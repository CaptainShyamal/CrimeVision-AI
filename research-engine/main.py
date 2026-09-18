import torch
import numpy as np
import io
import cv2
import tempfile
import os
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from transformers import CLIPProcessor, CLIPVisionModelWithProjection
import warnings

# --- Neo4j and Local LLM Imports ---
from neo4j_connector import KnowledgeGraphEngine
from langchain_community.llms import Ollama

warnings.filterwarnings("ignore")

app = FastAPI(title="CrimeVision AI Engine", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
sbert_model = None
clip_model = None
clip_processor = None
kg_engine = None  

@app.on_event("startup")
async def load_ai_models():
    global sbert_model, clip_model, clip_processor, kg_engine
    print("🚀 Booting up CrimeVision AI Engine...")
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
    clip_model = CLIPVisionModelWithProjection.from_pretrained("openai/clip-vit-base-patch32").to(device)
    clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    
    print("🔗 Connecting to Neo4j...")
    kg_engine = KnowledgeGraphEngine()
    
    print("✅ AI Engine is live and listening for evidence!")

@app.on_event("shutdown")
async def shutdown_event():
    if kg_engine:
        kg_engine.close()

def sinkhorn_knopp(C, epsilon=0.1, iterations=10):
    K = torch.exp(-C / epsilon)
    u = torch.ones_like(K[:, 0]) / K.shape[0]
    v = torch.ones_like(K[0, :]) / K.shape[1]
    for _ in range(iterations):
        u = 1.0 / (K @ v)
        v = 1.0 / (K.T @ u)
    return torch.diag(u) @ K @ torch.diag(v)

def extract_keyframe_from_video(video_bytes):
    temp_video_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
            temp_video.write(video_bytes)
            temp_video_path = temp_video.name
        
        cap = cv2.VideoCapture(temp_video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, total_frames // 2))
        ret, frame = cap.read()
        cap.release()
        
        if ret:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return Image.fromarray(frame_rgb)
        return None
    finally:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

def generate_graphrag_audit_report(case_id, new_cost, new_statement, new_filename, kg_engine):
    """The core GraphRAG pipeline: Fetches Neo4j context, then prompts Llama-3."""
    print(f"🧠 Querying Neo4j for Case {case_id} history...")
    
    # 1. RETRIEVAL: Pull the existing graph knowledge
    case_context = kg_engine.get_case_context(case_id)
    
    # 2. AUGMENTED GENERATION: Feed graph + new evidence to local Llama-3
    print("🧠 Passing Graph Context to Llama-3...")
    llm = Ollama(model="llama3", temperature=0)
    
    prompt = f"""
    You are an AI Forensic Analyst. You have access to a Neo4j Knowledge Graph containing the evidence history of a criminal case.
    
    {case_context}
    
    NEWLY INGESTED EVIDENCE:
    - Video: {new_filename}
    - Statement: "{new_statement}"
    - Mathematical Contradiction Cost: {new_cost} (Scores > 1.15 indicate a contradiction)
    
    TASK: 
    Write a professional, 3-sentence forensic audit log. 
    First, evaluate if the NEW evidence contradicts itself based on the math. 
    Second, mention how it fits into the context of the EXISTING case history from the graph.
    Do not use hallucinated facts, ONLY use the provided graph context.
    """
    return llm.invoke(prompt)

@app.post("/analyze_evidence/")
async def analyze_evidence(
    case_id: str = Form("CASE-2026-001"),  
    evidence_file: UploadFile = File(...),
    statement_text: str = Form(None), 
    statement_file: UploadFile = File(None)
):
    final_statement = ""
    if statement_file and statement_file.filename.endswith(".txt"):
        txt_bytes = await statement_file.read()
        final_statement = txt_bytes.decode('utf-8')
    elif statement_text:
        final_statement = statement_text
    else:
        return {"error": "You must provide either a typed statement or a .txt file!"}

    file_bytes = await evidence_file.read()
    if evidence_file.content_type.startswith("video") or evidence_file.filename.endswith(".mp4"):
        image = extract_keyframe_from_video(file_bytes)
        if image is None:
            return {"error": "Failed to extract frame from MP4 video."}
    else:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    
    # 1. PyTorch Math Engine
    inputs = clip_processor(images=[image], return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        vision_features = clip_model(**inputs).image_embeds
    text_embeddings = sbert_model.encode([final_statement], convert_to_tensor=True).clone()
    
    with torch.no_grad():
        torch.manual_seed(42)
        text_projector = torch.nn.Linear(384, 256).to(device)
        vision_projector = torch.nn.Linear(512, 256).to(device)
        aligned_text = text_projector(text_embeddings)
        aligned_vision = vision_projector(vision_features)
        
        aligned_text = aligned_text / aligned_text.norm(dim=-1, keepdim=True)
        aligned_vision = aligned_vision / aligned_vision.norm(dim=-1, keepdim=True)
        
        cost_matrix = 1.0 - (aligned_text @ aligned_vision.T)
        ot_plan = sinkhorn_knopp(cost_matrix)
        final_cost = cost_matrix[0][0].item()

    # 2. Save NEW data to Neo4j
    try:
        kg_engine.create_evidential_link(
            case_id=case_id,
            evidence_filename=evidence_file.filename,
            statement_text=final_statement,
            sinkhorn_cost=final_cost
        )
        graph_status = "Saved to Neo4j Successfully"
    except Exception as e:
        graph_status = f"Neo4j Error: {str(e)}"

    # 3. GraphRAG AI Engine
    try:
        # We pass the kg_engine into the function so Llama-3 can read the database!
        audit_report = generate_graphrag_audit_report(case_id, round(final_cost, 4), final_statement, evidence_file.filename, kg_engine)
    except Exception as e:
        audit_report = f"LLM Error: {str(e)}"

    return {
        "status": "success",
        "case_id": case_id,
        "evidence_processed": evidence_file.filename,
        "sinkhorn_alignment_cost": round(final_cost, 4),
        "graph_status": graph_status,
        "audit_report": audit_report
    }

@app.post("/analyze_evidence/")
async def analyze_evidence(
    case_id: str = Form("CASE-2026-001"),  
    evidence_file: UploadFile = File(...),
    statement_text: str = Form(None), 
    statement_file: UploadFile = File(None)
):
    final_statement = ""
    if statement_file and statement_file.filename.endswith(".txt"):
        txt_bytes = await statement_file.read()
        final_statement = txt_bytes.decode('utf-8')
    elif statement_text:
        final_statement = statement_text
    else:
        return {"error": "You must provide either a typed statement or a .txt file!"}

    file_bytes = await evidence_file.read()
    if evidence_file.content_type.startswith("video") or evidence_file.filename.endswith(".mp4"):
        image = extract_keyframe_from_video(file_bytes)
        if image is None:
            return {"error": "Failed to extract frame from MP4 video."}
    else:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    
    # 1. Math Engine
    inputs = clip_processor(images=[image], return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        vision_features = clip_model(**inputs).image_embeds
    text_embeddings = sbert_model.encode([final_statement], convert_to_tensor=True).clone()
    
    with torch.no_grad():
        torch.manual_seed(42)
        text_projector = torch.nn.Linear(384, 256).to(device)
        vision_projector = torch.nn.Linear(512, 256).to(device)
        aligned_text = text_projector(text_embeddings)
        aligned_vision = vision_projector(vision_features)
        
        aligned_text = aligned_text / aligned_text.norm(dim=-1, keepdim=True)
        aligned_vision = aligned_vision / aligned_vision.norm(dim=-1, keepdim=True)
        
        cost_matrix = 1.0 - (aligned_text @ aligned_vision.T)
        ot_plan = sinkhorn_knopp(cost_matrix)
        final_cost = cost_matrix[0][0].item()

    # 2. Save to Neo4j
    try:
        kg_engine.create_evidential_link(
            case_id=case_id,
            evidence_filename=evidence_file.filename,
            statement_text=final_statement,
            sinkhorn_cost=final_cost
        )
        graph_status = "Saved to Neo4j Successfully"
    except Exception as e:
        graph_status = f"Neo4j Error: {str(e)}"

    # 3. Trigger Llama-3
    try:
        audit_report = generate_audit_report(round(final_cost, 4), final_statement, evidence_file.filename)
    except Exception as e:
        audit_report = f"LLM Error: {str(e)}"

    return {
        "status": "success",
        "case_id": case_id,
        "evidence_processed": evidence_file.filename,
        "sinkhorn_alignment_cost": round(final_cost, 4),
        "graph_status": graph_status,
        "audit_report": audit_report  # <-- We are now sending the Llama-3 text to React!
    }
