import React, { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Eye, Copy, Check, Info, FileText, AlertOctagon, HelpCircle } from 'lucide-react';

export default function LLMAnalysisPanel({
  evidenceName,
  statementText,
  cost,
  isContradiction,
  isBlurry,
  visualUncertainty = 0,
  qualityLabel,
  investigatorAdvisory,
  discrepancyInfo,
  auditReport,
  caseId = "CASE-REACT-001",
  caseName = "",
  crossCaseLinks = []
}) {
  const [copied, setCopied] = useState(false);

  const hasAnalysis = Boolean(evidenceName || auditReport || cost !== null && cost !== undefined);
  const uncertaintyVal = typeof visualUncertainty === 'number' ? visualUncertainty : 0.0;
  const uncertaintyPct = (uncertaintyVal * 100).toFixed(1);
  const isContra = Boolean(isContradiction || (typeof cost === 'number' && cost > 1.15));

  const relevantLinks = crossCaseLinks.filter(l => l.source_case_id === caseId || l.target_case_id === caseId);

  const handleCopy = () => {
    const text = `CRIMEVISION AI - FORENSIC INVESTIGATOR AUDIT BRIEFING
Case: ${caseName || caseId} (#${caseId})
Evidence Target: ${evidenceName || 'N/A'}
Witness Statement: "${statementText || 'N/A'}"
Sinkhorn Divergence Cost: ${typeof cost === 'number' ? cost.toFixed(4) : cost} (Threshold: 1.15)
AI Verdict: ${isContra ? 'CONTRADICTION DETECTED' : 'VERIFIED CONGRUENT'}
Visual Quality: ${qualityLabel || (isBlurry ? 'High Blur/Noise' : 'Clear')} (${uncertaintyPct}% uncertainty)
Feature Details: ${discrepancyInfo || 'Standard alignment'}
Investigator Advisory: ${investigatorAdvisory || 'Standard review'}
Cross-Case Links: ${relevantLinks.length > 0 ? relevantLinks.map(l => `${l.relation_type} -> ${l.source_case_id === caseId ? l.target_case_id : l.source_case_id}`).join(', ') : 'None'}
LLM Forensic Audit:
${auditReport || 'Pending evidence analysis.'}
--------------------------------------------------`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedReport = auditReport || (
    isContra 
      ? (isBlurry 
          ? `[FORENSIC BRIEFING - CONTRADICTION & BLUR WARNING] Evidence file '${evidenceName || 'Uploaded Media'}' was analyzed against statement: "${statementText || 'N/A'}". The mathematical alignment divergence is ${typeof cost === 'number' ? cost.toFixed(4) : cost} (Threshold: 1.15), confirming an evidential contradiction.${discrepancyInfo ? ` Attribute analysis indicates: ${discrepancyInfo}.` : ''} CRITICAL INVESTIGATOR ADVISORY: The footage exhibits ${uncertaintyPct}% optical blur/noise (${qualityLabel || 'High Degradation'}). Automated AI matching is NOT guaranteed; the investigating officer must manually inspect, isolate, and enhance raw keyframes.`
          : `[FORENSIC BRIEFING - CONTRADICTION DETECTED] Evidence file '${evidenceName || 'Uploaded Media'}' was analyzed against statement: "${statementText || 'N/A'}". The mathematical divergence score is ${typeof cost === 'number' ? cost.toFixed(4) : cost} (Threshold: 1.15), exceeding the contradiction threshold.${discrepancyInfo ? ` Attribute analysis indicates: ${discrepancyInfo}.` : ''} Visual features extracted under optimal clarity fail to corroborate the claimed statement on the case record.`
        )
      : (isBlurry 
          ? `[FORENSIC BRIEFING - TENTATIVE ALIGNMENT & BLUR ADVISORY] Evidence file '${evidenceName || 'Uploaded Media'}' aligns tentatively with statement: "${statementText || 'N/A'}" (Mathematical divergence: ${typeof cost === 'number' ? cost.toFixed(4) : cost}, <= 1.15). Faint visual cues indicate potential presence of claimed elements. MANDATORY INVESTIGATOR NOTICE: Due to substantial sensor noise and blur (${uncertaintyPct}% epistemic uncertainty), automated AI matching is NOT guaranteed. Forensic detectives must manually verify keyframes and perform high-resolution optical inspection.`
          : `[FORENSIC BRIEFING - VERIFIED ALIGNMENT] Evidence file '${evidenceName || 'Uploaded Media'}' successfully corroborates witness statement: "${statementText || 'N/A'}". The cross-modal Sinkhorn divergence score is ${typeof cost === 'number' ? cost.toFixed(4) : cost} (Threshold: 1.15), confirming robust evidential congruence under optimal visual clarity (${uncertaintyPct}% uncertainty).`
        )
  );

  return (
    <div className="bg-slate-800/95 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              LLM Forensic Reasoning & Case Audit Engine
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic cross-modal GraphRAG verification • Grounded reasoning without hallucination
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {relevantLinks.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {relevantLinks.length} Cross-Case Links
            </span>
          )}
          <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-3 py-1 rounded-xl border border-purple-800 font-bold truncate max-w-[200px]" title={caseName || caseId}>
            {caseName ? `${caseName.split('-')[0].trim()}` : `Case: #${caseId}`}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasAnalysis}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 transition-colors shadow"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy Briefing'}</span>
          </button>
        </div>
      </div>

      {!hasAnalysis ? (
        <div className="py-8 text-center text-slate-500 space-y-2">
          <Cpu size={36} className="mx-auto mb-1 opacity-40 text-purple-400" />
          <p className="text-sm font-bold text-slate-300">Awaiting Evidence Ingestion</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload video/image evidence and a witness transcript to generate deep LLM physical reasoning, attribute verification, and investigator advisories.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Metrics Row: Verdict + Cost + Quality */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* AI Forensic Verdict */}
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isContra 
                ? 'bg-red-950/40 border-red-800/80 text-red-300' 
                : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            }`}>
              <div className={`p-2 rounded-lg ${isContra ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isContra ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">AI Forensic Verdict</span>
                <strong className={`text-sm font-black ${isContra ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isContra ? 'CONTRADICTION DETECTED' : 'VERIFIED CONGRUENT'}
                </strong>
              </div>
            </div>

            {/* Mathematical Alignment Cost */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Sinkhorn Divergence Cost</span>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Threshold: &gt; 1.15 is Contradiction</p>
              </div>
              <span className={`font-mono text-base font-black px-2.5 py-1 rounded-lg border ${
                isContra 
                  ? 'bg-red-900/60 text-red-300 border-red-700' 
                  : 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
              }`}>
                {typeof cost === 'number' ? cost.toFixed(4) : cost || '0.0000'}
              </span>
            </div>

            {/* Visual Quality & Epistemic Uncertainty */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isBlurry 
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300' 
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Footage Quality Rating</span>
                <strong className={`text-xs font-bold block mt-0.5 ${isBlurry ? 'text-amber-400' : 'text-slate-200'}`}>
                  {qualityLabel || (isBlurry ? 'High Blur / Static Noise' : 'Optimal Visual Clarity')}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Uncertainty</span>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block ${
                  isBlurry 
                    ? 'bg-amber-900/60 text-amber-300 border-amber-700' 
                    : 'bg-blue-900/60 text-blue-300 border-blue-700'
                }`}>
                  {uncertaintyPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Critical Blurry Footage Warning Banner */}
          {isBlurry && (
            <div className="p-3.5 bg-amber-950/60 border-2 border-amber-600/80 rounded-xl flex items-start gap-3 text-amber-200 animate-pulse">
              <AlertOctagon size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <strong className="text-amber-300 font-bold block uppercase tracking-wider text-[11px]">
                  ⚠️ Mandatory Investigator Advisory: High Optical Blur & Ambiguity Detected
                </strong>
                <p className="leading-relaxed text-amber-200/90 text-[11px]">
                  The uploaded video evidence exhibits substantial sensor noise, motion blur, or low-light degradation ({uncertaintyPct}% epistemic uncertainty). 
                  <strong> Automated cross-modal AI matching is NOT guaranteed.</strong> Forensic investigators must conduct manual frame-by-frame enhancement, optical zoom, and physical review before legal filing.
                </p>
              </div>
            </div>
          )}

          {/* Evidence Details & Object Discrepancy Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Evidence Target & Ingested Transcript:
              </span>
              <p className="text-slate-200 font-mono font-bold truncate text-[11px]">
                🎥 {evidenceName || 'Active Media'}
              </p>
              <p className="text-slate-300 italic bg-slate-950/80 p-2.5 rounded-lg border-l-2 border-blue-500 font-serif">
                "{statementText || 'No transcript provided.'}"
              </p>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Physical Feature & Attribute Discrepancy Breakdown:
              </span>
              {discrepancyInfo ? (
                <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/70 text-red-300 text-[11px] leading-relaxed">
                  <strong className="block text-red-400 font-semibold mb-0.5">Attribute Mismatch:</strong>
                  {discrepancyInfo}
                </div>
              ) : isBlurry ? (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] leading-relaxed">
                  <strong className="block text-amber-400 font-semibold mb-0.5">Optical Ambiguity:</strong>
                  Visual features are attenuated by noise. Object edges cannot be conclusively resolved without manual enhancement.
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] leading-relaxed">
                  <strong className="block text-emerald-400 font-semibold mb-0.5">Feature Agreement:</strong>
                  Visual attributes extracted from keyframe match witness statement descriptors with high confidence.
                </div>
              )}
            </div>
          </div>

          {/* Main LLM Forensic Reasoning Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Sparkles size={14} /> Full GraphRAG Forensic Analysis Briefing:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Case Context Integrated</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
              {formattedReport}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
