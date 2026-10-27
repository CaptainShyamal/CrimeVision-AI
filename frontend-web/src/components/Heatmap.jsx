import React, { useState } from 'react';
import { Layers, Sparkles, HelpCircle, Eye, UploadCloud } from 'lucide-react';

export default function Heatmap({ data = [], tokens = [], patches = [], visualUncertainty, evidenceName, cost }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const hasData = data && data.length > 0 && tokens && tokens.length > 0;
  const uncertainty = typeof visualUncertainty === 'number' ? visualUncertainty : 0.0;
  const isContra = cost !== undefined && cost !== null && (cost > 1.15);
  const isHighUncertainty = uncertainty > 0.5;

  const badgeColor = isContra 
    ? "bg-red-950/80 text-red-300 border border-red-700"
    : isHighUncertainty
      ? "bg-amber-950/80 text-amber-300 border border-amber-700"
      : "bg-emerald-950/80 text-emerald-300 border border-emerald-700";

  const badgeText = isContra
    ? "⚠️ Contradiction Flagged (> 1.15)"
    : isHighUncertainty
      ? "High Visual Doubt (Dampened)"
      : "✅ Verified Congruent (≤ 1.15)";

  return (
    <div className="bg-slate-800/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              Evidential Optimal Transport Alignment Matrix
            </h3>
            {evidenceName ? (
              <p className="text-[11px] text-blue-300 font-mono">Target: <span className="font-bold">{evidenceName}</span></p>
            ) : (
              <p className="text-[11px] text-slate-400">Awaiting media & statement ingestion</p>
            )}
          </div>
        </div>
        {hasData && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>
      
      {/* Info Banner */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Cross-referencing witness text tokens with CCTV spatial patches.</span>
        </div>
        {hasData && (
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Visual Uncertainty: <strong className="text-amber-400">{(uncertainty * 100).toFixed(1)}%</strong></span>
            {cost !== undefined && cost !== null && (
              <span>Sinkhorn Score: <strong className={isContra ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{typeof cost === 'number' ? cost.toFixed(4) : cost}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Table or Empty State */}
      {!hasData ? (
        <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-10 flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
            <Layers size={32} />
          </div>
          <p className="text-sm font-bold text-slate-300">No Optimal Transport Matrix Generated Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Upload digital evidence and a transcript to compute Dirichlet epistemic uncertainty & Sinkhorn cross-modal divergence.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 font-mono text-[11px] text-slate-400">
                <th className="p-2.5 border border-slate-700/80 text-left font-semibold">Visual Zone / Token</th>
                {tokens.map((token, i) => (
                  <th key={i} className="p-2.5 border border-slate-700/80 font-mono text-xs font-bold text-blue-300 bg-slate-800/60">
                    {token}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-2.5 border border-slate-700/80 font-mono text-xs text-left text-slate-300 bg-slate-900/60 font-semibold">
                    {patches[i] || `Patch ${i + 1}`}
                  </td>
                  {row.map((val, j) => {
                    const normalizedVal = Math.min(Math.max(val, 0), 1.5);
                    const isHovered = hoveredCell && hoveredCell.row === i && hoveredCell.col === j;
                    
                    const cellBg = val > 1.15
                      ? `rgba(220, 38, 38, ${Math.min(0.85, Math.max(0.2, (val - 1.0) * 1.5))})`
                      : `rgba(16, 185, 129, ${Math.min(0.75, Math.max(0.15, (1.15 - val) * 1.2))})`;

                    return (
                      <td 
                        key={j} 
                        onMouseEnter={() => setHoveredCell({ row: i, col: j, val, token: tokens[j], patch: patches[i] })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`p-2.5 border border-slate-700/80 text-slate-100 font-mono font-bold text-xs cursor-pointer transition-all ${
                          isHovered ? 'ring-2 ring-blue-400 scale-105 z-10' : ''
                        }`}
                        style={{ backgroundColor: cellBg }}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hover Cell Inspector */}
      {hoveredCell && (
        <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300 flex items-center justify-between font-mono animate-fadeIn">
          <span>Patch: <strong className="text-white">{hoveredCell.patch}</strong> &harr; Token: <strong className="text-blue-300">"{hoveredCell.token}"</strong></span>
          <span>Alignment Cost: <strong className="text-amber-400">{hoveredCell.val.toFixed(3)}</strong></span>
        </div>
      )}
    </div>
  );
}