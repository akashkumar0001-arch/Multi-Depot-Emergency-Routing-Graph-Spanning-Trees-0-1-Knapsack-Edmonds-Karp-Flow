import { AlgorithmType, AlgorithmComplexity } from "../types";

export interface AlgorithmMetadata extends AlgorithmComplexity {
  type: AlgorithmType;
  shortTitle: string;
  badge: string;
  iconName: string;
  realWorldRole: string;
}

export const ALGORITHM_REGISTRY: Record<AlgorithmType, AlgorithmMetadata> = {
  mdvrp: {
    type: "mdvrp",
    name: "Multi-Depot Vehicle Routing (MDVRP) & Clustering",
    shortTitle: "Multi-Depot VRP",
    paradigm: "Heuristic & ML",
    badge: "NP-Hard Optimization",
    iconName: "Truck",
    timeComplexity: "O(N² log N) + O(K · N²)",
    spaceComplexity: "O(N² + K · N)",
    description:
      "Decomposes the NP-hard Multi-Depot Capacitated VRP into spatial clusters via K-Means / Voronoi gravity partitioning, then optimizes convoy routes using Clarke-Wright Savings and 2-Opt edge-swapping heuristics under vehicle payload limits.",
    realWorldRole:
      "Determines how regional emergency depots partition hundreds of disaster victim zones and generates fleet multi-stop truck routes that minimize total fuel consumption and vehicle turn-around times.",
    pseudocode: [
      "1. PARTITION zones Z into K depot clusters based on distance & casualty gravity",
      "2. FOR each depot D and its assigned zone cluster C:",
      "3.   INITIALIZE radial routes [D -> z -> D] for each z in C",
      "4.   COMPUTE savings s(i, j) = c(D, i) + c(D, j) - c(i, j) for all pairs (i, j)",
      "5.   SORT pairs descending by savings s(i, j)",
      "6.   WHILE savings list not empty:",
      "7.     MERGE routes containing i and j IF endpoint condition and total_demand <= CAPACITY",
      "8.   APPLY 2-Opt local search: reverse sub-tour (i..k) IF edge swap decreases tour distance",
      "9. RETURN combined fleet dispatch schedule across all depots",
    ],
  },
  dijkstra: {
    type: "dijkstra",
    name: "Dynamic Dijkstra with Hazard Weighting",
    shortTitle: "Dynamic Dijkstra",
    paradigm: "Graph Theory",
    badge: "Priority Queue Min-Heap",
    iconName: "Navigation",
    timeComplexity: "O((V + E) log V)",
    spaceComplexity: "O(V + E)",
    description:
      "Computes the single-source shortest survivable path across the disaster road network. Edge weights are dynamically weighted by flood water levels, debris damage, and bridge collapse status: w'(e) = dist(e) × hazard(e).",
    realWorldRole:
      "Guides urgent ambulances and mobile surgical teams around flash floods and collapsed bridges to reach trapped casualties via the fastest safe road corridor.",
    pseudocode: [
      "1. SET dist[origin] = 0; dist[v] = ∞ for all other v in V",
      "2. INSERT (origin, 0) into Min-PriorityQueue Q",
      "3. WHILE Q is not empty:",
      "4.   EXTRACT-MIN vertex u from Q with smallest tentative distance dist[u]",
      "5.   FOR each neighbor v of u with road edge (u, v):",
      "6.     cost = edge.dist * edge.hazardMultiplier",
      "7.     IF dist[u] + cost < dist[v]:",
      "8.       dist[v] = dist[u] + cost; parent[v] = u; INSERT (v, dist[v]) into Q",
      "9. RECONSTRUCT path from destination backwards using parent pointers",
    ],
  },
  kruskal: {
    type: "kruskal",
    name: "Emergency Backbone Minimum Spanning Tree (MST)",
    shortTitle: "Kruskal's MST",
    paradigm: "Greedy",
    badge: "Disjoint Set Union (DSU)",
    iconName: "Network",
    timeComplexity: "O(E log E) with DSU",
    spaceComplexity: "O(V + E)",
    description:
      "Greedily builds a cycle-free communication and supply corridor network connecting all response depots and isolated survival camps with the lowest total road-clearing and debris-removal expenditure.",
    realWorldRole:
      "Directs military bulldozers and heavy engineering corps on which blocked road links to clear first so every community is restored to the primary relief network.",
    pseudocode: [
      "1. INITIALIZE Disjoint Set Union (DSU) with each vertex v as its own set",
      "2. SORT all passable edges E ascending by clearing cost: w(e) = dist(e) * hazard(e)",
      "3. SET MST = empty list",
      "4. FOR each edge (u, v) in sorted E:",
      "5.   IF FIND(u) != FIND(v):  // No cycle will be formed",
      "6.     UNION(u, v);  // Merge disjoint components",
      "7.     ADD (u, v) to MST",
      "8.   ELSE: SKIP (u, v)  // Discard redundant cycle edge",
      "9. RETURN MST containing (V - 1) cleared arterial corridors",
    ],
  },
  knapsack: {
    type: "knapsack",
    name: "Relief Cargo Allocation (Fractional Knapsack)",
    shortTitle: "Fractional Knapsack",
    paradigm: "Greedy",
    badge: "Greedy Choice Property",
    iconName: "Box",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    description:
      "Optimizes divisible humanitarian cargo loading under strict vehicle payload capacity W (kg). Uses the Greedy Strategy by ranking relief supplies by utility density ratio (vᵢ / wᵢ) and taking fractional allocations for the boundary pallet to achieve 100% payload saturation and provable global optimality.",
    realWorldRole:
      "Determines the optimal quantities of bulk potable water, blood plasma liters, oral rehydration salts, and fuel rations loaded into an emergency transport vehicle, maximizing survival utility in O(n log n) time.",
    pseudocode: [
      "1. FOR each relief cargo item i in Supplies:",
      "2.   COMPUTE utility density ratio r[i] = utility[i] / weight[i]",
      "3. SORT items descending by density ratio r[i] such that r[1] >= r[2] >= ... >= r[n]",
      "4. SET remaining_capacity = W, total_utility = 0, allocation = []",
      "5. FOR each item i in sorted order:",
      "6.   IF weight[i] <= remaining_capacity:  // Entire item fits",
      "7.     fraction x[i] = 1.0; remaining_capacity -= weight[i]; total_utility += utility[i]",
      "8.   ELSE IF remaining_capacity > 0:      // Boundary item: take fractional slice",
      "9.     fraction x[i] = remaining_capacity / weight[i]",
      "10.    total_utility += fraction x[i] * utility[i]; remaining_capacity = 0; BREAK",
      "11.  ELSE: fraction x[i] = 0.0           // Knapsack full: omit remaining items",
      "12. RETURN optimal fractional payload vector x and maximum total utility",
    ],
  },
  maxflow: {
    type: "maxflow",
    name: "Evacuation & Relief Flow (Edmonds-Karp)",
    shortTitle: "Edmonds-Karp Max Flow",
    paradigm: "Network Flow",
    badge: "Max-Flow Min-Cut Theorem",
    iconName: "Layers",
    timeComplexity: "O(V · E²)",
    spaceComplexity: "O(V + E)",
    description:
      "Models the regional road grid as a capacitated flow network with a Super-Source (S) connecting all depots and a Super-Sink (T) draining all disaster zones. Uses BFS augmenting paths to compute max convoy throughput and identify the Min-Cut bottlenecks.",
    realWorldRole:
      "Identifies the precise road bottlenecks choking mass evacuation convoys and relief transport, calculating the maximum number of emergency vehicles that can transit per hour without gridlock.",
    pseudocode: [
      "1. AUGMENT network: connect Super-Source S to Depots; connect Zones to Super-Sink T",
      "2. SET total_flow = 0; INITIALIZE residual graph R = capacities C",
      "3. WHILE true:",
      "4.   RUN BFS from S to T in residual graph R to find shortest augmenting path P",
      "5.   IF no augmenting path exists: BREAK loop (Max Flow reached!)",
      "6.   delta = MIN residual capacity along path P",
      "7.   AUGMENT flow along P by delta; UPDATE forward & reverse residual capacities in R",
      "8.   total_flow += delta",
      "9. IDENTIFY Min-Cut edges crossing from reachable set A to unreachable set B in R",
    ],
  },
  triage: {
    type: "triage",
    name: "Triage Priority Dispatch (Greedy Interval Scheduling)",
    shortTitle: "Greedy Triage Scheduling",
    paradigm: "Greedy",
    badge: "Urgency Decay Minimization",
    iconName: "HeartPulse",
    timeComplexity: "O(N log N)",
    spaceComplexity: "O(N)",
    description:
      "Schedules emergency convoy dispatch order across casualty zones with time-decaying survival functions. Prioritizes sectors where delay penalty is steepest using an earliest deadline and casualty decay quotient.",
    realWorldRole:
      "Prevents hospital and clinic collapse by prioritizing medical dispatch to communities where victims will deteriorate most rapidly within the 2-hour golden window.",
    pseudocode: [
      "1. FOR each casualty sector z in Zones:",
      "2.   COMPUTE penalty_weight w(z) = casualties * (urgency_decay / 10)",
      "3.   COMPUTE priority_quotient Q(z) = w(z) / dispatch_transit_time",
      "4. SORT zones descending by priority_quotient Q(z) : O(N log N)",
      "5. FOR each zone in sorted sequence:",
      "6.   ASSIGN sequential dispatch time slot",
      "7.   CHECK if arrival_time <= golden_hour_deadline",
      "8.   COMPUTE projected lives saved vs irreversible deterioration",
      "9. RETURN prioritized tactical dispatch roster",
    ],
  },
};
