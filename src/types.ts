/**
 * Types and interfaces for Disaster Response Logistics:
 * Multi-Depot Routing & Resource Allocation with DAA Algorithms & AI
 */

export type TriageLevel = "critical" | "severe" | "moderate" | "stable";
export type RoadStatus = "clear" | "flooded" | "debris" | "collapsed_bridge";
export type VehicleType = "ambulance" | "heavy_truck" | "4x4_tactical" | "amphibious" | "drone_squad";

export interface SupplyInventory {
  medicalKg: number;
  waterKg: number;
  foodKg: number;
  powerUnits: number;
}

export interface Vehicle {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  maxCapacityKg: number;
  speedKmH: number;
  fuelRangeKm: number;
  currentDepotId: string;
  assignedZoneIds: string[];
  status: "ready" | "dispatched" | "returning";
}

export interface Depot {
  id: string;
  name: string;
  code: string;
  x: number; // 0 - 1000 coordinate space
  y: number;
  elevationMeters: number;
  supplies: SupplyInventory;
  fleet: Vehicle[];
  maxDailyThroughputKg: number;
  color: string;
}

export interface DisasterZone {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  triage: TriageLevel;
  casualties: number;
  population: number;
  urgencyDecayPerHour: number; // % deterioration per hour if unassisted
  demand: SupplyInventory;
  assignedDepotId?: string;
  accessRestriction?: "road_only" | "high_clearance_only" | "air_only" | "all";
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  status: RoadStatus;
  hazardMultiplier: number; // 1.0 = normal, 1.8 = heavy rain, 3.5 = debris, 999 = impassable
  capacityVehiclesPerHour: number;
  isBridge?: boolean;
  isMountainPass?: boolean;
}

export interface SupplyItem {
  id: string;
  name: string;
  category: "medical" | "water" | "food" | "power";
  weightKg: number;
  utilityScore: number; // Value in Fractional / 0-1 Knapsack
  urgencyLevel: number; // 1 - 10
  description: string;
  iconName: string;
}

export interface FractionalAllocation {
  item: SupplyItem;
  ratio: number; // utilityScore / weightKg
  fraction: number; // 0 to 1 (e.g. 1.0 = fully packed, 0.54 = 54% loaded, 0 = omitted)
  takenWeightKg: number;
  takenUtility: number;
  status: "full" | "fractional" | "omitted";
  cumulativeWeightKg: number;
}

export type AlgorithmType =
  | "mdvrp"
  | "dijkstra"
  | "kruskal"
  | "knapsack"
  | "maxflow"
  | "triage";

export interface AlgorithmComplexity {
  name: string;
  paradigm: "Greedy" | "Dynamic Programming" | "Graph Theory" | "Heuristic & ML" | "Network Flow";
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  pseudocode: string[];
}

export interface AlgorithmStep {
  stepNumber: number;
  title: string;
  description: string;
  pseudocodeLine?: number;
  activeNodeIds?: string[];
  visitedNodeIds?: string[];
  activeEdgeIds?: string[];
  spanningTreeEdgeIds?: string[];
  highlightedData?: any;
  logMessage?: string;
  metrics?: Record<string, string | number>;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  hazardType: "Cyclone Surge" | "Seismic Fault" | "Flash Inundation";
  depots: Depot[];
  disasterZones: DisasterZone[];
  edges: Edge[];
}

export interface ConvoyAnimation {
  vehicleId: string;
  vehicleCode: string;
  type: VehicleType;
  color: string;
  pathNodeIds: string[];
  currentEdgeIndex: number;
  progress: number; // 0 to 1 along current edge
  totalDistanceKm: number;
}

export interface RouteTour {
  depotId: string;
  vehicleId?: string;
  vehicleCode?: string;
  zoneIds: string[];
  totalDistanceKm: number;
  totalDemandKg: number;
  totalCasualtiesCovered: number;
  travelMinutes: number;
}

export interface TriageScheduleItem {
  zone: DisasterZone;
  priorityScore: number;
  estimatedArrivalHours: number;
  deadlineHours: number;
  status: "on_time" | "at_risk" | "breached";
  livesAtRiskMitigated: number;
}
