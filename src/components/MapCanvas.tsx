import React, { useState, useMemo } from "react";
import {
  Depot,
  DisasterZone,
  Edge,
  AlgorithmType,
  RoadStatus,
  RouteTour,
  TriageScheduleItem,
} from "../types";
import {
  ShieldAlert,
  Truck,
  HeartPulse,
  AlertTriangle,
  Compass,
  Layers,
  Building2,
  Navigation,
  Maximize2,
  Minimize2,
  Route,
  Eye,
  EyeOff,
  Network,
  Clock,
} from "lucide-react";

const CONVOY_PALETTE = [
  { stroke: "#2563eb", fill: "#dbeafe", text: "#1e40af", halo: "#93c5fd", label: "Alpha Convoy" },
  { stroke: "#d97706", fill: "#fef3c7", text: "#92400e", halo: "#fde68a", label: "Bravo Convoy" },
  { stroke: "#7c3aed", fill: "#ede9fe", text: "#5b21b6", halo: "#ddd6fe", label: "Charlie Convoy" },
  { stroke: "#059669", fill: "#d1fae5", text: "#065f46", halo: "#a7f3d0", label: "Delta Convoy" },
  { stroke: "#e11d48", fill: "#ffe4e6", text: "#9f1239", halo: "#fecdd3", label: "Echo Convoy" },
  { stroke: "#0891b2", fill: "#cffafe", text: "#155e75", halo: "#a5f3fc", label: "Foxtrot Convoy" },
];

export interface MapCanvasProps {
  depots: Depot[];
  zones: DisasterZone[];
  edges: Edge[];
  activeAlgorithm: AlgorithmType;
  highlightedNodeIds?: string[];
  highlightedEdgeIds?: string[];
  spanningTreeEdgeIds?: string[];
  clusterAssignments?: Record<string, string>; // zoneId -> depotId
  flowByEdge?: Record<string, number>;
  minCutEdgeIds?: string[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onToggleEdgeStatus: (edgeId: string) => void;
  routes?: RouteTour[] | { depotId: string; zoneIds: string[]; vehicleCode?: string }[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;

  // Dedicated Route and Algorithm Metadata
  mdvrpRoutes?: RouteTour[];
  dijkstraPath?: string[];
  dijkstraPathEdgeIds?: string[];
  dijkstraTotalDistanceKm?: number;
  dijkstraTravelMinutes?: number;
  triageSchedule?: TriageScheduleItem[];
  kruskalTotalCost?: number;
  kruskalTotalDistanceKm?: number;
  maxFlowValue?: number;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  depots,
  zones,
  edges,
  activeAlgorithm,
  highlightedNodeIds = [],
  highlightedEdgeIds = [],
  spanningTreeEdgeIds = [],
  clusterAssignments = {},
  flowByEdge = {},
  minCutEdgeIds = [],
  selectedNodeId,
  onSelectNode,
  onToggleEdgeStatus,
  routes = [],
  isFullscreen = false,
  onToggleFullscreen,
  mdvrpRoutes,
  dijkstraPath = [],
  dijkstraPathEdgeIds = [],
  dijkstraTotalDistanceKm = 0,
  dijkstraTravelMinutes = 0,
  triageSchedule = [],
  kruskalTotalCost = 0,
  kruskalTotalDistanceKm = 0,
  maxFlowValue = 0,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [showTerrainContours, setShowTerrainContours] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showRouteCorridors, setShowRouteCorridors] = useState<boolean>(true);
  const [selectedConvoyIndex, setSelectedConvoyIndex] = useState<number | null>(null);

  // Build node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, Depot | DisasterZone>();
    depots.forEach((d) => map.set(d.id, d));
    zones.forEach((z) => map.set(z.id, z));
    return map;
  }, [depots, zones]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  // Effective MDVRP tours
  const effectiveRoutes: RouteTour[] = useMemo(() => {
    if (mdvrpRoutes && mdvrpRoutes.length > 0) return mdvrpRoutes;
    if (routes && routes.length > 0) return routes as RouteTour[];
    return [];
  }, [mdvrpRoutes, routes]);

  // Dijkstra path nodes
  const dijkstraNodes = useMemo(() => {
    if (!dijkstraPath || dijkstraPath.length < 2) return [];
    return dijkstraPath
      .map((id) => nodeMap.get(id))
      .filter((n): n is Depot | DisasterZone => Boolean(n));
  }, [dijkstraPath, nodeMap]);

  // Construct Dijkstra SVG path
  const dijkstraPathD = useMemo(() => {
    if (dijkstraNodes.length < 2) return "";
    let d = `M ${dijkstraNodes[0].x} ${dijkstraNodes[0].y}`;
    for (let i = 1; i < dijkstraNodes.length; i++) {
      d += ` L ${dijkstraNodes[i].x} ${dijkstraNodes[i].y}`;
    }
    return d;
  }, [dijkstraNodes]);

  // Triage dispatch path
  const triageNodes = useMemo(() => {
    if (!triageSchedule || triageSchedule.length === 0) return [];
    const primaryDepot = depots[0];
    const orderedZones = triageSchedule.map((s) => s.zone);
    return primaryDepot ? [primaryDepot, ...orderedZones] : orderedZones;
  }, [triageSchedule, depots]);

  const triagePathD = useMemo(() => {
    if (triageNodes.length < 2) return "";
    let d = `M ${triageNodes[0].x} ${triageNodes[0].y}`;
    for (let i = 1; i < triageNodes.length; i++) {
      d += ` L ${triageNodes[i].x} ${triageNodes[i].y}`;
    }
    return d;
  }, [triageNodes]);

  return (
    <div className="relative w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col select-none">
      {/* Tactical Canvas Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 backdrop-blur border-b border-slate-200 z-10 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="font-mono uppercase tracking-wider font-bold text-slate-800">
            Sector Topological Tactical Grid (1000×1000 Coordinate Vector)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle Route Corridors */}
          <button
            onClick={() => setShowRouteCorridors(!showRouteCorridors)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 shadow-xs ${
              showRouteCorridors
                ? "bg-amber-50 text-amber-800 border border-amber-300 font-bold"
                : "bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900"
            }`}
            title="Toggle Algorithmic Route Corridors"
          >
            <Route className="w-3.5 h-3.5 text-amber-700" />
            Routes {showRouteCorridors ? "ON" : "OFF"}
          </button>

          {/* Toggle Topography */}
          <button
            onClick={() => setShowTerrainContours(!showTerrainContours)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
              showTerrainContours
                ? "bg-slate-100 text-slate-800 border border-slate-300 font-bold shadow-xs"
                : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Topography
          </button>

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
              showLabels
                ? "bg-cyan-50 text-cyan-800 border border-cyan-300 font-bold shadow-xs"
                : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Labels
          </button>

          {/* Full Screen Toggle */}
          {onToggleFullscreen && (
            <button
              id="map-fullscreen-toggle"
              onClick={onToggleFullscreen}
              className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 shadow-xs border ${
                isFullscreen
                  ? "bg-amber-500 text-slate-950 border-amber-600 font-bold hover:bg-amber-400"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900 hover:bg-slate-200"
              }`}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Full Screen View"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Full Screen View"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
          )}

          <span className="text-slate-500 font-mono hidden xl:inline text-[11px]">
            Click edge to toggle hazard
          </span>
        </div>
      </div>

      {/* Algorithm Route Intelligence Sub-Header Bar */}
      {showRouteCorridors && (
        <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {activeAlgorithm === "mdvrp" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600 font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                CONVOY CIRCUITS ({effectiveRoutes.length}):
              </span>
              <button
                onClick={() => setSelectedConvoyIndex(null)}
                className={`px-2.5 py-0.5 rounded text-[11px] transition font-bold shadow-xs ${
                  selectedConvoyIndex === null
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                All Convoys
              </button>
              {effectiveRoutes.map((rt, idx) => {
                const pal = CONVOY_PALETTE[idx % CONVOY_PALETTE.length];
                const isSel = selectedConvoyIndex === idx;
                return (
                  <button
                    key={`convoy-filter-${idx}`}
                    onClick={() => setSelectedConvoyIndex(isSel ? null : idx)}
                    className={`px-2.5 py-0.5 rounded text-[11px] transition flex items-center gap-1.5 border font-semibold shadow-xs ${
                      isSel
                        ? "shadow-sm ring-1 ring-offset-1 font-bold"
                        : "opacity-85 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: isSel ? pal.stroke : pal.fill,
                      color: isSel ? "#ffffff" : pal.text,
                      borderColor: pal.stroke,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: isSel ? "#ffffff" : pal.stroke }}
                    />
                    <span>{rt.vehicleCode || `Convoy #${idx + 1}`}</span>
                    <span className="text-[10px] opacity-90">
                      ({rt.zoneIds.length} stops • {rt.totalDistanceKm}km)
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeAlgorithm === "dijkstra" && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-600 font-bold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-orange-600" />
                SHORTEST SAFE ROUTE CORRIDOR:
              </span>
              {dijkstraPath && dijkstraPath.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                    {dijkstraPath.join(" ➔ ")}
                  </span>
                  <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                    {dijkstraTotalDistanceKm.toFixed(1)} km • ~{dijkstraTravelMinutes} min
                  </span>
                </div>
              ) : (
                <span className="text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                  ⚠️ No Passable Route (Bridge Collapsed)
                </span>
              )}
            </div>
          )}

          {activeAlgorithm === "kruskal" && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-600 font-bold flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-emerald-600" />
                MINIMUM SPANNING TREE (MST) BACKBONE:
              </span>
              <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold">
                {spanningTreeEdgeIds.length} Spanning Links (0 Cycles)
              </span>
              <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                Total Road Length: {kruskalTotalDistanceKm.toFixed(1)} km
              </span>
              <span className="text-slate-500 text-[11px]">
                (Hazard-weighted cost: {kruskalTotalCost.toFixed(1)} km-equiv)
              </span>
            </div>
          )}

          {activeAlgorithm === "maxflow" && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-600 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600" />
                THROUGHPUT & BOTTLENECK FLOW CORRIDORS:
              </span>
              <span className="text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200 font-bold">
                Max Safe Convoy Flow: {maxFlowValue} vehicles/hr
              </span>
              {minCutEdgeIds.length > 0 && (
                <span className="text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 font-bold">
                  {minCutEdgeIds.length} Min-Cut Bottlenecks
                </span>
              )}
            </div>
          )}

          {activeAlgorithm === "triage" && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-600 font-bold flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                GOLDEN-HOUR EVACUATION DISPATCH TRAJECTORY:
              </span>
              <span className="text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 font-bold">
                {triageSchedule.length} Disaster Sectors Prioritized
              </span>
              <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                Queue Order: {triageSchedule.map((s) => s.zone.code).join(" ➔ ")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto text-[11px] text-slate-500">
            <span>Visual Corridors Active</span>
          </div>
        </div>
      )}

      {/* SVG Interactive Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#f8fafc]">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full object-contain"
          style={{ minHeight: "480px" }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(203, 213, 225, 0.65)"
                strokeWidth="1"
              />
            </pattern>

            {/* Inundation / Flood texture */}
            <pattern id="floodPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 0 10 Q 5 5, 10 10 T 20 10"
                fill="none"
                stroke="rgba(2, 132, 199, 0.45)"
                strokeWidth="1.5"
              />
            </pattern>

            {/* Glowing filters */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="corridorGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Arrow Markers for Routes */}
            <marker
              id="arrow-dijkstra"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ea580c" />
            </marker>

            <marker
              id="arrow-triage"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#dc2626" />
            </marker>

            <marker
              id="arrow-mst"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#059669" />
            </marker>

            {/* Convoy Arrow Markers */}
            {CONVOY_PALETTE.map((pal, idx) => (
              <marker
                key={`marker-convoy-${idx}`}
                id={`arrow-convoy-${idx}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={pal.stroke} />
              </marker>
            ))}
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="1000" fill="url(#grid)" />

          {/* Topographical terrain contours */}
          {showTerrainContours && (
            <g opacity="0.6" pointerEvents="none">
              <path
                d="M 600,0 C 720,200 680,500 800,700 C 880,850 950,900 1000,920 L 1000,0 Z"
                fill="url(#floodPattern)"
                stroke="rgba(2, 132, 199, 0.4)"
                strokeWidth="1.2"
              />
              <ellipse cx="250" cy="800" rx="180" ry="120" fill="none" stroke="rgba(100, 116, 139, 0.22)" strokeWidth="1.5" strokeDasharray="4 4" />
              <ellipse cx="250" cy="800" rx="110" ry="70" fill="none" stroke="rgba(100, 116, 139, 0.3)" strokeWidth="1.5" />
              <ellipse cx="250" cy="800" rx="50" ry="30" fill="none" stroke="rgba(100, 116, 139, 0.38)" strokeWidth="1.5" />
              <text x="250" y="805" fill="rgba(71, 85, 105, 0.6)" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="600">HIGH RIDGE 220m</text>
              <text x="820" y="100" fill="rgba(2, 132, 199, 0.7)" fontSize="12" fontFamily="monospace" fontWeight="600">COASTAL INUNDATION SECTOR</text>
            </g>
          )}

          {/* Cluster Voronoi partitioning lines (light background hints in MDVRP) */}
          {activeAlgorithm === "mdvrp" && (
            <g opacity="0.18" pointerEvents="none">
              {zones.map((z) => {
                const assignedDepotId = clusterAssignments[z.id];
                const d = depots.find((dp) => dp.id === assignedDepotId);
                if (!d) return null;
                return (
                  <line
                    key={`cluster-${z.id}-${d.id}`}
                    x1={d.x}
                    y1={d.y}
                    x2={z.x}
                    y2={z.y}
                    stroke={d.color}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </g>
          )}

          {/* Road Network Layer */}
          <g id="edges-layer">
            {edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted = highlightedEdgeIds.includes(edge.id);
              const isInMST = spanningTreeEdgeIds.includes(edge.id);
              const isMinCut = minCutEdgeIds.includes(edge.id);
              const isHovered = hoveredEdgeId === edge.id;
              const flowVal = flowByEdge[edge.id] || 0;

              // In Kruskal mode or Dijkstra mode, dim non-involved edges to make the proper route pop
              const isDimmed =
                (activeAlgorithm === "kruskal" && !isInMST && spanningTreeEdgeIds.length > 0) ||
                (activeAlgorithm === "dijkstra" && !isHighlighted && dijkstraPathEdgeIds.length > 0 && !dijkstraPathEdgeIds.includes(edge.id));

              // Color determination
              let strokeColor = "#94a3b8"; // default slate-400
              let strokeWidth = 3;
              let strokeDash: string | undefined = undefined;

              if (edge.status === "collapsed_bridge") {
                strokeColor = "#dc2626"; // red
                strokeDash = "6 4";
                strokeWidth = 3.5;
              } else if (edge.status === "flooded") {
                strokeColor = "#0284c7"; // azure cyan
                strokeDash = "8 4";
                strokeWidth = 3.5;
              } else if (edge.status === "debris") {
                strokeColor = "#d97706"; // amber
                strokeDash = "6 3";
                strokeWidth = 3.5;
              }

              // Algorithm specific highlights on physical road segments
              if (isInMST) {
                strokeColor = "#059669"; // emerald MST backbone
                strokeWidth = 6.5;
                strokeDash = undefined;
              } else if (isHighlighted || (activeAlgorithm === "dijkstra" && dijkstraPathEdgeIds.includes(edge.id))) {
                strokeColor = "#ea580c"; // bright orange shortest path
                strokeWidth = 7;
                strokeDash = undefined;
              }

              if (isMinCut) {
                strokeColor = "#e11d48"; // rose min-cut bottleneck
                strokeWidth = 7.5;
                strokeDash = "6 4";
              }

              if (isHovered) {
                strokeWidth += 3;
              }

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g
                  key={edge.id}
                  className="cursor-pointer transition-all duration-200"
                  opacity={isDimmed ? 0.35 : 1}
                  onClick={() => onToggleEdgeStatus(edge.id)}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                >
                  {/* Invisible thick hover target */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="transparent"
                    strokeWidth="26"
                  />

                  {/* Outer Corridor Glow */}
                  {(isHighlighted || isMinCut || isInMST) && (
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth + 8}
                      opacity={0.3}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Base road line */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                  />

                  {/* Inner stripe for MST */}
                  {isInMST && (
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="#a7f3d0"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Flow animation / visualization */}
                  {activeAlgorithm === "maxflow" && flowVal > 0 && (
                    <circle r="4.5" fill="#0284c7" opacity="0.95" filter="url(#glow)">
                      <animateMotion
                        path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                        dur={`${Math.max(1.5, 8 - (flowVal / 10))}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Road badge / metrics */}
                  {showLabels && !isDimmed && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-26"
                        y="-10"
                        width="52"
                        height="20"
                        rx="4"
                        fill="#ffffff"
                        stroke={
                          edge.status === "collapsed_bridge"
                            ? "#dc2626"
                            : edge.status === "flooded"
                            ? "#0284c7"
                            : isMinCut
                            ? "#e11d48"
                            : isInMST
                            ? "#059669"
                            : isHighlighted
                            ? "#ea580c"
                            : "#cbd5e1"
                        }
                        strokeWidth="1.5"
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
                      />
                      <text
                        x="0"
                        y="4"
                        fill={
                          edge.status === "collapsed_bridge"
                            ? "#dc2626"
                            : edge.status === "flooded"
                            ? "#0284c7"
                            : isMinCut
                            ? "#e11d48"
                            : isInMST
                            ? "#059669"
                            : isHighlighted
                            ? "#ea580c"
                            : "#334155"
                        }
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {edge.status === "collapsed_bridge"
                          ? "CUT"
                          : activeAlgorithm === "maxflow"
                          ? `${flowVal}/${edge.capacityVehiclesPerHour}`
                          : `${edge.distanceKm}k`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* DEDICATED ALGORITHM ROUTE CORRIDORS LAYER */}
          {showRouteCorridors && (
            <g id="algorithm-routes-layer">
              {/* 1. MULTI-DEPOT VEHICLE ROUTING TOURS (MDVRP) */}
              {activeAlgorithm === "mdvrp" &&
                effectiveRoutes.map((route, routeIdx) => {
                  const pal = CONVOY_PALETTE[routeIdx % CONVOY_PALETTE.length];
                  const isSelectedConvoy =
                    selectedConvoyIndex === null || selectedConvoyIndex === routeIdx;
                  const depot = nodeMap.get(route.depotId);
                  if (!depot) return null;

                  const stops = route.zoneIds
                    .map((id) => nodeMap.get(id))
                    .filter((n): n is DisasterZone => Boolean(n));
                  if (stops.length === 0) return null;

                  // Full loop: depot -> stop1 -> stop2 -> ... -> depot
                  const tourPoints = [depot, ...stops, depot];
                  let pathD = `M ${tourPoints[0].x} ${tourPoints[0].y}`;
                  for (let i = 1; i < tourPoints.length; i++) {
                    pathD += ` L ${tourPoints[i].x} ${tourPoints[i].y}`;
                  }

                  const opacity = isSelectedConvoy ? 1.0 : 0.15;

                  return (
                    <g
                      key={`mdvrp-tour-${routeIdx}`}
                      opacity={opacity}
                      className="transition-opacity duration-300"
                    >
                      {/* Outer Glow Corridor */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={pal.halo}
                        strokeWidth="10"
                        opacity="0.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Main Convoy Route Path */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={pal.stroke}
                        strokeWidth={isSelectedConvoy && selectedConvoyIndex !== null ? "4.5" : "3.5"}
                        strokeDasharray={isSelectedConvoy ? undefined : "6 4"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        markerEnd={`url(#arrow-convoy-${routeIdx % CONVOY_PALETTE.length})`}
                      />

                      {/* Animated Moving Convoy Unit */}
                      <g>
                        <circle
                          r="6.5"
                          fill="#ffffff"
                          stroke={pal.stroke}
                          strokeWidth="3"
                          filter="url(#glow)"
                        >
                          <animateMotion
                            path={pathD}
                            dur={`${Math.max(5, (route.zoneIds.length + 1) * 3)}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>

                      {/* Stop Order Badges on Zones */}
                      {stops.map((stop, stopIdx) => (
                        <g
                          key={`stop-badge-${routeIdx}-${stop.id}`}
                          transform={`translate(${stop.x + 16}, ${stop.y + 16})`}
                          className="pointer-events-none"
                        >
                          <rect
                            x="-10"
                            y="-9"
                            width="20"
                            height="18"
                            rx="4"
                            fill={pal.stroke}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                          />
                          <text
                            x="0"
                            y="4"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            #{stopIdx + 1}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}

              {/* 2. DYNAMIC DIJKSTRA SHORTEST SAFE PATH */}
              {activeAlgorithm === "dijkstra" && dijkstraPathD && (
                <g id="dijkstra-corridor">
                  {/* Glowing Highway Halo */}
                  <path
                    d={dijkstraPathD}
                    fill="none"
                    stroke="#fed7aa"
                    strokeWidth="18"
                    opacity="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#corridorGlow)"
                  />

                  {/* Main Emergency Corridor */}
                  <path
                    d={dijkstraPathD}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd="url(#arrow-dijkstra)"
                  />

                  {/* Yellow Centerline Stripe */}
                  <path
                    d={dijkstraPathD}
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="2.5"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Animated Emergency Ambulance/Convoy */}
                  <g>
                    <circle
                      r="8"
                      fill="#f59e0b"
                      stroke="#7c2d12"
                      strokeWidth="2.5"
                      filter="url(#glow)"
                    >
                      <animateMotion path={dijkstraPathD} dur="4.5s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* Waypoint Milestone Flags */}
                  {dijkstraNodes.map((node, nodeIdx) => {
                    const isStart = nodeIdx === 0;
                    const isGoal = nodeIdx === dijkstraNodes.length - 1;
                    return (
                      <g
                        key={`dijkstra-waypoint-${node.id}`}
                        transform={`translate(${node.x}, ${node.y - 32})`}
                        className="pointer-events-none"
                      >
                        <rect
                          x={isGoal ? "-70" : isStart ? "-40" : "-35"}
                          y="-10"
                          width={isGoal ? "140" : isStart ? "80" : "70"}
                          height="20"
                          rx="5"
                          fill={isGoal ? "#ea580c" : isStart ? "#059669" : "#ffffff"}
                          stroke={isGoal ? "#c2410c" : isStart ? "#047857" : "#ea580c"}
                          strokeWidth="1.5"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                        />
                        <text
                          x="0"
                          y="4"
                          fill={isGoal || isStart ? "#ffffff" : "#c2410c"}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {isStart
                            ? `START: ${node.code}`
                            : isGoal
                            ? `TARGET (${dijkstraTotalDistanceKm.toFixed(1)}km)`
                            : `WAYPOINT #${nodeIdx}`}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Dijkstra Unreachable Warning Banner */}
              {activeAlgorithm === "dijkstra" && (!dijkstraPath || dijkstraPath.length === 0) && (
                <g transform="translate(500, 60)" className="pointer-events-none">
                  <rect
                    x="-240"
                    y="-20"
                    width="480"
                    height="40"
                    rx="8"
                    fill="#fee2e2"
                    stroke="#dc2626"
                    strokeWidth="2"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                  />
                  <text
                    x="0"
                    y="5"
                    fill="#991b1b"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    ⚠️ NO PASSABLE ROUTE — ALL CORRIDORS CUT BY COLLAPSED BRIDGES
                  </text>
                </g>
              )}

              {/* 3. TRIAGE EMERGENCY PRIORITY DISPATCH TRAJECTORY */}
              {activeAlgorithm === "triage" && triagePathD && (
                <g id="triage-corridor">
                  {/* Outer Urgent Glow */}
                  <path
                    d={triagePathD}
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth="12"
                    opacity="0.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#corridorGlow)"
                  />

                  {/* Trajectory Dashed Line */}
                  <path
                    d={triagePathD}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="5"
                    strokeDasharray="8 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd="url(#arrow-triage)"
                  />

                  {/* Animated Medical Beacon */}
                  <g>
                    <circle
                      r="7.5"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animateMotion path={triagePathD} dur="5s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* Priority Numbered Flags on Zones */}
                  {triageSchedule.map((item, itemIdx) => (
                    <g
                      key={`triage-order-${item.zone.id}`}
                      transform={`translate(${item.zone.x - 28}, ${item.zone.y - 28})`}
                      className="pointer-events-none"
                    >
                      <circle
                        r="11"
                        fill="#dc2626"
                        stroke="#ffffff"
                        strokeWidth="2"
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        P{itemIdx + 1}
                      </text>
                    </g>
                  ))}
                </g>
              )}
            </g>
          )}

          {/* Disaster Zones Layer */}
          <g id="zones-layer">
            {zones.map((zone) => {
              const isSelected = selectedNodeId === zone.id;
              const isHighlighted = highlightedNodeIds.includes(zone.id);
              const isHovered = hoveredNodeId === zone.id;

              const triageColors = {
                critical: { bg: "#ef4444", ring: "#f87171" },
                severe: { bg: "#f97316", ring: "#fb923c" },
                moderate: { bg: "#eab308", ring: "#fde047" },
                stable: { bg: "#10b981", ring: "#34d399" },
              };
              const color = triageColors[zone.triage];

              return (
                <g
                  key={zone.id}
                  transform={`translate(${zone.x}, ${zone.y})`}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => onSelectNode(isSelected ? null : zone.id)}
                  onMouseEnter={() => setHoveredNodeId(zone.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Pulsing ring for critical/highlighted */}
                  {(zone.triage === "critical" || isHighlighted) && (
                    <circle
                      r="32"
                      fill="none"
                      stroke={color.ring}
                      strokeWidth="2"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="r"
                        values="22;38;22"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0.1;0.8"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Outer selection ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Node Body */}
                  <circle
                    r="18"
                    fill="#ffffff"
                    stroke={color.bg}
                    strokeWidth={isHighlighted ? 4.5 : 3}
                    filter="url(#glow)"
                  />

                  {/* Inner triage pip */}
                  <circle r="7" fill={color.bg} />

                  {/* Casualties badge */}
                  <g transform="translate(14, -14)">
                    <rect
                      x="-12"
                      y="-8"
                      width="24"
                      height="16"
                      rx="8"
                      fill={color.bg}
                    />
                    <text
                      x="0"
                      y="4"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {zone.casualties}
                    </text>
                  </g>

                  {/* Zone Label */}
                  {showLabels && (
                    <g transform="translate(0, 32)">
                      <rect
                        x="-60"
                        y="-8"
                        width="120"
                        height="18"
                        rx="4"
                        fill="#ffffff"
                        fillOpacity="0.95"
                        stroke="#cbd5e1"
                        strokeWidth="1.2"
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
                      />
                      <text
                        x="0"
                        y="5"
                        fill="#0f172a"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {zone.name.length > 18 ? zone.name.slice(0, 16) + "…" : zone.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Regional Response Depots Layer */}
          <g id="depots-layer">
            {depots.map((depot) => {
              const isSelected = selectedNodeId === depot.id;
              const isHighlighted = highlightedNodeIds.includes(depot.id);
              const isHovered = hoveredNodeId === depot.id;

              return (
                <g
                  key={depot.id}
                  transform={`translate(${depot.x}, ${depot.y})`}
                  className="cursor-pointer"
                  onClick={() => onSelectNode(isSelected ? null : depot.id)}
                  onMouseEnter={() => setHoveredNodeId(depot.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Outer glow ring */}
                  <circle
                    r="34"
                    fill="none"
                    stroke={depot.color}
                    strokeWidth={isSelected || isHighlighted ? 3 : 1.5}
                    opacity="0.4"
                    strokeDasharray={isSelected ? "5 3" : undefined}
                  />

                  {/* Diamond Base for Depot */}
                  <polygon
                    points="0,-24 24,0 0,24 -24,0"
                    fill="#ffffff"
                    stroke={depot.color}
                    strokeWidth={isHighlighted ? 4.5 : 3}
                    filter="url(#glow)"
                  />

                  {/* Inner depot glyph */}
                  <circle r="6" fill={depot.color} />

                  {/* Fleet Count Badge */}
                  <g transform="translate(18, -18)">
                    <circle r="9" fill={depot.color} />
                    <text
                      x="0"
                      y="3.5"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {depot.fleet.length}
                    </text>
                  </g>

                  {/* Depot Label */}
                  {showLabels && (
                    <g transform="translate(0, 36)">
                      <rect
                        x="-70"
                        y="-9"
                        width="140"
                        height="20"
                        rx="4"
                        fill="#ffffff"
                        fillOpacity="0.95"
                        stroke={depot.color}
                        strokeWidth="1.5"
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
                      />
                      <text
                        x="0"
                        y="5"
                        fill="#0f172a"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {depot.code}: {depot.name.slice(0, 14)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Telemetry HUD */}
        {selectedNode && (
          <div className="absolute top-4 left-4 max-w-sm w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 text-xs">
            <div className="flex items-start justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {"supplies" in selectedNode ? (
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div
                    className={`p-1.5 rounded-lg ${
                      selectedNode.triage === "critical"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 font-mono text-sm">
                    {selectedNode.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {selectedNode.id} | Code: {selectedNode.code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onSelectNode(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {"supplies" in selectedNode ? (
              // Depot Details
              <div className="mt-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">THROUGHPUT</span>
                    <span className="font-bold text-cyan-700">
                      {(selectedNode.maxDailyThroughputKg / 1000).toFixed(0)} T/day
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">READY FLEET</span>
                    <span className="font-bold text-emerald-700">
                      {selectedNode.fleet.length} Convoys
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Medical Supplies:</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {selectedNode.supplies.medicalKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Drinking Water:</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {selectedNode.supplies.waterKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Emergency Rations:</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {selectedNode.supplies.foodKg.toLocaleString()} kg
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Disaster Zone Details
              <div className="mt-3 space-y-2.5">
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2 rounded bg-red-50 border border-red-200">
                    <span className="text-red-700 block text-[10px]">CASUALTIES</span>
                    <span className="text-base font-bold text-red-800">
                      {selectedNode.casualties}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">POPULATION</span>
                    <span className="text-base font-bold text-slate-800">
                      {selectedNode.population}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-200">
                    <span className="text-amber-700 block text-[10px]">DECAY RATE</span>
                    <span className="text-base font-bold text-amber-800">
                      {selectedNode.urgencyDecayPerHour}%/hr
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 font-mono text-[11px]">
                  <span className="text-slate-600 font-bold block">RELIEF DEMAND:</span>
                  <div className="flex justify-between text-slate-700">
                    <span>• Trauma Medical:</span>
                    <span className="text-red-700 font-bold">{selectedNode.demand.medicalKg} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>• Water Rations:</span>
                    <span className="text-cyan-700 font-bold">{selectedNode.demand.waterKg} kg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Tactical Map Legend */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-700 space-y-1.5 shadow-lg z-10 max-w-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>Tactical Map Legend</span>
            <span className="text-amber-700 font-bold text-[9px]">LIVE ROUTES</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {activeAlgorithm === "mdvrp" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 rounded bg-blue-600"></span>
                  <span>Convoy Circuit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-[8px] text-white flex items-center justify-center font-bold">#1</span>
                  <span>Stop Milestone</span>
                </div>
              </>
            )}

            {activeAlgorithm === "dijkstra" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 rounded bg-orange-600"></span>
                  <span>Shortest Corridor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Active Vehicle</span>
                </div>
              </>
            )}

            {activeAlgorithm === "kruskal" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 rounded bg-emerald-600"></span>
                  <span>MST Backbone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-slate-300"></span>
                  <span>Non-MST Road</span>
                </div>
              </>
            )}

            {activeAlgorithm === "maxflow" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 rounded bg-cyan-600"></span>
                  <span>Flow Volume</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 border-b-2 border-dashed border-red-600"></span>
                  <span>Min-Cut Bottleneck</span>
                </div>
              </>
            )}

            {activeAlgorithm === "triage" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 border-b-2 border-dashed border-red-600"></span>
                  <span>Triage Trajectory</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-[8px] text-white flex items-center justify-center font-bold">P1</span>
                  <span>Priority Rank</span>
                </div>
              </>
            )}

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Critical Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rotate-45 inline-block"></span>
              <span>Response Depot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
