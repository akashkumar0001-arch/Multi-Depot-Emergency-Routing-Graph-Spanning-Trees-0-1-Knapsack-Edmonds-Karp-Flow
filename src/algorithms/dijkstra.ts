import { Edge, AlgorithmStep, Depot, DisasterZone } from "../types";

export interface DijkstraResult {
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  path: string[];
  totalDistanceKm: number;
  totalTravelMinutes: number;
  steps: AlgorithmStep[];
  pathEdgeIds: string[];
}

export function runDijkstra(
  startNodeId: string,
  targetNodeId: string,
  nodes: (Depot | DisasterZone)[],
  edges: Edge[],
  averageSpeedKmH = 60
): DijkstraResult {
  const steps: AlgorithmStep[] = [];
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();

  // Build adjacency list (undirected graph)
  const adj: Record<string, { neighbor: string; edge: Edge; weight: number }[]> = {};
  for (const n of nodes) {
    adj[n.id] = [];
    distances[n.id] = Infinity;
    previous[n.id] = null;
  }

  for (const edge of edges) {
    // If bridge is collapsed, edge is impassable (infinite weight)
    if (edge.status === "collapsed_bridge" || edge.hazardMultiplier >= 900) {
      continue;
    }
    const effectiveCost = edge.distanceKm * edge.hazardMultiplier;
    if (adj[edge.from]) {
      adj[edge.from].push({ neighbor: edge.to, edge, weight: effectiveCost });
    }
    if (adj[edge.to]) {
      adj[edge.to].push({ neighbor: edge.from, edge, weight: effectiveCost });
    }
  }

  distances[startNodeId] = 0;

  steps.push({
    stepNumber: 1,
    title: "Dijkstra Initialization",
    description: `Set tentative cost to 0 for origin ${startNodeId} and ∞ for all other ${nodes.length - 1} vertices. Priority Queue initialized.`,
    pseudocodeLine: 1,
    activeNodeIds: [startNodeId],
    visitedNodeIds: [],
    activeEdgeIds: [],
    logMessage: `[Init] Origin ${startNodeId} cost = 0.0 km-equivalent.`,
    metrics: {
      "Priority Queue Size": 1,
      "Visited Count": 0,
    },
  });

  // Simple Priority Queue structure
  const pq: { id: string; dist: number }[] = [{ id: startNodeId, dist: 0 }];

  let stepCounter = 2;

  while (pq.length > 0) {
    // Extract min
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: d } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    steps.push({
      stepNumber: stepCounter++,
      title: `Extract-Min: Vertex ${u}`,
      description: `Vertex ${u} extracted from Priority Queue with confirmed minimum hazard cost ${d.toFixed(1)}. Now inspecting adjacent road links.`,
      pseudocodeLine: 4,
      activeNodeIds: [u],
      visitedNodeIds: Array.from(visited),
      activeEdgeIds: [],
      logMessage: `[Extract-Min] Settled node ${u} at total hazard-weighted distance ${d.toFixed(2)}`,
      metrics: {
        "Current Node": u,
        "Tentative Dist": d.toFixed(1),
        "Visited Nodes": visited.size,
      },
    });

    if (u === targetNodeId) {
      steps.push({
        stepNumber: stepCounter++,
        title: `Target ${targetNodeId} Reached`,
        description: `Optimal shortest safe path to disaster destination ${targetNodeId} found. Backtracking parent pointers to trace emergency convoy corridor.`,
        pseudocodeLine: 8,
        activeNodeIds: [targetNodeId],
        visitedNodeIds: Array.from(visited),
        activeEdgeIds: [],
        logMessage: `[Destination Reached] Target ${targetNodeId} resolved with cost ${d.toFixed(2)}`,
      });
      break;
    }

    const neighbors = adj[u] || [];
    for (const { neighbor: v, edge, weight } of neighbors) {
      if (visited.has(v)) continue;

      const alt = distances[u] + weight;
      const wasRelaxed = alt < distances[v];

      if (wasRelaxed) {
        distances[v] = alt;
        previous[v] = u;
        pq.push({ id: v, dist: alt });

        steps.push({
          stepNumber: stepCounter++,
          title: `Edge Relaxation: (${u} → ${v})`,
          description: `Relaxing link (${u}, ${v}) with distance ${edge.distanceKm}km and hazard factor ${edge.hazardMultiplier}x. New shorter tentative distance: ${alt.toFixed(1)} (was ${distances[v] === Infinity ? "∞" : distances[v].toFixed(1)}).`,
          pseudocodeLine: 6,
          activeNodeIds: [u, v],
          visitedNodeIds: Array.from(visited),
          activeEdgeIds: [edge.id],
          logMessage: `[Relax] Reduced cost to ${v} to ${alt.toFixed(2)} via ${u}.`,
          metrics: {
            "Relaxed Edge": `${u}-${v}`,
            "Edge Condition": edge.status,
            "Hazard Multiplier": `${edge.hazardMultiplier}x`,
            "New Path Cost": alt.toFixed(1),
          },
        });
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  // If unreachable
  if (path[0] !== startNodeId) {
    return {
      distances,
      previous,
      path: [],
      totalDistanceKm: 0,
      totalTravelMinutes: 0,
      steps,
      pathEdgeIds: [],
    };
  }

  // Find corresponding edge ids and compute real distance
  const pathEdgeIds: string[] = [];
  let realDistanceKm = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = edges.find(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    if (edge) {
      pathEdgeIds.push(edge.id);
      realDistanceKm += edge.distanceKm;
    }
  }

  const travelHours = realDistanceKm / averageSpeedKmH;
  const travelMinutes = Math.round(travelHours * 60);

  steps.push({
    stepNumber: stepCounter,
    title: "Path Traversal Finalized",
    description: `Optimal corridor resolved: ${path.join(" ➔ ")}. Total physical road length: ${realDistanceKm.toFixed(1)} km. Estimated transit time: ${travelMinutes} minutes.`,
    pseudocodeLine: 9,
    activeNodeIds: path,
    visitedNodeIds: Array.from(visited),
    activeEdgeIds: pathEdgeIds,
    logMessage: `[Final Route] ${path.join(" -> ")} | Distance: ${realDistanceKm.toFixed(1)} km`,
    metrics: {
      "Total Road Distance": `${realDistanceKm.toFixed(1)} km`,
      "Estimated Transit Time": `${travelMinutes} min`,
      "Path Vertices": path.length,
    },
  });

  return {
    distances,
    previous,
    path,
    totalDistanceKm: realDistanceKm,
    totalTravelMinutes: travelMinutes,
    steps,
    pathEdgeIds,
  };
}
