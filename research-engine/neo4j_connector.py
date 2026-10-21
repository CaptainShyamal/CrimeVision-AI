import datetime
import re
from neo4j import GraphDatabase

class KnowledgeGraphEngine:
    def __init__(self, uri="bolt://localhost:7687", user="neo4j", password="crimevision_password"):
        """Initializes connection to the local Neo4j database with fallback store."""
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
        self.memory_store = {} # Fallback in-memory store: case_id -> list of records
        self.cases_metadata = {} # Starts completely empty until user creates a case
        self.cross_case_links = [] # List of cross-case relationships

        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            print("[INFO] Connected to Neo4j Knowledge Graph!")
        except Exception as e:
            print(f"[WARN] Neo4j not reachable, using resilient memory store: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def get_cases(self):
        """Returns the list of all registered cases with evidence stats."""
        cases_dict = {k: {**v, "evidence_count": 0, "contradiction_count": 0, "congruent_count": 0} for k, v in self.cases_metadata.items()}
        
        # Pull stats from memory store
        for cid, ev_list in self.memory_store.items():
            if cid not in cases_dict:
                cases_dict[cid] = {
                    "id": cid,
                    "name": f"Case {cid}",
                    "description": "Active Forensic Investigation File",
                    "category": "General Forensics",
                    "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "evidence_count": 0,
                    "contradiction_count": 0,
                    "congruent_count": 0
                }
            cases_dict[cid]["evidence_count"] = len(ev_list)
            cases_dict[cid]["contradiction_count"] = sum(1 for e in ev_list if e.get("is_contradiction") or e.get("sinkhorn_cost", 0) > 1.15)
            cases_dict[cid]["congruent_count"] = cases_dict[cid]["evidence_count"] - cases_dict[cid]["contradiction_count"]

        # Pull from Neo4j if available
        if self.driver:
            try:
                query = """
                MATCH (c:Case)
                OPTIONAL MATCH (c)-[:CONTAINS]->(v:VisualEvidence)
                OPTIONAL MATCH (t:WitnessStatement)-[r:CORRELATES_TO]->(v)
                WHERE (c)-[:CONTAINS]->(t)
                RETURN c.id AS id, c.name AS name, c.description AS description, c.category AS category,
                       c.created_at AS created_at,
                       count(DISTINCT v) AS visual_count,
                       count(DISTINCT r) AS rel_count,
                       sum(CASE WHEN r.flagged_contradiction = true OR r.sinkhorn_cost > 1.15 THEN 1 ELSE 0 END) AS contra_count
                """
                with self.driver.session() as session:
                    res = session.run(query)
                    for row in res.data():
                        cid = row['id']
                        if cid:
                            if cid not in cases_dict:
                                cases_dict[cid] = {
                                    "id": cid,
                                    "name": row.get('name') or f"Case {cid}",
                                    "description": row.get('description') or "Active Forensic Investigation File",
                                    "category": row.get('category') or "General Forensics",
                                    "created_at": str(row.get('created_at') or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                                    "evidence_count": 0,
                                    "contradiction_count": 0,
                                    "congruent_count": 0
                                }
                            if row.get('rel_count', 0) > 0:
                                cases_dict[cid]["evidence_count"] = row['rel_count']
                                cases_dict[cid]["contradiction_count"] = row.get('contra_count', 0)
                                cases_dict[cid]["congruent_count"] = max(0, row['rel_count'] - row.get('contra_count', 0))
            except Exception as e:
                print(f"[WARN] Error listing Neo4j cases: {e}")

        return list(cases_dict.values())

    def create_case(self, case_id, name=None, description=None, category=None):
        """Creates or registers a new case file in Neo4j and memory store."""
        case_id = str(case_id).strip()
        name = name.strip() if name else f"Case {case_id}"
        description = description.strip() if description else "Active criminal forensics case file."
        category = category.strip() if category else "General Forensics"
        created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        self.cases_metadata[case_id] = {
            "id": case_id,
            "name": name,
            "description": description,
            "category": category,
            "created_at": created_at
        }
        if case_id not in self.memory_store:
            self.memory_store[case_id] = []

        if self.driver:
            try:
                with self.driver.session() as session:
                    session.run("""
                    MERGE (c:Case {id: $case_id})
                    SET c.name = $name,
                        c.description = $description,
                        c.category = $category,
                        c.created_at = $created_at
                    RETURN c
                    """, case_id=case_id, name=name, description=description, category=category, created_at=created_at)
                print(f"[INFO] Created/Updated Case {case_id} in Neo4j.")
            except Exception as e:
                print(f"[WARN] Error persisting Case {case_id} in Neo4j: {e}")

        return self.cases_metadata[case_id]

    def update_case(self, case_id, name=None, description=None, category=None):
        """Updates metadata for an existing case."""
        case_id = str(case_id).strip()
        if case_id not in self.cases_metadata:
            return self.create_case(case_id, name, description, category)

        if name:
            self.cases_metadata[case_id]["name"] = name.strip()
        if description:
            self.cases_metadata[case_id]["description"] = description.strip()
        if category:
            self.cases_metadata[case_id]["category"] = category.strip()

        if self.driver:
            try:
                with self.driver.session() as session:
                    session.run("""
                    MATCH (c:Case {id: $case_id})
                    SET c.name = $name,
                        c.description = $description,
                        c.category = $category
                    RETURN c
                    """, case_id=case_id, 
                         name=self.cases_metadata[case_id]["name"], 
                         description=self.cases_metadata[case_id]["description"], 
                         category=self.cases_metadata[case_id]["category"])
            except Exception as e:
                print(f"[WARN] Error updating Case {case_id} in Neo4j: {e}")

        return self.cases_metadata[case_id]

    def add_cross_case_relation(self, source_case_id, target_case_id, relation_type="SHARED_SUSPECT", description="", confidence=0.88, shared_entity=None):
        """Connects two cases or entities across cases in Neo4j and memory."""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        link_id = f"link_{source_case_id}_{target_case_id}_{len(self.cross_case_links)}"
        link_record = {
            "id": link_id,
            "source_case_id": source_case_id,
            "target_case_id": target_case_id,
            "relation_type": relation_type,
            "description": description or f"Correlated {relation_type.replace('_', ' ').title()}",
            "confidence": float(confidence),
            "shared_entity": shared_entity or "",
            "timestamp": timestamp
        }

        # Store in memory
        self.cross_case_links = [
            l for l in self.cross_case_links 
            if not (l['source_case_id'] == source_case_id and l['target_case_id'] == target_case_id and l['relation_type'] == relation_type)
        ]
        self.cross_case_links.append(link_record)

        # Store in Neo4j
        if self.driver:
            try:
                query = """
                MATCH (c1:Case {id: $src}), (c2:Case {id: $tgt})
                MERGE (c1)-[r:CROSS_CASE_CORRELATION {type: $rel_type}]->(c2)
                SET r.description = $desc,
                    r.confidence = $conf,
                    r.shared_entity = $shared_entity,
                    r.timestamp = $timestamp
                RETURN r
                """
                with self.driver.session() as session:
                    session.run(
                        query,
                        src=source_case_id,
                        tgt=target_case_id,
                        rel_type=relation_type,
                        desc=description,
                        conf=float(confidence),
                        shared_entity=shared_entity or "",
                        timestamp=timestamp
                    )
                print(f"[INFO] Created cross-case link between {source_case_id} and {target_case_id}")
            except Exception as e:
                print(f"[WARN] Error saving cross-case link to Neo4j: {e}")

        return link_record

    def get_cross_case_relations(self):
        """Returns all cross-case correlations."""
        return self.cross_case_links

    def clear_case_data(self, case_id=None):
        """Clears all stored records for a case (or all cases) from memory and Neo4j."""
        if case_id:
            self.memory_store[case_id] = []
            if case_id in self.cases_metadata:
                del self.cases_metadata[case_id]
            self.cross_case_links = [l for l in self.cross_case_links if l['source_case_id'] != case_id and l['target_case_id'] != case_id]
        else:
            self.memory_store.clear()
            self.cross_case_links.clear()
            self.cases_metadata.clear()
        
        if self.driver:
            try:
                with self.driver.session() as session:
                    if case_id:
                        session.run("""
                        MATCH (c:Case {id: $case_id})
                        OPTIONAL MATCH (c)-[:CONTAINS]->(item)
                        DETACH DELETE c, item
                        """, case_id=case_id)
                        session.run("""
                        MATCH (t:WitnessStatement) WHERE NOT (t)<-[:CONTAINS]-(:Case) DETACH DELETE t
                        """)
                        session.run("""
                        MATCH (v:VisualEvidence) WHERE NOT (v)<-[:CONTAINS]-(:Case) DETACH DELETE v
                        """)
                    else:
                        session.run("MATCH (n) DETACH DELETE n")
                print(f"[INFO] Cleared case {case_id} from Neo4j.")
            except Exception as e:
                print(f"[WARN] Error clearing Neo4j case: {e}")
        return {"status": "cleared", "case_id": case_id}
        
    def get_case_context(self, case_id):
        """
        GraphRAG Retrieval: Fetches the entire history of a case from Neo4j 
        so Llama-3 / Ollama can read it before generating the audit log.
        """
        if self.driver:
            try:
                query = """
                MATCH (c:Case {id: $case_id})
                OPTIONAL MATCH (t:WitnessStatement)-[r:CORRELATES_TO]->(v:VisualEvidence)
                WHERE (c)-[:CONTAINS]->(t) AND (c)-[:CONTAINS]->(v)
                RETURN t.text AS statement, v.filename AS video, r.sinkhorn_cost AS cost, r.flagged_contradiction AS is_contradiction
                """
                with self.driver.session() as session:
                    result = session.run(query, case_id=case_id)
                    records = result.data()
                    if records and not all(r.get('statement') is None for r in records):
                        context = "CASE GRAPH HISTORY:\n"
                        for row in records:
                            if row.get('statement') and row.get('video'):
                                context += f"- Statement: '{row['statement']}' | Video: '{row['video']}' | Cost: {row['cost']} ({'CONTRADICTION' if row.get('is_contradiction') else 'CONGRUENT'})\n"
                        return context
            except Exception as e:
                print(f"[WARN] Neo4j query error: {e}")

        # Fallback to memory store
        records = self.memory_store.get(case_id, [])
        if not records:
            return "No previous evidence history found in the graph for this case."
        
        context = "CASE GRAPH HISTORY:\n"
        for row in records:
            context += f"- Statement: '{row['statement_text']}' | Video: '{row['evidence_filename']}' | Cost: {row['sinkhorn_cost']} ({row.get('status', 'EVALUATED')})\n"
        return context

    def create_evidential_link(self, case_id, evidence_filename, statement_text, sinkhorn_cost, timestamp=None, 
                               audit_report=None, is_blurry=False, visual_uncertainty=0.0, quality_label="", 
                               investigator_advisory=None, discrepancy_info=None):
        """
        Creates nodes and edges in Neo4j representing the AI's analysis.
        Lower sinkhorn_cost = stronger correlation.
        """
        if not timestamp:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Auto-register case if missing
        if case_id not in self.cases_metadata:
            self.create_case(case_id=case_id, name=f"Case {case_id}")

        is_contradiction = float(sinkhorn_cost) > 1.15
        record_item = {
            "case_id": case_id,
            "evidence_filename": evidence_filename,
            "statement_text": statement_text,
            "sinkhorn_cost": round(float(sinkhorn_cost), 4),
            "is_contradiction": is_contradiction,
            "is_blurry": bool(is_blurry),
            "visual_uncertainty": float(visual_uncertainty),
            "quality_label": quality_label or ("Severe Degradation / Blur" if is_blurry else "Optimal Visual Clarity"),
            "investigator_advisory": investigator_advisory,
            "discrepancy_info": discrepancy_info,
            "audit_report": audit_report,
            "timestamp": timestamp,
            "status": "CONTRADICTION" if is_contradiction else "CONGRUENT"
        }
        
        # Save to memory store
        if case_id not in self.memory_store:
            self.memory_store[case_id] = []
        
        # Avoid duplicate identical pairs
        self.memory_store[case_id] = [
            r for r in self.memory_store[case_id] 
            if not (r['evidence_filename'] == evidence_filename and r['statement_text'] == statement_text)
        ]
        self.memory_store[case_id].append(record_item)

        # Attempt to save to Neo4j
        if self.driver:
            try:
                case_name = self.cases_metadata.get(case_id, {}).get("name", f"Case {case_id}")
                query = """
                MERGE (c:Case {id: $case_id})
                ON CREATE SET c.name = $case_name, c.created_at = datetime()
                MERGE (v:VisualEvidence {filename: $evidence_filename})
                MERGE (c)-[:CONTAINS]->(v)
                MERGE (t:WitnessStatement {text: $statement_text})
                MERGE (c)-[:CONTAINS]->(t)
                MERGE (t)-[r:CORRELATES_TO]->(v)
                SET r.sinkhorn_cost = $sinkhorn_cost,
                    r.flagged_contradiction = $is_contradiction,
                    r.is_blurry = $is_blurry,
                    r.visual_uncertainty = $visual_uncertainty,
                    r.quality_label = $quality_label,
                    r.investigator_advisory = $investigator_advisory,
                    r.discrepancy_info = $discrepancy_info,
                    r.audit_report = $audit_report,
                    r.timestamp = $timestamp,
                    r.case_id = $case_id
                RETURN v, t, r
                """
                with self.driver.session() as session:
                    result = session.run(
                        query, 
                        case_id=case_id,
                        case_name=case_name,
                        evidence_filename=evidence_filename, 
                        statement_text=statement_text, 
                        sinkhorn_cost=round(float(sinkhorn_cost), 4),
                        is_contradiction=is_contradiction,
                        is_blurry=bool(is_blurry),
                        visual_uncertainty=float(visual_uncertainty),
                        quality_label=quality_label,
                        investigator_advisory=investigator_advisory or "",
                        discrepancy_info=discrepancy_info or "",
                        audit_report=audit_report or "",
                        timestamp=timestamp
                    )
                    return result.single()
            except Exception as e:
                print(f"[WARN] Could not persist to Neo4j, saved to in-memory store: {e}")
        
        return record_item

    def _sanitize_id(self, text):
        """Sanitizes text into a safe node identifier key."""
        clean = re.sub(r'[^a-zA-Z0-9_]', '_', text)
        return clean[:32]

    def get_case_graph(self, case_id):
        """
        Returns full graph nodes, edges, and evidence records for ReactFlow and the Evidence Table for a single case.
        Reuses canonical visual evidence nodes so multiple statements connect cleanly to the same evidence.
        """
        nodes = []
        edges = []
        evidence_list = []
        records = []

        # Case info
        case_info = self.cases_metadata.get(case_id, {
            "id": case_id,
            "name": f"Case {case_id}",
            "description": "Active Case File"
        })

        # Always merge records from Neo4j with local memory store
        records_map = {} # (filename, statement) -> record
        
        # 1. Memory store records
        for m_rec in self.memory_store.get(case_id, []):
            key = (m_rec['evidence_filename'], m_rec['statement_text'])
            records_map[key] = m_rec

        # 2. Neo4j records
        if self.driver:
            try:
                query = """
                MATCH (c:Case {id: $case_id})
                OPTIONAL MATCH (c)-[:CONTAINS]->(t:WitnessStatement)-[r:CORRELATES_TO]->(v:VisualEvidence)
                WHERE (c)-[:CONTAINS]->(v)
                RETURN t.text AS statement, v.filename AS video, r.sinkhorn_cost AS cost, 
                       r.flagged_contradiction AS is_contradiction, r.is_blurry AS is_blurry,
                       r.visual_uncertainty AS visual_uncertainty, r.quality_label AS quality_label,
                       r.investigator_advisory AS investigator_advisory, r.discrepancy_info AS discrepancy_info,
                       r.audit_report AS audit_report, r.timestamp AS timestamp
                """
                with self.driver.session() as session:
                    res = session.run(query, case_id=case_id)
                    neo_records = res.data()
                    for r in neo_records:
                        if r.get('video') and r.get('statement'):
                            key = (r['video'], r['statement'])
                            records_map[key] = {
                                "case_id": case_id,
                                "evidence_filename": r['video'],
                                "statement_text": r['statement'],
                                "sinkhorn_cost": r.get('cost', 0.5),
                                "is_contradiction": r.get('is_contradiction', False),
                                "is_blurry": r.get('is_blurry', False),
                                "visual_uncertainty": r.get('visual_uncertainty', 0.0),
                                "quality_label": r.get('quality_label', "Optimal Visual Clarity"),
                                "investigator_advisory": r.get('investigator_advisory', ""),
                                "discrepancy_info": r.get('discrepancy_info', ""),
                                "audit_report": r.get('audit_report', ""),
                                "timestamp": r.get('timestamp', 'Recorded')
                            }
            except Exception as e:
                print(f"[WARN] Error fetching Neo4j graph: {e}")

        records = list(records_map.values())

        # Root Case Node (Top Center)
        case_node_id = f"case_{case_id}"
        nodes.append({
            "id": case_node_id,
            "position": {"x": 460, "y": 20},
            "data": {
                "label": f"📁 {case_info.get('name', f'Case: #{case_id}')}",
                "case_id": case_id,
                "type": "case"
            },
            "draggable": True,
            "style": {
                "background": "#0f172a",
                "color": "#38bdf8",
                "border": "2px solid #0284c7",
                "borderRadius": "12px",
                "fontWeight": "bold",
                "padding": "12px 20px",
                "cursor": "grab",
                "boxShadow": "0 6px 16px rgba(2, 132, 199, 0.25)"
            }
        })

        if not records:
            return {
                "case_id": case_id,
                "case_info": case_info,
                "nodes": nodes,
                "edges": [],
                "evidence_list": []
            }

        # Track canonical visual nodes and statement nodes for hierarchical tree
        visual_nodes_map = {} # filename -> node_id
        statement_nodes_map = {} # statement_text -> node_id

        # Level 1: Place Visual Evidence Nodes in the middle tier
        vis_y = 150
        for rec in records:
            fn = rec['evidence_filename']
            if fn not in visual_nodes_map:
                v_id = f"vis_{case_id}_{self._sanitize_id(fn)}"
                visual_nodes_map[fn] = v_id
                nodes.append({
                    "id": v_id,
                    "position": {"x": 460, "y": vis_y},
                    "data": {
                        "label": f"🎥 {fn}",
                        "case_id": case_id,
                        "filename": fn,
                        "type": "visual"
                    },
                    "draggable": True,
                    "style": {
                        "background": "#1e293b",
                        "color": "#f8fafc",
                        "border": "2px solid #3b82f6",
                        "borderRadius": "10px",
                        "padding": "10px 16px",
                        "cursor": "grab",
                        "boxShadow": "0 4px 14px rgba(59, 130, 246, 0.25)"
                    }
                })
                # Case -> Visual Tree Root Edge
                edges.append({
                    "id": f"e_case_{v_id}",
                    "source": case_node_id,
                    "target": v_id,
                    "style": {"stroke": "#64748b", "strokeWidth": 1.8, "strokeDasharray": "4 4"}
                })
                vis_y += 140

        # Level 2: Tree Branches - Congruent (Left Wing) and Contradiction (Right Wing)
        cong_idx = 0
        contra_idx = 0

        for s_idx, rec in enumerate(records):
            st = rec['statement_text']
            if st not in statement_nodes_map:
                t_id = f"txt_{case_id}_{s_idx}_{self._sanitize_id(st)}"
                statement_nodes_map[st] = t_id

                stmt_label = st
                if len(stmt_label) > 28:
                    stmt_label = stmt_label[:25] + "..."

                is_contra = rec.get('is_contradiction', False) or float(rec.get('sinkhorn_cost', 0)) > 1.15

                if is_contra:
                    # Right Wing branch for Contradictions
                    pos_x = 820
                    pos_y = 280 + (contra_idx * 120)
                    contra_idx += 1
                    border_color = "#ef4444"
                    shadow_color = "rgba(239, 68, 68, 0.25)"
                    icon = "🔴"
                else:
                    # Left Wing branch for Congruent matches
                    pos_x = 70
                    pos_y = 280 + (cong_idx * 120)
                    cong_idx += 1
                    border_color = "#22c55e"
                    shadow_color = "rgba(34, 197, 94, 0.25)"
                    icon = "🟢"

                nodes.append({
                    "id": t_id,
                    "position": {"x": pos_x, "y": pos_y},
                    "data": {
                        "label": f"{icon} \"{stmt_label}\"",
                        "case_id": case_id,
                        "full_text": st,
                        "is_contradiction": is_contra,
                        "type": "statement"
                    },
                    "draggable": True,
                    "style": {
                        "background": "#1e293b",
                        "color": "#f8fafc",
                        "border": f"1.5px solid {border_color}",
                        "borderRadius": "10px",
                        "padding": "10px 14px",
                        "cursor": "grab",
                        "boxShadow": f"0 4px 14px {shadow_color}"
                    }
                })

        # Evidential Tree Correlation Edges (Visual Evidence <-> Statement Leaves)
        for rec in records:
            fn = rec['evidence_filename']
            st = rec['statement_text']
            v_id = visual_nodes_map.get(fn)
            t_id = statement_nodes_map.get(st)

            if v_id and t_id:
                is_contra = rec.get('is_contradiction', False) or float(rec.get('sinkhorn_cost', 0)) > 1.15
                cost_val = rec.get('sinkhorn_cost', 0.0)
                edge_color = "#ef4444" if is_contra else "#22c55e"
                edge_label = f"Cost: {cost_val} ({'CONTRADICTION' if is_contra else 'CONGRUENT'})"

                edges.append({
                    "id": f"e_{v_id}_{t_id}",
                    "source": v_id,
                    "target": t_id,
                    "label": edge_label,
                    "animated": is_contra,
                    "style": {
                        "stroke": edge_color, 
                        "strokeWidth": 2.2 if is_contra else 1.8,
                        "strokeDasharray": "4 4" if is_contra else None
                    }
                })

            evidence_list.append(rec)

        return {
            "case_id": case_id,
            "case_info": case_info,
            "nodes": nodes,
            "edges": edges,
            "evidence_list": evidence_list
        }

    def get_multi_case_graph(self):
        """
        Constructs a comprehensive, unified Multi-Case Graph showing ALL cases, 
        their respective canonical evidence nodes, statements, and cross-case correlation links.
        """
        all_cases = self.get_cases()
        all_nodes = []
        all_edges = []
        all_evidence = []

        palette = [
            {"border": "#0284c7", "text": "#38bdf8", "vis": "#3b82f6", "stmt": "#a855f7", "shadow": "rgba(2, 132, 199, 0.25)"}, # Blue
            {"border": "#059669", "text": "#34d399", "vis": "#10b981", "stmt": "#8b5cf6", "shadow": "rgba(5, 150, 105, 0.25)"}, # Emerald
            {"border": "#d97706", "text": "#fbbf24", "vis": "#f59e0b", "stmt": "#ec4899", "shadow": "rgba(217, 119, 6, 0.25)"}, # Amber
            {"border": "#9333ea", "text": "#c084fc", "vis": "#a855f7", "stmt": "#06b6d4", "shadow": "rgba(147, 51, 234, 0.25)"}, # Purple
            {"border": "#e11d48", "text": "#fb7185", "vis": "#f43f5e", "stmt": "#14b8a6", "shadow": "rgba(225, 29, 72, 0.25)"}, # Rose
            {"border": "#0d9488", "text": "#2dd4bf", "vis": "#14b8a6", "stmt": "#6366f1", "shadow": "rgba(13, 148, 136, 0.25)"}, # Teal
        ]

        case_x_spacing = 1100
        case_idx = 0

        for c in all_cases:
            cid = c['id']
            case_base_x = 50 + case_idx * case_x_spacing
            case_idx += 1

            # Get case graph data (which already has tree structure)
            c_data = self.get_case_graph(cid)
            records = c_data.get("evidence_list", [])
            all_evidence.extend(records)

            # Offset nodes for this case
            for n in c_data.get("nodes", []):
                offset_node = dict(n)
                offset_node["position"] = {
                    "x": n["position"]["x"] + case_base_x,
                    "y": n["position"]["y"]
                }
                all_nodes.append(offset_node)

            for e in c_data.get("edges", []):
                all_edges.append(e)

        # Cross-case relational edges between Cases
        for link in self.cross_case_links:
            src_id = f"case_{link['source_case_id']}"
            tgt_id = f"case_{link['target_case_id']}"
            all_edges.append({
                "id": link['id'],
                "source": src_id,
                "target": tgt_id,
                "label": f"🔗 {link['relation_type'].replace('_', ' ')} ({int(link.get('confidence', 0.85)*100)}%)",
                "animated": True,
                "style": {
                    "stroke": "#f59e0b",
                    "strokeWidth": 2.8,
                    "strokeDasharray": "5 5"
                }
            })

        return {
            "mode": "multi_case",
            "total_cases": len(all_cases),
            "cases": all_cases,
            "nodes": all_nodes,
            "edges": all_edges,
            "cross_case_links": self.cross_case_links,
            "evidence_list": all_evidence
        }
