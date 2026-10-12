import { SupplyItem, AlgorithmStep, FractionalAllocation } from "../types";

export interface FractionalKnapsackResult {
  maxUtility: number;
  totalWeightKg: number;
  capacityKg: number;
  allocations: FractionalAllocation[];
  fullAllocations: FractionalAllocation[];
  fractionalAllocation: FractionalAllocation | null;
  omittedAllocations: FractionalAllocation[];
  steps: AlgorithmStep[];

  // 0/1 Knapsack Comparison (for DAA curriculum demonstration)
  discrete01Utility: number;
  discrete01WeightKg: number;
  discrete01Items: SupplyItem[];
  relaxationGain: number; // Fractional Utility - 0/1 Utility
  dpTable: number[][];
  weightSteps: number[];
}

/**
 * Solves the Fractional Knapsack Problem using the Greedy Strategy.
 *
 * Algorithm Paradigm: GREEDY
 * Time Complexity: O(n log n) due to sorting (or O(n) with linear selection)
 * Space Complexity: O(n)
 *
 * Optimality Property:
 * The Greedy Choice Property guarantees global optimality for Fractional Knapsack.
 * Items are sorted in descending order of utility density ratio r_i = v_i / w_i.
 * Items with higher density are consumed in full (x_i = 1) until the boundary
 * item, which is fractionally partitioned (x_k = remaining_capacity / w_k)
 * to saturate 100% of vehicle payload capacity W.
 */
export function runFractionalKnapsack(
  items: SupplyItem[],
  capacityKg: number,
  stepGranularityKg = 100
): FractionalKnapsackResult {
  const steps: AlgorithmStep[] = [];
  const n = items.length;

  // 1. Calculate utility density ratio r_i = utility / weight
  const itemsWithRatio = items.map((item) => ({
    item,
    ratio: item.utilityScore / item.weightKg,
  }));

  // 2. Sort descending by ratio: r_1 >= r_2 >= ... >= r_n
  itemsWithRatio.sort((a, b) => b.ratio - a.ratio);

  steps.push({
    stepNumber: 1,
    title: "Density Ratios Computed & Descending Sort O(n log n)",
    description: `Computed utility density ratio (rᵢ = vᵢ / wᵢ) for all ${n} candidate relief pallets. Sorted descending by rᵢ to prepare Greedy selection. Highest density item: '${itemsWithRatio[0].item.name}' (${itemsWithRatio[0].ratio.toFixed(2)} pts/kg); lowest: '${itemsWithRatio[n - 1].item.name}' (${itemsWithRatio[n - 1].ratio.toFixed(2)} pts/kg). Target capacity W = ${capacityKg.toLocaleString()} kg.`,
    pseudocodeLine: 2,
    logMessage: `[Greedy Sort] Ranked ${n} items by utility density ratio. W = ${capacityKg} kg.`,
    metrics: {
      "Target Payload (W)": `${capacityKg} kg`,
      "Candidate Items": n,
      "Highest Density": `${itemsWithRatio[0].ratio.toFixed(2)} pts/kg`,
      "Lowest Density": `${itemsWithRatio[n - 1].ratio.toFixed(2)} pts/kg`,
    },
  });

  let remainingCap = capacityKg;
  let runningUtility = 0;
  let runningWeight = 0;
  let stepIndex = 2;

  const allocations: FractionalAllocation[] = [];
  const fullAllocations: FractionalAllocation[] = [];
  let fractionalAllocation: FractionalAllocation | null = null;
  const omittedAllocations: FractionalAllocation[] = [];

  for (let i = 0; i < itemsWithRatio.length; i++) {
    const { item, ratio } = itemsWithRatio[i];

    if (remainingCap <= 0) {
      // Knapsack completely filled; item is omitted (x_i = 0)
      const alloc: FractionalAllocation = {
        item,
        ratio,
        fraction: 0,
        takenWeightKg: 0,
        takenUtility: 0,
        status: "omitted",
        cumulativeWeightKg: runningWeight,
      };
      allocations.push(alloc);
      omittedAllocations.push(alloc);

      if (omittedAllocations.length === 1) {
        steps.push({
          stepNumber: stepIndex++,
          title: `Capacity Saturated: Omitted '${item.name}'`,
          description: `Vehicle capacity W = ${capacityKg} kg is 100% full. All remaining lower-density items are assigned allocation fraction xᵢ = 0.0.`,
          pseudocodeLine: 8,
          logMessage: `[Greedy Capacity Limit] Payload filled to 100%. Remaining items omitted.`,
          metrics: {
            "Saturated Weight": `${runningWeight.toFixed(1)} kg`,
            "Accumulated Utility": runningUtility.toFixed(1),
            "Remaining Capacity": "0 kg",
          },
        });
      }
    } else if (item.weightKg <= remainingCap) {
      // Entire item fits (x_i = 1.0)
      const fraction = 1.0;
      const takenWeight = item.weightKg;
      const takenUtility = item.utilityScore;

      remainingCap -= takenWeight;
      runningWeight += takenWeight;
      runningUtility += takenUtility;

      const alloc: FractionalAllocation = {
        item,
        ratio,
        fraction,
        takenWeightKg: takenWeight,
        takenUtility,
        status: "full",
        cumulativeWeightKg: runningWeight,
      };
      allocations.push(alloc);
      fullAllocations.push(alloc);

      steps.push({
        stepNumber: stepIndex++,
        title: `Loaded 100% Full Pallet: '${item.name}'`,
        description: `Greedily selected highest remaining density item '${item.name}' (density: ${ratio.toFixed(2)} pts/kg). Loaded full pallet (${takenWeight} kg, ${takenUtility} pts). Remaining vehicle capacity: ${remainingCap.toFixed(1)} kg.`,
        pseudocodeLine: 6,
        highlightedData: { item: item.name, fraction: 1.0 },
        logMessage: `[Greedy Pick Full] ${item.name} -> +${takenUtility} pts (${takenWeight} kg). Remaining: ${remainingCap} kg.`,
        metrics: {
          "Loaded Item": item.name,
          "Density Ratio": `${ratio.toFixed(2)} pts/kg`,
          "Allocation Fraction": "100% (Full)",
          "Running Utility": runningUtility.toFixed(1),
          "Remaining Capacity": `${remainingCap.toFixed(1)} kg`,
        },
      });
    } else {
      // Boundary item cannot fit completely: take fraction x_i = remainingCap / item.weightKg
      const fraction = remainingCap / item.weightKg;
      const takenWeight = remainingCap;
      const takenUtility = fraction * item.utilityScore;

      runningWeight += takenWeight;
      runningUtility += takenUtility;
      remainingCap = 0;

      const alloc: FractionalAllocation = {
        item,
        ratio,
        fraction,
        takenWeightKg: takenWeight,
        takenUtility,
        status: "fractional",
        cumulativeWeightKg: runningWeight,
      };
      allocations.push(alloc);
      fractionalAllocation = alloc;

      steps.push({
        stepNumber: stepIndex++,
        title: `CRITICAL BOUNDARY SPLIT: '${item.name}' at ${(fraction * 100).toFixed(1)}%`,
        description: `Item '${item.name}' (${item.weightKg} kg) exceeds remaining capacity (${takenWeight.toFixed(1)} kg). Dividing cargo pallet: took fraction x = ${(fraction * 100).toFixed(1)}% (${takenWeight.toFixed(1)} kg, +${takenUtility.toFixed(1)} utility points) to achieve exact 100% payload saturation!`,
        pseudocodeLine: 7,
        highlightedData: { item: item.name, fraction },
        logMessage: `[Fractional Split] ${item.name} divided: ${(fraction * 100).toFixed(1)}% loaded (${takenWeight.toFixed(1)} kg, +${takenUtility.toFixed(1)} pts).`,
        metrics: {
          "Boundary Item": item.name,
          "Original Pallet Weight": `${item.weightKg} kg`,
          "Fraction Loaded": `${(fraction * 100).toFixed(1)}%`,
          "Partial Weight Loaded": `${takenWeight.toFixed(1)} kg`,
          "Partial Utility": takenUtility.toFixed(1),
          "Payload Saturation": "100.0%",
        },
      });
    }
  }

  // Round results for clean presentation
  const maxUtility = Number(runningUtility.toFixed(2));
  const totalWeightKg = Number(runningWeight.toFixed(2));

  // -------------------------------------------------------------
  // Calculate Discrete 0/1 Knapsack via Dynamic Programming
  // for DAA Curriculum & LP Relaxation comparison
  // -------------------------------------------------------------
  const slots = Math.floor(capacityKg / stepGranularityKg);
  const weightSteps: number[] = [];
  for (let w = 0; w <= slots; w++) {
    weightSteps.push(w * stepGranularityKg);
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(slots + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const itemSlots = Math.ceil(item.weightKg / stepGranularityKg);

    for (let w = 0; w <= slots; w++) {
      const currentWeightKg = w * stepGranularityKg;
      if (item.weightKg > currentWeightKg) {
        dp[i][w] = dp[i - 1][w];
      } else {
        const remainingSlots = Math.max(0, w - itemSlots);
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][remainingSlots] + item.utilityScore);
      }
    }
  }

  // Backtrack 0/1 selected items
  const discrete01Items: SupplyItem[] = [];
  let currW = slots;
  for (let i = n; i > 0; i--) {
    if (dp[i][currW] !== dp[i - 1][currW]) {
      const picked = items[i - 1];
      discrete01Items.push(picked);
      const pickedSlots = Math.ceil(picked.weightKg / stepGranularityKg);
      currW = Math.max(0, currW - pickedSlots);
    }
  }
  discrete01Items.reverse();
  const discrete01Utility = dp[n][slots];
  const discrete01WeightKg = discrete01Items.reduce((acc, it) => acc + it.weightKg, 0);

  const relaxationGain = Number((maxUtility - discrete01Utility).toFixed(2));

  // Final Algorithm Step: Solution Summary
  steps.push({
    stepNumber: stepIndex,
    title: "Fractional Knapsack Optimal Solution & DAA Verification",
    description: `Greedy strategy achieved optimal fractional utility of ${maxUtility} pts at ${totalWeightKg} kg / ${capacityKg} kg (${((totalWeightKg / capacityKg) * 100).toFixed(1)}% payload utilization). Due to divisible cargo allowance, Fractional Knapsack yields +${relaxationGain} pts (+${discrete01Utility > 0 ? ((relaxationGain / discrete01Utility) * 100).toFixed(1) : 0}%) higher utility than the discrete 0/1 Knapsack integer restriction.`,
    pseudocodeLine: 10,
    logMessage: `[Fractional Knapsack Complete] Optimal Utility: ${maxUtility} pts. Relaxation Gain: +${relaxationGain} pts over 0/1.`,
    metrics: {
      "Optimal Fractional Utility": maxUtility,
      "Discrete 0/1 DP Utility": discrete01Utility,
      "Relaxation Gain": `+${relaxationGain} pts`,
      "Payload Utilization": `${((totalWeightKg / capacityKg) * 100).toFixed(1)}%`,
      "Full Pallets Loaded": fullAllocations.length,
      "Boundary Pallet Split": fractionalAllocation ? `${fractionalAllocation.item.name} (${(fractionalAllocation.fraction * 100).toFixed(1)}%)` : "None (Exact fit)",
    },
  });

  return {
    maxUtility,
    totalWeightKg,
    capacityKg,
    allocations,
    fullAllocations,
    fractionalAllocation,
    omittedAllocations,
    steps,
    discrete01Utility,
    discrete01WeightKg,
    discrete01Items,
    relaxationGain,
    dpTable: dp,
    weightSteps,
  };
}

/**
 * Backward compatibility alias for any existing imports
 */
export const runKnapsackDP = (
  items: SupplyItem[],
  capacityKg: number,
  stepGranularityKg = 100
) => {
  return runFractionalKnapsack(items, capacityKg, stepGranularityKg);
};

export type KnapsackDPResult = FractionalKnapsackResult;
