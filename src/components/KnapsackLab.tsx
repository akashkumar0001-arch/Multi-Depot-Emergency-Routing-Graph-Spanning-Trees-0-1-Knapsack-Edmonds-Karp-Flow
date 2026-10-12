import React, { useState, useMemo } from "react";
import { RELIEF_SUPPLIES } from "../data/scenarios";
import { runFractionalKnapsack, FractionalKnapsackResult } from "../algorithms/knapsack";
import {
  Box,
  Truck,
  HeartPulse,
  Droplets,
  Zap,
  Apple,
  Shield,
  Pill,
  CheckCircle2,
  PieChart,
  Table,
  Scale,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  Divide,
  Sigma,
  AlertTriangle,
} from "lucide-react";

export const KnapsackLab: React.FC = () => {
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState<number>(1800);
  const [activeTab, setActiveTab] = useState<"manifest" | "trace" | "theory">("manifest");
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const vehiclePresets = [
    { name: "Trauma Van Ambulance", cap: 1200, icon: HeartPulse },
    { name: "4x4 Tactical Cruiser", cap: 2400, icon: Truck },
    { name: "Heavy Transport 10T", cap: 4500, icon: Truck },
    { name: "AirDrop Drone Wing", cap: 800, icon: Box },
  ];

  // Run Fractional Knapsack Greedy Algorithm
  const result: FractionalKnapsackResult = useMemo(() => {
    return runFractionalKnapsack(RELIEF_SUPPLIES, vehicleCapacityKg, 100);
  }, [vehicleCapacityKg]);

  const currentStep = result.steps[selectedStepIdx] || result.steps[0];
  const totalSteps = result.steps.length;

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "medical":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          bar: "bg-red-500",
        };
      case "water":
        return {
          bg: "bg-cyan-50",
          text: "text-cyan-700",
          border: "border-cyan-200",
          bar: "bg-cyan-500",
        };
      case "power":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          bar: "bg-amber-500",
        };
      case "food":
      default:
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          bar: "bg-emerald-500",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Vehicle Capacity Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
              <Divide className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  Vehicle Cargo Allocation & Fractional Knapsack Lab
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  GREEDY STRATEGY • O(N LOG N)
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  PROVABLY OPTIMAL
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Optimal allocation of divisible humanitarian supplies (potable water liters, blood plasma crates, bulk rations) by utility density ratio (vᵢ / wᵢ).
              </p>
            </div>
          </div>

          {/* Vehicle Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {vehiclePresets.map((vp) => (
              <button
                key={vp.name}
                onClick={() => {
                  setVehicleCapacityKg(vp.cap);
                  setSelectedStepIdx(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
                  vehicleCapacityKg === vp.cap
                    ? "bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-xs ring-1 ring-amber-400/30"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <vp.icon className="w-3.5 h-3.5" />
                {vp.name} ({vp.cap.toLocaleString()}kg)
              </button>
            ))}
          </div>
        </div>

        {/* Capacity Slider & Real-time Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                Vehicle Payload Capacity Constraint (W):
              </span>
              <span className="text-amber-800 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {vehicleCapacityKg.toLocaleString()} kg
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="50"
              value={vehicleCapacityKg}
              onChange={(e) => {
                setVehicleCapacityKg(Number(e.target.value));
                setSelectedStepIdx(0);
              }}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>500 kg (Drone Wing)</span>
              <span>1,800 kg (Standard Truck)</span>
              <span>3,500 kg (Transport)</span>
              <span>6,000 kg (Heavy Convoy)</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-mono block">FRACTIONAL UTILITY</span>
              <span className="text-base font-mono font-bold text-emerald-700">
                {result.maxUtility.toLocaleString()} pts
              </span>
              <span className="text-[9px] font-mono text-emerald-600 block font-semibold">
                GLOBAL OPTIMAL
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-mono block">PAYLOAD SATURATION</span>
              <span className="text-base font-mono font-bold text-cyan-700">
                {((result.totalWeightKg / result.capacityKg) * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] font-mono text-slate-500 block">
                {result.totalWeightKg.toLocaleString()} / {result.capacityKg.toLocaleString()} kg
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-mono block">FULL / SPLIT / OMIT</span>
              <span className="text-base font-mono font-bold text-slate-800">
                {result.fullAllocations.length} / {result.fractionalAllocation ? "1" : "0"} /{" "}
                {result.omittedAllocations.length}
              </span>
              <span className="text-[9px] font-mono text-slate-500 block">
                {RELIEF_SUPPLIES.length} items evaluated
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-[10px] text-amber-800 font-mono block font-semibold">
                LP RELAXATION SURPLUS
              </span>
              <span className="text-base font-mono font-bold text-amber-800">
                +{result.relaxationGain} pts
              </span>
              <span className="text-[9px] font-mono text-amber-700 block">
                over 0/1 discrete DP
              </span>
            </div>
          </div>
        </div>

        {/* Visual Stacked Vehicle Payload Cargo Bay */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-700 font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              Vehicle Cargo Bay Payload Distribution (100% Saturation):
            </span>
            {result.fractionalAllocation && (
              <span className="text-amber-700 font-semibold text-[11px] flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Divide className="w-3 h-3 text-amber-600" />
                Boundary Split: {result.fractionalAllocation.item.name} at{" "}
                <strong>{(result.fractionalAllocation.fraction * 100).toFixed(1)}%</strong> (
                {result.fractionalAllocation.takenWeightKg.toFixed(1)}kg)
              </span>
            )}
          </div>

          {/* Stacked Cargo Bar */}
          <div className="w-full bg-slate-100 border border-slate-300 h-7 rounded-lg overflow-hidden flex shadow-inner relative">
            {result.allocations
              .filter((a) => a.fraction > 0)
              .map((alloc) => {
                const widthPercent = (alloc.takenWeightKg / result.capacityKg) * 100;
                const isFractional = alloc.status === "fractional";
                const isHovered = hoveredItemId === alloc.item.id;
                const col = categoryColor(alloc.item.category);

                return (
                  <div
                    key={alloc.item.id}
                    onMouseEnter={() => setHoveredItemId(alloc.item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full relative group transition-all cursor-pointer border-r border-white/60 ${
                      col.bar
                    } ${isHovered ? "brightness-110 ring-2 ring-slate-900 z-10" : ""}`}
                    title={`${alloc.item.name}: ${alloc.takenWeightKg.toFixed(1)} kg (${(
                      alloc.fraction * 100
                    ).toFixed(1)}%) -> +${alloc.takenUtility.toFixed(1)} pts`}
                  >
                    {isFractional && (
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.4)_4px,rgba(255,255,255,0.4)_8px)]" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white font-bold truncate px-1 drop-shadow-xs">
                      {widthPercent > 7 && (
                        <span>
                          {alloc.item.name.slice(0, 10)} {isFractional ? `(${Math.round(alloc.fraction * 100)}%)` : ""}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Medical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> Water
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Power
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Food
              </span>
              <span className="flex items-center gap-1 ml-2 text-amber-700">
                <span className="w-3.5 h-2.5 rounded-sm bg-amber-500 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.5)_2px,rgba(255,255,255,0.5)_4px)] inline-block border border-amber-600" />{" "}
                Fractional Boundary Split
              </span>
            </div>
            <span className="text-slate-600 font-semibold">
              Total Weight: {result.totalWeightKg.toFixed(1)} kg / {result.capacityKg} kg
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("manifest")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
            activeTab === "manifest"
              ? "bg-white text-slate-900 border border-slate-200 shadow-xs font-bold ring-1 ring-slate-300"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          Fractional Allocation Manifest ({RELIEF_SUPPLIES.length} Items)
        </button>

        <button
          onClick={() => setActiveTab("trace")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
            activeTab === "trace"
              ? "bg-white text-amber-900 border border-slate-200 shadow-xs font-bold ring-1 ring-amber-300"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Divide className="w-3.5 h-3.5 text-amber-600" />
          Greedy Decision Trace & Boundary Split ({result.steps.length} Steps)
        </button>

        <button
          onClick={() => setActiveTab("theory")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
            activeTab === "theory"
              ? "bg-white text-emerald-900 border border-slate-200 shadow-xs font-bold ring-1 ring-emerald-300"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          DAA Formulation: Fractional vs 0/1 Knapsack
        </button>
      </div>

      {/* Tab 1: Fractional Cargo Allocation Manifest */}
      {activeTab === "manifest" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-3">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-700 font-semibold">
              Items ranked in descending order of Utility Density Ratio (vᵢ / wᵢ).
            </span>
            <div className="flex items-center gap-3 text-slate-600">
              <span>
                Full Pallets: <strong className="text-emerald-700">{result.fullAllocations.length}</strong>
              </span>
              <span>
                Boundary Split:{" "}
                <strong className="text-amber-700">
                  {result.fractionalAllocation ? "1 Pallet" : "None"}
                </strong>
              </span>
              <span>
                Omitted: <strong className="text-slate-500">{result.omittedAllocations.length}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-4">Relief Supply Cargo</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Unit Weight (wᵢ)</th>
                  <th className="py-3 px-3">Unit Utility (vᵢ)</th>
                  <th className="py-3 px-3">Density Ratio (v/w)</th>
                  <th className="py-3 px-4">Allocation Fraction (xᵢ)</th>
                  <th className="py-3 px-3">Loaded Weight</th>
                  <th className="py-3 px-3">Realized Utility</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.allocations.map((alloc, idx) => {
                  const isHovered = hoveredItemId === alloc.item.id;
                  const col = categoryColor(alloc.item.category);
                  const isFractional = alloc.status === "fractional";
                  const isFull = alloc.status === "full";
                  const isOmitted = alloc.status === "omitted";

                  return (
                    <tr
                      key={alloc.item.id}
                      onMouseEnter={() => setHoveredItemId(alloc.item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      className={`transition-colors ${
                        isFractional
                          ? "bg-amber-50/70 hover:bg-amber-50"
                          : isFull
                          ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                          : "hover:bg-slate-50 text-slate-400"
                      } ${isHovered ? "ring-1 ring-inset ring-slate-300" : ""}`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className={isOmitted ? "text-slate-400" : "text-slate-800"}>
                            {alloc.item.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-sans block">
                          {alloc.item.description}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${col.bg} ${col.text} ${col.border}`}
                        >
                          {alloc.item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{alloc.item.weightKg} kg</td>
                      <td className="py-3 px-3 text-slate-800 font-bold">
                        {alloc.item.utilityScore} pts
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {alloc.ratio.toFixed(2)} pts/kg
                        </span>
                      </td>
                      <td className="py-3 px-4 min-w-[170px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span
                              className={
                                isFractional
                                  ? "text-amber-800"
                                  : isFull
                                  ? "text-emerald-700"
                                  : "text-slate-400"
                              }
                            >
                              {(alloc.fraction * 100).toFixed(1)}%
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              xᵢ = {alloc.fraction.toFixed(3)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isFractional
                                  ? "bg-amber-500"
                                  : isFull
                                  ? "bg-emerald-500"
                                  : "bg-transparent"
                              }`}
                              style={{ width: `${alloc.fraction * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {alloc.takenWeightKg.toFixed(1)} kg
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        +{alloc.takenUtility.toFixed(1)} pts
                      </td>
                      <td className="py-3 px-3">
                        {isFull && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            100% FULL
                          </span>
                        )}
                        {isFractional && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                            <Divide className="w-3 h-3" />
                            PARTITIONED
                          </span>
                        )}
                        {isOmitted && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            0% Omitted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Greedy Decision Trace & Boundary Split Stepper */}
      {activeTab === "trace" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          {/* Step Controller Deck */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 font-mono text-sm flex items-center gap-2">
                <Divide className="w-4 h-4 text-amber-600" />
                Greedy Strategy Execution Trace
              </h3>
              <p className="text-xs text-slate-600">
                Step-by-step verification of density sorting, full item intakes, and the critical boundary split.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setSelectedStepIdx((p) => Math.max(0, p - 1))}
                disabled={selectedStepIdx === 0}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="px-2.5 py-1 bg-slate-50 rounded border border-slate-200 text-slate-800 font-bold">
                Step {selectedStepIdx + 1} of {totalSteps}
              </span>
              <button
                onClick={() => setSelectedStepIdx((p) => Math.min(totalSteps - 1, p + 1))}
                disabled={selectedStepIdx >= totalSteps - 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Current Step Detail Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                PHASE {currentStep.pseudocodeLine || 1}: {currentStep.title}
              </span>
              <span className="text-slate-500 text-[11px]">
                Trace Entry #{currentStep.stepNumber}
              </span>
            </div>

            <p className="text-sm text-slate-800 font-sans leading-relaxed">
              {currentStep.description}
            </p>

            {currentStep.metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                {Object.entries(currentStep.metrics).map(([key, val]) => (
                  <div key={key} className="p-2 rounded bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">{key}</span>
                    <span className="font-bold text-slate-800 text-xs">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stepper Timeline Tiles */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-500 font-semibold block">
              Timeline of Greedy Decisions:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {result.steps.map((st, i) => (
                <div
                  key={st.stepNumber}
                  onClick={() => setSelectedStepIdx(i)}
                  className={`p-3 rounded-lg border transition cursor-pointer text-xs font-mono ${
                    selectedStepIdx === i
                      ? "bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-300"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold pb-1">
                    <span className={selectedStepIdx === i ? "text-amber-900" : "text-slate-800"}>
                      Step {st.stepNumber}: {st.title.split(":")[0]}
                    </span>
                    <span className="text-[10px] text-slate-400">#{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans line-clamp-2">
                    {st.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: DAA Formulation: Fractional vs 0/1 Knapsack Comparison */}
      {activeTab === "theory" && (
        <div className="space-y-6">
          {/* Side-by-Side Architectural Paradigm Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fractional Knapsack (Greedy) Card */}
            <div className="bg-white border border-emerald-300 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-slate-900 font-mono text-sm">
                    Fractional Knapsack (Greedy Strategy)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  PROVABLY OPTIMAL
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-sans leading-relaxed">
                <p>
                  <strong>Formulation:</strong> Maximizes total survival utility{" "}
                  <code className="text-emerald-800 font-mono bg-emerald-50 px-1 py-0.5 rounded">
                    ∑ xᵢ · vᵢ
                  </code>{" "}
                  subject to payload weight{" "}
                  <code className="text-emerald-800 font-mono bg-emerald-50 px-1 py-0.5 rounded">
                    ∑ xᵢ · wᵢ ≤ W
                  </code>
                  , with continuous relaxation <strong>0 ≤ xᵢ ≤ 1</strong>.
                </p>
                <p>
                  <strong>Greedy Choice Property:</strong> Sorting candidate cargo by utility density{" "}
                  <code className="font-mono text-emerald-800">rᵢ = vᵢ / wᵢ</code> guarantees an exact global optimum.
                  The knapsack is filled to <strong>100% capacity</strong> by dividing only the single boundary item.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-2">
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">TOTAL UTILITY</span>
                  <span className="text-base font-bold text-emerald-700">
                    {result.maxUtility} pts
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">LOADED WEIGHT</span>
                  <span className="text-base font-bold text-slate-800">
                    {result.totalWeightKg} kg
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">TIME COMPLEXITY</span>
                  <span className="text-base font-bold text-emerald-700">O(n log n)</span>
                </div>
              </div>
            </div>

            {/* 0/1 Knapsack (Dynamic Programming) Card */}
            <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h3 className="font-bold text-slate-800 font-mono text-sm">
                    0/1 Knapsack (Integer Discrete DP)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  INTEGER RESTRICTION
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-sans leading-relaxed">
                <p>
                  <strong>Formulation:</strong> Decision variable is strictly integer discrete{" "}
                  <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">
                    xᵢ ∈ &#123;0, 1&#125;
                  </code>
                  . Items cannot be divided. Solved via Bellman 2D recurrence:
                  <code className="block mt-1 text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-800">
                    DP[i][w] = max(DP[i-1][w], DP[i-1][w - wᵢ] + vᵢ)
                  </code>
                </p>
                <p>
                  <strong>Why Greedy Fails:</strong> Greedily sorting by density can leave large unfillable gaps
                  (slack) that cannot accommodate subsequent items, yielding sub-optimal combinations.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">TOTAL UTILITY</span>
                  <span className="text-base font-bold text-slate-700">
                    {result.discrete01Utility} pts
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">LOADED WEIGHT</span>
                  <span className="text-base font-bold text-slate-800">
                    {result.discrete01WeightKg} kg
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">TIME COMPLEXITY</span>
                  <span className="text-base font-bold text-slate-700">O(n · W) DP</span>
                </div>
              </div>
            </div>
          </div>

          {/* DAA Mathematical Rigor: The LP Relaxation Theorem */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sigma className="w-4 h-4 text-amber-700" />
              DAA Mathematical Comparison: The Fractional Relaxation Upper Bound
            </h4>
            <p className="text-slate-600 font-sans leading-relaxed">
              Because the Fractional Knapsack problem is the Linear Programming (LP) continuous relaxation of the 0/1 Knapsack problem (expanding the feasible decision set from {" "}
              <code className="font-mono text-slate-800">xᵢ ∈ &#123;0, 1&#125;</code> to{" "}
              <code className="font-mono text-slate-800">xᵢ ∈ [0, 1]</code>), the optimal fractional utility is mathematically guaranteed to be an <strong>upper bound</strong> on the discrete optimal utility:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-sm text-slate-800">
              OPT<sub>0/1</sub> ({result.discrete01Utility} pts) ≤ OPT<sub>Fractional</sub> ({result.maxUtility} pts)
              <span className="block text-xs text-emerald-700 font-semibold mt-1">
                Fractional Surplus: +{result.relaxationGain} utility points (+
                {result.discrete01Utility > 0
                  ? ((result.relaxationGain / result.discrete01Utility) * 100).toFixed(1)
                  : 0}
                %) gained by allowing partial cargo divisibility.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
