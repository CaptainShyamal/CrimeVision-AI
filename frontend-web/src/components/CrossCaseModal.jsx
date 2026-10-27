import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, X, Link, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, UserCheck, Car, Crosshair, MapPin, Clock } from 'lucide-react';

export default function CrossCaseModal({ 
  isOpen, 
  onClose, 
  cases = [], 
  currentCaseId, 
  onLinkCreated,
  existingLinks = []
}) {
  const [activeTab, setActiveTab] = useState("manual"); // "manual" | "suggestions" | "existing"
  const [sourceCaseId, setSourceCaseId] = useState(currentCaseId || (cases[0]?.id || "CASE-REACT-001"));
  const [targetCaseId, setTargetCaseId] = useState(cases.find(c => c.id !== sourceCaseId)?.id || "");
  const [relationType, setRelationType] = useState("SHARED_SUSPECT");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState(0.85);
  const [sharedEntity, setSharedEntity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentCaseId) {
        setSourceCaseId(currentCaseId);
        const other = cases.find(c => c.id !== currentCaseId);
        if (other) setTargetCaseId(other.id);
      }
      fetchSuggestions();
    }
  }, [isOpen, currentCaseId, cases]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await axios.get("http://127.0.0.1:8001/cross_case_suggestions");
      if (res.data) {
        setSuggestions(res.data);
      }
    } catch (e) {
      console.log("Suggestions fetch error:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceCaseId || !targetCaseId || sourceCaseId === targetCaseId) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post("http://127.0.0.1:8001/cross_case_relation", {
        source_case_id: sourceCaseId,
        target_case_id: targetCaseId,
        relation_type: relationType,
        description: description || `Connected via ${relationType.replace('_', ' ').toLowerCase()}`,
        confidence: parseFloat(confidence),
        shared_entity: sharedEntity
      });

      if (onLinkCreated) {
        onLinkCreated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Error creating cross-case link:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySuggestion = async (sug) => {
    try {
      const res = await axios.post("http://127.0.0.1:8001/cross_case_relation", {
        source_case_id: sug.source_case_id,
        target_case_id: sug.target_case_id,
        relation_type: sug.relation_type,
        description: sug.description,
        confidence: sug.confidence,
        shared_entity: sug.shared_entity
      });
      if (onLinkCreated) {
        onLinkCreated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Error applying suggestion:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Share2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Cross-Case Intelligence Relator
              </h2>
              <p className="text-xs text-slate-400">
                Establish entity paths and correlations between Case A, Case B, and other files
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "manual"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔗 Connect Cases Manually
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "suggestions"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={12} className="text-purple-400" />
            <span>AI Discovered Overlaps ({suggestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("existing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "existing"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 Active Links ({existingLinks.length})
          </button>
        </div>

        {/* Tab 1: Manual Connector */}
        {activeTab === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Case Selectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 items-center">
              {/* Source Case */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  Source Case File
                </label>
                <select
                  value={sourceCaseId}
                  onChange={(e) => setSourceCaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.id} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Case */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Target Case File To Link
                </label>
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="" disabled>Select case to correlate...</option>
                  {cases.filter(c => c.id !== sourceCaseId).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.id} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Relationship Type & Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Correlation Type
                </label>
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="SHARED_SUSPECT">👤 Shared Suspect / Matching MO</option>
                  <option value="SHARED_VEHICLE">🚗 Shared Vehicle / License Plate</option>
                  <option value="BALLISTICS_MATCH">🔫 Ballistics / Weapon Match</option>
                  <option value="PROXIMITY_LOCATION">📍 Geographic Proximity & Perimeter</option>
                  <option value="CHRONOLOGICAL_SERIES">⏱️ Linked Incident Timeline</option>
                  <option value="OVERLAPPING_EVIDENCE">📄 Overlapping Evidence Item</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Confidence Score: <span className="text-amber-400 font-mono font-bold">{Math.round(confidence * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="0.99"
                  step="0.01"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                />
              </div>
            </div>

            {/* Shared Entity Name */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Shared Entity / Matching Keyword
              </label>
              <input
                type="text"
                value={sharedEntity}
                onChange={(e) => setSharedEntity(e.target.value)}
                placeholder="e.g. 'Black Sedan with tinted glass', 'Suspect with Red Hoodie', '9mm Firearm'"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Description / Notes */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Forensic Justification / Modus Operandi Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details explaining why these two cases correlate in the Neo4j graph..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !targetCaseId || targetCaseId === sourceCaseId}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/25"
              >
                <Link size={14} />
                <span>{isSubmitting ? 'Linking in Neo4j...' : 'Link Cases & Update Graph'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: AI Suggestions */}
        {activeTab === "suggestions" && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {loadingSuggestions ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Scanning cross-case witness statements and visual features for correlations...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 text-xs text-slate-400 space-y-2">
                <Sparkles size={24} className="text-purple-400 mx-auto" />
                <p className="font-bold text-slate-300">No Automated Overlaps Detected Yet</p>
                <p className="text-[11px] text-slate-500">
                  Ingest evidence across multiple cases (e.g. Case A and Case B) with matching witness statements or vehicles to trigger automated intelligence links.
                </p>
              </div>
            ) : (
              suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30 hover:border-purple-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400">{sug.source_case_name || sug.source_case_id}</span>
                      <ArrowRight size={12} className="text-purple-400" />
                      <span className="text-xs font-bold text-amber-400">{sug.target_case_name || sug.target_case_id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
                        {Math.round(sug.confidence * 100)}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{sug.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplySuggestion(sug)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow"
                  >
                    <CheckCircle2 size={13} /> Link Now
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Existing Links */}
        {activeTab === "existing" && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {existingLinks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                No active cross-case relationships established yet.
              </div>
            ) : (
              existingLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">{link.source_case_id}</span>
                      <span className="text-slate-500">&harr;</span>
                      <span className="font-bold text-amber-400">{link.target_case_id}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        [{link.relation_type}]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{link.description}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    Neo4j Synced
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
