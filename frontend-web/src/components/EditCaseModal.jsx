import React, { useState, useEffect } from 'react';
import { Edit3, X, Check, Folder } from 'lucide-react';

export default function EditCaseModal({ isOpen, onClose, caseItem, onSaveCase }) {
  const [caseName, setCaseName] = useState("");
  const [category, setCategory] = useState("Surveillance & Robbery");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (caseItem) {
      setCaseName(caseItem.name || `Case ${caseItem.id}`);
      setCategory(caseItem.category || "General Forensics");
      setDescription(caseItem.description || "");
    }
  }, [caseItem, isOpen]);

  if (!isOpen || !caseItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveCase(caseItem.id, {
        name: caseName.trim(),
        category: category.trim(),
        description: description.trim()
      });
      onClose();
    } catch (err) {
      console.error("Error updating case:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Edit Case Details</h3>
              <p className="text-[11px] text-slate-400 font-mono">Case ID: #{caseItem.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Case Title / Tab Name
            </label>
            <input
              type="text"
              required
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="e.g. Case A - Downtown Bank Surveillance"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Forensic Category
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

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Case Description / Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of target evidence and crime scene..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              <Check size={13} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
