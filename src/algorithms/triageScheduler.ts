import { DisasterZone, AlgorithmStep } from "../types";

export interface TriageScheduleItem {
  zone: DisasterZone;
  priorityScore: number;
  estimatedArrivalHours: number;
  deadlineHours: number;
  status: "on_time" | "at_risk" | "breached";
  livesAtRiskMitigated: number;
}

export interface TriageScheduleResult {
  schedule: TriageScheduleItem[];
  totalLivesSaved: number;
  preventedDeteriorationIndex: number;
  steps: AlgorithmStep[];
}

export function runTriageScheduler(
  zones: DisasterZone[],
  averageDispatchHoursPerZone = 1.2
): TriageScheduleResult {
  const steps: AlgorithmStep[] = [];

  // Triage scoring: casualties * urgencyDecayPerHour
  const zoneScores = zones.map((z) => {
    // Deadline based on triage level
    const deadlineHours =
      z.triage === "critical"
        ? 2.0
        : z.triage === "severe"
        ? 4.5
        : z.triage === "moderate"
        ? 8.0
        : 14.0;

    const penaltyWeight = z.casualties * (z.urgencyDecayPerHour / 10);
    // Density heuristic: penalty / processing_time
    const priorityQuotient = penaltyWeight / averageDispatchHoursPerZone;

    return {
      zone: z,
      deadlineHours,
      penaltyWeight,
      priorityQuotient,
    };
  });

  steps.push({
    stepNumber: 1,
    title: "Triage Urgency & Decay Modelling",
    description: `Computed medical deterioration quotients for ${zones.length} casualty sectors based on casualty count × physiological urgency decay rate ÷ response transit window.`,
    pseudocodeLine: 1,
    activeNodeIds: zones.map((z) => z.id),
    logMessage: `[Triage Model] Calculated risk penalties for ${zones.length} zones. Highest urgency: ${zoneScores[0]?.zone.name}`,
    metrics: {
      "Critical Triage Sectors": zones.filter((z) => z.triage === "critical").length,
      "Total Reported Casualties": zones.reduce((acc, z) => acc + z.casualties, 0),
    },
  });

  // Greedy sort descending by priority quotient
  zoneScores.sort((a, b) => b.priorityQuotient - a.priorityQuotient);

  const schedule: TriageScheduleItem[] = [];
  let cumulativeTime = 0;
  let totalSaved = 0;
  let stepCounter = 2;

  for (let i = 0; i < zoneScores.length; i++) {
    const item = zoneScores[i];
    cumulativeTime += averageDispatchHoursPerZone;

    let status: "on_time" | "at_risk" | "breached" = "on_time";
    if (cumulativeTime <= item.deadlineHours) {
      status = "on_time";
    } else if (cumulativeTime <= item.deadlineHours + 1.5) {
      status = "at_risk";
    } else {
      status = "breached";
    }

    const savedFraction = status === "on_time" ? 0.95 : status === "at_risk" ? 0.65 : 0.35;
    const mitigated = Math.round(item.zone.casualties * savedFraction);
    totalSaved += mitigated;

    schedule.push({
      zone: item.zone,
      priorityScore: Math.round(item.priorityQuotient),
      estimatedArrivalHours: Number(cumulativeTime.toFixed(1)),
      deadlineHours: item.deadlineHours,
      status,
      livesAtRiskMitigated: mitigated,
    });

    steps.push({
      stepNumber: stepCounter++,
      title: `Slot ${i + 1}: ${item.zone.name}`,
      description: `Scheduled priority dispatch for ${item.zone.name} (Triage: ${item.zone.triage.toUpperCase()}, ${item.zone.casualties} casualties). ETA: T+${cumulativeTime.toFixed(1)} hrs (Golden Window Deadline: T+${item.deadlineHours} hrs). Status: ${status.replace("_", " ").toUpperCase()}.`,
      pseudocodeLine: 4,
      activeNodeIds: [item.zone.id],
      logMessage: `[Scheduled Slot ${i + 1}] ${item.zone.name} | ETA: ${cumulativeTime.toFixed(1)}h | Window: ${item.deadlineHours}h`,
      metrics: {
        "Dispatched Sector": item.zone.name,
        "Arrival ETA": `T+${cumulativeTime.toFixed(1)}h`,
        "Expected Survival Rate": `${(savedFraction * 100).toFixed(0)}%`,
      },
    });
  }

  const preventedDeteriorationIndex = Math.round((totalSaved / zones.reduce((a, z) => a + z.casualties, 0)) * 100);

  steps.push({
    stepNumber: stepCounter,
    title: "Triage Dispatch Plan Verified",
    description: `Optimal greedy sequence resolved. Projected survival intervention rate: ${preventedDeteriorationIndex}% (${totalSaved} lives stabilized within physiological golden hours).`,
    pseudocodeLine: 8,
    activeNodeIds: zones.map((z) => z.id),
    logMessage: `[Triage Complete] ${totalSaved} casualties mitigated across ${schedule.length} sequential dispatches.`,
    metrics: {
      "Overall Survival Rate": `${preventedDeteriorationIndex}%`,
      "Stabilized Casualties": totalSaved,
      "Critical Windows Met": schedule.filter((s) => s.status === "on_time").length,
    },
  });

  return {
    schedule,
    totalLivesSaved: totalSaved,
    preventedDeteriorationIndex,
    steps,
  };
}
