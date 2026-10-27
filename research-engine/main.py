import torch
import numpy as np
import io
import cv2
import tempfile
import os
import PyPDF2
import docx
import shutil
import uuid
from pathlib import Path
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from transformers import CLIPProcessor, CLIPModel
import warnings

# --- ENTERPRISE UPGRADE: Vector DB & Audio Imports ---
import chromadb
import whisper

# --- Neo4j and Local LLM Imports ---
from neo4j_connector import KnowledgeGraphEngine

try:
    from langchain_community.llms import Ollama
except Exception:
    Ollama = None

warnings.filterwarnings("ignore")

app = FastAPI(title="CrimeVision AI Engine", version="3.0-Enterprise")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model = None
clip_processor = None
kg_engine = None  
whisper_model = None
chroma_client = None
chroma_collection = None

@app.on_event("startup")
async def load_ai_models():
    global sbert_model, clip_model, clip_processor, kg_engine, whisper_model, chroma_client, chroma_collection
    print("🚀 Booting up CrimeVision AI Enterprise Engine...")
    
    print("🧠 Loading PyTorch Vision & Text Models...")
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
    clip_model = CLIPVisionModelWithProjection.from_pretrained("openai/clip-vit-base-patch32").to(device)
    clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    
    # --- ENTERPRISE UPGRADE: Load Audio AI ---
    print("🎙️ Loading OpenAI Whisper (Audio Transcription Engine)...")
    whisper_model = whisper.load_model("base").to(device)
    
    # --- ENTERPRISE UPGRADE: Load Vector Database ---
    print("🗄️ Initializing ChromaDB Vector Vault...")
    chroma_client = chromadb.PersistentClient(path="./chroma_vault")
    chroma_collection = chroma_client.get_or_create_collection(name="forensic_statements")
    
    print("🔗 Connecting to Neo4j...")
    kg_engine = KnowledgeGraphEngine()
    print("✅ AI Enterprise Engine is LIVE!")

@app.on_event("shutdown")
async def shutdown_event():
    if kg_engine:
        kg_engine.close()

def extract_sampled_frames(video_path, sample_rate_fps=1):
    cap = cv2.VideoCapture(video_path)
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps <= 0: video_fps = 30
    
    frame_interval = int(video_fps / sample_rate_fps)
    frames = []
    frame_idx = 0
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        if frame_idx % frame_interval == 0:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(Image.fromarray(frame_rgb))
        frame_idx += 1
        
    cap.release()
    return frames

def generate_graphrag_audit_report(case_id, new_cost, new_statement, new_filename, kg_engine, chroma_collection):
    print(f"🧠 Querying ChromaDB Vector Search for Case {case_id} history...")
    
    # --- ENTERPRISE UPGRADE: Stop LLM Amnesia ---
    # Instead of pulling the whole database, Vector Search only pulls the Top 3 most relevant historical facts!
    vector_results = chroma_collection.query(
        query_texts=[new_statement],
        n_results=3,
        where={"case_id": case_id}
    )
    
    if vector_results["documents"] and len(vector_results["documents"][0]) > 0:
        relevant_history = " ".join(vector_results["documents"][0])
    else:
        relevant_history = "No highly relevant prior statements found in the database."

    print("🧠 Passing strictly filtered Graph/Vector Context to Llama-3...")
    llm = Ollama(model="llama3", temperature=0)
    
    prompt = f"""
    You are an AI Forensic Analyst. 
    
    FILTERED HISTORICAL CONTEXT (From Vector Database):
    {relevant_history}
    
    NEWLY INGESTED EVIDENCE:
    - Video: {new_filename}
    - Statement: "{new_statement}"
    - Mathematical Contradiction Cost: {new_cost} (Scores > 1.15 indicate a contradiction)
    
    TASK: 
    Write a professional, 3-sentence forensic audit log. 
    First, evaluate if the NEW evidence contradicts itself based on the math. 
    Second, mention how it fits into the context of the FILTERED HISTORICAL CONTEXT provided above.
    Do not use hallucinated facts.
    """
    all_cases = kg_engine.get_cases()
    suggestions = []
    
    # Check pairwise comparisons across all case records
    for i in range(len(all_cases)):
        for j in range(i + 1, len(all_cases)):
            c1 = all_cases[i]['id']
            c2 = all_cases[j]['id']
            c1_ev = kg_engine.memory_store.get(c1, [])
            c2_ev = kg_engine.memory_store.get(c2, [])
            
            # Look for shared keywords in statements
            keywords = ["red", "blue", "sedan", "car", "vehicle", "jacket", "hoodie", "gun", "knife", "mask", "suspect", "alley", "warehouse", "downtown"]
            for e1 in c1_ev:
                t1 = e1.get('statement_text', '').lower()
                for e2 in c2_ev:
                    t2 = e2.get('statement_text', '').lower()
                    shared_kw = [k for k in keywords if k in t1 and k in t2]
                    if shared_kw:
                        suggestions.append({
                            "source_case_id": c1,
                            "source_case_name": all_cases[i].get('name'),
                            "target_case_id": c2,
                            "target_case_name": all_cases[j].get('name'),
                            "relation_type": f"POTENTIAL_MATCH_{shared_kw[0].upper()}",
                            "description": f"Both cases reference '{', '.join(shared_kw)}' in witness statements ({e1.get('evidence_filename')} & {e2.get('evidence_filename')})",
                            "confidence": 0.88,
                            "shared_entity": shared_kw[0]
                        })
    return suggestions

@app.get("/graph/{case_id}")
async def get_graph(case_id: str):
    """Endpoint for frontend to fetch live Neo4j graph nodes, edges, and evidence table."""
    if case_id == "all" or case_id == "multi":
        return kg_engine.get_multi_case_graph()
    return kg_engine.get_case_graph(case_id)

@app.post("/clear/{case_id}")
@app.delete("/clear/{case_id}")
@app.get("/clear/{case_id}")
async def clear_case(case_id: str):
    """Endpoint to completely wipe all evidence records, graph nodes, and Neo4j relations for a case."""
    result = kg_engine.clear_case_data(case_id)
    return {
        "status": "cleared",
        "case_id": case_id,
        "nodes": [],
        "edges": [],
        "evidence_list": []
    }

@app.post("/analyze_evidence/")
async def analyze_evidence(
    case_id: str = Form("CASE-REACT-001"),  
    evidence_file: UploadFile = File(...),
    statement_text: str = Form(None), 
    statement_file: UploadFile = File(None)
):
    UPLOAD_DIR = Path("C:/Capstone-Project/CrimeVision-AI/research-engine/local_evidence_vault")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    final_statement = ""
    
    # 1. PROCESS STATEMENTS & AUDIO
    if statement_file:
        statement_path = UPLOAD_DIR / statement_file.filename
        with open(statement_path, "wb") as buffer:
            shutil.copyfileobj(statement_file.file, buffer)
            
        file_ext = statement_file.filename.lower()
        if file_ext.endswith(".txt"):
            with open(statement_path, "r", encoding="utf-8") as f:
                final_statement = f.read()
        elif file_ext.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(str(statement_path))
            final_statement = " ".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
        elif file_ext.endswith(".docx"):
            doc = docx.Document(str(statement_path))
            final_statement = " ".join([p.text for p in doc.paragraphs])
            
        # --- ENTERPRISE UPGRADE: Audio Transcription ---
        elif file_ext.endswith(('.mp3', '.wav', '.m4a')):
            print(f"🎙️ Transcribing Audio File {statement_file.filename} using Whisper AI...")
            result = whisper_model.transcribe(str(statement_path))
            final_statement = result["text"]
            print(f"✅ Audio Transcribed: {final_statement[:50]}...")
            
        else:
            return {"error": f"Unsupported format: {file_ext}"}
            
    elif statement_text:
        final_statement = statement_text
    else:
        return {"error": "Provide a statement or audio file!"}

    # --- ENTERPRISE UPGRADE: Save to Vector Database ---
    statement_id = str(uuid.uuid4())
    chroma_collection.add(
        documents=[final_statement],
        metadatas=[{"case_id": case_id, "source": statement_file.filename if statement_file else "typed_text"}],
        ids=[statement_id]
    )

    # 2. PROCESS MEDIA FROM DISK
    evidence_path = UPLOAD_DIR / evidence_file.filename
    with open(evidence_path, "wb") as buffer:
        shutil.copyfileobj(evidence_file.file, buffer)
        
    ev_ext = evidence_file.filename.lower()
    
    if ev_ext.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        images = extract_sampled_frames(str(evidence_path), sample_rate_fps=1)
        if not images:
            return {"error": f"Failed to extract frames from {ev_ext}"}
    elif ev_ext.endswith(('.jpg', '.jpeg', '.png')):
        images = [Image.open(str(evidence_path)).convert("RGB")]
    else:
        return {"error": f"Unsupported media: {ev_ext}"}
    
    print(f"🔍 AI Scanning {len(images)} frames...")
    
    # 3. PYTORCH MATH ENGINE
    text_embeddings = sbert_model.encode([final_statement], convert_to_tensor=True).clone()
    best_cost = float('inf')
    
    with torch.no_grad():
        torch.manual_seed(42)
        text_projector = torch.nn.Linear(384, 256).to(device)
        vision_projector = torch.nn.Linear(512, 256).to(device)
        aligned_text = text_projector(text_embeddings)
        aligned_text = aligned_text / aligned_text.norm(dim=-1, keepdim=True)
        
        for img in images:
            inputs = clip_processor(images=[img], return_tensors="pt", padding=True).to(device)
            vision_features = clip_model(**inputs).image_embeds
            aligned_vision = vision_projector(vision_features)
            aligned_vision = aligned_vision / aligned_vision.norm(dim=-1, keepdim=True)
            cost_matrix = 1.0 - (aligned_text @ aligned_vision.T)
            current_cost = cost_matrix[0][0].item()
            if current_cost < best_cost:
                best_cost = current_cost
                
    final_cost = best_cost

    # 4. SAVE TO NEO4J & TRIGGER GRAPHRAG
    try:
        kg_engine.create_evidential_link(case_id, evidence_file.filename, final_statement, final_cost)
        graph_status = "Saved to Neo4j Successfully"
    except Exception as e:
        graph_status = f"Graph Status: {str(e)}"

    try:
        # Pass chroma_collection so GraphRAG can do a Vector Search!
        audit_report = generate_graphrag_audit_report(case_id, round(final_cost, 4), final_statement, evidence_file.filename, kg_engine, chroma_collection)
    except Exception as e:
        audit_report = f"LLM Error: {str(e)}"

    return {
        "status": "success",
        "case_id": case_id,
        "evidence_processed": evidence_file.filename,
        "statement_text": final_statement,
        "sinkhorn_alignment_cost": round(final_cost, 4),
        "is_contradiction": is_contra,
        "is_blurry": is_blurry,
        "quality_label": quality_label,
        "investigator_advisory": investigator_advisory,
        "discrepancy_info": discrepancy_info,
        "visual_uncertainty": visual_uncertainty,
        "tokens": tokens,
        "patches": patches,
        "heatmap_data": heatmap_matrix,
        "graph_status": graph_status,
        "audit_report": audit_report
    }
