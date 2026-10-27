import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, FileVideo, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles, Wand2, RotateCcw } from 'lucide-react';

export default function IngestionZone({ 
  onUploadSuccess, 
  onClearAll, 
  resetTrigger, 
  caseId = "CASE-1", 
  caseName = "",
  evidenceList = []
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [customStatement, setCustomStatement] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeEvidenceName, setActiveEvidenceName] = useState(null);

  // Extract unique evidence filenames from this case's evidence list
  const existingEvidenceFilenames = Array.from(
    new Set(evidenceList.filter(e => e.case_id === caseId || !e.case_id).map(e => e.evidence_filename).filter(Boolean))
  );

  // Synchronize when parent triggers a global reset or changes active case
  React.useEffect(() => {
    setSelectedFile(null);
    setUploadResult(null);
    setCustomStatement("");
    setActiveEvidenceName(existingEvidenceFilenames[0] || null);
  }, [resetTrigger, caseId]);

  // Keep activeEvidenceName in sync if new evidence is added
  React.useEffect(() => {
    if (!activeEvidenceName && existingEvidenceFilenames.length > 0) {
      setActiveEvidenceName(existingEvidenceFilenames[0]);
    }
  }, [existingEvidenceFilenames, activeEvidenceName]);

  const processUpload = async (evidenceFileOrName, statementText = "") => {
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    const effectiveStatement = (statementText || customStatement || "").trim();

    let targetFilename = "surveillance_evidence.jpg";

    if (evidenceFileOrName instanceof File) {
      targetFilename = evidenceFileOrName.name;
      formData.append("evidence_file", evidenceFileOrName, evidenceFileOrName.name);
      setActiveEvidenceName(evidenceFileOrName.name);
    } else if (typeof evidenceFileOrName === 'string' && evidenceFileOrName) {
      targetFilename = evidenceFileOrName;
      // Re-use existing evidence target with synthetic canvas frame
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = targetFilename.includes('alleyway') ? '#1e1b4b' : '#0f172a';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Evidence: ${targetFilename}`, 20, 120);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const mockFile = new File([blob], targetFilename, { type: targetFilename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' });
      formData.append("evidence_file", mockFile, targetFilename);
      setSelectedFile(mockFile);
      setActiveEvidenceName(targetFilename);
    } else if (selectedFile) {
      targetFilename = selectedFile.name;
      formData.append("evidence_file", selectedFile, selectedFile.name);
      setActiveEvidenceName(selectedFile.name);
    } else if (activeEvidenceName) {
      targetFilename = activeEvidenceName;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Evidence: ${targetFilename}`, 20, 120);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const mockFile = new File([blob], targetFilename, { type: targetFilename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' });
      formData.append("evidence_file", mockFile, targetFilename);
      setSelectedFile(mockFile);
    } else {
      // Default fallback
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px sans-serif';
      ctx.fillText("CrimeVision Ingested Frame", 20, 120);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const mockFile = new File([blob], "cctv_sample.mp4", { type: 'video/mp4' });
      formData.append("evidence_file", mockFile, "cctv_sample.mp4");
      setSelectedFile(mockFile);
      setActiveEvidenceName("cctv_sample.mp4");
    }

    formData.append("statement_text", effectiveStatement || "Witness observed suspect moving near the scene perimeter.");
    formData.append("case_id", caseId);

    try {
      const response = await axios.post("http://127.0.0.1:8001/analyze_evidence/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploadResult(response.data);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({ error: "Failed to connect to AI Engine (port 8001). Verify research engine server is running." });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    let evidenceFile = null;
    let statementFile = null;

    acceptedFiles.forEach(file => {
      if (file.type.startsWith('video/') || file.type.startsWith('image/') || file.name.endsWith('.mp4') || file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.jpeg')) {
        evidenceFile = file;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        statementFile = file;
      }
    });

    if (evidenceFile) {
      setSelectedFile(evidenceFile);
      setActiveEvidenceName(evidenceFile.name);
      if (statementFile) {
        const text = await statementFile.text();
        setCustomStatement(text);
        processUpload(evidenceFile, text);
      } else if (customStatement.trim()) {
        processUpload(evidenceFile, customStatement);
      }
    } else if (statementFile) {
      const text = await statementFile.text();
      setCustomStatement(text);
    } else {
      setUploadResult({ error: "Please drop a video (.mp4) or image (.jpg/.png)." });
    }
  }, [customStatement]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleManualAnalyze = (e) => {
    e.preventDefault();
    if (!selectedFile && !activeEvidenceName && !customStatement.trim()) {
      setUploadResult({ error: "Please drop/select an evidence file or enter a witness statement." });
      return;
    }
    const target = selectedFile || activeEvidenceName || "cctv_sample.mp4";
    processUpload(target, customStatement);
  };

  const loadPreset = (statement, filename) => {
    setCustomStatement(statement);
    const targetFile = filename || selectedFile?.name || activeEvidenceName || "cctv_sample.mp4";
    
    // Create a mock canvas file for instant preset testing
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = targetFile.includes('alleyway') ? '#1e1b4b' : '#022c22';
    ctx.fillRect(0, 0, 320, 240);
    canvas.toBlob((blob) => {
      const mockFile = new File([blob], targetFile, { type: targetFile.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' });
      setSelectedFile(mockFile);
      setActiveEvidenceName(targetFile);
      processUpload(mockFile, statement);
    }, 'image/jpeg');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setActiveEvidenceName(null);
    setUploadResult(null);
    setCustomStatement("");
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className="bg-slate-800/95 backdrop-blur-md p-5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <UploadCloud size={18} />
          </div>
          Evidence Ingestion Engine
        </h3>
        <span className="text-[11px] font-mono text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800 truncate max-w-[170px]" title={caseName || caseId}>
          {caseName ? `${caseName.split('-')[0].trim()}` : `Case: #${caseId}`}
        </span>
      </div>

      {/* Existing Case Evidence Selector / Active Evidence Target */}
      {existingEvidenceFilenames.length > 0 && (
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <FileVideo size={12} className="text-blue-400" /> Evidence Target in Case:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {existingEvidenceFilenames.length} Uploaded
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {existingEvidenceFilenames.map((fn) => {
              const isTargetActive = (selectedFile?.name === fn) || (activeEvidenceName === fn);
              return (
                <button
                  key={fn}
                  type="button"
                  onClick={() => {
                    setActiveEvidenceName(fn);
                    // create canvas placeholder for selected target
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 240;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, 320, 240);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = '14px sans-serif';
                    ctx.fillText(`Evidence: ${fn}`, 20, 120);
                    canvas.toBlob((blob) => {
                      const mockFile = new File([blob], fn, { type: fn.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' });
                      setSelectedFile(mockFile);
                    }, 'image/jpeg');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all flex items-center gap-1 border truncate max-w-[180px] ${
                    isTargetActive
                      ? 'bg-blue-600/30 text-blue-200 border-blue-400 shadow-sm shadow-blue-500/30 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                  title={`Interrogate evidence: ${fn}`}
                >
                  <FileVideo size={11} className={isTargetActive ? 'text-blue-300' : 'text-slate-400'} />
                  <span className="truncate">{fn}</span>
                  {isTargetActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Quick Test Scenarios */}
      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Wand2 size={12} className="text-amber-400" /> Quick Forensic Test Presets:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => loadPreset("Suspect wore a dark black hoodie and fled east in a black SUV.", selectedFile?.name || activeEvidenceName || "cctv_entrance_cam1.mp4")}
            disabled={isUploading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-left rounded-lg border border-slate-700 text-[11px] text-slate-200 transition-colors truncate"
            title="Load Congruent Statement (Green Graph Edge)"
          >
            🟢 <span className="font-semibold text-emerald-400">Congruent:</span> Dark SUV & Hoodie
          </button>
          <button
            type="button"
            onClick={() => loadPreset("Suspect was wearing a bright neon yellow raincoat and riding a red bicycle.", selectedFile?.name || activeEvidenceName || "cctv_entrance_cam1.mp4")}
            disabled={isUploading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-left rounded-lg border border-slate-700 text-[11px] text-slate-200 transition-colors truncate"
            title="Load Contradicting Statement (Red Graph Edge)"
          >
            🔴 <span className="font-semibold text-red-400">Contradict:</span> Yellow Coat & Bike
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer text-center
          ${isDragActive 
            ? 'border-blue-500 bg-blue-950/30 text-blue-400' 
            : 'border-slate-600 bg-slate-900/50 text-slate-400 hover:border-blue-500 hover:text-blue-400'}`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center text-blue-400 py-3">
            <Loader2 className="animate-spin mb-2" size={36} />
            <p className="font-bold text-sm text-slate-100">AI Evidential Fusion Computing...</p>
            <p className="text-[11px] text-slate-400 mt-1">Extracting CLIP features & updating Neo4j Graph</p>
          </div>
        ) : (selectedFile || activeEvidenceName) ? (
          <div className="flex flex-col items-center py-1 text-slate-200">
            <FileVideo className="text-blue-400 mb-1.5" size={32} />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">Target</span>
              <p className="text-xs font-bold truncate max-w-[200px]">{selectedFile?.name || activeEvidenceName}</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Type question/statement below & click Analyze (or drop new evidence)</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <UploadCloud size={32} className="mb-1.5 text-blue-400" />
            <p className="font-bold text-xs text-slate-200">Drag & Drop Evidence (MP4 / JPG / PNG)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Or browse your computer</p>
          </div>
        )}
      </div>

      {/* Statement Input Form */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span>Witness Statement / Interrogation Transcript:</span>
          <span className="text-slate-500 font-normal text-[10px]">Type or paste text</span>
        </label>
        <textarea
          value={customStatement}
          onChange={(e) => setCustomStatement(e.target.value)}
          placeholder="e.g. Witness stated suspect arrived at 22:15 wearing dark jacket."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleManualAnalyze}
          disabled={isUploading}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            isUploading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
          }`}
        >
          <Sparkles size={14} /> Run Evidential Analysis
        </button>
        <button
          onClick={handleReset}
          className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
          title="Reset form"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Result feedback */}
      {uploadResult?.error ? (
        <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
          <span>{uploadResult.error}</span>
        </div>
      ) : uploadResult?.status === "success" ? (
        (() => {
          const isContra = uploadResult.is_contradiction || uploadResult.sinkhorn_alignment_cost > 1.15;
          return (
            <div className={`p-4 rounded-2xl border space-y-3 text-xs transition-all shadow-xl ${
              isContra 
                ? 'bg-red-950/40 border-red-800/80 shadow-red-950/20' 
                : 'bg-emerald-950/40 border-emerald-800/80 shadow-emerald-950/20'
            }`}>
              {/* Verdict Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded-lg ${isContra ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {isContra ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">AI Forensic Verdict</span>
                    <strong className={`text-sm font-black tracking-tight ${isContra ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isContra ? 'CONTRADICTION DETECTED' : 'VERIFIED CONGRUENT'}
                    </strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Alignment Cost</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block ${
                    isContra 
                      ? 'bg-red-900/60 text-red-300 border-red-700' 
                      : 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                  }`}>
                    {typeof uploadResult.sinkhorn_alignment_cost === 'number' 
                      ? uploadResult.sinkhorn_alignment_cost.toFixed(4) 
                      : uploadResult.sinkhorn_alignment_cost}
                  </span>
                </div>
              </div>

              {/* Evidence & Statement Cross-Modal Matching Summary */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <FileVideo size={13} className="text-blue-400" /> Evidence Target:
                  </span>
                  <span className="text-slate-200 font-mono font-bold truncate max-w-[180px]" title={uploadResult.evidence_processed}>
                    {uploadResult.evidence_processed}
                  </span>
                </div>

                <div className="text-[11px] space-y-1">
                  <span className="text-slate-400 font-semibold block">Ingested Statement:</span>
                  <p className="text-slate-200 italic bg-slate-900/80 p-2 rounded-lg border-l-2 border-blue-500 font-serif">
                    "{uploadResult.statement_text}"
                  </p>
                </div>
              </div>

              {/* LLM GraphRAG Audit Output */}
              {uploadResult.audit_report && (
                <div className="text-slate-300 bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-blue-400 font-mono uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles size={12} /> GraphRAG Forensic Analysis:
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">Synced to Neo4j</span>
                  </div>
                  <p className="text-slate-300">{uploadResult.audit_report}</p>
                </div>
              )}
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
