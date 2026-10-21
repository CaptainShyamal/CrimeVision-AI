import React, { useState, useMemo } from 'react';
import { Database, FileVideo, FileImage, AlertTriangle, CheckCircle2, Search, Filter, Eye, Sparkles, Download, Layers } from 'lucide-react';
import EvidenceModal from './EvidenceModal';

export default function EvidenceTable({ evidenceList, onSelectEvidence, selectedIndex }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CONTRADICTIONS' | 'CONGRUENT'
  const [searchQuery, setSearchQuery] = useState('');
  const [modalEvidence, setModalEvidence] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredList = useMemo(() => {
    if (!evidenceList) return [];
    return evidenceList.filter(item => {
      const isContradiction = item.is_contradiction || item.sinkhorn_cost > 1.15;
      if (filter === 'CONTRADICTIONS' && !isContradiction) return false;
      if (filter === 'CONGRUENT' && isContradiction) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesFile = item.evidence_filename?.toLowerCase().includes(query);
        const matchesStmt = item.statement_text?.toLowerCase().includes(query);
        return matchesFile || matchesStmt;
      }
      return true;
    });
  }, [evidenceList, filter, searchQuery]);

  const openDossier = (item) => {
    setModalEvidence(item);
    setIsModalOpen(true);
  };

  const exportEvidenceJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evidenceList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `crimevision_case_evidence_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-800/95 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Database size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              Ingested Evidence Repository & Neo4j Relations
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700 font-mono">
                {evidenceList.length} Total
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live multi-modal evidence synchronized with Neo4j Knowledge Graph & LLM Audit Engine
            </p>
          </div>
        </div>

        {/* Action Controls: Search, Filter, Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file or statement..."
              className="bg-slate-900/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 md:w-56"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({evidenceList.length})
            </button>
            <button
              onClick={() => setFilter('CONTRADICTIONS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === 'CONTRADICTIONS' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              Contradictions ({evidenceList.filter(e => e.is_contradiction || e.sinkhorn_cost > 1.15).length})
            </button>
            <button
              onClick={() => setFilter('CONGRUENT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filter === 'CONGRUENT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Congruent ({evidenceList.filter(e => !e.is_contradiction && e.sinkhorn_cost <= 1.15).length})
            </button>
          </div>

          {/* Export JSON Button */}
          <button
            onClick={exportEvidenceJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Download full case data in JSON"
          >
            <Download size={13} /> Export JSON
          </button>
        </div>
      </div>

      {/* Table Content */}
      {filteredList.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <Database size={36} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No matching evidence records found.</p>
          <p className="text-xs text-slate-500 mt-1">Try changing your search query or filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Case File</th>
                <th className="py-3.5 px-4">Evidence Target</th>
                <th className="py-3.5 px-4">Witness Statement</th>
                <th className="py-3.5 px-4 text-center">Sinkhorn Cost</th>
                <th className="py-3.5 px-4 text-center">AI Verdict</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Investigation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredList.map((item, idx) => {
                const isVideo = item.evidence_filename?.toLowerCase().endsWith('.mp4');
                const isContradiction = item.is_contradiction || item.sinkhorn_cost > 1.15;
                const isSelected = selectedIndex === idx;

                return (
                  <tr 
                    key={idx}
                    onClick={() => onSelectEvidence && onSelectEvidence(idx)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected 
                        ? 'bg-blue-950/50 border-l-4 border-l-blue-500' 
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                    
                    {/* Case ID Badge */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-bold">
                        #{item.case_id || 'CASE-001'}
                      </span>
                    </td>

                    {/* File Media */}
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      <div className="flex items-center gap-2">
                        {isVideo ? (
                          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <FileVideo size={15} />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <FileImage size={15} />
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-xs text-white truncate max-w-[150px]" title={item.evidence_filename}>
                            {item.evidence_filename}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {isVideo ? 'CCTV Video' : 'Crime Scene Image'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Witness Statement */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <p className="truncate max-w-[280px] text-xs" title={item.statement_text}>
                        "{item.statement_text}"
                      </p>
                    </td>

                    {/* Mathematical Cost */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        isContradiction 
                          ? 'bg-red-950/60 text-red-400 border border-red-800/80' 
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                      }`}>
                        {typeof item.sinkhorn_cost === 'number' ? item.sinkhorn_cost.toFixed(4) : item.sinkhorn_cost}
                      </span>
                    </td>

                    {/* Verdict */}
                    <td className="py-3.5 px-4 text-center">
                      {isContradiction ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800">
                          <AlertTriangle size={12} className="text-red-400" /> Contradiction
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 size={12} className="text-emerald-400" /> Congruent
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-[11px] font-mono text-slate-400">
                      {item.timestamp || 'Recorded'}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvidence && onSelectEvidence(idx);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-300 border border-slate-700 transition-colors flex items-center gap-1"
                          title="View OT Matrix for this item"
                        >
                          <Layers size={12} /> Heatmap
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDossier(item);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1"
                          title="Open Full Forensic Audit Dossier"
                        >
                          <Eye size={12} /> Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Deep Investigation */}
      <EvidenceModal 
        evidence={modalEvidence} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
