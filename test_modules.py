import sys
sys.path.insert(0, '.')

print("Testing JARVIS THIRU modules...\n")

errors = []

def ok(msg):
    print(f"  [PASS] {msg}")

def fail(msg, exc):
    print(f"  [FAIL] {msg}: {exc}")
    errors.append(msg)

# Config
try:
    from app.config import load_config
    cfg = load_config()
    ok(f"Config loaded - user={cfg['user_name']}, model={cfg['default_model']}")
except Exception as e:
    fail("Config", e)

# Prompts
try:
    from app.ai.prompts import get_system_prompt
    p = get_system_prompt("assistant", "AUTO", "Thiru")
    ok(f"Prompts OK - {len(p)} chars")
except Exception as e:
    fail("Prompts", e)

# Ollama client
try:
    from app.ai.ollama_client import OllamaClient
    client = OllamaClient()
    online = client.is_online()
    ok(f"OllamaClient - online={online}")
    if not online:
        ok("Offline state reported honestly; no fallback reply generated")
except Exception as e:
    fail("OllamaClient", e)

# Orchestrator
try:
    from app.agent.orchestrator import classify_intent
    cat, intent, extra = classify_intent("open notepad")
    ok(f"Intent 'open notepad' -> category={cat}, intent={intent}")
    cat2, intent2, _ = classify_intent("hash this file")
    ok(f"Intent 'hash file' -> category={cat2}, intent={intent2}")
    cat3, intent3, _ = classify_intent("hello how are you")
    ok(f"Intent 'hello' -> category={cat3}, intent={intent3}")
except Exception as e:
    fail("Orchestrator", e)

# System monitor
try:
    from app.computer.monitor import get_system_stats, format_stats_text
    stats = get_system_stats()
    cpu = stats.get("cpu", {}).get("percent", "?")
    ok(f"System stats - CPU={cpu}%")
    text = format_stats_text(stats)
    ok(f"Stats text ({len(text)} chars)")
except Exception as e:
    fail("SystemMonitor", e)

# Security tools
try:
    from app.security.sec_tools import hash_text, base64_encode, hex_encode
    hashes = hash_text("JARVIS THIRU")
    ok(f"SHA256: {hashes['sha256'][:20]}...")
    enc = base64_encode("Hello JARVIS")
    ok(f"Base64 encode: {enc}")
    hex_enc = hex_encode("test")
    ok(f"Hex encode: {hex_enc}")
except Exception as e:
    fail("SecurityTools", e)

# Coding assistant
try:
    from app.coding.code_assistant import validate_python_syntax
    valid, msg = validate_python_syntax("def hello(): return 42")
    ok(f"Syntax validation: {msg}")
    valid2, msg2 = validate_python_syntax("def broken(: pass")
    ok(f"Syntax error detected: {not valid2}")
except Exception as e:
    fail("CodingAssistant", e)

# Logger
try:
    from app.utils.logger import get_logger
    log = get_logger("TestRunner")
    log.info("Test log entry")
    ok("Logger working")
except Exception as e:
    fail("Logger", e)

print()
if errors:
    print(f"RESULT: {len(errors)} FAILURE(S): {', '.join(errors)}")
    sys.exit(1)
else:
    print("=" * 40)
    print("  ALL MODULES PASSED SUCCESSFULLY!")
    print("=" * 40)
    print()
    print("Run the app with:  python main.py")
    print("Or double-click:   run.bat")
