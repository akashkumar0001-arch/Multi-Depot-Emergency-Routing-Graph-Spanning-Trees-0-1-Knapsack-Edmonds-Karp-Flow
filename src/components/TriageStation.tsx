import React, { useState, useMemo } from "react";
import { DisasterZone } from "../types";
import { runTriageScheduler, TriageScheduleResult } from "../algorithms/triageScheduler";
import {
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface TriageStationProps {
  zones: DisasterZone[];
}

export const TriageStation: React.FC<TriageStationProps> = ({ zones }) => {
  const [dispatchHoursPerZone, setDispatchHoursPerZone] = useState(1.0);

  const triageResult: TriageScheduleResult = useMemo(() => {
    return runTriageScheduler(zones, dispatchHoursPerZone);
  }, [zones, dispatchHoursPerZone]);

  const { schedule, totalLivesSaved, preventedDeteriorationIndex } = triageResult;

  const totalCasualties = zones.reduce((acc, z) => acc + z.casualties, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-700 border border-red-200">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-mono">
                Triage Priority Dispatch & Deadline Scheduling
              </h2>
              <p className="text-xs text-slate-600">
                Greedy Earliest Deadline First (EDF) with exponential casualty urgency decay penalties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center min-w-[140px]">
              <span className="text-[10px] text-slate-500 font-mono block">PROJECTED SURVIVAL</span>
              <span className="text-2xl font-mono font-bold text-emerald-700">
                {preventedDeteriorationIndex}%
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center min-w-[140px]">
              <span className="text-[10px] text-slate-500 font-mono block">STABILIZED VICTIMS</span>
              <span className="text-2xl font-mono font-bold text-slate-800">
                {totalLivesSaved} / {totalCasualties}
              </span>
            </div>
          </div>
        </div>

        {/* Speed Adjustment Slider */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-600 font-medium">Convoy Transit & Field Setup Time per Zone:</span>
              <span className="text-amber-800 font-bold text-sm">
                {dispatchHoursPerZone.toFixed(1)} hours / sector
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={dispatchHoursPerZone}
              onChange={(e) => setDispatchHoursPerZone(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.5 hr (Rapid Medevac / Air)</span>
              <span>1.0 hr (Standard Convoy)</span>
              <span>2.5 hr (Severe Traffic / Flooding)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sequential Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedule.map((slot, index) => {
          const statusStyles = {
            on_time: {
              border: "border-emerald-300",
              badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
              label: "WITHIN GOLDEN WINDOW",
              icon: CheckCircle2,
            },
            at_risk: {
              border: "border-amber-300",
              badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
              label: "MODERATE DETERIORATION RISK",
              icon: AlertTriangle,
            },
            breached: {
              border: "border-red-300",
              badgeBg: "bg-red-50 text-red-800 border-red-200",
              label: "DEADLINE BREACHED",
              icon: XCircle,
            },
          }[slot.status];

          const IconComponent = statusStyles.icon;

          return (
            <div
              key={slot.zone.id}
              className={`bg-white border ${statusStyles.border} rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-amber-800 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                      #{index + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 font-mono text-sm">
                      {slot.zone.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusStyles.badgeBg} flex items-center gap-1`}
                  >
                    <IconComponent className="w-3 h-3" />
                    {statusStyles.label}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 font-mono text-xs text-center">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">TRIAGE</span>
                    <span
                      className={`font-bold uppercase ${
                        slot.zone.triage === "critical"
                          ? "text-red-700"
                          : slot.zone.triage === "severe"
                          ? "text-amber-700"
                          : "text-slate-700"
                      }`}
                    >
                      {slot.zone.triage}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">CASUALTIES</span>
                    <span className="font-bold text-slate-800">{slot.zone.casualties}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">DEADLINE</span>
                    <span className="font-bold text-amber-800">{slot.deadlineHours}h</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">CONVOY ETA</span>
                    <span className="font-bold text-cyan-800">T+{slot.estimatedArrivalHours}h</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>Priority Quotient: {slot.priorityScore} pts</span>
                <span className="text-emerald-700 font-bold">
                  {slot.livesAtRiskMitigated} survivors protected
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
