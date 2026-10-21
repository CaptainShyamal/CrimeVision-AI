import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Activity, 
  FileSearch, 
  RefreshCw, 
  Layers, 
  Database, 
  GitFork, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2,
  Network,
  Share2,
  FolderPlus,
  ArrowRight,
  Plus
} from 'lucide-react';
import Heatmap from '../components/Heatmap';
import GraphView from '../components/GraphView';
import IngestionZone from '../components/IngestionZone';
import EvidenceTable from '../components/EvidenceTable';
import LLMAnalysisPanel from '../components/LLMAnalysisPanel';
import CaseTabBar from '../components/CaseTabBar';
import CreateCaseModal from '../components/CreateCaseModal';
import EditCaseModal from '../components/EditCaseModal';
import CrossCaseModal from '../components/CrossCaseModal';

const API_BASE = "http://127.0.0.1:8001";

export default function Dashboard() {
  // Cases & Tabs State - starts clean
  const [cases, setCases] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [isMultiCaseView, setIsMultiCaseView] = useState(false);
  const [crossCaseLinks, setCrossCaseLinks] = useState([]);

  // Modals State
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [isCrossCaseOpen, setIsCrossCaseOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);

  // Evidence & Graph State
  const [evidenceList, setEvidenceList] = useState([]);
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const [activeAnalysis, setActiveAnalysis] = useState({
    evidenceName: null,
    statementText: null,
    cost: null,
    isContradiction: false,
    isBlurry: false,
    visualUncertainty: 0,
    qualityLabel: null,
    investigatorAdvisory: null,
    discrepancyInfo: null,
    auditReport: null
  });

  const [activeHeatmap, setActiveHeatmap] = useState({
    tokens: [],
    patches: [],
    matrix: [],
    visualUncertainty: 0,
    evidenceName: null,
    cost: null
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeCaseObj = cases.find(c => c.id === activeCaseId) || {
    id: activeCaseId || "UNASSIGNED",
    name: activeCaseId ? `Case #${activeCaseId}` : "No Active Case"
  };

  // Fetch all cases and cross-case relations from backend
  const fetchCasesList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cases`);
      if (res.data && Array.isArray(res.data)) {
        setCases(res.data);
        if (res.data.length > 0) {
          // Sync open tabs
          setOpenTabs(prev => {
            if (prev.length === 0) return [res.data[0]];
            return prev.map(tab => {
              const match = res.data.find(c => c.id === tab.id);
              return match ? { ...tab, ...match } : tab;
            });
          });
          if (!activeCaseId) {
            setActiveCaseId(res.data[0].id);
          }
        }
      }
    } catch (e) {
      console.log("Cases fetch:", e);
    }

    try {
      const linksRes = await axios.get(`${API_BASE}/cross_case_relations`);
      if (linksRes.data) {
        setCrossCaseLinks(linksRes.data);
      }
    } catch (e) {}
  };

  // Fetch graph and evidence data
  const fetchGraphData = useCallback(async (targetCaseId = activeCaseId, forceMulti = isMultiCaseView) => {
    if (!targetCaseId && !forceMulti) {
      setGraphNodes([]);
      setGraphEdges([]);
      setEvidenceList([]);
      return;
    }

    try {
      if (forceMulti) {
        const response = await axios.get(`${API_BASE}/graph/all`);
        if (response.data) {
          setGraphNodes(response.data.nodes || []);
          setGraphEdges(response.data.edges || []);
          setEvidenceList(response.data.evidence_list || []);
          if (response.data.cross_case_links) {
            setCrossCaseLinks(response.data.cross_case_links);
          }
          showToast(`🌐 Multi-Case Relational Graph Loaded (${response.data.total_cases || 0} Cases)`);
        }
      } else {
        const response = await axios.get(`${API_BASE}/graph/${targetCaseId}`);
        if (response.data) {
          setGraphNodes(response.data.nodes || []);
          setGraphEdges(response.data.edges || []);
          const list = response.data.evidence_list || [];
          setEvidenceList(list);

          if (list.length > 0) {
            const first = list[0];
            const words = first.statement_text.split(" ").slice(0, 6);
            setActiveHeatmap({
              tokens: words.length > 0 ? words : ["suspect", "observed"],
              patches: ["Zone 1 (Top-Left)", "Zone 2 (Top-Right)", "Zone 3 (Bottom-Center)"],
              matrix: [
                [0.15, 0.22, 0.18],
                [0.32, 0.15, 0.28],
                [0.10, 0.22, 0.16]
              ],
              visualUncertainty: typeof first.visual_uncertainty === 'number' ? first.visual_uncertainty : 0.45,
              evidenceName: first.evidence_filename,
              cost: first.sinkhorn_cost
            });

            setActiveAnalysis({
              evidenceName: first.evidence_filename,
              statementText: first.statement_text,
              cost: first.sinkhorn_cost,
              isContradiction: first.is_contradiction || first.sinkhorn_cost > 1.15,
              isBlurry: Boolean(first.is_blurry),
              visualUncertainty: typeof first.visual_uncertainty === 'number' ? first.visual_uncertainty : 0.45,
              qualityLabel: first.quality_label || (first.is_blurry ? "Severe Degradation / Moderate Ambiguity" : "Optimal Visual Clarity"),
              investigatorAdvisory: first.investigator_advisory || null,
              discrepancyInfo: first.discrepancy_info || null,
              auditReport: first.audit_report || null
            });
          } else {
            setActiveHeatmap({
              tokens: [],
              patches: [],
              matrix: [],
              visualUncertainty: 0,
              evidenceName: null,
              cost: null
            });
            setActiveAnalysis({
              evidenceName: null,
              statementText: null,
              cost: null,
              isContradiction: false,
              isBlurry: false,
              visualUncertainty: 0,
              qualityLabel: null,
              investigatorAdvisory: null,
              discrepancyInfo: null,
              auditReport: null
            });
          }
        }
      }
    } catch (err) {
      console.log("Graph ready for case ingestion:", targetCaseId);
      setGraphNodes([]);
      setGraphEdges([]);
      setEvidenceList([]);
    }
  }, [activeCaseId, isMultiCaseView]);

  // Initial load
  useEffect(() => {
    fetchCasesList();
  }, []);

  useEffect(() => {
    if (activeCaseId || isMultiCaseView) {
      fetchGraphData(activeCaseId, isMultiCaseView);
    }
  }, [activeCaseId, isMultiCaseView, fetchGraphData]);

  // Handle Tab Switch
  const handleSelectTab = (caseId) => {
    setIsMultiCaseView(false);
    setActiveCaseId(caseId);

    // If tab is not open, open it
    if (!openTabs.some(t => t.id === caseId)) {
      const match = cases.find(c => c.id === caseId) || { id: caseId, name: `Case #${caseId}` };
      setOpenTabs(prev => [...prev, match]);
    }

    fetchGraphData(caseId, false);
    showToast(`Switched to Tab: ${cases.find(c => c.id === caseId)?.name || caseId}`);
  };

  // Handle Close Tab
  const handleCloseTab = (caseIdToClose) => {
    const updated = openTabs.filter(t => t.id !== caseIdToClose);
    setOpenTabs(updated);
    
    if (activeCaseId === caseIdToClose) {
      if (updated.length > 0) {
        const nextActive = updated[updated.length - 1].id;
        setActiveCaseId(nextActive);
        fetchGraphData(nextActive, false);
      } else {
        setActiveCaseId(null);
        setEvidenceList([]);
        setGraphNodes([]);
        setGraphEdges([]);
      }
    }
  };

  // Handle Create New Case
  const handleCreateCase = async (casePayload) => {
    try {
      const res = await axios.post(`${API_BASE}/cases`, casePayload);
      const newCase = res.data?.case || casePayload;
      
      setCases(prev => {
        const filtered = prev.filter(c => c.id !== newCase.id);
        return [...filtered, newCase];
      });

      setOpenTabs(prev => {
        const filtered = prev.filter(t => t.id !== newCase.id);
        return [...filtered, newCase];
      });

      setIsMultiCaseView(false);
      setActiveCaseId(newCase.id);
      
      await fetchGraphData(newCase.id, false);
      showToast(`✨ Created Case Tab: ${newCase.name}`);
    } catch (err) {
      console.error("Create case error:", err);
      setCases(prev => [...prev, casePayload]);
      setOpenTabs(prev => [...prev, casePayload]);
      setActiveCaseId(casePayload.case_id);
      setIsMultiCaseView(false);
      fetchGraphData(casePayload.case_id, false);
      showToast(`✨ Created Case: ${casePayload.name}`);
    }
  };

  // Handle Save / Edit Case
  const handleSaveCase = async (caseId, updatedFields) => {
    try {
      const res = await axios.put(`${API_BASE}/cases/${caseId}`, updatedFields);
      const updated = res.data?.case || { id: caseId, ...updatedFields };

      setCases(prev => prev.map(c => c.id === caseId ? { ...c, ...updated } : c));
      setOpenTabs(prev => prev.map(t => t.id === caseId ? { ...t, ...updated } : t));
      
      showToast(`📝 Updated Case: ${updated.name}`);
      fetchGraphData(activeCaseId, isMultiCaseView);
    } catch (err) {
      console.error("Update case error:", err);
    }
  };

  // Handle Delete Case
  const handleDeleteCase = async (caseIdToDelete) => {
    try {
      await axios.delete(`${API_BASE}/cases/${caseIdToDelete}`);
    } catch (e) {
      console.log("Deleted locally:", e);
    }

    setCases(prev => prev.filter(c => c.id !== caseIdToDelete));
    setOpenTabs(prev => prev.filter(t => t.id !== caseIdToDelete));
    
    if (activeCaseId === caseIdToDelete) {
      const remaining = cases.filter(c => c.id !== caseIdToDelete);
      const nextId = remaining[0]?.id || null;
      setActiveCaseId(nextId);
      if (nextId) {
        fetchGraphData(nextId, false);
      } else {
        setEvidenceList([]);
        setGraphNodes([]);
        setGraphEdges([]);
      }
    }
    showToast(`🗑️ Deleted Case: #${caseIdToDelete}`);
  };

  // Toggle Global Multi-Case Relational View
  const handleToggleMultiCaseView = () => {
    const nextState = !isMultiCaseView;
    setIsMultiCaseView(nextState);
    fetchGraphData(activeCaseId, nextState);
  };

  // Upload Completion Handler
  const handleUploadSuccess = (data) => {
    if (!data) return;

    const isContradiction = data.is_contradiction || data.sinkhorn_alignment_cost > 1.15;
    const isBlurry = Boolean(data.is_blurry);
    const newRecord = {
      case_id: data.case_id || activeCaseId,
      evidence_filename: data.evidence_processed,
      statement_text: data.statement_text,
      sinkhorn_cost: data.sinkhorn_alignment_cost,
      is_contradiction: isContradiction,
      is_blurry: isBlurry,
      visual_uncertainty: typeof data.visual_uncertainty === 'number' ? data.visual_uncertainty : 0.45,
      quality_label: data.quality_label || (isBlurry ? "Severe Degradation / Moderate Ambiguity" : "Optimal Visual Clarity"),
      investigatorAdvisory: data.investigator_advisory || null,
      discrepancy_info: data.discrepancy_info || null,
      timestamp: data.timestamp || new Date().toLocaleTimeString(),
      status: isContradiction ? "CONTRADICTION" : "CONGRUENT",
      audit_report: data.audit_report
    };

    if (data.evidence_list && data.evidence_list.length > 0) {
      setEvidenceList(data.evidence_list);
    } else {
      setEvidenceList(prev => [newRecord, ...prev.filter(e => e.evidence_filename !== newRecord.evidence_filename || e.statement_text !== newRecord.statement_text)]);
    }

    setSelectedIndex(0);

    // Update Analysis Panel
    setActiveAnalysis({
      evidenceName: data.evidence_processed,
      statementText: data.statement_text,
      cost: data.sinkhorn_alignment_cost,
      isContradiction: isContradiction,
      isBlurry: isBlurry,
      visualUncertainty: typeof data.visual_uncertainty === 'number' ? data.visual_uncertainty : 0.45,
      qualityLabel: data.quality_label || (isBlurry ? "Severe Degradation / Moderate Ambiguity" : "Optimal Visual Clarity"),
      investigatorAdvisory: data.investigator_advisory || null,
      discrepancyInfo: data.discrepancy_info || null,
      auditReport: data.audit_report || null
    });

    // Update Knowledge Graph
    if (data.nodes && data.nodes.length > 0) {
      setGraphNodes(data.nodes);
    }
    if (data.edges && data.edges.length > 0) {
      setGraphEdges(data.edges);
    }

    // Update Heatmap View
    setActiveHeatmap({
      tokens: data.tokens && data.tokens.length > 0 ? data.tokens : ["token1", "token2"],
      patches: data.patches && data.patches.length > 0 ? data.patches : ["Zone 1", "Zone 2", "Zone 3"],
      matrix: data.heatmap_data || [],
      visualUncertainty: typeof data.visual_uncertainty === 'number' ? data.visual_uncertainty : 0.45,
      evidenceName: data.evidence_processed,
      cost: data.sinkhorn_alignment_cost
    });

    // Refresh case counters
    fetchCasesList();

    showToast(isContradiction ? "⚠️ Contradiction Flagged & Neo4j Updated!" : "✅ Evidential Alignment Verified!");
  };

  // Inspect specific evidence from table
  const handleSelectEvidence = (idx) => {
    setSelectedIndex(idx);
    const item = evidenceList[idx];
    if (item) {
      const words = item.statement_text.split(" ").filter(w => w.length > 2).slice(0, 6);
      const isContra = item.is_contradiction || item.sinkhorn_cost > 1.15;
      const isBlurry = Boolean(item.is_blurry);
      const baseCost = item.sinkhorn_cost || 0.5;
      
      const matrix = [
        words.map((_, i) => roundVal(baseCost * 0.8 + Math.sin(i) * 0.1)),
        words.map((_, i) => roundVal(baseCost * 1.0 + Math.cos(i) * 0.1)),
        words.map((_, i) => roundVal(baseCost * 0.9 + Math.sin(i + 1) * 0.1))
      ];

      const dynamicUncertainty = typeof item.visual_uncertainty === 'number' ? item.visual_uncertainty : (isBlurry ? 0.73 : 0.15);

      setActiveHeatmap(prev => ({
        ...prev,
        evidenceName: item.evidence_filename,
        cost: item.sinkhorn_cost,
        tokens: words.length > 0 ? words : ["evidence", "item"],
        patches: ["Zone 1 (Top-Left)", "Zone 2 (Top-Right)", "Zone 3 (Bottom-Center)"],
        matrix: matrix,
        visualUncertainty: dynamicUncertainty
      }));

      setActiveAnalysis({
        evidenceName: item.evidence_filename,
        statementText: item.statement_text,
        cost: item.sinkhorn_cost,
        isContradiction: isContra,
        isBlurry: isBlurry,
        visualUncertainty: dynamicUncertainty,
        qualityLabel: item.quality_label || (isBlurry ? "Severe Degradation (Heavy Blur & Sensor Static)" : "Optimal Visual Clarity"),
        investigatorAdvisory: item.investigator_advisory || null,
        discrepancyInfo: item.discrepancy_info || null,
        auditReport: item.audit_report || null
      });

      showToast(`Inspecting Evidence: ${item.evidence_filename}`);
    }
  };

  const roundVal = (v) => Math.max(0.02, Math.min(0.98, parseFloat(v.toFixed(2))));

  // Clear / Reset active case
  const handleClearAll = async () => {
    if (activeCaseId) {
      try {
        await axios.post(`${API_BASE}/clear/${activeCaseId}`);
      } catch (e) {
        console.log("Cleared locally:", e);
      }
    }
    setEvidenceList([]);
    setGraphNodes([]);
    setGraphEdges([]);
    setSelectedIndex(0);
    setActiveHeatmap({
      tokens: [],
      patches: [],
      matrix: [],
      visualUncertainty: 0,
      evidenceName: null,
      cost: null
    });
    setActiveAnalysis({
      evidenceName: null,
      statementText: null,
      cost: null,
      isContradiction: false,
      isBlurry: false,
      visualUncertainty: 0,
      qualityLabel: null,
      investigatorAdvisory: null,
      discrepancyInfo: null,
      auditReport: null
    });
    setResetTrigger(prev => prev + 1);
    fetchCasesList();
    showToast(activeCaseId ? `Case #${activeCaseId} reset to clean state` : "Dashboard reset");
  };

  const handleCrossCaseCreated = (linkData) => {
    showToast(`🔗 Established cross-case link: ${linkData.link?.relation_type || 'Correlated'}`);
    fetchCasesList();
    if (isMultiCaseView) {
      fetchGraphData(activeCaseId, true);
    }
  };

  const totalIngested = evidenceList.length;
  const totalContradictions = evidenceList.filter(e => e.is_contradiction || e.sinkhorn_cost > 1.15).length;
  const totalCongruent = totalIngested - totalContradictions;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[120] bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-slideIn">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap justify-between items-center mb-5 border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl shadow-lg shadow-blue-500/10">
            <ShieldAlert size={28} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              CrimeVision AI <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700">Multi-Case Forensics War Room</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-Case Relational Graph • Uncertainty-Aware Evidential Fusion • Ollama LLM Airgapped Audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsCrossCaseOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 border border-amber-700/90 px-3.5 py-2 rounded-xl transition-all shadow"
            title="Relate between Case A and Case B in Neo4j"
          >
            <Share2 size={14} className="text-amber-400" /> Relate Cases
          </button>
          <button 
            type="button"
            onClick={() => setIsCreateCaseOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/25"
            title="Create New Case Tab"
          >
            <FolderPlus size={14} /> + Create Case
          </button>
          {activeCaseId && (
            <button 
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800 px-3 py-2 rounded-xl transition-all shadow"
              title="Reset active case view"
            >
              <Trash2 size={13} /> Reset Case
            </button>
          )}
          <button 
            type="button"
            onClick={() => fetchGraphData(activeCaseId, isMultiCaseView)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl transition-all shadow hover:border-slate-600"
            title="Refresh from Neo4j"
          >
            <RefreshCw size={13} className="text-blue-400" /> Refresh
          </button>
        </div>
      </header>

      {/* Browser Tab Bar for Multiple Cases */}
      <CaseTabBar 
        cases={cases}
        openTabs={openTabs}
        activeTabId={activeCaseId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onOpenNewCaseModal={() => setIsCreateCaseOpen(true)}
        onOpenCrossCaseModal={() => setIsCrossCaseOpen(true)}
        onEditCase={(caseItem) => setEditingCase(caseItem)}
        onDeleteCase={handleDeleteCase}
        isMultiCaseView={isMultiCaseView}
        onToggleMultiCaseView={handleToggleMultiCaseView}
        crossCaseCount={crossCaseLinks.length}
      />

      {/* When no cases exist: Beautiful Onboarding Prompt */}
      {cases.length === 0 && (
        <div className="mb-6 p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-blue-950/40 to-slate-900/90 border-2 border-dashed border-blue-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-fadeIn">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} /> Forensic Investigation Setup
            </span>
            <h2 className="text-xl font-black text-white">No Active Forensic Case Initialized</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Start by creating your first case file (e.g. <strong>Case 1</strong> or <strong>Case A</strong>). Once created, you can upload video/image surveillance and witness transcripts to calculate mathematical Sinkhorn divergence and render real-time Neo4j entity graphs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateCaseOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-blue-500/30 shrink-0"
          >
            <Plus size={16} />
            <span>Create Case 1 to Start</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Top Section: Ingestion + Case Forensic Metrics & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left Column: Upload & Live Stats */}
        <div className="space-y-6">
          <IngestionZone 
            onUploadSuccess={handleUploadSuccess} 
            onClearAll={handleClearAll}
            resetTrigger={resetTrigger}
            caseId={activeCaseId || "CASE-1"}
            caseName={activeCaseObj.name}
            evidenceList={evidenceList}
          />

          {/* Forensic Case Stats */}
          <div className="bg-slate-800/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                  <FileSearch size={18} />
                </div>
                {isMultiCaseView ? 'Global Multi-Case Metrics' : 'Case Investigation Metrics'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-400">
                {isMultiCaseView ? `${cases.length} Cases` : (activeCaseId ? `#${activeCaseId}` : 'Standby')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Ingested</span>
                <p className="text-xl font-black text-white font-mono">{totalIngested}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Congruent Alignments</span>
                <p className="text-xl font-black text-emerald-400 font-mono">{totalCongruent}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-red-400">Contradictions (&gt; 1.15)</span>
                <p className="text-xl font-black text-red-400 font-mono">{totalContradictions}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-400">Cross-Case Links</span>
                <p className="text-xs font-bold text-purple-300 font-mono mt-1 flex items-center gap-1">
                  <Share2 size={13} className="text-amber-400" /> {crossCaseLinks.length} Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Neo4j Relationship Graph & Heatmap */}
        <div className="lg:col-span-2 space-y-6">
          <GraphView 
            nodes={graphNodes} 
            edges={graphEdges} 
            onRefresh={() => fetchGraphData(activeCaseId, isMultiCaseView)}
            isMultiCaseView={isMultiCaseView}
            cases={cases}
            onSelectCase={handleSelectTab}
            activeCaseId={activeCaseId}
          />
          
          <Heatmap 
            data={activeHeatmap.matrix}
            tokens={activeHeatmap.tokens}
            patches={activeHeatmap.patches}
            visualUncertainty={activeHeatmap.visualUncertainty}
            evidenceName={activeHeatmap.evidenceName}
            cost={activeHeatmap.cost}
          />
        </div>
      </div>

      {/* Middle Section: LLM Reasoning, Attribute Discrepancy & Investigator Advisory Panel */}
      <div className="w-full mb-6">
        <LLMAnalysisPanel 
          evidenceName={activeAnalysis.evidenceName}
          statementText={activeAnalysis.statementText}
          cost={activeAnalysis.cost}
          isContradiction={activeAnalysis.isContradiction}
          isBlurry={activeAnalysis.isBlurry}
          visualUncertainty={activeAnalysis.visualUncertainty}
          qualityLabel={activeAnalysis.qualityLabel}
          investigatorAdvisory={activeAnalysis.investigatorAdvisory}
          discrepancyInfo={activeAnalysis.discrepancyInfo}
          auditReport={activeAnalysis.auditReport}
          caseId={activeCaseId || "CASE-1"}
          caseName={activeCaseObj.name}
          crossCaseLinks={crossCaseLinks}
        />
      </div>

      {/* Bottom Row: Full Ingested Evidence Repository Table */}
      <div className="w-full">
        <EvidenceTable 
          evidenceList={evidenceList} 
          onSelectEvidence={handleSelectEvidence}
          selectedIndex={selectedIndex}
        />
      </div>

      {/* Modals */}
      <CreateCaseModal 
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
        onCreateCase={handleCreateCase}
        existingCount={cases.length}
      />

      <EditCaseModal 
        isOpen={Boolean(editingCase)}
        onClose={() => setEditingCase(null)}
        caseItem={editingCase}
        onSaveCase={handleSaveCase}
      />

      <CrossCaseModal 
        isOpen={isCrossCaseOpen}
        onClose={() => setIsCrossCaseOpen(false)}
        cases={cases}
        currentCaseId={activeCaseId}
        onLinkCreated={handleCrossCaseCreated}
        existingLinks={crossCaseLinks}
      />

    </div>
  );
}