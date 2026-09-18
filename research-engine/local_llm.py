from langchain_community.llms import Ollama

def generate_audit_report(sinkhorn_cost, statement_text, evidence_filename):
    """
    Sends the mathematical data to our local Llama-3 model to generate 
    a natural language report for the detective.
    """
    print("🧠 Waking up local Llama-3 Model...")
    
    # Connect to the Ollama service running in the background
    llm = Ollama(model="llama3", temperature=0)
    
    # Create the prompt combining our math and evidence
    prompt = f"""
    You are an AI Forensic Analyst. Review the following evidence alignment.
    
    Evidence File: {evidence_filename}
    Witness Statement: "{statement_text}"
    Mathematical Contradiction Cost: {sinkhorn_cost} (A score above 1.15 is highly suspicious)
    
    Write a brief, 2-sentence audit log summarizing if the statement matches the video evidence.
    Keep it professional and objective.
    """
    
    print("⏳ Thinking... (This runs entirely on your local hardware)")
    response = llm.invoke(prompt)
    
    return response

# Test it directly
if __name__ == "__main__":
    # We will simulate the exact data you just pushed to Neo4j
    test_cost = 1.1378
    test_statement = "There was a red square on the camera."
    test_file = "cctv_sample.mp4"
    
    report = generate_audit_report(test_cost, test_statement, test_file)
    
    print("\n" + "="*50)
    print("📝 LLM AUDIT REPORT:")
    print(report)
    print("="*50)
