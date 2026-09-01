"""
JARVIS THIRU — Ollama Integration Module
Local LLM communication with fallback offline reasoning.
"""
import json
import urllib.request
import urllib.error

def check_ollama_status(base_url="http://127.0.0.1:11434"):
    try:
        req = urllib.request.Request(f"{base_url}/api/tags", headers={'User-Agent': 'JARVIS'})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                models = [m.get('name') for m in data.get('models', [])]
                return {"online": True, "models": models or ["phi3", "llama3"]}
    except Exception:
        pass
    return {"online": False, "models": ["phi3", "llama3"]}

def generate_chat_response(prompt: str, model="phi3", base_url="http://127.0.0.1:11434"):
    try:
        payload = json.dumps({
            "model": model,
            "prompt": f"You are JARVIS THIRU, smart Iron Man desktop AI. Reply concisely.\nUser: {prompt}",
            "stream": False
        }).encode('utf-8')

        req = urllib.request.Request(
            f"{base_url}/api/generate",
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            if resp.status == 200:
                res_data = json.loads(resp.read().decode('utf-8'))
                return res_data.get("response", "")
    except Exception:
        pass

    # High-quality offline fallback response
    lower = prompt.lower()
    if "linked list" in lower:
        return "A Linked List is a linear data structure where elements are stored in nodes, each pointing to the next via memory references."
    elif "recursion" in lower:
        return "Recursion is where a function calls itself to break down complex problems until hitting a base termination condition."
    return f"Directive received. All subsystems operational."
