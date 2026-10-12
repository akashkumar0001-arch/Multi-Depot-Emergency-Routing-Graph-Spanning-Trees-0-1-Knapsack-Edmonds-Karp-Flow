import React from "react";
import { ALGORITHM_REGISTRY } from "../algorithms/registry";
import { AlgorithmType } from "../types";
import { BookOpen, Cpu, CheckCircle2, Sigma, Activity, Network } from "lucide-react";

interface DAATheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DAATheoryModal: React.FC<DAATheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                DAA Core Curriculum & Disaster Logistics Formulations
              </h2>
              <p className="text-xs text-slate-600">
                Formal algorithmic analysis, asymptotic complexities, and mathematical paradigms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(ALGORITHM_REGISTRY).map((meta) => (
              <div
                key={meta.type}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                        {meta.paradigm}
                      </span>
                      <h3 className="font-bold text-slate-900 font-mono text-sm mt-1">
                        {meta.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                      {meta.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans">
                    {meta.description}
                  </p>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TIME COMPLEXITY:</span>
                      <span className="text-emerald-700 font-bold">{meta.timeComplexity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SPACE COMPLEXITY:</span>
                      <span className="text-cyan-700 font-bold">{meta.spaceComplexity}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1">
                    Disaster Logistics Application:
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {meta.realWorldRole}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparative Paradigm Reference Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <h3 className="font-bold text-slate-900 font-mono text-sm flex items-center gap-2">
              <Sigma className="w-4 h-4 text-amber-700" />
              Paradigm Comparison Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-slate-600 bg-slate-50 border-b border-slate-200 text-[11px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Algorithmic Paradigm</th>
                    <th className="py-2.5 px-3">Implemented Algorithm</th>
                    <th className="py-2.5 px-3">Optimality Guarantee</th>
                    <th className="py-2.5 px-3">Primary Data Structure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 text-amber-800 font-semibold">Greedy</td>
                    <td className="py-2.5 px-3">Fractional Knapsack Cargo Allocation</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Exact Global Optimal (Greedy Choice Property)</td>
                    <td className="py-2.5 px-3">Value-to-Weight Density Ratio Sort</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-amber-800 font-semibold">Greedy</td>
                    <td className="py-2.5 px-3">Kruskal's MST</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Exact Global Optimal (Matroid / Cut Property)</td>
                    <td className="py-2.5 px-3">Disjoint Set Union (DSU)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-emerald-800 font-semibold">Dynamic Programming (Contrast)</td>
                    <td className="py-2.5 px-3">0/1 Knapsack Discrete Benchmark</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Exact Integer Optimal (Bellman Recurrence)</td>
                    <td className="py-2.5 px-3">2D Memoization Matrix DP[i][w]</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-cyan-800 font-semibold">Graph Theory</td>
                    <td className="py-2.5 px-3">Dynamic Dijkstra</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Exact Shortest Path</td>
                    <td className="py-2.5 px-3">Binary Min-Heap / Priority Queue</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-rose-800 font-semibold">Network Flow</td>
                    <td className="py-2.5 px-3">Edmonds-Karp Max Flow</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Max-Flow Min-Cut Exact</td>
                    <td className="py-2.5 px-3">Residual Graph & BFS Queue</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-purple-800 font-semibold">Heuristic / ML</td>
                    <td className="py-2.5 px-3">MDVRP (Clarke-Wright + 2-Opt)</td>
                    <td className="py-2.5 px-3 text-amber-700 font-medium">Near-Optimal (NP-Hard)</td>
                    <td className="py-2.5 px-3">Savings Matrix & K-Means Clusters</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
