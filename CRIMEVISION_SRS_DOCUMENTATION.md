# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## CrimeVision AI: Intelligent Digital Forensics Decision Support System

---

**Document Version:** 1.0.0  
**Project Title:** CrimeVision AI — Multimodal Artificial Intelligence Framework for Intelligent Crime Scene Reconstruction, Uncertainty-Aware Evidential Fusion, and Forensic Investigation Support  
**Authors / Development Team:** 
- Shyamal (Computer Science & Engineering)
- Moukthika (Computer Science & Engineering)
- Venu (Computer Science & Engineering)
- Niteesha (Computer Science & Engineering)  
**Standard Compliance:** IEEE Std 830-1998 (Recommended Practice for Software Requirements Specifications)

---

## TABLE OF CONTENTS
1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Document Conventions
   - 1.3 Intended Audience & Reading Suggestions
   - 1.4 Product Scope
   - 1.5 Definitions, Acronyms, and Abbreviations
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective & Context
   - 2.2 System Architecture Overview
   - 2.3 Product Functions & Core Capabilities
   - 2.4 User Classes and Characteristics
   - 2.5 Operating Environment & Hardware Requirements
   - 2.6 Design and Implementation Constraints
   - 2.7 Assumptions and Dependencies
3. [Exhaustive Technology Stack](#3-exhaustive-technology-stack)
   - 3.1 Research & AI Mathematical Engine
   - 3.2 Backend REST API Microservices
   - 3.3 Frontend Web War Room Dashboard
   - 3.4 Mobile Application
   - 3.5 DevOps, Containerization & Infrastructure
4. [Database Management Systems (DBMS) Specifications](#4-database-management-systems-dbms-specifications)
   - 4.1 Polyglot Persistence Architecture Rationale
   - 4.2 Document Database: MongoDB 6.0
   - 4.3 Graph Database: Neo4j 5.11 (Knowledge Graph)
   - 4.4 Data Schemas, Entities, and Relationship Mappings
   - 4.5 In-Memory Dual-Store Resilient Fallback Engine
5. [Mathematical Formulation & Algorithmic Core](#5-mathematical-formulation--algorithmic-core)
   - 5.1 The Forensic Problem: Blurry Evidence & Catastrophic False Contradictions
   - 5.2 Epistemic Parameterization (Dirichlet Subjective Logic)
   - 5.3 Computer Vision Uncertainty Quantification (Sobel & Gaussian Attenuation)
   - 5.4 Uncertainty-Dampened Cost Matrix ($\tilde{\mathbf{C}}_{ij}$)
   - 5.5 Entropy-Regularized Sinkhorn Divergence Objective
   - 5.6 GraphRAG Contextual LLM Audit Synthesis
6. [Functional Requirements (System Features)](#6-functional-requirements)
   - FR-01: User Authentication & Role-Based Access Control
   - FR-02: Multi-Case Lifecycle Management
   - FR-03: Heterogeneous Multimodal Ingestion
   - FR-04: Video Frame Extraction & Optimal Keyframe Isolation
   - FR-05: Dynamic Visual Noise & Blur Metric Computation
   - FR-06: Zero-Shot Cross-Modal Feature Calibration
   - FR-07: Evidential Contradiction Resolution
   - FR-08: Spatial Patch vs. Linguistic Token Heatmap Generation
   - FR-09: Knowledge Graph Node & Edge Assembly
   - FR-10: Cross-Case Suspect, Vehicle & Modus Operandi Linkage
   - FR-11: Heuristic Cross-Case Link Recommendation Engine
   - FR-12: GraphRAG Local LLM Forensic Briefing Generation
   - FR-13: Interactive React Flow War Room Canvas
   - FR-14: Forensic Evidence Ledger & Filterable Audit Table
   - FR-15: Case Graph Purge & Evidence Integrity Erasure
7. [External Interface Requirements](#7-external-interface-requirements)
   - 7.1 User Interfaces (UI)
   - 7.2 Hardware Interfaces
   - 7.3 Software / REST API Interfaces
   - 7.4 Communications Interfaces
8. [Non-Functional Requirements (NFRs)](#8-non-functional-requirements)
   - 8.1 Performance & Latency
   - 8.2 Security, Integrity & Chain of Custody
   - 8.3 Reliability, Fault Tolerance & Offline Fallback
   - 8.4 Scalability & Resource Utilization
   - 8.5 Usability & Visual Ergonomics
9. [Verification & Validation Matrix](#9-verification--validation-matrix)

---

## 1. INTRODUCTION

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) document is to provide a complete, rigorous, and definitive description of **CrimeVision AI**. It details the software architecture, the exact database management systems (DBMS), the multimodal AI technology stack, mathematical formulations for uncertainty-aware evidential fusion, system features, and external interfaces.

This document serves as the primary technical specification for forensic investigators, AI research engineers, software developers, and academic evaluators of the B.Tech Degree Program Capstone Project.

### 1.2 Document Conventions
- **IEEE Std 830-1998** format is strictly adhered to.
- Mathematical notations:
  - Vectors are denoted as bold lowercase letters ($\mathbf{v}_i, \mathbf{t}_j$).
  - Matrices are denoted as bold uppercase letters ($\mathbf{C}, \mathbf{P}$).
  - Sets and distributions are denoted using calligraphic or Greek symbols ($\boldsymbol{\alpha}, \mathcal{D}$).
- Priority levels: `[MANDATORY]`, `[HIGH]`, `[DESIRABLE]`, `[OPTIONAL]`.

### 1.3 Intended Audience & Reading Suggestions
- **Forensic Investigators & Law Enforcement Analysts:** Focus on Sections 2, 6, and 7 to understand functional capabilities, the War Room Dashboard, and forensic briefing interpretation.
- **AI & Data Science Engineers:** Focus on Section 3.1 and Section 5 for the mathematical mechanics of Dirichlet Epistemic Uncertainty and Evidential Optimal Transport.
- **Backend & Database Engineers:** Focus on Section 3.2, Section 4 (MongoDB & Neo4j schemas), and Section 7.3 for API specifications.
- **Academic Evaluators & Reviewers:** Review all sections sequentially for validation against engineering standards.

### 1.4 Product Scope
CrimeVision AI is an intelligent forensic decision-support platform designed to address the challenges of modern digital crime scene reconstruction. Digital forensics teams encounter overwhelming volumes of heterogeneous, unstructured data (blurry CCTV recordings, phone camera footage, eyewitness transcripts, interrogation logs, crime scene photos, and GPS trails). 

Standard AI solutions suffer from **deterministic overconfidence**: when presented with a low-light, blurry CCTV video of a suspect and a witness statement saying *"The suspect drove a blue sedan"*, a standard deep learning model will confidently flag a contradiction because it cannot locate blue pixels in the blurry static. This leads to catastrophic false-contradiction alarms that derail police investigations.

CrimeVision AI introduces an **Uncertainty-Aware Evidential Fusion Layer** that:
1. Ingests video (`.mp4`), images (`.jpg`, `.png`), and witness statements (`.txt` or plain text).
2. Calculates continuous epistemic visual uncertainty directly from optical noise, Sobel gradient energy, and sensor degradation.
3. Scales down penalization in an entropic **Optimal Transport (Sinkhorn)** plan, preventing false contradiction flags on degraded evidence.
4. Synthesizes a searchable **Neo4j Knowledge Graph** of suspects, vehicles, statements, and visual frames.
5. Employs **GraphRAG (Retrieval-Augmented Generation)** with local LLMs (Ollama Llama-3) to produce deterministic, court-admissible forensic audit logs.
6. Connects disparate investigation cases via **Cross-Case Link Analysis** to track serial offenders.

### 1.5 Definitions, Acronyms, and Abbreviations
| Term | Expansion / Definition |
| :--- | :--- |
| **SRS** | Software Requirements Specification |
| **DBMS** | Database Management System |
| **OT** | Optimal Transport (Wasserstein geometry / Monge-Kantorovich problem) |
| **Sinkhorn** | Entropy-regularized matrix scaling algorithm for solving Optimal Transport |
| **GraphRAG**| Graph-based Retrieval-Augmented Generation |
| **Dirichlet**| A family of continuous multivariate probability distributions parameterized by vector $\boldsymbol{\alpha}$ |
| **CLIP** | Contrastive Language-Image Pretraining (OpenAI ViT-B/32) |
| **DeBERTa** | Decoding-enhanced BERT with Disentangled Attention |
| **SBERT** | Sentence-BERT (Sentence Transformers) |
| **Neo4j** | Labeled Property Graph Database using Bolt Protocol and Cypher |
| **MongoDB** | Distributed Document-Oriented NoSQL Database |
| **OOD** | Out-of-Distribution (degraded, blurry, or noisy data) |
| **REST** | Representational State Transfer |
| **JWT** | JSON Web Token |

---

## 2. OVERALL DESCRIPTION

### 2.1 Product Perspective & Context
CrimeVision AI functions as a central intelligence nexus operating between field evidence collection and courtroom evidence presentation. 

```
+-------------------------------------------------------------------------+
|                         FIELD DATA SOURCES                              |
|   Surveillance Cameras (MP4) | Eyewitness Audio/Transcripts | Crime Photos   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 CRIMEVISION AI INGESTION & PIPELINE                     |
|                                                                         |
|  +--------------------+   +-------------------+   +------------------+  |
|  | Fast Frame & Key   |   | Sobel / Noise     |   | CLIP ViT-B/32    |  |
|  | Extraction (OpenCV)|   | Uncertainty Engine|   | Feature Vector   |  |
|  +---------+----------+   +---------+---------+   +--------+---------+  |
|            |                        |                      |            |
|            +-------------------+    |    +-----------------+            |
|                                |    |    |                              |
|                                v    v    v                              |
|                 +--------------------------------------+                |
|                 | Uncertainty-Dampened Cost Matrix     |                |
|                 |     (Sinkhorn Divergence OT)         |                |
|                 +------------------+-------------------+                |
|                                    |                                    |
|                                    v                                    |
|              Contradiction Score & Spatial Patch Heatmap                |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-----------------------------+             +-----------------------------+
|     DOCUMENT PERSISTENCE    |             |       KNOWLEDGE GRAPH       |
|    MongoDB 6.0 Collections  |             |      Neo4j Graph Engine     |
| (Raw Files, Logs, Cases)    |             | (Case-Entity-Evidence Paths)|
+-----------------------------+             +--------------+--------------+
                                                           |
                                                           v
                                            +-----------------------------+
                                            |       GRAPHRAG ENGINE       |
                                            |  Ollama Local Llama-3 LLM   |
                                            | (Forensic Briefing Synthesis|
                                            +--------------+--------------+
                                                           |
                                                           v
+-------------------------------------------------------------------------+
|                  FORENSIC WAR ROOM DASHBOARD (Next.js)                  |
|  Interactive ReactFlow Graph | Contradiction Heatmaps | Multi-Case Tabs |
+-------------------------------------------------------------------------+
```

### 2.2 System Architecture Overview
The system is divided into four cleanly decoupled tiers:
1. **Presentation Tier:** Next.js 13.5 + React 18 single-page application with React Flow node visualization, Tailwind CSS glassmorphic interface, and real-time Recharts heatmaps.
2. **API & Orchestration Tier:** 
   - Primary Backend (`backend/app/main.py`): Port 8000 for case CRUD, user authentication, and file routing.
   - AI Research Engine API (`research-engine/main.py`): Port 8001 for compute-heavy tensor operations, CV video scanning, Sinkhorn OT execution, and Neo4j graph population.
3. **Mathematical & Evidential Core:** PyTorch-based Dirichlet uncertainty encoder, OpenCV edge-noise detector, zero-shot CLIP contrastive attribute verifier, and Python Optimal Transport (POT).
4. **Data Tier (Dual DBMS):** MongoDB for document/metadata storage and Neo4j for semantic relationship graphing.

### 2.3 Product Functions & Core Capabilities
- **Multi-Case Investigation Workspace:** Tabbed case management allowing investigators to isolate different murder, robbery, or cyber-crime case files while having a unified multi-case view.
- **Multimodal Contradiction Detection:** Automatic evaluation of witness statements against CCTV footage or crime scene photographs to identify factual mismatches (e.g., claiming a blue sedan when evidence displays a red box).
- **Epistemic Doubt Dampening:** Automatic calculation of video/image degradation; if footage is blurry or noisy, the system suppresses false alarms, alerts the officer, and tags the result as *tentative*.
- **Spatial Patch vs. Linguistic Token Heatmaps:** Breakdowns of visual zones (Zone 1 Top-Left, Zone 2 Top-Right, Zone 3 Bottom-Center) crossed with key witness nouns to show exactly where semantic divergence occurs.
- **Interactive Knowledge Graphs:** High-resolution force-directed graphs showing interconnected nodes: `Case -> CONTAINS -> WitnessStatement -> CORRELATES_TO -> VisualEvidence`.
- **Cross-Case Entity Correlation:** Automated heuristic scanner that matches suspects, license plates, weapons, and modus operandi across independent case dockets.
- **Local AI Forensic Briefing Generation:** Local, offline generation of human-readable, non-hallucinated forensic reports using GraphRAG and Ollama Llama-3.

### 2.4 User Classes and Characteristics
- **Lead Forensic Investigator:** Primary user who creates cases, uploads raw exhibits, examines contradiction heatmaps, inspects the knowledge graph, and exports forensic audit logs.
- **Field Detective / Patrol Officer:** Uploads geotagged mobile photos and initial witness statements from crime scenes.
- **Prosecution / Court Officer:** Reads exported objective forensic audit reports detailing divergence scores and chain-of-custody timestamps.
- **System Administrator:** Manages database deployments, backups, and user credential revocation.

### 2.5 Operating Environment & Hardware Requirements
- **Server OS:** Ubuntu 22.04 LTS / Windows 10/11 (64-bit) / macOS Sonoma.
- **GPU Acceleration:** NVIDIA GPU with minimum 6 GB VRAM (CUDA 11.8+ / 12.x) for real-time PyTorch CLIP tensor inferences; fallback CPU mode is natively supported.
- **System RAM:** Minimum 16 GB (32 GB recommended when running local Ollama Llama-3 8B alongside Neo4j).
- **Disk Storage:** Fast NVMe SSD with at least 25 GB free space for Docker volumes, AI model weights, and evidence caches.

### 2.6 Design and Implementation Constraints
- **Zero-Cloud Dependency (Air-Gapped Operation):** Crime scene evidence is sensitive law-enforcement data. The core research engine must run entirely local using local LLMs (Ollama) and on-premises databases to prevent evidence leakage.
- **Court Admissibility:** The AI must never hallucinate facts. All LLM generation must be anchored strictly to Neo4j graph nodes and mathematical divergence scores.
- **Sub-Second Graph Retrieval:** Graph queries must return within 250 milliseconds for up to 10,000 nodes.

### 2.7 Assumptions and Dependencies
- Docker and Docker Compose are installed for hosting containerized databases.
- Node.js (version 18.0+) is installed for compiling the Next.js frontend.
- Python 3.10+ is configured with PyTorch, Torchvision, and OpenCV.

---

## 3. EXHAUSTIVE TECHNOLOGY STACK

The table and detailed subsections below specify every technology, library, framework, and language implemented across CrimeVision AI:

| Layer / Subsystem | Technology | Version | Purpose & Function |
| :--- | :--- | :--- | :--- |
| **Research Engine Language** | Python | 3.10+ | Core language for tensor computation, AI, and Graph orchestration |
| **Deep Learning Framework** | PyTorch (`torch`) | $\ge$ 2.0.0 | GPU-accelerated tensor algebra, Dirichlet encoders, and projections |
| **Computer Vision Tensor Ops** | Torchvision | $\ge$ 0.15.0 | Image transformations and tensor normalization |
| **Multimodal Vision Backbone** | OpenAI CLIP (`ViT-B/32`) | Hugging Face $\ge$ 4.30.0 | Joint 512-D latent space projection for images, video frames & text |
| **Alternative Text Backbone** | Microsoft DeBERTa-v3 / SBERT | Hugging Face / Sentence-Transformers | Semantic sentence tokenization and textual embedding extraction |
| **Optimal Transport Solver** | POT (Python Optimal Transport) | $\ge$ 0.9.0 | Exact and regularized Sinkhorn-Knopp Optimal Transport algorithms |
| **Scientific Computation** | NumPy & SciPy | $\ge$ 1.24.0 / $\ge$ 1.10.0 | Array matrix manipulation, distribution stats, and distance metrics |
| **Computer Vision & Video** | OpenCV (`cv2`) | $\ge$ 4.7.0 | Video frame decoding, Sobel edge filtering, Gaussian noise analysis |
| **Image Manipulation** | Pillow (PIL) | $\ge$ 9.5.0 | High-fidelity image cropping into spatial zones (Z1, Z2, Z3) |
| **Local LLM Engine** | Ollama (Llama-3 8B) | Latest | Air-gapped, zero-leakage local LLM for forensic report synthesis |
| **LLM Orchestration** | LangChain Community & Core | $\ge$ 0.3.0 | Prompt grounding and GraphRAG context retrieval |
| **Backend REST Framework** | FastAPI | $\ge$ 0.100.0 | High-performance asynchronous REST API architecture |
| **ASGI Web Server** | Uvicorn | $\ge$ 0.23.0 | Production ASGI server running asynchronous event loops |
| **Data Validation** | Pydantic & Pydantic-Settings | $\ge$ 2.0.0 | Strict schema validation for request payloads and configurations |
| **Document DBMS** | MongoDB | 6.0 (Docker) | Storage of raw evidence files, case logs, and investigator profiles |
| **Async Mongo Driver** | Motor | $\ge$ 3.2.0 | Non-blocking asynchronous Python client for MongoDB |
| **Graph DBMS** | Neo4j Community Edition | 5.11 (Docker) | Knowledge Graph database for entity paths and contradiction links |
| **Graph Driver** | Neo4j Python Driver | $\ge$ 5.10.0 | Cypher query execution over Bolt protocol (`bolt://localhost:7687`)|
| **Security & Auth** | PyJWT & Passlib (Bcrypt) | $\ge$ 2.8.0 / $\ge$ 1.7.4 | Password hashing and HMAC-SHA256 JWT access tokens |
| **Frontend Framework** | Next.js | $\ge$ 13.5.11 | React Server/Client Architecture with optimized routing |
| **UI Library** | React.js | 18.2.0 | Component-driven reactive UI architecture |
| **CSS Styling Engine** | Tailwind CSS | 3.3.3 | Utility-first responsive styling with dark-mode War Room theme |
| **CSS Post-Processing** | PostCSS & Autoprefixer | 8.4.29 / 10.4.15 | CSS compilation and cross-browser vendor prefixing |
| **Node Graph Visualization** | React Flow (`reactflow`) | $\ge$ 11.8.3 | Interactive canvas, custom node renderers, minimaps, and zoom |
| **Charts & Heatmaps** | Recharts | $\ge$ 2.8.0 | Data visualization for uncertainty distributions and metrics |
| **UI Iconography** | Lucide React (`lucide-react`) | $\ge$ 0.274.0 | Clean, military/forensic-grade SVG interface icons |
| **HTTP Communication** | Axios | $\ge$ 1.20.0 | Asynchronous HTTP client for browser-to-backend REST communication |
| **Drag-and-Drop Ingestion** | React Dropzone | $\ge$ 19.3.0 | Frictionless multi-format file drag-and-drop file upload |
| **Mobile Application** | Flutter SDK (Dart) | 3.x | Cross-platform field application for mobile geotagged uploads |
| **Containerization** | Docker & Docker Compose | Compose v3.8 | Unified container orchestration for Mongo, Neo4j, Backend, Web |

---

## 4. DATABASE MANAGEMENT SYSTEMS (DBMS) SPECIFICATIONS

### 4.1 Polyglot Persistence Architecture Rationale
A single database cannot efficiently solve both high-volume digital asset storage and deep relational network traversals. CrimeVision AI employs a **Polyglot Persistence Model**:

```
                               +----------------------------+
                               |     CrimeVision Ingestion  |
                               +--------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
       +----------------------------+                    +----------------------------+
       |   Document Store (MongoDB) |                    |  Graph Store (Neo4j)       |
       |----------------------------|                    |----------------------------|
       | - Raw case dossiers        |                    | - Case -> Evidence nodes   |
       | - Media binary paths       |                    | - Witness Statements nodes |
       | - User accounts & credentials                   | - CORRELATES_TO relations  |
       | - Ingestion logs & audit   |                    | - Contradiction flags      |
       | - GPS metadata & timestamps|                    | - Cross-case entity links  |
       +----------------------------+                    +----------------------------+
```

- **MongoDB** excels at schema flexibility: forensic media metadata varies wildly (a video has framerate, bitrate, codec; an image has EXIF, ISO, aperture; an audio file has sample rate and channels). Storing these in a document-based BSON structure avoids schema rigidity.
- **Neo4j** excels at entity graph traversal: discovering indirect linkages (`Case A -> Suspect X -> drives -> Red Sedan -> seen in -> Case B`) requires expensive multi-table joins in traditional SQL. In Neo4j's index-free adjacency graph, traversing these relationships is $O(1)$ per hop, enabling real-time cross-case correlation.

### 4.2 Document Database: MongoDB 6.0
- **Container Name:** `crimevision-mongodb`
- **Default Port:** `27017`
- **Driver:** Motor (Python `AsyncIOMotorClient`)
- **Database Name:** `crimevision`

#### Collections Structure:
1. `cases`:
   ```json
   {
     "_id": "ObjectId('65d21a9f...')",
     "case_id": "CASE-2026-001",
     "title": "Downtown Jewelry Store Break-in",
     "description": "Armed robbery involving suspect in dark hoodie.",
     "location": "Sector 4 Commercial Corridor",
     "investigator_id": "OFFICER-741",
     "created_at": "2026-08-17T09:15:00Z",
     "status": "OPEN",
     "tags": ["Armed Robbery", "Vehicle Flight", "CCTV Evidence"]
   }
   ```
2. `evidence`:
   ```json
   {
     "_id": "ObjectId('65d21b10...')",
     "evidence_id": "EVID-999",
     "case_id": "CASE-2026-001",
     "filename": "cctv_entrance_cam2.mp4",
     "evidence_type": "VIDEO",
     "storage_path": "storage/CASE-2026-001/cctv_entrance_cam2.mp4",
     "file_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
     "file_size_bytes": 156595,
     "visual_uncertainty": 0.72,
     "is_blurry": true,
     "uploaded_at": "2026-08-17T09:30:00Z",
     "status": "PROCESSED"
   }
   ```
3. `users`:
   ```json
   {
     "_id": "ObjectId('65d21b88...')",
     "username": "admin",
     "hashed_password": "$2b$12$e83a9c7b4f210d5e18239a0c71a9e8d4239851f0c0827b1a...",
     "full_name": "Detective Inspector Reynolds",
     "badge_number": "BADGE-4891",
     "role": "LEAD_INVESTIGATOR",
     "created_at": "2026-01-01T00:00:00Z"
   }
   ```

### 4.3 Graph Database: Neo4j 5.11 (Knowledge Graph)
- **Container Name:** `crimevision-neo4j`
- **Default Ports:** `7474` (HTTP Web Console Browser), `7687` (Bolt Binary Protocol)
- **Plugins:** APOC (Awesome Procedures on Cypher) enabled
- **Authentication:** `neo4j / crimevision_password`

#### Node Labels and Properties:
- **`(:Case)`**:
  - `id`: String (e.g. `"CASE-2026-001"`) [Unique Index]
  - `name`: String (e.g. `"Case CASE-2026-001"`)
  - `description`: String
  - `category`: String (e.g. `"Homicide"`, `"Robbery"`, `"Cybercrime"`)
  - `created_at`: Datetime / String
- **`(:VisualEvidence)`**:
  - `filename`: String (e.g. `"cctv_sample.mp4"`) [Unique Index]
  - `type`: String (`"VIDEO"` or `"IMAGE"`)
- **`(:WitnessStatement)`**:
  - `text`: String (e.g. `"Witness saw a blue car leaving the alley."`)
  - `source`: String (e.g. `"Field Transcript"`)

#### Relationships and Edge Properties:
- **`(:Case)-[:CONTAINS]->(:VisualEvidence)`**
- **`(:Case)-[:CONTAINS]->(:WitnessStatement)`**
- **`(:WitnessStatement)-[:CORRELATES_TO]->(:VisualEvidence)`**:
  - `sinkhorn_cost`: Float (e.g., `0.3842` or `1.4510`)
  - `flagged_contradiction`: Boolean (`true` if cost > 1.15)
  - `is_blurry`: Boolean (`true` if uncertainty $\ge$ 0.40)
  - `visual_uncertainty`: Float ($[0.0, 1.0]$)
  - `quality_label`: String (e.g. `"Severe Degradation (Heavy Blur & Sensor Static)"`)
  - `investigator_advisory`: String
  - `discrepancy_info`: String (attribute mismatch notes)
  - `audit_report`: String (GraphRAG synthesized briefing)
  - `timestamp`: Datetime / String
  - `case_id`: String
- **`(:Case)-[:CROSS_CASE_CORRELATION]->(:Case)`**:
  - `type`: String (`"SHARED_SUSPECT"`, `"SAME_VEHICLE"`, `"LINKED_WEAPON"`, `"REPEATED_MODUS_OPERANDI"`)
  - `description`: String
  - `confidence`: Float ($[0.0, 1.0]$)
  - `shared_entity`: String
  - `timestamp`: Datetime / String

### 4.4 Data Schemas, Entities, and Relationship Mappings

```
  +-----------------------------------------------------------+
  |                           (:Case)                         |
  |  - id: "CASE-001"                                         |
  |  - name: "Downtown Robbery"                               |
  +-------------+-------------------------------+-------------+
                |                               |
       [:CONTAINS]                         [:CONTAINS]
                |                               |
                v                               v
    +------------------------+      +------------------------+
    |   (:WitnessStatement)  |      |   (:VisualEvidence)    |
    | - text: "Red sedan..." |      | - filename: "cctv.mp4" |
    +-----------+------------+      +-----------+------------+
                |                               ^
                |      [:CORRELATES_TO]         |
                +-------------------------------+
                  - sinkhorn_cost: 0.28
                  - flagged_contradiction: false
                  - visual_uncertainty: 0.12
                  - quality_label: "Optimal Clarity"
```

### 4.5 In-Memory Dual-Store Resilient Fallback Engine
To guarantee that investigators are never blocked if the Neo4j or MongoDB container encounters a cold start or network separation, the `KnowledgeGraphEngine` in `research-engine/neo4j_connector.py` implements a synchronized **dual-store architecture**:
- `self.memory_store`: In-memory hash mapping `case_id -> list of evidential records`.
- `self.cases_metadata`: In-memory dictionary storing case metadata and entity counts.
- `self.cross_case_links`: In-memory store for cross-case correlation records.
- When Neo4j is reachable, every Cypher write (`MERGE`, `SET`) is executed, and query reads merge results from both disk and memory without duplicates. If Neo4j goes offline, the system logs a `[WARN]` and seamlessly continues serving all graph queries, node positions, and evidence lists directly from the resilient in-memory engine.

---

## 5. MATHEMATICAL FORMULATION & ALGORITHMIC CORE

### 5.1 The Forensic Problem: Blurry Evidence & Catastrophic False Contradictions
In digital forensics, surveillance evidence is routinely captured in night-time, low-resolution, or rainy conditions. Standard deterministic multimodal models compute cosine distance:
$$d(\mathbf{v}, \mathbf{t}) = 1 - \frac{\mathbf{v} \cdot \mathbf{t}}{\|\mathbf{v}\|_2 \|\mathbf{t}\|_2}$$
When $\mathbf{v}$ is degraded by optical blur and sensor noise, its embedding shifts toward an out-of-distribution vector, causing $d(\mathbf{v}, \mathbf{t})$ to arbitrarily exceed contradiction thresholds. This results in false contradiction alerts against honest witnesses.

CrimeVision AI models doubt as a primary statistical parameter across three mathematical operations.

### 5.2 Epistemic Parameterization (Dirichlet Subjective Logic)
Following Subjective Logic, epistemic uncertainty (the system's doubt about its own prediction) is parameterized via the concentration parameters of a Dirichlet distribution $\boldsymbol{\alpha} = [\alpha_1, \alpha_2, \dots, \alpha_K]^T$:
$$\alpha_i = \text{ReLU}(\mathbf{W} \mathbf{x}_i) + 1$$
The total Dirichlet strength $S$ and corresponding Epistemic Uncertainty $u$ are:
$$S = \sum_{k=1}^K \alpha_k, \qquad u = \frac{K}{S}$$
Where:
- $K$ is the number of evidence classification classes.
- As positive evidence accumulates, $S \to \infty$ and $u \to 0$ (high confidence).
- In the absence of decisive features (extreme ambiguity), $\alpha_k \to 1$, $S \to K$, and $u \to 1.0$ (maximum epistemic doubt).

### 5.3 Computer Vision Uncertainty Quantification (Sobel & Gaussian Attenuation)
In `research-engine/main.py`, visual uncertainty is dynamically extracted directly from raw pixel frames without requiring human annotations:
1. **Sensor Noise Extraction:** The grayscale image $I$ is smoothed with a Gaussian kernel $G_\sigma$ of size $5 \times 5$:
   $$\text{NoiseLevel} = \frac{1}{H \cdot W} \sum_{x,y} |I(x,y) - (I * G_\sigma)(x,y)|$$
2. **Edge Energy (Sobel Gradients):** High-frequency sharpness is quantified using horizontal and vertical Sobel filters:
   $$\text{EdgeEnergy} = \frac{1}{H \cdot W} \sum_{x,y} \sqrt{\left(\frac{\partial I}{\partial x}\right)^2 + \left(\frac{\partial I}{\partial y}\right)^2}$$
3. **Dynamic Contrast:** Calculated as standard deviation $\sigma_I$ of luminance.
4. **Composite Epistemic Visual Uncertainty ($u_v$):**
   $$p_{\text{noise}} = \text{clip}\left(\frac{\text{NoiseLevel} - 1.2}{30.0}, 0, 1\right)$$
   $$p_{\text{blur}} = \text{clip}\left(\frac{15.0 - \text{EdgeEnergy}}{15.0}, 0, 1\right)$$
   $$p_{\text{contrast}} = \text{clip}\left(\frac{20.0 - \sigma_I}{20.0}, 0, 1\right)$$
   $$u_v = \text{clip}\left(0.08 + 0.65 \cdot p_{\text{noise}} + 0.20 \cdot p_{\text{blur}} + 0.07 \cdot p_{\text{contrast}}, 0.06, 0.94\right)$$

- If $u_v \ge 0.70$: Classified as **Severe Degradation (Heavy Blur & Sensor Static)**.
- If $0.40 \le u_v < 0.70$: Classified as **Moderate Ambiguity (Low Light / Optical Blur)**.
- If $u_v < 0.40$: Classified as **Optimal Visual Clarity**.

### 5.4 Uncertainty-Dampened Cost Matrix ($\tilde{\mathbf{C}}_{ij}$)
To align visual patches $\mathbf{v}_i$ ($i \in [1, N]$) with statement tokens $\mathbf{t}_j$ ($j \in [1, M]$), we construct an uncertainty-dampened cost matrix $\tilde{\mathbf{C}} \in \mathbb{R}^{N \times M}$:
$$\tilde{\mathbf{C}}_{ij} = \left(1 - \frac{\mathbf{v}_i \cdot \mathbf{t}_j}{\|\mathbf{v}_i\| \|\mathbf{t}_j\|}\right) \cdot \exp\left(-\gamma \cdot \max(u_{v_i}, u_{t_j})\right) + \lambda_{\text{neg}} \cdot \mathbf{M}_{\text{neg}}$$
Where:
- $\gamma \ge 0$ is the uncertainty damping coefficient (default $\gamma = 2.0$).
- When optical noise inflates visual uncertainty $u_{v_i} \to 1.0$, the penalty multiplier $\exp(-\gamma \cdot u)$ exponentially contracts toward zero.
- Consequently, an unidentifiable blurry object is **never** penalized with a high cost, mathematically preventing false-positive contradiction flags.

### 5.5 Entropy-Regularized Sinkhorn Divergence Objective
The optimal transport plan $\mathbf{P}^* \in \mathbb{R}^{N \times M}$ between the visual patch distribution $\mathbf{a} \in \Delta^N$ and linguistic token distribution $\mathbf{b} \in \Delta^M$ is solved via entropy-regularized Kantorovitch formulation:
$$\mathbf{P}^* = \arg\min_{\mathbf{P} \in \mathcal{U}(\mathbf{a}, \mathbf{b})} \langle \mathbf{P}, \tilde{\mathbf{C}} \rangle - \epsilon H(\mathbf{P})$$
Where:
- $H(\mathbf{P}) = - \sum_{i,j} P_{ij} (\log P_{ij} - 1)$ is the Shannon entropy.
- $\epsilon > 0$ is the regularization parameter.
- Solved efficiently via iterative matrix-vector multiplications using the Sinkhorn-Knopp algorithm:
  $$\mathbf{K}_{ij} = \exp\left(-\frac{\tilde{\mathbf{C}}_{ij}}{\epsilon}\right), \quad \mathbf{u}^{(k+1)} = \frac{\mathbf{a}}{\mathbf{K} \mathbf{v}^{(k)}}, \quad \mathbf{v}^{(k+1)} = \frac{\mathbf{b}}{\mathbf{K}^T \mathbf{u}^{(k+1)}}$$
  $$\mathbf{P}^* = \text{diag}(\mathbf{u}) \cdot \mathbf{K} \cdot \text{diag}(\mathbf{v})$$
The composite Sinkhorn Contradiction Cost is:
$$\mathcal{L}_{\text{OT}} = \sum_{i=1}^N \sum_{j=1}^M P_{ij}^* \cdot \tilde{\mathbf{C}}_{ij}$$
**Decision Boundary:**
- If $\mathcal{L}_{\text{OT}} > 1.15$: Flagged as **CONTRADICTION** (Significant factual discrepancy).
- If $\mathcal{L}_{\text{OT}} \le 1.15$: Flagged as **CONGRUENT** (Aligned or uncertainty-mitigated).

### 5.6 GraphRAG Contextual LLM Audit Synthesis
Rather than prompting an LLM blindly, CrimeVision AI executes a **GraphRAG pipeline**:
1. It queries Neo4j for the historical graph context of the active case:
   $$\text{MATCH } (c:\text{Case } \{id: \$case\_id\}) \dots \text{ RETURN statements, videos, costs}$$
2. It injects the ingested statement, file metadata, exact Sinkhorn divergence cost ($\mathcal{L}_{\text{OT}}$), and optical uncertainty percentage ($u_v$) into a constrained forensic prompt.
3. It queries the local Ollama LLM (`llama3` model via `http://127.0.0.1:11434/api/generate`) with zero temperature.
4. If Ollama is offline or uninstalled, a fully deterministic, non-hallucinated evidence-grounded briefing fallback generates court-admissible audit reports immediately.

---

## 6. FUNCTIONAL REQUIREMENTS

### FR-01: User Authentication & Role-Based Access Control
- **Description:** The system shall authenticate investigators via secure username and badge ID credentials before granting access to forensic case files.
- **Inputs:** Username (e.g., `"admin"`), Password (e.g., `"password"`).
- **Processing:** Authentication service evaluates credentials; upon validation, issues an HMAC-SHA256 JWT access token with a 120-minute expiration period.
- **Outputs:** JWT Bearer token and redirect to the War Room Dashboard (`/`).

### FR-02: Multi-Case Lifecycle Management
- **Description:** The system shall allow investigators to create, view, update, switch between, and clear investigation case files.
- **Inputs:** Case ID (e.g. `"CASE-2026-001"`), Name, Description, Category.
- **Processing:** Backend updates MongoDB `cases` collection and executes a Cypher `MERGE (c:Case {id: $case_id})` in Neo4j.
- **Outputs:** Updated case array and tab rendering in the header bar.

### FR-03: Heterogeneous Multimodal Ingestion
- **Description:** The system shall support drag-and-drop ingestion of digital evidence files (MP4, AVI, JPEG, PNG) paired with witness testimonies (direct text input or `.txt` transcripts).
- **Inputs:** `multipart/form-data` containing `evidence_file` (UploadFile), `statement_text` (String), or `statement_file` (UploadFile).
- **Outputs:** HTTP 200 JSON object with extracted tokens, patches, uncertainty metrics, divergence cost, and updated graph.

### FR-04: Video Frame Extraction & Optimal Keyframe Isolation
- **Description:** When an MP4 video is ingested, the system shall sample frames uniformly across the video timeline, calculate their respective sharpness-to-noise ratios ($\frac{\text{EdgeEnergy}}{\text{NoiseLevel} + 1.0}$), and isolate the sharpest frame as the representative keyframe for AI feature extraction.

### FR-05: Dynamic Visual Noise & Blur Metric Computation
- **Description:** The system shall execute Sobel filtering and Gaussian difference checks on every evidence image/video to produce an epistemic uncertainty score between $0.06$ and $0.94$.

### FR-06: Zero-Shot Cross-Modal Feature Calibration
- **Description:** The system shall feed the image keyframe and statement into OpenAI CLIP ViT-B/32 to generate normalized 512-D embeddings and evaluate cosine similarity calibrated around the baseline zero-shot threshold ($0.22$).

### FR-07: Evidential Contradiction Resolution
- **Description:** The system shall compare the resulting Sinkhorn divergence against the decision threshold ($1.15$). It shall automatically apply contrastive checks for colors (e.g., blue vs. red) and object classes (e.g., vehicle vs. square vs. person) and flag contradiction status accordingly.

### FR-08: Spatial Patch vs. Linguistic Token Heatmap Generation
- **Description:** The system shall divide the evidence keyframe into three spatial regions:
  - Zone 1: Top-Left
  - Zone 2: Top-Right
  - Zone 3: Bottom-Center
- It shall compute cross-modal alignment between each zone and the first 6 key tokens of the statement, producing a $3 \times M$ matrix rendered in the dashboard as an interactive color-coded heatmap.

### FR-09: Knowledge Graph Node & Edge Assembly
- **Description:** For every evaluated evidence-statement pair, the system shall create Neo4j nodes `(:VisualEvidence)` and `(:WitnessStatement)` connected by the relationship `[:CORRELATES_TO]`, tagged with the Sinkhorn cost, contradiction flag, and uncertainty metrics.

### FR-10: Cross-Case Suspect, Vehicle & Modus Operandi Linkage
- **Description:** The system shall allow linking two separate case dockets in Neo4j with the directed edge `[:CROSS_CASE_CORRELATION]`, recording the relation type (`SHARED_SUSPECT`, `SAME_VEHICLE`, `LINKED_WEAPON`, `REPEATED_MODUS_OPERANDI`), confidence score, and linking notes.

### FR-11: Heuristic Cross-Case Link Recommendation Engine
- **Description:** The system shall scan evidence statements across all cases for co-occurring high-value investigative keywords (e.g. *"sedan"*, *"blue"*, *"red"*, *"hoodie"*, *"knife"*, *"warehouse"*) and return recommended cross-case linkages with calculated confidence scores.

### FR-12: GraphRAG Local LLM Forensic Briefing Generation
- **Description:** The system shall assemble Neo4j case history and current divergence metrics into an evidentiary prompt, querying a local Ollama instance (Llama-3) to produce an objective, court-admissible forensic briefing.

### FR-13: Interactive React Flow War Room Canvas
- **Description:** The frontend shall render interactive, zoomable, draggable force-directed graphs of all cases, evidence nodes, and witness statements. Color schemes:
  - Red Nodes/Edges: Flagged Contradictions (Cost > 1.15)
  - Emerald/Cyan Nodes/Edges: Verified Congruent Matches (Cost $\le$ 1.15)
  - Purple/Blue Nodes: Case Hubs and Multi-Case Bridge Edges

### FR-14: Forensic Evidence Ledger & Filterable Audit Table
- **Description:** The system shall maintain an evidentiary ledger displaying every processed exhibit, its filename, statement snippet, Sinkhorn cost, uncertainty %, degradation status, and an action button to inspect individual GraphRAG briefings.

### FR-15: Case Graph Purge & Evidence Integrity Erasure
- **Description:** The system shall provide an authenticated endpoint (`/clear/{case_id}`) allowing investigators to purge case data, detaching and deleting connected Neo4j nodes and flushing corresponding memory cache records.

---

## 7. EXTERNAL INTERFACE REQUIREMENTS

### 7.1 User Interfaces (UI)
The web user interface is implemented in Next.js with a dark-mode military/forensic design system:
- **Global Case Tab Bar:** Fixed top bar displaying all active case files, badge icons indicating contradiction counts vs. congruent evidence, an *"All Cases"* multi-graph toggle, and a *"New Case"* creation modal button.
- **Evidence Ingestion Zone:** Drag-and-drop file upload target supporting simultaneous file drops and text inputs with visual feedback.
- **Forensic Knowledge Canvas (React Flow):** Center stage interactive node graph with minimap, zoom controls, and click-to-inspect node drawers.
- **Contradiction Heatmap Matrix:** Visual matrix displaying linguistic tokens along the X-axis and spatial zones along the Y-axis with an uncertainty bar.
- **LLM Forensic Briefing Panel:** Displays the AI-generated audit briefing with alert banners for visual degradation and investigator directives.
- **Evidence Audit Ledger:** Bottom drawer tabular view of all evidence exhibits.

### 7.2 Hardware Interfaces
- **Camera / CCTV Ingestion:** Standard USB storage, SD card readers, or networked RTSP streams exporting MP4/AVI media.
- **GPU Acceleration:** NVIDIA CUDA-enabled GPUs via standard PCIe interface for PyTorch tensor execution.

### 7.3 Software / REST API Interfaces

#### A. Central Backend Endpoints (`http://127.0.0.1:8000/api/v1`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticates investigator; returns JWT access token |
| `GET` | `/cases/` | Returns list of all registered cases from MongoDB |
| `POST` | `/cases/` | Creates a new case record in MongoDB |
| `POST` | `/evidence/upload` | Uploads raw media files and registers metadata |
| `POST` | `/analysis/contradiction-check` | Prototype bridge to evidential inference engine |

#### B. AI Research & Graph Engine Endpoints (`http://127.0.0.1:8001`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/cases` | Fetches active cases with evidence and contradiction counts |
| `POST` | `/cases` | Registers a new case in Neo4j and memory cache |
| `PUT` | `/cases/{case_id}` | Updates metadata for an existing case |
| `DELETE` | `/cases/{case_id}` | Purges a case and detaches connected evidence graph |
| `POST` | `/analyze_evidence/` | Executes end-to-end multi-frame scan, Sinkhorn OT & GraphRAG |
| `GET` | `/graph/{case_id}` | Returns React Flow nodes, edges, and evidence ledger |
| `GET` | `/graph/all` | Returns unified multi-case relationship graph |
| `POST` | `/cross_case_relation` | Links two cases with a specified correlation relationship |
| `GET` | `/cross_case_relations` | Returns all cross-case links in the system |
| `GET` | `/cross_case_suggestions` | Scans for cross-case keyword and entity matches |
| `POST` | `/clear/{case_id}` | Completely purges graph and cache for a given case ID |

### 7.4 Communications Interfaces
- **HTTP / HTTPS:** REST communication between frontend and backend via Axios (`JSON` payloads and `multipart/form-data`).
- **Bolt Protocol (`bolt://`):** Binary protocol connecting Python backend to Neo4j database on port 7687.
- **MongoDB Wire Protocol:** TCP communication on port 27017 for document reads/writes.
- **Ollama REST API:** Local loopback HTTP calls to port 11434 (`/api/generate` and `/api/tags`).

---

## 8. NON-FUNCTIONAL REQUIREMENTS (NFRs)

### 8.1 Performance & Latency
- **Evidence Analysis Latency:** Full video keyframe extraction, Sobel uncertainty computation, CLIP zero-shot feature extraction, and Sinkhorn divergence calculation must complete within $\le 2.5$ seconds per exhibit on a CUDA-enabled GPU ($\le 5.0$ seconds on modern multi-core CPU).
- **Graph Query Performance:** Fetching case graph structures for up to 500 nodes shall render in the browser in $\le 300$ milliseconds.

### 8.2 Security, Integrity & Chain of Custody
- **Cryptographic Hashing:** Every ingested digital exhibit must be hashed using SHA-256 upon ingestion to guarantee chain of custody.
- **Authentication:** All administrative endpoints must validate JWT tokens signed using HMAC-SHA256.
- **Air-Gapped Privacy:** Zero evidence or prompts are transmitted to public clouds; all LLM operations run strictly on the local host.

### 8.3 Reliability, Fault Tolerance & Offline Fallback
- **Dual-Store Persistence:** If the Neo4j graph container is unreachable or restarts, the system shall continue operation without data loss or exceptions using its in-memory fallback cache.
- **Deterministic LLM Fallback:** If the Ollama service is unavailable, the research engine immediately falls back to structured, deterministic forensic briefings.

### 8.4 Scalability & Resource Utilization
- **Microservice Decoupling:** The architecture allows scaling the research engine independently across multi-GPU worker nodes using Docker Compose.
- **Graph Indexing:** Neo4j constraints on `(:Case {id})` and `(:VisualEvidence {filename})` ensure $O(1)$ node lookup times.

### 8.5 Usability & Visual Ergonomics
- The War Room interface must adhere to dark-mode design standards (slate-900 background `#0f172a`, emerald congruency `#10b981`, rose-red contradiction `#f43f5e`) to minimize eye fatigue during extended investigative operations.

---

## 9. VERIFICATION & VALIDATION MATRIX

| Requirement ID | Test Method | Test Procedure & Acceptance Criteria |
| :--- | :--- | :--- |
| **FR-01** | Functional Test | Submit valid and invalid credentials to `/auth/login`. Verify 200 with JWT on valid, 401 on invalid. |
| **FR-04** | Unit Test | Ingest `cctv_sample.mp4`. Verify OpenCV samples 5 points and selects frame with highest $\frac{\text{EdgeEnergy}}{\text{NoiseLevel} + 1.0}$. |
| **FR-05** | Stress Test | Ingest clean vs. degraded video (via `degrade_evidence.py`). Verify uncertainty score rises from $<0.20$ to $>0.70$. |
| **FR-07** | Integration Test | Submit contradictory statement (*"Blue vehicle"* against red image). Verify cost $>1.15$ and `is_contradiction = true`. |
| **FR-08** | Visual Test | Verify heatmap matrix has exactly 3 rows (Zone 1, Zone 2, Zone 3) and $M$ columns matching token count. |
| **FR-09** | Graph Validation | Query Neo4j Cypher console. Confirm `(:Case)-[:CONTAINS]->(:WitnessStatement)-[:CORRELATES_TO]->(:VisualEvidence)` exists. |
| **FR-10** | End-to-End Test | Create Case 001 and Case 002. Link via `SHARED_SUSPECT`. Verify bridge edge appears in Multi-Case Graph view. |
| **FR-12** | Fallback Test | Terminate Ollama daemon. Upload evidence. Verify briefing returns valid deterministic report without crashing. |

---

*End of Software Requirements Specification Document — CrimeVision AI*
