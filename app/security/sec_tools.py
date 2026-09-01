"""
JARVIS THIRU — Security Lab Suite
Purely defensive/educational: hashing, encoding, port scanning, network diagnostics.
All destructive operations require explicit user confirmation.
"""
import hashlib
import base64
import socket
from typing import Dict, Tuple, List
from app.utils.logger import get_logger

logger = get_logger("SecurityLab")


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

def hash_text(text: str, algorithms: List[str] = None) -> Dict[str, str]:
    """
    Hash a string with multiple algorithms.
    :param text: input string
    :param algorithms: list of hashlib algorithm names; default = [md5, sha1, sha256, sha512]
    """
    if algorithms is None:
        algorithms = ["md5", "sha1", "sha256", "sha512"]
    result = {}
    encoded = text.encode("utf-8")
    for algo in algorithms:
        try:
            h = hashlib.new(algo, encoded)
            result[algo] = h.hexdigest()
        except ValueError:
            result[algo] = f"Unsupported algorithm: {algo}"
    return result


def hash_file(path: str, algorithm: str = "sha256") -> Tuple[bool, str]:
    """Compute the hash of a file."""
    try:
        h = hashlib.new(algorithm)
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        digest = h.hexdigest()
        logger.info(f"Hashed file {path} ({algorithm}): {digest}")
        return True, digest
    except FileNotFoundError:
        return False, f"File not found: {path}"
    except Exception as exc:
        return False, str(exc)


# ---------------------------------------------------------------------------
# Encoding / Decoding
# ---------------------------------------------------------------------------

def base64_encode(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


def base64_decode(encoded: str) -> Tuple[bool, str]:
    try:
        decoded = base64.b64decode(encoded).decode("utf-8")
        return True, decoded
    except Exception as exc:
        return False, f"Base64 decode error: {exc}"


def hex_encode(text: str) -> str:
    return text.encode("utf-8").hex()


def hex_decode(hex_str: str) -> Tuple[bool, str]:
    try:
        decoded = bytes.fromhex(hex_str.replace(" ", "")).decode("utf-8")
        return True, decoded
    except Exception as exc:
        return False, f"Hex decode error: {exc}"


def rot13(text: str) -> str:
    import codecs
    return codecs.encode(text, "rot_13")


# ---------------------------------------------------------------------------
# Network diagnostics
# ---------------------------------------------------------------------------

def ping_host(host: str, count: int = 4) -> Tuple[bool, str]:
    """Ping a host and return (success, output)."""
    import subprocess
    try:
        result = subprocess.run(
            ["ping", "-n", str(count), host],
            capture_output=True, text=True, timeout=15
        )
        return result.returncode == 0, result.stdout.strip()
    except Exception as exc:
        return False, str(exc)


def dns_lookup(hostname: str) -> Tuple[bool, str]:
    """Resolve hostname to IP addresses."""
    try:
        info = socket.getaddrinfo(hostname, None)
        ips = list({r[4][0] for r in info})
        return True, ", ".join(ips)
    except socket.gaierror as e:
        return False, f"DNS lookup failed: {e}"


def port_scan(host: str, ports: List[int] = None, timeout: float = 0.5) -> Dict[int, bool]:
    """
    Scan a list of ports on a host using TCP connect (socket).
    Default ports: common well-known services.
    Returns {port: is_open}.
    """
    if ports is None:
        ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443]
    logger.info(f"Port scanning {host} on {len(ports)} ports.")
    results: Dict[int, bool] = {}
    for port in ports:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                results[port] = True
        except (ConnectionRefusedError, socket.timeout, OSError):
            results[port] = False
    return results


def format_port_scan(host: str, results: Dict[int, bool]) -> str:
    open_ports = [str(p) for p, o in results.items() if o]
    closed_ports = [str(p) for p, o in results.items() if not o]
    lines = [f"🔍 Port scan results for **{host}**:"]
    if open_ports:
        lines.append(f"  ✅ Open:   {', '.join(open_ports)}")
    else:
        lines.append("  ✅ Open:   (none in scanned range)")
    lines.append(f"  ❌ Closed: {', '.join(closed_ports[:15])}{'…' if len(closed_ports) > 15 else ''}")
    return "\n".join(lines)


def whois_info(host: str) -> str:
    """Basic WHOIS by querying whois.iana.org (TCP port 43)."""
    try:
        with socket.create_connection(("whois.iana.org", 43), timeout=5) as s:
            s.sendall((host + "\r\n").encode())
            data = b""
            while True:
                chunk = s.recv(4096)
                if not chunk:
                    break
                data += chunk
        return data.decode("utf-8", errors="replace")[:1500]
    except Exception as exc:
        return f"WHOIS error: {exc}"


def get_local_network_info() -> Dict[str, str]:
    """Return local hostname and IP addresses."""
    info: Dict[str, str] = {}
    try:
        hostname = socket.gethostname()
        info["hostname"] = hostname
        info["local_ip"] = socket.gethostbyname(hostname)
    except Exception:
        info["hostname"] = "unknown"
        info["local_ip"] = "unknown"
    return info
