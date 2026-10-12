import React, { useState } from "react";
import { Depot, DisasterZone, Edge, AlgorithmType } from "../types";
import {
  Sparkles,
  Cpu,
  FileText,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Compass,
} from "lucide-react";

interface AiCommanderModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioName: string;
  depots: Depot[];
  zones: DisasterZone[];
  edges: Edge[];
  activeAlgorithm: AlgorithmType;
  metrics: Record<string, string | number>;
}

export const AiCommanderModal: React.FC<AiCommanderModalProps> = ({
  isOpen,
  onClose,
  scenarioName,
  depots,
  zones,
  edges,
  activeAlgorithm,
  metrics,
}) => {
  const [sitrep, setSitrep] = useState<string | null>(null);
  const [sitrepSource, setSitrepSource] = useState<string | null>(null);
  const [isLoadingSitrep, setIsLoadingSitrep] = useState(false);
  const [copied, setCopied] = useState(false);

  // Q&A state
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string; source?: string }[]
  >([
    {
      role: "assistant",
      content:
        "Tactical Dispatch AI online. I analyze disaster logistics graphs using DAA principles (Dijkstra, Kruskal MST, Fractional Knapsack, Edmonds-Karp, and Multi-Depot VRP). Ask any question regarding resource allocation, bottleneck clearing, or convoy re-routing.",
      source: "gemini-3.8-flash",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const generateSitrep = async () => {
    setIsLoadingSitrep(true);
    try {
      const response = await fetch("/api/gemini/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName,
          depots,
          disasterZones: zones,
          edges,
          activeAlgorithm,
          metrics,
        }),
      });
      const data = await response.json();
      setSitrep(data.report);
      setSitrepSource(data.source);
    } catch (err) {
      console.error("Error fetching SITREP:", err);
      setSitrep("Failed to generate report. Please check server connectivity.");
    } finally {
      setIsLoadingSitrep(false);
    }
  };

  const handleAsk = async (promptToUse?: string) => {
    const text = promptToUse || query;
    if (!text.trim()) return;

    setChatHistory((prev) => [...prev, { role: "user", content: text }]);
    setQuery("");
    setIsAsking(true);

    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          scenarioContext: {
            scenarioName,
            depotsCount: depots.length,
            zonesCount: zones.length,
            criticalZones: zones.filter((z) => z.triage === "critical").map((z) => z.name),
            blockedCorridors: edges.filter((e) => e.status !== "clear").map((e) => `${e.from}-${e.to}`),
            activeAlgorithm,
          },
        }),
      });
      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, source: data.source },
      ]);
    } catch (err) {
      console.error("Error asking advisor:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Encountered an issue communicating with Tactical AI. Please retry.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopySitrep = () => {
    if (!sitrep) return;
    navigator.clipboard.writeText(sitrep);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickQuestions = [
    "Which depot should handle St. Jude Hospital's trauma crisis?",
    "If the coastal highway collapses, what is the Dijkstra alternate route?",
    "Why is the Greedy Strategy provably optimal for Fractional Knapsack but not 0/1 Knapsack?",
    "What roadway does Edmonds-Karp identify as the primary Min-Cut bottleneck?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                Gemini Tactical Dispatch Commander
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-50 text-cyan-800 border border-cyan-200">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                Real-time algorithmic situational synthesis & conversational emergency logistics advisor.
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

        {/* Content Body: Split into SITREP and Interactive Q&A */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Automated SITREP Generator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Executive Situation Report (SITREP)</span>
                {sitrepSource && (
                  <span className="text-[10px] font-normal text-slate-500">
                    Source: {sitrepSource}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {sitrep && (
                  <button
                    onClick={handleCopySitrep}
                    className="px-2.5 py-1 rounded text-xs font-mono text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy SITREP
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={generateSitrep}
                  disabled={isLoadingSitrep}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 shadow-xs"
                >
                  {isLoadingSitrep ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing Disaster Grid...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {sitrep ? "Regenerate SITREP" : "Generate Tactical SITREP"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {sitrep ? (
              <div className="prose max-w-none text-xs leading-relaxed text-slate-700 font-sans whitespace-pre-line bg-white p-3.5 rounded-lg border border-slate-200">
                {sitrep}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                Click "Generate Tactical SITREP" to query Gemini AI with current casualty numbers,
                impassable road links, and algorithm telemetry.
              </div>
            )}
          </div>

          {/* Section 2: Interactive Dispatcher Q&A */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 pb-2 border-b border-slate-200">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <span>Tactical Operations Advisor (Conversational DAA Engine)</span>
            </div>

            {/* Chat Log */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-amber-50 text-amber-900 border border-amber-200 font-mono"
                        : "bg-white text-slate-800 border border-slate-200 font-sans shadow-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.source && (
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      via {msg.source}
                    </span>
                  )}
                </div>
              ))}
              {isAsking && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  Tactical AI formulating algorithmic guidance...
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(q)}
                  disabled={isAsking}
                  className="px-2.5 py-1 rounded text-[11px] font-mono text-slate-700 bg-white border border-slate-200 hover:text-cyan-800 hover:border-cyan-300 hover:bg-cyan-50/50 transition disabled:opacity-50 text-left shadow-xs"
                >
                  💡 {q}
                </button>
              ))}
            </div>

            {/* Query Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Ask tactical advisor (e.g., 'How to clear bottleneck on route Z1-D2?')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                disabled={isAsking}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
              <button
                onClick={() => handleAsk()}
                disabled={isAsking || !query.trim()}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
