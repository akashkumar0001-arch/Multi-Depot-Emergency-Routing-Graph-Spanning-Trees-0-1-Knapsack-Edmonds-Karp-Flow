import React from "react";
import { AlgorithmStep } from "../types";
import { ALGORITHM_REGISTRY, AlgorithmMetadata } from "../algorithms/registry";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
  Code2,
  Cpu,
  CheckCircle2,
} from "lucide-react";

interface AlgorithmControlsProps {
  algorithmMeta: AlgorithmMetadata;
  steps: AlgorithmStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onChangeSpeed: (speedMs: number) => void;
}

export const AlgorithmControls: React.FC<AlgorithmControlsProps> = ({
  algorithmMeta,
  steps,
  currentStepIndex,
  isPlaying,
  playbackSpeedMs,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onChangeSpeed,
}) => {
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
      {/* Algorithm Header & Paradigm Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 font-mono text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-600" />
              {algorithmMeta.name}
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
              {algorithmMeta.badge}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {algorithmMeta.realWorldRole}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-slate-500">TIME:</span>{" "}
            <span className="font-bold text-emerald-700">{algorithmMeta.timeComplexity}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-slate-500">SPACE:</span>{" "}
            <span className="font-bold text-cyan-700">{algorithmMeta.spaceComplexity}</span>
          </div>
        </div>
      </div>

      {/* Playback Control Deck & Timeline */}
      <div className="space-y-2">
        {/* Progress Scrubber */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-600">
          <span className="font-medium">Execution Trace Progress</span>
          <span className="text-amber-800 font-bold">
            Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
          </span>
        </div>

        <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition hover:text-slate-900 border border-slate-200 shadow-xs"
              title="Reset Execution"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onStepBack}
              disabled={currentStepIndex <= 0}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-slate-900 border border-slate-200 shadow-xs"
              title="Step Backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  PAUSE
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  AUTO-RUN
                </>
              )}
            </button>

            <button
              onClick={onStepForward}
              disabled={currentStepIndex >= totalSteps - 1}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-slate-900 border border-slate-200 shadow-xs"
              title="Step Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Speed:</span>
            {[
              { label: "0.5x", val: 1600 },
              { label: "1x", val: 900 },
              { label: "2x", val: 400 },
              { label: "4x", val: 180 },
            ].map((sp) => (
              <button
                key={sp.label}
                onClick={() => onChangeSpeed(sp.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  playbackSpeedMs === sp.val
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Step Explanation & Pseudocode Synchronization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        {/* Step Explanation Card */}
        <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <h4 className="font-bold text-slate-900 font-mono text-xs uppercase tracking-wide">
                {currentStep?.title || "Ready to execute"}
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {currentStep?.description || "Press Auto-Run or Step Forward to begin algorithm execution."}
            </p>
          </div>

          {/* Metrics Pill Grid */}
          {currentStep?.metrics && Object.keys(currentStep.metrics).length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-2">
              {Object.entries(currentStep.metrics).map(([key, val]) => (
                <div
                  key={key}
                  className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono shadow-xs"
                >
                  <span className="text-slate-500">{key}:</span>{" "}
                  <span className="text-amber-800 font-bold">{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Synchronized Pseudocode Window */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-3 font-mono text-[11px] overflow-hidden flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              DAA Pseudocode State
            </span>
            <span className="text-amber-400 font-bold">
              Line {currentStep?.pseudocodeLine || 1}
            </span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-36 pr-1 select-text">
            {algorithmMeta.pseudocode.map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = currentStep?.pseudocodeLine === lineNum;

              return (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded transition flex items-start gap-2 ${
                    isCurrentLine
                      ? "bg-amber-500/20 text-amber-300 border-l-2 border-amber-400 font-bold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span className="text-slate-500 select-none text-[10px] w-3 text-right">
                    {lineNum}
                  </span>
                  <span className="break-all">{line.replace(/^\d+\.\s*/, "")}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
