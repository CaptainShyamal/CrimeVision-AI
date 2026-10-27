import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MiniMap,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  GitFork, 
  RefreshCw, 
  UploadCloud, 
  Maximize2, 
  Minimize2, 
  Lock, 
  Unlock, 
  Move, 
  LayoutGrid, 
  Info,
  Compass,
  Eye,
  Network,
  Share2,
  Folder,
  Layers
} from 'lucide-react';

function FlowInner({ 
  nodes: propNodes = [], 
  edges: propEdges = [], 
  initialNodes = [], 
  initialEdges = [], 
  onRefresh, 
  fullScreenMode = false, 
  toggleFullScreen,
  isMultiCaseView = false,
  cases = [],
  onSelectCase,
  activeCaseId
}) {
  const activeNodesSource = (propNodes && propNodes.length > 0) ? propNodes : (initialNodes || []);
  const activeEdgesSource = (propEdges && propEdges.length > 0) ? propEdges : (initialEdges || []);

  const [nodes, setNodes, onNodesChange] = useNodesState(activeNodesSource);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeEdgesSource);
  
  const [isLocked, setIsLocked] = useState(false);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [spreadStep, setSpreadStep] = useState(0);
  const [caseFilter, setCaseFilter] = useState("ALL");
  const reactFlowInstance = useReactFlow();
  const lastSyncKey = useRef("");
  const containerRef = useRef(null);

  // Sync internal nodes and edges ONLY when nodes IDs or content change
  useEffect(() => {
    let rawNodes = (propNodes && propNodes.length > 0) ? propNodes : initialNodes;
    let rawEdges = (propEdges && propEdges.length > 0) ? propEdges : initialEdges;

    if (caseFilter !== "ALL") {
      rawNodes = rawNodes.filter(n => n.data?.case_id === caseFilter || n.id === `case_${caseFilter}`);
      const nodeIds = new Set(rawNodes.map(n => n.id));
      rawEdges = rawEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    const currentSyncKey = (rawNodes || []).map(n => n.id).join(",") + "::" + (rawEdges || []).map(e => e.id).join(",") + "::filter_" + caseFilter;

    if (currentSyncKey !== lastSyncKey.current) {
      lastSyncKey.current = currentSyncKey;

      if (rawNodes && rawNodes.length > 0) {
        const enhancedNodes = rawNodes.map(node => ({
          ...node,
          draggable: !isLocked,
          data: {
            ...node.data,
            title: node.data?.full_text || node.data?.label || ""
          },
          style: {
            ...node.style,
            cursor: isLocked ? 'default' : 'grab',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease'
          }
        }));
        setNodes(enhancedNodes);
      } else {
        setNodes([]);
      }

      if (rawEdges && rawEdges.length > 0) {
        const formattedEdges = rawEdges.map(edge => ({
          ...edge,
          labelStyle: { fill: '#f1f5f9', fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95, stroke: '#334155', strokeWidth: 1 },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6
        }));
        setEdges(formattedEdges);
      } else {
        setEdges([]);
      }

      // Auto fit view
      if (reactFlowInstance && rawNodes && rawNodes.length > 0) {
        setTimeout(() => {
          try {
            reactFlowInstance.fitView({ padding: 0.25, duration: 400 });
          } catch (e) {}
        }, 60);
      }
    }
  }, [propNodes, propEdges, initialNodes, initialEdges, setNodes, setEdges, reactFlowInstance, isLocked, caseFilter]);

  const hasData = nodes && nodes.length > 0;

  const onNodeClick = (event, node) => {
    setSelectedNodeInfo(node);
  };

  const updateRelativeMousePos = (clientX, clientY) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    } else {
      setMousePos({ x: clientX, y: clientY });
    }
  };

  const onNodeMouseEnter = (event, node) => {
    setHoveredNode(node);
    updateRelativeMousePos(event.clientX, event.clientY);
  };

  const onNodeMouseMove = (event, node) => {
    updateRelativeMousePos(event.clientX, event.clientY);
  };

  const onNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  const onNodeDragStart = useCallback(() => {
    document.body.style.cursor = 'grabbing';
    setHoveredNode(null);
  }, []);

  const onNodeDragStop = useCallback((event, node) => {
    document.body.style.cursor = 'default';
    setSelectedNodeInfo(node);
  }, []);

  const handleSpreadLayout = () => {
    const nextStep = spreadStep + 1;
    setSpreadStep(nextStep);
    const spacingFactor = (nextStep % 3 === 1) ? 1.5 : (nextStep % 3 === 2) ? 2.0 : 1.0;

    setNodes((currentNds) => {
      if (!currentNds || currentNds.length === 0) return currentNds;
      return currentNds.map((node) => {
        if (node.id.startsWith("case_")) {
          return { ...node, position: { x: Math.round(node.position.x * (spacingFactor > 1.2 ? 1.2 : 1.0)), y: 20 } };
        }
        return {
          ...node,
          position: {
            x: Math.round(node.position.x * spacingFactor),
            y: Math.round(node.position.y * (spacingFactor > 1.2 ? 1.15 : 1.0))
          }
        };
      });
    });

    setTimeout(() => {
      try {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      } catch (e) {}
    }, 100);
  };

  const handleResetLayout = () => {
    const rawNodes = (propNodes && propNodes.length > 0) ? propNodes : initialNodes;
    if (rawNodes && rawNodes.length > 0) {
      setNodes(rawNodes.map(node => ({
        ...node,
        draggable: !isLocked,
        style: {
          ...node.style,
          cursor: isLocked ? 'default' : 'grab'
        }
      })));
      setSpreadStep(0);
      setCaseFilter("ALL");
      setTimeout(() => {
        try {
          reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
        } catch (e) {}
      }, 50);
    }
  };

  const toggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    setNodes(nds => nds.map(n => ({
      ...n,
      draggable: !nextLocked,
      style: {
        ...n.style,
        cursor: nextLocked ? 'default' : 'grab'
      }
    })));
  };

  return (
    <div className={`flex flex-col h-full space-y-3 ${fullScreenMode ? 'p-6 bg-slate-950 text-slate-100' : ''}`}>
      
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isMultiCaseView ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'}`}>
            {isMultiCaseView ? <Network size={20} /> : <GitFork size={20} />}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              {isMultiCaseView ? 'Neo4j Multi-Case Relational Knowledge Network' : 'Neo4j Case Knowledge Graph'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isMultiCaseView 
                ? 'Global cross-case entity correlation (Case A ↔ Case B ↔ Shared Suspects & Vehicles)' 
                : 'Interactive path tracing witness statements → visual evidence for active case'}
            </p>
          </div>
        </div>

        {/* Counter & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-700 transition-colors shadow"
              title="Reload Graph from Neo4j"
            >
              <RefreshCw size={14} className="text-blue-400" />
            </button>
          )}

          <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold">
            {nodes.length} Nodes • {edges.length} Edges
          </span>

          <button
            type="button"
            onClick={toggleFullScreen}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all shadow ${
              fullScreenMode 
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' 
                : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={fullScreenMode ? "Exit Fullscreen (ESC)" : "Expand Graph Fullscreen for Investigator"}
          >
            {fullScreenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} className="text-purple-400" />}
            <span>{fullScreenMode ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Action Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700/60 shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          {/* Lock / Unlock Toggle */}
          <button
            type="button"
            onClick={toggleLock}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all shadow ${
              isLocked 
                ? 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-700 shadow-red-900/20' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={isLocked ? "Graph Locked: Click to Unlock & Drag Nodes" : "Graph Unlocked: Click to Lock in Place"}
          >
            {isLocked ? <Lock size={13} className="text-red-400" /> : <Unlock size={13} className="text-emerald-400" />}
            <span>{isLocked ? 'Locked' : 'Lock Graph'}</span>
          </button>

          {/* Spread / Fan-out Nodes */}
          <button
            type="button"
            onClick={handleSpreadLayout}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow hover:border-purple-500/50"
            title="Spread and expand node spacing across canvas"
          >
            <Move size={13} className="text-purple-400" />
            <span>Spread Nodes</span>
          </button>

          {/* Reset Layout */}
          <button
            type="button"
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow"
            title="Reset to default hierarchical layout"
          >
            <LayoutGrid size={13} className="text-blue-400" />
            <span>Reset Layout</span>
          </button>

          {/* Filter by Case dropdown in Multi-Case Mode */}
          {isMultiCaseView && cases && cases.length > 1 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Filter:</span>
              <select
                value={caseFilter}
                onChange={(e) => setCaseFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
              >
                <option value="ALL">🌐 All Cases ({cases.length})</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800 font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            {hasData ? (isMultiCaseView ? 'Unified Graph Active' : 'Live Relations') : 'Awaiting Ingestion'}
          </span>
          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold border flex items-center gap-1.5 ${
            isLocked 
              ? 'bg-red-950/80 text-red-300 border-red-800' 
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}>
            {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
            {isLocked ? 'LOCKED' : 'DRAGGABLE'}
          </span>
        </div>
      </div>
      
      {/* ReactFlow Interactive Canvas Container */}
      <div 
        ref={containerRef}
        onMouseMove={(e) => updateRelativeMousePos(e.clientX, e.clientY)}
        className="w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 relative shadow-inner"
        style={{ 
          minHeight: fullScreenMode ? '500px' : '400px', 
          height: fullScreenMode ? 'calc(100vh - 200px)' : '430px' 
        }}
      >
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/90 z-10 space-y-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
              <UploadCloud size={32} />
            </div>
            <p className="text-sm font-bold text-slate-300">No Graph Relations Ingested Yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Upload video/image evidence and a witness statement on the left panel to construct real-time Neo4j entity paths.
            </p>
          </div>
        ) : (
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={isLocked ? undefined : onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseMove={onNodeMouseMove}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            nodesDraggable={!isLocked}
            nodesConnectable={false}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2.0}
            attributionPosition="bottom-right"
            style={{ width: '100%', height: '100%', background: '#020617' }}
          >
            <Background color="#1e293b" gap={20} size={1.2} />
            <Controls className="bg-slate-900 fill-slate-300 border border-slate-700 rounded-xl overflow-hidden shadow-xl m-3" />
            {fullScreenMode && (
              <MiniMap 
                nodeColor={(n) => {
                  if (n.id.startsWith("case_")) return "#0284c7";
                  if (n.id.startsWith("vis_")) return "#3b82f6";
                  return "#a855f7";
                }}
                maskColor="rgba(15, 23, 42, 0.75)"
                className="bg-slate-900/90 border border-slate-700 rounded-xl overflow-hidden m-3"
              />
            )}
          </ReactFlow>
        )}

        {/* Dynamic Hover Tooltip centered directly above cursor inside the graph canvas */}
        {hoveredNode && !selectedNodeInfo && (() => {
          const cWidth = containerRef.current?.offsetWidth || 800;
          const isNearTop = mousePos.y < 120;
          const isContra = hoveredNode.data?.is_contradiction;
          const isStmt = hoveredNode.data?.type === 'statement' || hoveredNode.id?.startsWith('txt_');
          const isVis = hoveredNode.data?.type === 'visual' || hoveredNode.id?.startsWith('vis_');
          const fullSentence = hoveredNode.data?.full_text || hoveredNode.data?.label?.replace(/^[🟢🔴📝🎥📁]\s*/, '') || '';

          // Clamped strictly within the canvas borders so it never clips
          const clampedX = Math.max(150, Math.min(cWidth - 150, mousePos.x));
          const posY = isNearTop ? mousePos.y + 18 : mousePos.y - 12;
          const transformStyle = isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';

          return (
            <div 
              className="absolute z-50 pointer-events-none transition-transform duration-75 ease-out drop-shadow-2xl"
              style={{ 
                left: `${clampedX}px`, 
                top: `${posY}px`,
                transform: transformStyle
              }}
            >
              {/* Tooltip Content Box */}
              <div className={`p-3 rounded-xl border shadow-2xl backdrop-blur-2xl w-72 sm:w-80 space-y-2 text-xs animate-scaleUp ${
                isContra
                  ? 'bg-slate-950/95 border-red-500 shadow-red-950/60 text-red-100'
                  : (isStmt
                      ? 'bg-slate-950/95 border-emerald-500 shadow-emerald-950/60 text-emerald-100'
                      : 'bg-slate-950/95 border-blue-500 shadow-blue-950/60 text-slate-100')
              }`}>
                {/* Header Tag */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 truncate">
                    {isStmt 
                      ? '📝 Statement / Question' 
                      : (isVis ? '🎥 Visual Evidence' : '📁 Forensic Case')}
                  </span>
                  {isStmt && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                      isContra 
                        ? 'bg-red-950/90 text-red-300 border-red-700' 
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                    }`}>
                      {isContra ? '🔴 Contradiction' : '🟢 Congruent'}
                    </span>
                  )}
                </div>

                {/* Full Statement Display */}
                <div className="space-y-1">
                  <p className="font-serif italic text-xs text-slate-100 bg-slate-900/90 p-2 rounded-lg border border-slate-800 leading-snug break-words">
                    "{fullSentence}"
                  </p>
                </div>

                {hoveredNode.data?.case_id && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5 border-t border-slate-800/80">
                    <span>Case: #{hoveredNode.data.case_id}</span>
                    <span className={isContra ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {isContra ? 'Contradicts' : 'Congruent'}
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow Notch pointing directly to cursor */}
              <div 
                className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent mx-auto ${
                  isNearTop 
                    ? '-mt-[1px] border-b-[6px] border-b-slate-950' 
                    : '-mt-[1px] border-t-[6px] border-t-slate-950'
                }`} 
              />
            </div>
          );
        })()}

        {/* Selected Node Mini Inspector */}
        {selectedNodeInfo && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl max-w-sm text-xs text-slate-300 space-y-2.5 backdrop-blur-md animate-slideIn z-30">
            <div className="flex items-center justify-between text-blue-400 font-bold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Info size={14} /> Entity Inspector
              </span>
              <button 
                type="button"
                onClick={() => setSelectedNodeInfo(null)}
                className="text-slate-500 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Full Sentence / Content:</span>
              <p className="font-serif italic text-white text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-snug break-words">
                "{selectedNodeInfo.data?.full_text || selectedNodeInfo.data?.label?.replace(/^[🟢🔴📝🎥📁]\s*/, '')}"
              </p>
            </div>

            {selectedNodeInfo.data?.type === 'statement' && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Verdict Status:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  selectedNodeInfo.data?.is_contradiction
                    ? 'bg-red-950/80 text-red-300 border-red-700'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                }`}>
                  {selectedNodeInfo.data?.is_contradiction ? '🔴 CONTRADICTION DETECTED' : '🟢 VERIFIED CONGRUENT'}
                </span>
              </div>
            )}

            {selectedNodeInfo.data?.case_id && (
              <div className="flex items-center justify-between bg-blue-950/60 p-2 rounded-lg border border-blue-900/80">
                <span className="text-[11px] text-blue-300 font-mono">Case File: #{selectedNodeInfo.data.case_id}</span>
                {onSelectCase && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCase(selectedNodeInfo.data.case_id);
                      setSelectedNodeInfo(null);
                    }}
                    className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md transition-colors"
                  >
                    Open Tab
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span>Node ID: {selectedNodeInfo.id}</span>
              <span>Position: ({Math.round(selectedNodeInfo.position.x)}, {Math.round(selectedNodeInfo.position.y)})</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend & Instructions Footer Box */}
      <div className="bg-slate-900/95 border border-slate-700/70 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Left Badges: Congruent, Contradiction, and Cross-Case */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/90 px-3 py-1.5 rounded-lg text-emerald-300 text-xs font-semibold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
            <span>Congruent Path (Score &le; 1.15)</span>
          </div>

          <div className="flex items-center gap-2 bg-red-950/70 border border-red-800/90 px-3 py-1.5 rounded-lg text-red-300 text-xs font-semibold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/50"></span>
            <span>Contradiction Flagged (&gt; 1.15)</span>
          </div>

          {isMultiCaseView && (
            <div className="flex items-center gap-2 bg-amber-950/70 border border-amber-800/90 px-3 py-1.5 rounded-lg text-amber-300 text-xs font-semibold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
              <span>Cross-Case Link (🔗 Relates)</span>
            </div>
          )}
        </div>

        {/* Right Tip */}
        <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-[11px] shadow-sm">
          <Compass size={13} className={isLocked ? "text-red-400" : "text-purple-400"} />
          <span>
            {isLocked 
              ? 'Status: LOCKED (Click "Lock Graph" to move nodes)' 
              : 'Drag nodes freely • Press "Spread Nodes" to fan out'}
          </span>
        </div>
      </div>

    </div>
  );
}

export default function GraphView(props) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle ESC key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  return (
    <>
      {/* Standard Embedded View */}
      <div className="bg-slate-800/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col min-h-[580px]">
        <ReactFlowProvider>
          <FlowInner 
            {...props} 
            fullScreenMode={false} 
            toggleFullScreen={toggleFullScreen} 
          />
        </ReactFlowProvider>
      </div>

      {/* Full Screen Overlay Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl p-6 flex flex-col w-screen h-screen animate-fadeIn">
          <ReactFlowProvider>
            <FlowInner 
              {...props} 
              fullScreenMode={true} 
              toggleFullScreen={toggleFullScreen} 
            />
          </ReactFlowProvider>
        </div>
      )}
    </>
  );
}