import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Layers, 
  Share2, 
  Folder, 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Network, 
  ChevronDown, 
  Edit2,
  Trash2, 
  Sparkles 
} from 'lucide-react';

// Distinct Vibrant Palette for Tabs
const TAB_COLORS = [
  {
    active: 'bg-sky-950/90 text-sky-200 border-sky-400 shadow-lg shadow-sky-500/25',
    inactive: 'bg-slate-950/70 hover:bg-sky-950/40 text-slate-300 border-slate-800 hover:border-sky-500/50',
    text: 'text-sky-400',
    icon: 'text-sky-400',
    badge: 'bg-sky-900/60 text-sky-300 border-sky-700'
  },
  {
    active: 'bg-emerald-950/90 text-emerald-200 border-emerald-400 shadow-lg shadow-emerald-500/25',
    inactive: 'bg-slate-950/70 hover:bg-emerald-950/40 text-slate-300 border-slate-800 hover:border-emerald-500/50',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
  },
  {
    active: 'bg-amber-950/90 text-amber-200 border-amber-400 shadow-lg shadow-amber-500/25',
    inactive: 'bg-slate-950/70 hover:bg-amber-950/40 text-slate-300 border-slate-800 hover:border-amber-500/50',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-700'
  },
  {
    active: 'bg-purple-950/90 text-purple-200 border-purple-400 shadow-lg shadow-purple-500/25',
    inactive: 'bg-slate-950/70 hover:bg-purple-950/40 text-slate-300 border-slate-800 hover:border-purple-500/50',
    text: 'text-purple-400',
    icon: 'text-purple-400',
    badge: 'bg-purple-900/60 text-purple-300 border-purple-700'
  },
  {
    active: 'bg-rose-950/90 text-rose-200 border-rose-400 shadow-lg shadow-rose-500/25',
    inactive: 'bg-slate-950/70 hover:bg-rose-950/40 text-slate-300 border-slate-800 hover:border-rose-500/50',
    text: 'text-rose-400',
    icon: 'text-rose-400',
    badge: 'bg-rose-900/60 text-rose-300 border-rose-700'
  },
  {
    active: 'bg-teal-950/90 text-teal-200 border-teal-400 shadow-lg shadow-teal-500/25',
    inactive: 'bg-slate-950/70 hover:bg-teal-950/40 text-slate-300 border-slate-800 hover:border-teal-500/50',
    text: 'text-teal-400',
    icon: 'text-teal-400',
    badge: 'bg-teal-900/60 text-teal-300 border-teal-700'
  }
];

export default function CaseTabBar({
  cases = [],
  openTabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab,
  onOpenNewCaseModal,
  onOpenCrossCaseModal,
  onEditCase,
  onDeleteCase,
  isMultiCaseView = false,
  onToggleMultiCaseView,
  crossCaseCount = 0
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full mb-5 relative z-40">
      {/* Tab Strip */}
      <div className="flex items-center justify-between bg-slate-900/95 border border-slate-800 rounded-2xl p-2 backdrop-blur-md shadow-2xl gap-2">
        
        {/* Left: Tabs List */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[calc(100%-190px)] md:max-w-[calc(100%-250px)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Multi-Case Global Graph Tab */}
          <button
            type="button"
            onClick={onToggleMultiCaseView}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 shrink-0 border select-none ${
              isMultiCaseView
                ? 'bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-purple-200 border-purple-400 shadow-lg shadow-purple-500/30'
                : 'bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 border-slate-800 hover:border-purple-500/50'
            }`}
            title="Open Unified Multi-Case Relational Graph (Case A + Case B + ...)"
          >
            <Network size={15} className={isMultiCaseView ? 'text-purple-300 animate-pulse' : 'text-purple-400'} />
            <span>🌐 Multi-Case Graph</span>
            {crossCaseCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {crossCaseCount}
              </span>
            )}
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-0.5 shrink-0" />

          {/* If no tabs open, prompt user */}
          {openTabs.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
              <span>No active case open.</span>
            </div>
          )}

          {/* Individual Colored Case Tabs */}
          {openTabs.map((caseItem, idx) => {
            const isActive = !isMultiCaseView && activeTabId === caseItem.id;
            const colorScheme = TAB_COLORS[idx % TAB_COLORS.length];
            const hasContradiction = caseItem.contradiction_count > 0;
            const evidenceCount = caseItem.evidence_count || 0;

            return (
              <div
                key={caseItem.id}
                onClick={() => onSelectTab(caseItem.id)}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 shrink-0 border select-none ${
                  isActive ? colorScheme.active : colorScheme.inactive
                }`}
              >
                {/* Case Icon & Name */}
                <div className="flex items-center gap-1.5 truncate">
                  {isActive ? (
                    <FolderOpen size={14} className={colorScheme.icon} />
                  ) : (
                    <Folder size={14} className="text-slate-400 group-hover:text-slate-200" />
                  )}
                  <span className="truncate max-w-[130px] md:max-w-[170px]" title={caseItem.name || `Case ${caseItem.id}`}>
                    {caseItem.name || `Case ${caseItem.id}`}
                  </span>
                </div>

                {/* Evidence Count Pill */}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono border ${colorScheme.badge}`}>
                  {evidenceCount}
                </span>

                {/* Contradiction Alert Dot */}
                {hasContradiction && (
                  <span 
                    className="w-2 h-2 rounded-full bg-red-500 animate-pulse" 
                    title={`${caseItem.contradiction_count} contradiction(s) detected`}
                  />
                )}

                {/* Quick Edit Case Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditCase) onEditCase(caseItem);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Rename / Edit Case Details"
                >
                  <Edit2 size={11} />
                </button>

                {/* Close Tab Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(caseItem.id);
                  }}
                  className="p-0.5 rounded-md text-slate-500 hover:text-red-300 hover:bg-red-950/60 transition-colors"
                  title="Close Tab"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* High-Contrast Distinct "New Case" Tab Button */}
          <button
            type="button"
            onClick={onOpenNewCaseModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black border border-emerald-200 text-xs transition-all shrink-0 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95"
            title="Create New Forensic Case Tab"
          >
            <Plus size={15} className="text-slate-950 stroke-[3]" />
            <span>New Case</span>
          </button>
        </div>

        {/* Right Actions & Visible Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Relate Cases Button */}
          <button
            type="button"
            onClick={onOpenCrossCaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-950/60 text-slate-200 hover:text-amber-300 border border-slate-700 hover:border-amber-600/80 text-xs font-bold transition-all shadow"
            title="Establish cross-case correlation (shared suspect, vehicle, weapon)"
          >
            <Share2 size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Relate Cases</span>
          </button>

          {/* Cases Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                dropdownOpen 
                  ? 'bg-slate-700 text-white border-blue-500' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="View all registered cases in Neo4j"
            >
              <Layers size={14} className="text-blue-400" />
              <span>Cases ({cases.length})</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Floating Popover */}
            {dropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-[100] backdrop-blur-xl animate-scaleUp space-y-1.5"
                style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.7))' }}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                  <span>Registered Case Files</span>
                  <span className="text-blue-400 font-mono">{cases.length} Total</span>
                </div>

                {cases.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No cases created yet. Click "+ Create Case" to begin.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1 p-1 scrollbar-thin">
                    {cases.map((c, idx) => {
                      const isOpen = openTabs.some(t => t.id === c.id);
                      const isCurrent = activeTabId === c.id && !isMultiCaseView;
                      const colorScheme = TAB_COLORS[idx % TAB_COLORS.length];

                      return (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors group cursor-pointer ${
                            isCurrent 
                              ? 'bg-slate-800 border border-slate-600' 
                              : 'hover:bg-slate-800/70 border border-transparent'
                          }`}
                          onClick={() => {
                            onSelectTab(c.id);
                            setDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Folder size={15} className={colorScheme.icon} />
                            <div className="truncate">
                              <p className="font-bold text-slate-100 truncate">{c.name || c.id}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                #{c.id} • {c.evidence_count || 0} Evidences
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit Case */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(false);
                                if (onEditCase) onEditCase(c);
                              }}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                              title="Edit Case"
                            >
                              <Edit2 size={12} />
                            </button>

                            {/* Delete Case */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCase(c.id);
                              }}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/60 rounded-lg transition-colors"
                              title="Delete case"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewCaseModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow"
                  >
                    <Plus size={14} /> Create New Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
