import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Depot,
  DisasterZone,
  Edge,
  AlgorithmType,
  RoadStatus,
  ScenarioPreset,
} from "./types";
import { SCENARIOS, RELIEF_SUPPLIES } from "./data/scenarios";
import { ALGORITHM_REGISTRY } from "./algorithms/registry";
import { runDijkstra } from "./algorithms/dijkstra";
import { runKruskal } from "./algorithms/kruskal";
import { runEdmondsKarp } from "./algorithms/maxFlow";
import { runMDVRP } from "./algorithms/mdvrp";
import { runTriageScheduler } from "./algorithms/triageScheduler";
import { runFractionalKnapsack } from "./algorithms/knapsack";
import appIconImg from "./assets/images/app_icon_emblem_1789976695863.jpg";

import { MapCanvas } from "./components/MapCanvas";
import { AlgorithmControls } from "./components/AlgorithmControls";
import { KnapsackLab } from "./components/KnapsackLab";
import { MaxFlowInspector } from "./components/MaxFlowInspector";
import { TriageStation } from "./components/TriageStation";
import { AiCommanderModal } from "./components/AiCommanderModal";
import { DAATheoryModal } from "./components/DAATheoryModal";

import {
  Navigation,
  Network,
  Box,
  Layers,
  HeartPulse,
  Truck,
  Sparkles,
  BookOpen,
  RotateCcw,
  Activity,
  AlertTriangle,
  Building2,
  Cpu,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";

export function App() {
  // Scenario state
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const currentPreset: ScenarioPreset = SCENARIOS[scenarioIndex];

  // Editable scenario elements (supports dynamic edge hazards)
  const [depots, setDepots] = useState<Depot[]>(currentPreset.depots);
  const [zones, setZones] = useState<DisasterZone[]>(currentPreset.disasterZones);
  const [edges, setEdges] = useState<Edge[]>(currentPreset.edges);

  // Sync state when scenario changes
  useEffect(() => {
    setDepots(currentPreset.depots);
    setZones(currentPreset.disasterZones);
    setEdges(currentPreset.edges);
    setSelectedNodeId(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [scenarioIndex]);

  // Active DAA Algorithm
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmType>("mdvrp");

  // Dijkstra specific endpoints
  const [dijkstraOriginId, setDijkstraOriginId] = useState<string>(depots[0]?.id || "D1");
  const [dijkstraTargetId, setDijkstraTargetId] = useState<string>(zones[0]?.id || "Z1");

  // Step debugger state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(900);

  // UI Modals & Inspection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isTheoryModalOpen, setIsTheoryModalOpen] = useState<boolean>(false);

  // Fullscreen state & controller
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSimulatedFullscreen, setIsSimulatedFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsSimulatedFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSimulatedFullscreen) {
        setIsSimulatedFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSimulatedFullscreen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !isSimulatedFullscreen) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else {
          setIsSimulatedFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
        setIsSimulatedFullscreen(false);
      }
    } catch (err) {
      console.info("Native fullscreen request rejected/constrained; toggling simulated full-screen viewport.", err);
      setIsSimulatedFullscreen((prev) => !prev);
    }
  };

  const activeFullscreen = isFullscreen || isSimulatedFullscreen;

  // Combine all nodes for graph algorithms
  const allNodes = useMemo(() => {
    return [...depots, ...zones];
  }, [depots, zones]);

  // Run the selected algorithm and obtain step trace
  const mdvrpResult = useMemo(() => {
    return runMDVRP(depots, zones, 2, 6000);
  }, [depots, zones]);

  const dijkstraResult = useMemo(() => {
    return runDijkstra(dijkstraOriginId, dijkstraTargetId, allNodes, edges);
  }, [dijkstraOriginId, dijkstraTargetId, allNodes, edges]);

  const kruskalResult = useMemo(() => {
    return runKruskal(allNodes, edges);
  }, [allNodes, edges]);

  const maxFlowResult = useMemo(() => {
    return runEdmondsKarp(depots, zones, edges);
  }, [depots, zones, edges]);

  const triageResult = useMemo(() => {
    return runTriageScheduler(zones, 1.2);
  }, [zones]);

  const fractionalKnapsackResult = useMemo(() => {
    return runFractionalKnapsack(RELIEF_SUPPLIES, 1800);
  }, []);

  // Determine active steps depending on selected algorithm
  const currentAlgorithmSteps = useMemo(() => {
    switch (activeAlgorithm) {
      case "mdvrp":
        return mdvrpResult.steps;
      case "dijkstra":
        return dijkstraResult.steps;
      case "kruskal":
        return kruskalResult.steps;
      case "maxflow":
        return maxFlowResult.steps;
      case "triage":
        return triageResult.steps;
      case "knapsack":
        return fractionalKnapsackResult.steps;
      default:
        return [];
    }
  }, [activeAlgorithm, mdvrpResult, dijkstraResult, kruskalResult, maxFlowResult, triageResult, fractionalKnapsackResult]);

  // Clamp step index
  useEffect(() => {
    if (currentStepIndex >= currentAlgorithmSteps.length && currentAlgorithmSteps.length > 0) {
      setCurrentStepIndex(currentAlgorithmSteps.length - 1);
    }
  }, [currentAlgorithmSteps, currentStepIndex]);

  // Auto-play timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < currentAlgorithmSteps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playbackSpeedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeedMs, currentAlgorithmSteps.length]);

  // Active step highlights
  const activeStep = currentAlgorithmSteps[currentStepIndex] || currentAlgorithmSteps[0];

  const highlightedNodeIds = useMemo(() => {
    if (activeAlgorithm === "dijkstra") {
      if (activeStep?.activeNodeIds && activeStep.activeNodeIds.length > 0) {
        return activeStep.activeNodeIds;
      }
      return dijkstraResult.path || [];
    }
    if (activeAlgorithm === "triage") {
      return triageResult.schedule.map((s) => s.zone.id);
    }
    return activeStep?.activeNodeIds || [];
  }, [activeAlgorithm, activeStep, dijkstraResult, triageResult]);

  const highlightedEdgeIds = useMemo(() => {
    if (activeAlgorithm === "dijkstra") {
      if (activeStep?.activeEdgeIds && activeStep.activeEdgeIds.length > 0) {
        return activeStep.activeEdgeIds;
      }
      return dijkstraResult.pathEdgeIds || [];
    }
    return activeStep?.activeEdgeIds || [];
  }, [activeAlgorithm, activeStep, dijkstraResult]);

  const spanningTreeEdgeIds = useMemo(() => {
    if (activeAlgorithm === "kruskal") {
      if (activeStep?.spanningTreeEdgeIds && activeStep.spanningTreeEdgeIds.length > 0) {
        return activeStep.spanningTreeEdgeIds;
      }
      return kruskalResult.mstEdges.map((e: Edge) => e.id);
    }
    return [];
  }, [activeAlgorithm, activeStep, kruskalResult]);

  // Interactive toggle road status on canvas
  const handleToggleEdgeStatus = (edgeId: string) => {
    setEdges((prev) =>
      prev.map((e) => {
        if (e.id !== edgeId) return e;
        const cycle: RoadStatus[] = ["clear", "flooded", "debris", "collapsed_bridge"];
        const nextIdx = (cycle.indexOf(e.status) + 1) % cycle.length;
        const newStatus = cycle[nextIdx];
        const newMultiplier =
          newStatus === "collapsed_bridge"
            ? 999
            : newStatus === "flooded"
            ? 2.2
            : newStatus === "debris"
            ? 3.0
            : 1.0;
        return {
          ...e,
          status: newStatus,
          hazardMultiplier: newMultiplier,
        };
      })
    );
  };

  // Upgrade edge capacity in Max Flow station
  const handleUpgradeEdge = (edgeId: string) => {
    setEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              capacityVehiclesPerHour: e.capacityVehiclesPerHour + 25,
              status: e.status === "collapsed_bridge" ? "clear" : e.status,
            }
          : e
      )
    );
  };

  // Reset all road edges to clear
  const handleClearAllHazards = () => {
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        status: "clear",
        hazardMultiplier: 1.0,
      }))
    );
  };

  // Algorithm tabs list
  const algorithmTabs = [
    { type: "mdvrp" as AlgorithmType, label: "Multi-Depot VRP", icon: Truck },
    { type: "dijkstra" as AlgorithmType, label: "Dynamic Dijkstra", icon: Navigation },
    { type: "kruskal" as AlgorithmType, label: "Kruskal MST", icon: Network },
    { type: "knapsack" as AlgorithmType, label: "Fractional Knapsack", icon: Box },
    { type: "maxflow" as AlgorithmType, label: "Max Flow & Min-Cut", icon: Layers },
    { type: "triage" as AlgorithmType, label: "Triage Dispatch", icon: HeartPulse },
  ];

  // Global telemetry summaries for AI context
  const aiTelemetryMetrics = useMemo(() => {
    return {
      "Total Depots": depots.length,
      "Disaster Zones": zones.length,
      "Reported Casualties": zones.reduce((a, z) => a + z.casualties, 0),
      "Damaged / Blocked Corridors": edges.filter((e) => e.status !== "clear").length,
      "MST Total Distance": `${kruskalResult.totalDistanceKm.toFixed(1)} km`,
      "Max Convoy Throughput": `${maxFlowResult.maxFlow} vehicles/hr`,
      "MDVRP Fleet Mileage": `${mdvrpResult.totalFleetDistanceKm.toFixed(1)} km`,
    };
  }, [depots, zones, edges, kruskalResult, maxFlowResult, mdvrpResult]);

  return (
    <div
      className={`min-h-screen ppt-canvas-bg text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-900 ${
        isSimulatedFullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC]" : ""
      }`}
    >
      {/* Top Global Command Bar */}
      <header
        id="app-header"
        className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-4 lg:px-6 py-3 shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Tactical Identity */}
          <div className="flex items-center gap-3">
            <div className="relative group p-0.5 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600/80 to-slate-700 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40 hover:ring-amber-400/60 transition-all duration-300">
              <div className="relative w-11 h-11 rounded-[10px] overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={appIconImg}
                  alt="AegisOps Emblem"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/25 rounded-[10px] pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-mono tracking-tight text-slate-900">
                  AegisOps <span className="text-amber-600 font-medium">| DAA Logistics Studio</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
                  DAA ENGINE v4.2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans hidden md:block">
                Multi-Depot Emergency Routing, Graph Spanning Trees, Fractional Knapsack & Edmonds-Karp Flow
              </p>
            </div>
          </div>

          {/* Scenario Selector & Header Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Scenario Dropdown */}
            <div className="relative">
              <select
                id="scenario-selector"
                value={scenarioIndex}
                onChange={(e) => setScenarioIndex(Number(e.target.value))}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-amber-500 transition cursor-pointer appearance-none shadow-xs"
              >
                {SCENARIOS.map((sc: ScenarioPreset, idx: number) => (
                  <option key={sc.id} value={idx}>
                    {sc.name} ({sc.hazardType})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Clear Hazards Reset */}
            <button
              id="btn-clear-hazards"
              onClick={handleClearAllHazards}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-mono transition flex items-center gap-1.5 shadow-xs"
              title="Reset all road segments to Clear"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Hazards</span>
            </button>

            {/* DAA Curriculum & Theory Button */}
            <button
              id="btn-open-theory"
              onClick={() => setIsTheoryModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-300 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DAA Syllabus</span>
            </button>

            {/* Gemini AI Tactical Commander Button */}
            <button
              id="btn-open-ai-commander"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-mono font-bold text-xs shadow-md transition flex items-center gap-1.5 border border-slate-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tactical SITREP</span>
            </button>

            {/* Full Screen Toggle Button */}
            <button
              id="btn-toggle-fullscreen"
              onClick={toggleFullscreen}
              className={`p-2 sm:px-3 sm:py-2 rounded-lg border text-xs font-mono font-medium transition flex items-center gap-1.5 shadow-xs ${
                activeFullscreen
                  ? "bg-amber-500 text-slate-950 border-amber-600 font-bold hover:bg-amber-400"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300"
              }`}
              title={activeFullscreen ? "Exit Fullscreen (Esc)" : "Enter Full Screen Mode"}
              aria-label={activeFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {activeFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-950" />
                  <span className="hidden sm:inline">Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Algorithm Navigation Tab Bar */}
      <nav
        id="algorithm-nav"
        className="bg-white/80 backdrop-blur border-b border-slate-200/90 px-4 lg:px-6 py-2 overflow-x-auto shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-2 font-bold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-amber-600" />
            DAA Algorithms:
          </span>

          {algorithmTabs.map((tab) => {
            const isActive = activeAlgorithm === tab.type;
            const Icon = tab.icon;

            return (
              <button
                key={tab.type}
                id={`tab-algorithm-${tab.type}`}
                onClick={() => {
                  setActiveAlgorithm(tab.type);
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 border ${
                  isActive
                    ? "bg-amber-50 text-amber-900 border-amber-300 shadow-xs font-bold ring-1 ring-amber-400/30"
                    : "bg-slate-50/80 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-600" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Dynamic Dijkstra Endpoint Configuration (Only shown when Dijkstra tab is active) */}
        {activeAlgorithm === "dijkstra" && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold uppercase text-slate-800">
                  Dynamic Dijkstra Single-Source Shortest Path
                </h3>
                <p className="text-[11px] text-slate-500">
                  Adjust origin response depot and victim zone to compute safest hazard-weighted road corridor.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">Origin Depot:</span>
                <select
                  value={dijkstraOriginId}
                  onChange={(e) => {
                    setDijkstraOriginId(e.target.value);
                    setCurrentStepIndex(0);
                  }}
                  className="bg-transparent text-amber-700 font-bold focus:outline-none cursor-pointer"
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white text-slate-800">
                      {d.code}: {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">Target Zone:</span>
                <select
                  value={dijkstraTargetId}
                  onChange={(e) => {
                    setDijkstraTargetId(e.target.value);
                    setCurrentStepIndex(0);
                  }}
                  className="bg-transparent text-cyan-700 font-bold focus:outline-none cursor-pointer"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} className="bg-white text-slate-800">
                      {z.code}: {z.name} ({z.triage.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="text-emerald-700/80">Hazard Distance:</span>{" "}
                <span className="font-bold text-emerald-800">
                  {dijkstraResult.totalDistanceKm === Infinity
                    ? "UNREACHABLE (CUT)"
                    : `${dijkstraResult.totalDistanceKm.toFixed(1)} km-cost`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Specialized View or Tactical Map Workspace */}
        {activeAlgorithm === "knapsack" ? (
          /* Fractional Knapsack Divisible Cargo Allocation Workbench */
          <KnapsackLab />
        ) : activeAlgorithm === "maxflow" ? (
          /* Max Flow & Min-Cut Analysis Station */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Map Canvas */}
              <div className="lg:col-span-8 min-h-[520px]">
                <MapCanvas
                  depots={depots}
                  zones={zones}
                  edges={edges}
                  activeAlgorithm={activeAlgorithm}
                  highlightedNodeIds={highlightedNodeIds}
                  highlightedEdgeIds={highlightedEdgeIds}
                  spanningTreeEdgeIds={spanningTreeEdgeIds}
                  clusterAssignments={mdvrpResult.clusterAssignments}
                  flowByEdge={maxFlowResult.flowByEdge}
                  minCutEdgeIds={maxFlowResult.minCutEdges.map((e) => e.id)}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onToggleEdgeStatus={handleToggleEdgeStatus}
                  isFullscreen={activeFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  mdvrpRoutes={mdvrpResult.routes}
                  dijkstraPath={dijkstraResult.path}
                  dijkstraPathEdgeIds={dijkstraResult.pathEdgeIds}
                  dijkstraTotalDistanceKm={dijkstraResult.totalDistanceKm}
                  dijkstraTravelMinutes={dijkstraResult.totalTravelMinutes}
                  triageSchedule={triageResult.schedule}
                  kruskalTotalCost={kruskalResult.totalCost}
                  kruskalTotalDistanceKm={kruskalResult.totalDistanceKm}
                  maxFlowValue={maxFlowResult.maxFlow}
                />
              </div>

              {/* Step Controls */}
              <div className="lg:col-span-4">
                <AlgorithmControls
                  algorithmMeta={ALGORITHM_REGISTRY[activeAlgorithm]}
                  steps={currentAlgorithmSteps}
                  currentStepIndex={currentStepIndex}
                  isPlaying={isPlaying}
                  playbackSpeedMs={playbackSpeedMs}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onStepForward={() =>
                    setCurrentStepIndex((p) => Math.min(p + 1, currentAlgorithmSteps.length - 1))
                  }
                  onStepBack={() => setCurrentStepIndex((p) => Math.max(p - 1, 0))}
                  onReset={() => {
                    setCurrentStepIndex(0);
                    setIsPlaying(false);
                  }}
                  onChangeSpeed={setPlaybackSpeedMs}
                />
              </div>
            </div>

            {/* Min-Cut Bottleneck Inspector */}
            <MaxFlowInspector
              maxFlowResult={maxFlowResult}
              depots={depots}
              zones={zones}
              edges={edges}
              onUpgradeEdge={handleUpgradeEdge}
            />
          </div>
        ) : activeAlgorithm === "triage" ? (
          /* Triage Priority Scheduling Station */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 min-h-[520px]">
                <MapCanvas
                  depots={depots}
                  zones={zones}
                  edges={edges}
                  activeAlgorithm={activeAlgorithm}
                  highlightedNodeIds={highlightedNodeIds}
                  highlightedEdgeIds={highlightedEdgeIds}
                  spanningTreeEdgeIds={spanningTreeEdgeIds}
                  clusterAssignments={mdvrpResult.clusterAssignments}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onToggleEdgeStatus={handleToggleEdgeStatus}
                  isFullscreen={activeFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  mdvrpRoutes={mdvrpResult.routes}
                  dijkstraPath={dijkstraResult.path}
                  dijkstraPathEdgeIds={dijkstraResult.pathEdgeIds}
                  dijkstraTotalDistanceKm={dijkstraResult.totalDistanceKm}
                  dijkstraTravelMinutes={dijkstraResult.totalTravelMinutes}
                  triageSchedule={triageResult.schedule}
                  kruskalTotalCost={kruskalResult.totalCost}
                  kruskalTotalDistanceKm={kruskalResult.totalDistanceKm}
                  maxFlowValue={maxFlowResult.maxFlow}
                />
              </div>

              <div className="lg:col-span-4">
                <AlgorithmControls
                  algorithmMeta={ALGORITHM_REGISTRY[activeAlgorithm]}
                  steps={currentAlgorithmSteps}
                  currentStepIndex={currentStepIndex}
                  isPlaying={isPlaying}
                  playbackSpeedMs={playbackSpeedMs}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onStepForward={() =>
                    setCurrentStepIndex((p) => Math.min(p + 1, currentAlgorithmSteps.length - 1))
                  }
                  onStepBack={() => setCurrentStepIndex((p) => Math.max(p - 1, 0))}
                  onReset={() => {
                    setCurrentStepIndex(0);
                    setIsPlaying(false);
                  }}
                  onChangeSpeed={setPlaybackSpeedMs}
                />
              </div>
            </div>

            {/* Triage Station Schedule */}
            <TriageStation zones={zones} />
          </div>
        ) : (
          /* Standard Spatial Graph Algorithms (MDVRP, Dijkstra, Kruskal) */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Primary Interactive Topological Map */}
              <div className="lg:col-span-8 min-h-[540px]">
                <MapCanvas
                  depots={depots}
                  zones={zones}
                  edges={edges}
                  activeAlgorithm={activeAlgorithm}
                  highlightedNodeIds={highlightedNodeIds}
                  highlightedEdgeIds={highlightedEdgeIds}
                  spanningTreeEdgeIds={spanningTreeEdgeIds}
                  clusterAssignments={mdvrpResult.clusterAssignments}
                  flowByEdge={maxFlowResult.flowByEdge}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onToggleEdgeStatus={handleToggleEdgeStatus}
                  isFullscreen={activeFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  mdvrpRoutes={mdvrpResult.routes}
                  dijkstraPath={dijkstraResult.path}
                  dijkstraPathEdgeIds={dijkstraResult.pathEdgeIds}
                  dijkstraTotalDistanceKm={dijkstraResult.totalDistanceKm}
                  dijkstraTravelMinutes={dijkstraResult.totalTravelMinutes}
                  triageSchedule={triageResult.schedule}
                  kruskalTotalCost={kruskalResult.totalCost}
                  kruskalTotalDistanceKm={kruskalResult.totalDistanceKm}
                  maxFlowValue={maxFlowResult.maxFlow}
                />
              </div>

              {/* Algorithm Step Controller & Pseudocode Viewer */}
              <div className="lg:col-span-4">
                <AlgorithmControls
                  algorithmMeta={ALGORITHM_REGISTRY[activeAlgorithm]}
                  steps={currentAlgorithmSteps}
                  currentStepIndex={currentStepIndex}
                  isPlaying={isPlaying}
                  playbackSpeedMs={playbackSpeedMs}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onStepForward={() =>
                    setCurrentStepIndex((p) => Math.min(p + 1, currentAlgorithmSteps.length - 1))
                  }
                  onStepBack={() => setCurrentStepIndex((p) => Math.max(p - 1, 0))}
                  onReset={() => {
                    setCurrentStepIndex(0);
                    setIsPlaying(false);
                  }}
                  onChangeSpeed={setPlaybackSpeedMs}
                />
              </div>
            </div>

            {/* Bottom Algorithm Telemetry & Fleet Manifest Cards */}
            {activeAlgorithm === "mdvrp" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-slate-800 font-mono text-sm">
                      Synthesized Fleet Convoy Manifest (Clarke-Wright Savings + 2-Opt)
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-600">
                      Total Fleet Distance:{" "}
                      <strong className="text-emerald-700 font-bold">
                        {mdvrpResult.totalFleetDistanceKm.toFixed(1)} km
                      </strong>
                    </span>
                    <span className="text-slate-600">
                      Fleet Transit Time:{" "}
                      <strong className="text-cyan-700 font-bold">
                        {mdvrpResult.totalFleetMinutes} min
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mdvrpResult.routes.map((route, i) => {
                    const depot = depots.find((d) => d.id === route.depotId);
                    return (
                      <div
                        key={i}
                        className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200 space-y-2 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {route.vehicleCode || `Convoy ${i + 1}`}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200"
                            style={{ backgroundColor: `${depot?.color}15`, color: depot?.color }}
                          >
                            {depot?.name}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          Route:{" "}
                          <span className="text-slate-800 font-medium">
                            {depot?.code} ➔{" "}
                            {route.zoneIds
                              .map((zid) => zones.find((z) => z.id === zid)?.code || zid)
                              .join(" ➔ ")}{" "}
                            ➔ {depot?.code}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
                          <span className="text-slate-500">Distance: {route.totalDistanceKm}km</span>
                          <span className="text-amber-700 font-bold">
                            Casualties: {route.totalCasualtiesCovered}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeAlgorithm === "kruskal" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 font-mono text-sm">
                      Kruskal Minimum Spanning Tree Arteries ({kruskalResult.mstEdges.length} Links)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 font-bold">
                    Total Backbone Distance: {kruskalResult.totalDistanceKm.toFixed(1)} km
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {kruskalResult.mstEdges.map((e: Edge) => {
                    const fromN = allNodes.find((n) => n.id === e.from);
                    const toN = allNodes.find((n) => n.id === e.to);
                    return (
                      <div
                        key={e.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono flex items-center justify-between"
                      >
                        <div className="text-slate-700">
                          <span className="text-emerald-700 font-bold">
                            {fromN?.code || e.from}
                          </span>{" "}
                          ⮂{" "}
                          <span className="text-emerald-700 font-bold">
                            {toN?.code || e.to}
                          </span>
                        </div>
                        <span className="text-slate-500 font-semibold">{e.distanceKm} km</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Gemini AI Tactical Commander Modal */}
      <AiCommanderModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        scenarioName={currentPreset.name}
        depots={depots}
        zones={zones}
        edges={edges}
        activeAlgorithm={activeAlgorithm}
        metrics={aiTelemetryMetrics}
      />

      {/* DAA Academic Theory Modal */}
      <DAATheoryModal
        isOpen={isTheoryModalOpen}
        onClose={() => setIsTheoryModalOpen(false)}
      />

      {/* Footer System Status Bar */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3 mt-auto text-xs font-mono text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Server State: Express TSX + Vite HMR Active</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-500">Port: 3000 (0.0.0.0)</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Active Graph: {allNodes.length} Vertices, {edges.length} Edges
            </span>
            <span className="text-amber-700 font-semibold">
              Algorithm: {ALGORITHM_REGISTRY[activeAlgorithm].shortTitle}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
