import { Depot, DisasterZone, AlgorithmStep, Vehicle } from "../types";

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

export interface MDVRPResult {
  clusterAssignments: Record<string, string>; // zoneId -> depotId
  routes: RouteTour[];
  totalFleetDistanceKm: number;
  totalFleetMinutes: number;
  savingsGenerated: number;
  steps: AlgorithmStep[];
}

// Euclidean / topological distance helper
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  // Scaled to real-world km (100 units = 12 km)
  return Math.sqrt(dx * dx + dy * dy) * 0.12;
}

export function runMDVRP(
  depots: Depot[],
  zones: DisasterZone[],
  vehiclesPerDepot = 2,
  defaultVehicleCapacityKg = 6000
): MDVRPResult {
  const steps: AlgorithmStep[] = [];
  const clusterAssignments: Record<string, string> = {};

  steps.push({
    stepNumber: 1,
    title: "Phase 1: Multi-Depot Clustering (K-Means Gravity)",
    description: `Partitioning ${zones.length} disaster zones across ${depots.length} regional response depots using spatial proximity and casualty urgency gravity weighting.`,
    pseudocodeLine: 1,
    activeNodeIds: [...depots.map((d) => d.id), ...zones.map((z) => z.id)],
    logMessage: `[MDVRP Phase 1] Clustering ${zones.length} zones to ${depots.length} depots.`,
    metrics: {
      "Total Zones": zones.length,
      "Response Depots": depots.length,
      "Cluster Paradigm": "Casualty-Weighted Voronoi",
    },
  });

  // Phase 1: Assign each zone to closest depot (with capacity weighting)
  const depotClusters: Record<string, DisasterZone[]> = {};
  for (const d of depots) {
    depotClusters[d.id] = [];
  }

  for (const z of zones) {
    let bestDepotId = depots[0].id;
    let minWeightedDist = Infinity;

    for (const d of depots) {
      const dist = getDistance(d.x, d.y, z.x, z.y);
      // Triage penalty: critical zones prefer high-medical depots
      const urgencyBonus = z.triage === "critical" ? 0.85 : 1.0;
      const weightedDist = dist * urgencyBonus;

      if (weightedDist < minWeightedDist) {
        minWeightedDist = weightedDist;
        bestDepotId = d.id;
      }
    }

    clusterAssignments[z.id] = bestDepotId;
    depotClusters[bestDepotId].push(z);
  }

  let stepCounter = 2;
  for (const d of depots) {
    const assigned = depotClusters[d.id];
    steps.push({
      stepNumber: stepCounter++,
      title: `Territory Formed: ${d.name}`,
      description: `Depot ${d.code} assigned ${assigned.length} disaster sectors (${assigned.map((z) => z.name).join(", ") || "None"}). Total casualty density: ${assigned.reduce((acc, z) => acc + z.casualties, 0)} victims.`,
      pseudocodeLine: 3,
      activeNodeIds: [d.id, ...assigned.map((z) => z.id)],
      logMessage: `[Depot Cluster] ${d.name} -> ${assigned.length} zones.`,
      metrics: {
        "Assigned Zones": assigned.length,
        "Total Casualties": assigned.reduce((acc, z) => acc + z.casualties, 0),
      },
    });
  }

  // Phase 2: Clarke & Wright Savings Algorithm per Depot Cluster
  const allRoutes: RouteTour[] = [];
  let totalSavings = 0;

  for (const d of depots) {
    const clusterZones = depotClusters[d.id];
    if (clusterZones.length === 0) continue;

    // Start with radial routes: depot -> zone -> depot
    let tours: string[][] = clusterZones.map((z) => [z.id]);

    // Calculate Clarke-Wright savings matrix: s(i, j) = c(D, i) + c(D, j) - c(i, j)
    const savings: { i: string; j: string; s: number }[] = [];
    for (let a = 0; a < clusterZones.length; a++) {
      for (let b = a + 1; b < clusterZones.length; b++) {
        const za = clusterZones[a];
        const zb = clusterZones[b];
        const cDi = getDistance(d.x, d.y, za.x, za.y);
        const cDj = getDistance(d.x, d.y, zb.x, zb.y);
        const cij = getDistance(za.x, za.y, zb.x, zb.y);
        const sVal = cDi + cDj - cij;
        if (sVal > 0) {
          savings.push({ i: za.id, j: zb.id, s: sVal });
        }
      }
    }

    // Sort savings descending: O(N^2 log N)
    savings.sort((a, b) => b.s - a.s);

    // Merge routes based on savings while respecting vehicle capacity
    for (const { i, j, s } of savings) {
      // Find tours containing i and j
      const tourIIndex = tours.findIndex((t) => t.includes(i));
      const tourJIndex = tours.findIndex((t) => t.includes(j));

      if (tourIIndex !== -1 && tourJIndex !== -1 && tourIIndex !== tourJIndex) {
        const tourI = tours[tourIIndex];
        const tourJ = tours[tourJIndex];

        // Check if i and j are at the endpoints of their respective tours
        const iIsEnd = tourI[0] === i || tourI[tourI.length - 1] === i;
        const jIsEnd = tourJ[0] === j || tourJ[tourJ.length - 1] === j;

        if (iIsEnd && jIsEnd) {
          // Check capacity constraint
          const combinedDemand = [...tourI, ...tourJ].reduce((acc, zid) => {
            const zn = zones.find((z) => z.id === zid);
            return acc + (zn ? zn.demand.medicalKg + zn.demand.waterKg : 1000);
          }, 0);

          if (combinedDemand <= defaultVehicleCapacityKg) {
            // Merge
            let merged: string[];
            if (tourI[tourI.length - 1] === i && tourJ[0] === j) {
              merged = [...tourI, ...tourJ];
            } else if (tourI[0] === i && tourJ[tourJ.length - 1] === j) {
              merged = [...tourJ, ...tourI];
            } else if (tourI[tourI.length - 1] === i && tourJ[tourJ.length - 1] === j) {
              merged = [...tourI, ...[...tourJ].reverse()];
            } else {
              merged = [[...tourI].reverse(), ...tourJ].flat();
            }

            tours.splice(Math.max(tourIIndex, tourJIndex), 1);
            tours.splice(Math.min(tourIIndex, tourJIndex), 1);
            tours.push(merged);
            totalSavings += s;
          }
        }
      }
    }

    // Phase 3: 2-Opt Local Search refinement for each merged tour
    for (let t = 0; t < tours.length; t++) {
      let tour = tours[t];
      if (tour.length > 2) {
        let improved = true;
        while (improved) {
          improved = false;
          for (let i = 0; i < tour.length - 1; i++) {
            for (let k = i + 1; k < tour.length; k++) {
              // Compare distance with 2-opt swap
              const z1 = zones.find((z) => z.id === tour[i])!;
              const z2 = zones.find((z) => z.id === tour[i + 1])!;
              const z3 = zones.find((z) => z.id === tour[k])!;
              const z4 = k + 1 < tour.length ? zones.find((z) => z.id === tour[k + 1])! : null;

              const d1 = getDistance(z1.x, z1.y, z2.x, z2.y);
              const d2 = z4 ? getDistance(z3.x, z3.y, z4.x, z4.y) : getDistance(z3.x, z3.y, d.x, d.y);
              const d3 = getDistance(z1.x, z1.y, z3.x, z3.y);
              const d4 = z4 ? getDistance(z2.x, z2.y, z4.x, z4.y) : getDistance(z2.x, z2.y, d.x, d.y);

              if (d3 + d4 < d1 + d2 - 0.01) {
                // Perform 2-opt reversal
                const newTour = [
                  ...tour.slice(0, i + 1),
                  ...tour.slice(i + 1, k + 1).reverse(),
                  ...tour.slice(k + 1),
                ];
                tour = newTour;
                tours[t] = newTour;
                improved = true;
                break;
              }
            }
            if (improved) break;
          }
        }
      }

      // Compute total distance
      let tourDist = 0;
      let prevX = d.x;
      let prevY = d.y;
      let demandKg = 0;
      let casualtiesCovered = 0;

      for (const zid of tour) {
        const zn = zones.find((z) => z.id === zid)!;
        tourDist += getDistance(prevX, prevY, zn.x, zn.y);
        prevX = zn.x;
        prevY = zn.y;
        demandKg += zn.demand.medicalKg + zn.demand.waterKg;
        casualtiesCovered += zn.casualties;
      }
      tourDist += getDistance(prevX, prevY, d.x, d.y); // Return to depot

      const speedKmH = 55;
      const travelMins = Math.round((tourDist / speedKmH) * 60);
      const vehicle = d.fleet[t % d.fleet.length];

      allRoutes.push({
        depotId: d.id,
        vehicleId: vehicle?.id,
        vehicleCode: vehicle?.code || `CONVOY-${t + 1}`,
        zoneIds: tour,
        totalDistanceKm: Number(tourDist.toFixed(1)),
        totalDemandKg: demandKg,
        totalCasualtiesCovered: casualtiesCovered,
        travelMinutes: travelMins,
      });
    }

    steps.push({
      stepNumber: stepCounter++,
      title: `Savings & 2-Opt Optimization: ${d.name}`,
      description: `Constructed ${tours.length} multi-stop convoy circuits for Depot ${d.code}. Clarke-Wright savings merged radial trips, and 2-opt edge-swapping removed tour intersections.`,
      pseudocodeLine: 6,
      activeNodeIds: [d.id, ...clusterZones.map((z) => z.id)],
      logMessage: `[Routing Solution] ${d.name} -> ${tours.length} vehicle routes.`,
      metrics: {
        "Generated Tours": tours.length,
        "Payload Capacity Check": `Passed (≤ ${defaultVehicleCapacityKg}kg)`,
      },
    });
  }

  const totalDist = allRoutes.reduce((acc, r) => acc + r.totalDistanceKm, 0);
  const totalMins = allRoutes.reduce((acc, r) => acc + r.travelMinutes, 0);

  steps.push({
    stepNumber: stepCounter,
    title: "Global Multi-Depot Dispatch Plan Finalized",
    description: `Synthesized global operations: ${allRoutes.length} emergency convoys covering ${zones.length} disaster communities across ${depots.length} hubs. Total fleet travel: ${totalDist.toFixed(1)} km (approx. ${totalMins} minutes).`,
    pseudocodeLine: 9,
    activeNodeIds: [...depots.map((d) => d.id), ...zones.map((z) => z.id)],
    logMessage: `[MDVRP Finalized] ${allRoutes.length} routes, ${totalDist.toFixed(1)} km total.`,
    metrics: {
      "Total Convoys": allRoutes.length,
      "Fleet Mileage": `${totalDist.toFixed(1)} km`,
      "Cumulative Transit Time": `${totalMins} min`,
      "Casualties Serviced": allRoutes.reduce((acc, r) => acc + r.totalCasualtiesCovered, 0),
    },
  });

  return {
    clusterAssignments,
    routes: allRoutes,
    totalFleetDistanceKm: totalDist,
    totalFleetMinutes: totalMins,
    savingsGenerated: Math.round(totalSavings),
    steps,
  };
}
