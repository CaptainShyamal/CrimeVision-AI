import React, { useState } from 'react';
import { Plus, X, FolderPlus, Sparkles, Shield, Bookmark, Tag } from 'lucide-react';

export default function CreateCaseModal({ isOpen, onClose, onCreateCase, existingCount = 0 }) {
  const nextNumber = existingCount + 1;
  const defaultId = `CASE-2026-${String(nextNumber).padStart(3, '0')}`;
  const char = String.fromCharCode(64 + (nextNumber > 26 ? 26 : nextNumber));
  
  const [caseId, setCaseId] = useState(defaultId);
  const [caseName, setCaseName] = useState(`Case ${char} - Forensic Investigation`);
  const [category, setCategory] = useState("Surveillance & Robbery");
  const [description, setDescription] = useState("Evidence and suspect tracking for incident perimeter.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize default IDs when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const num = existingCount + 1;
      const letter = String.fromCharCode(64 + (num > 26 ? 26 : num));
      setCaseId(`CASE-2026-${String(num).padStart(3, '0')}`);
      setCaseName(`Case ${letter} - Forensic Investigation`);
      setDescription("Evidential fusion and cross-modal timeline reconstruction.");
    }
  }, [isOpen, existingCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseId.trim() || !caseName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateCase({
        case_id: caseId.trim(),
        name: caseName.trim(),
        category: category.trim(),
        description: description.trim()
      });
      onClose();
    } catch (err) {
      console.error("Error creating case:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (title, cat, desc) => {
    setCaseName(title);
    setCategory(cat);
    setDescription(desc);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
              <FolderPlus size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Create New Forensic Case
              </h2>
              <p className="text-xs text-slate-400">
                Initialize a separate Case graph & evidence file in Neo4j
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

        {/* Quick Preset Buttons */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" /> Quick Case Presets:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset("Case B - North Harbor Storage", "Commercial Robbery", "Surveillance tracking of warehouse breach and suspect vehicle.")}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-200 text-left transition-colors"
            >
              🏢 <strong className="block text-slate-100 font-bold">Case B</strong> Harbor Storage
            </button>
            <button
              type="button"
              onClick={() => applyPreset("Case C - Bank Vault Perimeter", "Armed Heist", "Multi-camera CCTV analysis of armored transport robbery.")}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-200 text-left transition-colors"
            >
              🏦 <strong className="block text-slate-100 font-bold">Case C</strong> Bank Heist
            </button>
            <button
              type="button"
              onClick={() => applyPreset("Case D - Highway Hit & Run", "Vehicular Forensics", "License plate and color classification of fleeing sedan.")}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-200 text-left transition-colors"
            >
              🚗 <strong className="block text-slate-100 font-bold">Case D</strong> Hit & Run
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Case ID */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Case Identifier (ID)
              </label>
              <input
                type="text"
                required
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="e.g. CASE-2026-002"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Forensics Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Surveillance & Robbery">Surveillance & Robbery</option>
                <option value="Commercial Robbery">Commercial Robbery</option>
                <option value="Homicide Forensics">Homicide Forensics</option>
                <option value="Vehicular Forensics">Vehicular Forensics</option>
                <option value="Ballistics & Weapons">Ballistics & Weapons</option>
                <option value="Cyber & Digital Forensics">Cyber & Digital Forensics</option>
              </select>
            </div>
          </div>

          {/* Case Name / Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Case Title / Investigation Name
            </label>
            <input
              type="text"
              required
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="e.g. Case B - North Harbor Storage Facility"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Case Briefing / Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a summary of the case scope and target evidence..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'Creating Case...' : 'Create Case & Open Tab'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
