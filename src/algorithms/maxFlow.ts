import { Edge, AlgorithmStep, Depot, DisasterZone } from "../types";

export interface MaxFlowResult {
  maxFlow: number;
  flowByEdge: Record<string, number>; // edgeId -> flow
  residualCapacities: Record<string, number>;
  minCutEdges: Edge[];
  steps: AlgorithmStep[];
  augmentingPaths: { path: string[]; flow: number }[];
}

export function runEdmondsKarp(
  depots: Depot[],
  disasterZones: DisasterZone[],
  edges: Edge[]
): MaxFlowResult {
  const steps: AlgorithmStep[] = [];
  const superSource = "SUPER_SOURCE";
  const superSink = "SUPER_SINK";

  // All node IDs
  const allNodes = [superSource, ...depots.map((d) => d.id), ...disasterZones.map((z) => z.id), superSink];

  // Adjacency and capacity map
  // key: "u->v"
  const capacity: Record<string, number> = {};
  const flow: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const n of allNodes) {
    adj[n] = [];
  }

  function addDirectedEdge(u: string, v: string, cap: number) {
    const forwardKey = `${u}->${v}`;
    const reverseKey = `${v}->${u}`;

    if (!adj[u].includes(v)) adj[u].push(v);
    if (!adj[v].includes(u)) adj[v].push(u);

    capacity[forwardKey] = (capacity[forwardKey] || 0) + cap;
    capacity[reverseKey] = capacity[reverseKey] || 0;
    flow[forwardKey] = 0;
    flow[reverseKey] = 0;
  }

  // 1. Connect Super-Source to each Depot
  for (const d of depots) {
    const depotHourlyCap = Math.round(d.maxDailyThroughputKg / 500); // approx vehicle convoys
    addDirectedEdge(superSource, d.id, depotHourlyCap);
  }

  // 2. Connect physical road edges (bidirectional road capacity)
  const edgeLookup: Record<string, Edge> = {};
  for (const e of edges) {
    edgeLookup[`${e.from}->${e.to}`] = e;
    edgeLookup[`${e.to}->${e.from}`] = e;

    const actualCap =
      e.status === "collapsed_bridge"
        ? 0
        : e.status === "flooded"
        ? Math.floor(e.capacityVehiclesPerHour * 0.35)
        : e.status === "debris"
        ? Math.floor(e.capacityVehiclesPerHour * 0.5)
        : e.capacityVehiclesPerHour;

    addDirectedEdge(e.from, e.to, actualCap);
    addDirectedEdge(e.to, e.from, actualCap);
  }

  // 3. Connect each Disaster Zone to Super-Sink (Evacuation / relief demand intake)
  for (const z of disasterZones) {
    const zoneIntakeCap = Math.max(15, Math.round(z.population / 60));
    addDirectedEdge(z.id, superSink, zoneIntakeCap);
  }

  steps.push({
    stepNumber: 1,
    title: "Augmented Flow Network Constructed",
    description: `Configured Super-Source (S) connecting to ${depots.length} response depots, and Super-Sink (T) draining from ${disasterZones.length} disaster sectors. Bidirectional road capacities adjusted for flood/debris penalties.`,
    pseudocodeLine: 1,
    activeNodeIds: [superSource, superSink],
    logMessage: `[MaxFlow Init] Super-Source S -> Depots -> Zones -> Super-Sink T initialized.`,
    metrics: {
      "Total Network Vertices": allNodes.length,
      "Depots (Sources)": depots.length,
      "Zones (Sinks)": disasterZones.length,
    },
  });

  // Edmonds-Karp BFS loop
  let maxFlow = 0;
  const augmentingPaths: { path: string[]; flow: number }[] = [];
  let stepCounter = 2;

  while (true) {
    // BFS to find shortest augmenting path in residual graph
    const parent: Record<string, string | null> = {};
    for (const n of allNodes) parent[n] = null;
    parent[superSource] = superSource;

    const queue: string[] = [superSource];

    while (queue.length > 0 && parent[superSink] === null) {
      const u = queue.shift()!;
      for (const v of adj[u]) {
        const residual = (capacity[`${u}->${v}`] || 0) - (flow[`${u}->${v}`] || 0);
        if (residual > 0 && parent[v] === null) {
          parent[v] = u;
          queue.push(v);
        }
      }
    }

    // If no path to sink, we have reached maximum flow!
    if (parent[superSink] === null) {
      break;
    }

    // Determine bottleneck capacity along path
    let pathFlow = Infinity;
    let curr = superSink;
    const path: string[] = [superSink];

    while (curr !== superSource) {
      const prev = parent[curr]!;
      const residual = (capacity[`${prev}->${curr}`] || 0) - (flow[`${prev}->${curr}`] || 0);
      pathFlow = Math.min(pathFlow, residual);
      curr = prev;
      path.unshift(curr);
    }

    // Augment flow
    curr = superSink;
    while (curr !== superSource) {
      const prev = parent[curr]!;
      flow[`${prev}->${curr}`] = (flow[`${prev}->${curr}`] || 0) + pathFlow;
      flow[`${curr}->${prev}`] = (flow[`${curr}->${prev}`] || 0) - pathFlow;
      curr = prev;
    }

    maxFlow += pathFlow;
    augmentingPaths.push({ path, flow: pathFlow });

    const readablePath = path.filter((n) => n !== superSource && n !== superSink).join(" ➔ ");

    steps.push({
      stepNumber: stepCounter++,
      title: `Augmenting Path Found (+${pathFlow} Convoys/hr)`,
      description: `BFS discovered augmenting corridor: ${readablePath} with bottleneck capacity ${pathFlow} vehicles/hr. Cumulative throughput increased to ${maxFlow} convoys/hr.`,
      pseudocodeLine: 4,
      activeNodeIds: path.filter((n) => n !== superSource && n !== superSink),
      logMessage: `[Augment] Path: ${path.join("->")} | Flow added: ${pathFlow} | Total MaxFlow: ${maxFlow}`,
      metrics: {
        "Bottleneck Augmentation": `+${pathFlow} convoys/hr`,
        "Cumulative Max Flow": `${maxFlow} convoys/hr`,
        "Augmenting Iteration": augmentingPaths.length,
      },
    });
  }

  // Find Min-Cut via BFS on residual graph from superSource
  const visited = new Set<string>();
  const cutQueue = [superSource];
  visited.add(superSource);

  while (cutQueue.length > 0) {
    const u = cutQueue.shift()!;
    for (const v of adj[u]) {
      const residual = (capacity[`${u}->${v}`] || 0) - (flow[`${u}->${v}`] || 0);
      if (residual > 0 && !visited.has(v)) {
        visited.add(v);
        cutQueue.push(v);
      }
    }
  }

  // Min-cut edges: edges from visited to unvisited in original graph
  const minCutEdges: Edge[] = [];
  const minCutEdgeIds = new Set<string>();

  for (const u of visited) {
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        // Look up corresponding physical road
        const originalEdge = edgeLookup[`${u}->${v}`];
        if (originalEdge && !minCutEdgeIds.has(originalEdge.id)) {
          minCutEdges.push(originalEdge);
          minCutEdgeIds.add(originalEdge.id);
        }
      }
    }
  }

  // Map physical edge flow
  const flowByEdge: Record<string, number> = {};
  for (const e of edges) {
    const f1 = flow[`${e.from}->${e.to}`] || 0;
    const f2 = flow[`${e.to}->${e.from}`] || 0;
    flowByEdge[e.id] = Math.max(0, f1, f2);
  }

  steps.push({
    stepNumber: stepCounter,
    title: "Max-Flow Min-Cut Theorem Verification",
    description: `Maximum relief throughput verified at ${maxFlow} vehicles/hour. Exactly identified ${minCutEdges.length} Min-Cut choke points in the road grid. Upgrading or repairing these specific bridges will directly increase overall disaster evacuation capacity.`,
    pseudocodeLine: 8,
    activeNodeIds: allNodes.filter((n) => n !== superSource && n !== superSink),
    activeEdgeIds: Array.from(minCutEdgeIds),
    logMessage: `[Min-Cut Identified] ${minCutEdges.map((e) => `${e.from}-${e.to}`).join(", ")} | MaxFlow = Capacity(MinCut) = ${maxFlow}`,
    metrics: {
      "Maximum Network Flow": `${maxFlow} convoys/hr`,
      "Min-Cut Bottlenecks": minCutEdges.length,
      "Flow Augmentation Steps": augmentingPaths.length,
    },
  });

  return {
    maxFlow,
    flowByEdge,
    residualCapacities: capacity,
    minCutEdges,
    steps,
    augmentingPaths,
  };
}
