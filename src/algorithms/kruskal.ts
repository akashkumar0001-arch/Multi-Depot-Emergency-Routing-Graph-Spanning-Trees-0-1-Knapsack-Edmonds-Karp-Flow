import { Edge, AlgorithmStep, Depot, DisasterZone } from "../types";

export interface KruskalResult {
  mstEdges: Edge[];
  totalCost: number;
  totalDistanceKm: number;
  steps: AlgorithmStep[];
  mstEdgeIds: string[];
}

// Disjoint Set Union (Union-Find) with path compression and rank optimization
class DisjointSetUnion {
  parent: Record<string, string> = {};
  rank: Record<string, number> = {};

  constructor(elements: string[]) {
    for (const el of elements) {
      this.parent[el] = el;
      this.rank[el] = 0;
    }
  }

  find(i: string): string {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]); // Path compression
    return this.parent[i];
  }

  union(i: string, j: string): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI === rootJ) return false; // Cycle detected

    // Union by rank
    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    return true;
  }
}

export function runKruskal(
  nodes: (Depot | DisasterZone)[],
  edges: Edge[]
): KruskalResult {
  const steps: AlgorithmStep[] = [];
  const nodeIds = nodes.map((n) => n.id);
  const dsu = new DisjointSetUnion(nodeIds);

  // Filter out impassable/collapsed roads
  const passableEdges = edges.filter(
    (e) => e.status !== "collapsed_bridge" && e.hazardMultiplier < 900
  );

  // Weight formula: distance * hazard
  const weightedEdges = passableEdges.map((edge) => ({
    edge,
    weight: edge.distanceKm * edge.hazardMultiplier,
  }));

  // Sort edges ascending by weight: O(E log E)
  weightedEdges.sort((a, b) => a.weight - b.weight);

  steps.push({
    stepNumber: 1,
    title: "Kruskal Initialization & Edge Sorting",
    description: `Disjoint Set Union (DSU) initialized for ${nodes.length} isolated components. Sorted ${weightedEdges.length} passable road segments ascending by clearing cost w(e) = dist × hazard.`,
    pseudocodeLine: 1,
    activeNodeIds: [],
    activeEdgeIds: [],
    spanningTreeEdgeIds: [],
    logMessage: `[Kruskal Init] ${weightedEdges.length} edges sorted. Smallest cost: ${weightedEdges[0]?.weight.toFixed(1) ?? 0}, Largest: ${weightedEdges[weightedEdges.length - 1]?.weight.toFixed(1) ?? 0}`,
    metrics: {
      "Total Vertices": nodes.length,
      "Passable Edges": weightedEdges.length,
      "Target MST Edges": nodes.length - 1,
    },
  });

  const mstEdges: Edge[] = [];
  const mstEdgeIds: string[] = [];
  let totalCost = 0;
  let totalDistanceKm = 0;
  let stepCounter = 2;

  for (let i = 0; i < weightedEdges.length; i++) {
    const { edge, weight } = weightedEdges[i];
    const u = edge.from;
    const v = edge.to;

    const rootU = dsu.find(u);
    const rootV = dsu.find(v);

    if (rootU !== rootV) {
      // No cycle: add to MST
      dsu.union(u, v);
      mstEdges.push(edge);
      mstEdgeIds.push(edge.id);
      totalCost += weight;
      totalDistanceKm += edge.distanceKm;

      steps.push({
        stepNumber: stepCounter++,
        title: `Edge Accepted: (${u} — ${v})`,
        description: `Link (${u} — ${v}) with clearing cost ${weight.toFixed(1)} connects component {${rootU}} and {${rootV}} without forming a cycle. Added to Minimum Spanning Relief Backbone.`,
        pseudocodeLine: 5,
        activeNodeIds: [u, v],
        activeEdgeIds: [edge.id],
        spanningTreeEdgeIds: [...mstEdgeIds],
        logMessage: `[MST Accepted] ${u}-${v} | Cost: ${weight.toFixed(1)} | Components connected: ${mstEdges.length}/${nodes.length - 1}`,
        metrics: {
          "Edges in Backbone": `${mstEdges.length} / ${nodes.length - 1}`,
          "Cumulative Cost": totalCost.toFixed(1),
          "Total Distance": `${totalDistanceKm.toFixed(1)} km`,
        },
      });

      if (mstEdges.length === nodes.length - 1) {
        break;
      }
    } else {
      // Cycle detected: reject edge
      steps.push({
        stepNumber: stepCounter++,
        title: `Edge Rejected: (${u} — ${v}) [Cycle Detected]`,
        description: `Link (${u} — ${v}) connects vertices already in the same connected partition {${rootU}}. Adding this edge would form a redundant cycle. Edge skipped.`,
        pseudocodeLine: 7,
        activeNodeIds: [u, v],
        activeEdgeIds: [edge.id],
        spanningTreeEdgeIds: [...mstEdgeIds],
        logMessage: `[MST Rejected - Cycle] ${u}-${v} creates loop in component ${rootU}`,
        metrics: {
          "Skipped Redundant": `${u}-${v}`,
          "Current MST Size": mstEdges.length,
        },
      });
    }
  }

  steps.push({
    stepNumber: stepCounter,
    title: "Relief Backbone MST Complete",
    description: `Minimum Spanning Corridor established with ${mstEdges.length} arterial links. Guarantees 100% mutual connectivity between all response bases and disaster sectors with minimum bulldozer clearing effort.`,
    pseudocodeLine: 8,
    activeNodeIds: nodes.map((n) => n.id),
    activeEdgeIds: mstEdgeIds,
    spanningTreeEdgeIds: mstEdgeIds,
    logMessage: `[Kruskal Complete] Final backbone cost: ${totalCost.toFixed(1)} | Length: ${totalDistanceKm.toFixed(1)} km`,
    metrics: {
      "Total Road Links": mstEdges.length,
      "Physical Mileage": `${totalDistanceKm.toFixed(1)} km`,
      "Clearing Difficulty Score": totalCost.toFixed(0),
    },
  });

  return {
    mstEdges,
    totalCost,
    totalDistanceKm,
    steps,
    mstEdgeIds,
  };
}
