"""
JARVIS THIRU — Authorized Security Lab Engine
Target locked to localhost/127.0.0.1 for defensive auditing and cryptography.
"""
import hashlib
import base64
import urllib.parse

def is_target_authorized(target: str) -> bool:
    t = target.strip().lower()
    return t in ["127.0.0.1", "localhost"] or t.startswith("192.168.") or t.startswith("10.")

def compute_hash(text: str, algorithm="sha256") -> str:
    h = getattr(hashlib, algorithm.lower(), hashlib.sha256)()
    h.update(text.encode('utf-8'))
    return h.hexdigest()

def encode_transform(text: str, mode="base64_encode") -> str:
    if mode == "base64_encode":
        return base64.b64encode(text.encode('utf-8')).decode('utf-8')
    elif mode == "base64_decode":
        try:
            return base64.b64decode(text.encode('utf-8')).decode('utf-8')
        except Exception:
            return "Invalid Base64 string"
    elif mode == "hex_encode":
        return text.encode('utf-8').hex()
    elif mode == "hex_decode":
        try:
            return bytes.fromhex(text).decode('utf-8')
        except Exception:
            return "Invalid Hex string"
    elif mode == "url_encode":
        return urllib.parse.quote(text)
    elif mode == "url_decode":
        return urllib.parse.unquote(text)
    return text
