import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, FileVideo, FileText, Loader2, CheckCircle } from 'lucide-react';

export default function IngestionZone() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // This function catches the files when you drop them
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    // Look through the dropped files to separate video/image from text
    let evidenceFile = null;
    let statementFile = null;

    acceptedFiles.forEach(file => {
      if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
        evidenceFile = file;
      } else if (file.type === 'text/plain') {
        statementFile = file;
      }
    });

    if (!evidenceFile) {
      setUploadResult({ error: "Please include a video or image file!" });
      setIsUploading(false);
      return;
    }

    // Package the files to send to the FastAPI Research Engine
    const formData = new FormData();
    formData.append("evidence_file", evidenceFile);
    if (statementFile) {
      formData.append("statement_file", statementFile);
    } else {
      // Fallback if they didn't drop a text file
      formData.append("statement_text", "Default test statement from Drag and Drop.");
    }
    formData.append("case_id", "CASE-REACT-001");

    try {
      // Send the data to your port 8001 AI Engine
      const response = await axios.post("http://127.0.0.1:8001/analyze_evidence/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploadResult(response.data);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadResult({ error: "Failed to connect to AI Engine." });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
      <h3 className="text-lg font-bold text-slate-100 mb-4">Evidence Ingestion</h3>

      {/* The actual Drag and Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-slate-700/50 text-blue-400' : 'border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400'}`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center text-blue-400">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-semibold text-lg">AI Engine Processing...</p>
            <p className="text-sm mt-1">Extracting embeddings & calculating Sinkhorn cost</p>
          </div>
        ) : uploadResult?.status === "success" ? (
          <div className="flex flex-col items-center text-green-400 w-full text-center">
            <CheckCircle size={48} className="mb-4" />
            <p className="font-semibold text-lg">Analysis Complete!</p>
            <p className="text-sm mt-1 text-slate-300">Cost: <span className="font-bold text-white">{uploadResult.sinkhorn_alignment_cost}</span></p>
            <p className="text-xs mt-1 text-slate-400">{uploadResult.graph_status}</p>

            {/* NEW: Display the Llama-3 Audit Report */}
            {uploadResult.audit_report && (
              <div className="mt-4 p-4 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 text-sm text-left w-full shadow-inner">
                <strong className="text-blue-400 block mb-2 font-mono uppercase tracking-wider">⚖️ Llama-3 Audit Log:</strong>
                {uploadResult.audit_report}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud size={48} className="mb-4" />
            <p className="font-semibold text-lg">Drag & Drop Evidence Files</p>
            <p className="text-sm mt-1">Supports MP4 & JPG</p>
            {uploadResult?.error && (
              <p className="text-red-400 text-sm mt-4 font-bold">{uploadResult.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <div className="flex-1 bg-slate-700 p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-600">
          <FileVideo className="text-blue-400" />
          <span className="text-sm font-medium">Reset Zone</span>
        </div>
      </div>
    </div>
  );
}
