import React from "react";
import { Edge, Depot, DisasterZone } from "../types";
import { MaxFlowResult } from "../algorithms/maxFlow";
import {
  Layers,
  ArrowRight,
  AlertOctagon,
  TrendingUp,
  CheckCircle2,
  Wrench,
  Gauge,
} from "lucide-react";

interface MaxFlowInspectorProps {
  maxFlowResult: MaxFlowResult;
  depots: Depot[];
  zones: DisasterZone[];
  edges: Edge[];
  onUpgradeEdge: (edgeId: string) => void;
}

export const MaxFlowInspector: React.FC<MaxFlowInspectorProps> = ({
  maxFlowResult,
  depots,
  zones,
  edges,
  onUpgradeEdge,
}) => {
  const { maxFlow, flowByEdge, minCutEdges, augmentingPaths } = maxFlowResult;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-mono">
                Evacuation & Relief Flow Bottleneck Station (Edmonds-Karp)
              </h2>
              <p className="text-xs text-slate-600">
                Max-Flow Min-Cut Theorem applied to disaster road networks and evacuation arteries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center min-w-[150px]">
              <span className="text-[10px] text-slate-500 font-mono block">MAX NETWORK FLOW</span>
              <span className="text-2xl font-mono font-bold text-cyan-700">
                {maxFlow} <span className="text-xs text-slate-500 font-normal">convoys/hr</span>
              </span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center min-w-[130px]">
              <span className="text-[10px] text-rose-700 font-mono font-semibold block">MIN-CUT CHOKEPOINTS</span>
              <span className="text-2xl font-mono font-bold text-rose-700">
                {minCutEdges.length} <span className="text-xs text-rose-600 font-normal">edges</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed font-sans">
          According to the <strong>Max-Flow Min-Cut Theorem</strong>, the maximum flow from Super-Source (S) to
          Super-Sink (T) equals the net capacity of the minimum cut. Repairing or widening these specific choke points
          directly expands the survivable evacuation throughput of the entire region.
        </p>
      </div>

      {/* Min-Cut Bottlenecks Section */}
      <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 font-mono text-sm">
              Identified Min-Cut Critical Bottlenecks ({minCutEdges.length} Arterial Links)
            </h3>
          </div>
          <span className="text-xs font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200 font-bold">
            100% Flow Saturation
          </span>
        </div>

        {minCutEdges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {minCutEdges.map((edge) => {
              const fromName =
                depots.find((d) => d.id === edge.from)?.name ||
                zones.find((z) => z.id === edge.from)?.name ||
                edge.from;
              const toName =
                depots.find((d) => d.id === edge.to)?.name ||
                zones.find((z) => z.id === edge.to)?.name ||
                edge.to;
              const flowVal = flowByEdge[edge.id] || 0;

              return (
                <div
                  key={edge.id}
                  className="bg-slate-50 border border-rose-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        Corridor {edge.from} ⮂ {edge.to}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        BOTTLENECK
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-sans mt-1">
                      {fromName} ➔ {toName}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-xs">
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">FLOW</span>
                        <span className="font-bold text-rose-700">{flowVal} v/h</span>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">CAPACITY</span>
                        <span className="font-bold text-slate-800">
                          {edge.capacityVehiclesPerHour} v/h
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">CONDITION</span>
                        <span className="font-bold text-amber-700 capitalize">
                          {edge.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpgradeEdge(edge.id)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Engineer Upgrade (+25 Vehicles/hr Capacity)
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            No active bottlenecks detected. Flow capacity meets current demand.
          </div>
        )}
      </div>

      {/* Augmenting Paths Discovered by BFS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <h3 className="font-bold text-slate-900 font-mono text-sm">
              BFS Augmenting Paths Discovered ({augmentingPaths.length} Iterations)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Edmonds-Karp Convergence
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {augmentingPaths.map((ap, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-cyan-700 font-bold">Path #{idx + 1}:</span>
                <span className="text-slate-600">
                  {ap.path.filter((n) => n !== "SUPER_SOURCE" && n !== "SUPER_SINK").join(" ➔ ")}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold">
                +{ap.flow} convoys/hr
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
