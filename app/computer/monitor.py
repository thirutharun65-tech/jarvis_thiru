"""
JARVIS THIRU — Real-Time System Monitor
Returns live CPU, RAM, disk, battery, network, and GPU stats via psutil.
"""
import time
from typing import Dict, Any, Optional
from app.utils.logger import get_logger

logger = get_logger("SystemMonitor")


def get_system_stats() -> Dict[str, Any]:
    """Return a comprehensive snapshot of system resources."""
    try:
        import psutil
        cpu_pct      = psutil.cpu_percent(interval=0.2)
        cpu_freq     = psutil.cpu_freq()
        mem          = psutil.virtual_memory()
        swap         = psutil.swap_memory()
        disk_parts   = psutil.disk_partitions()
        net_io       = psutil.net_io_counters()
        battery      = psutil.sensors_battery()

        disks = []
        for part in disk_parts:
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disks.append({
                    "device":      part.device,
                    "mountpoint":  part.mountpoint,
                    "total_gb":    round(usage.total / 1e9, 1),
                    "used_gb":     round(usage.used  / 1e9, 1),
                    "free_gb":     round(usage.free  / 1e9, 1),
                    "percent":     usage.percent,
                })
            except PermissionError:
                continue

        stats: Dict[str, Any] = {
            "cpu": {
                "percent":   cpu_pct,
                "cores":     psutil.cpu_count(logical=False),
                "threads":   psutil.cpu_count(logical=True),
                "freq_mhz":  round(cpu_freq.current, 1) if cpu_freq else None,
            },
            "ram": {
                "total_gb":  round(mem.total / 1e9, 2),
                "used_gb":   round(mem.used  / 1e9, 2),
                "percent":   mem.percent,
                "available_gb": round(mem.available / 1e9, 2),
            },
            "swap": {
                "total_gb":  round(swap.total / 1e9, 2),
                "used_gb":   round(swap.used  / 1e9, 2),
                "percent":   swap.percent,
            },
            "disks": disks,
            "network": {
                "bytes_sent_mb":  round(net_io.bytes_sent   / 1e6, 2),
                "bytes_recv_mb":  round(net_io.bytes_recv   / 1e6, 2),
                "packets_sent":   net_io.packets_sent,
                "packets_recv":   net_io.packets_recv,
            },
            "battery": None,
        }

        if battery:
            stats["battery"] = {
                "percent":  battery.percent,
                "plugged":  battery.power_plugged,
                "secs_left": battery.secsleft if battery.secsleft != psutil.POWER_TIME_UNLIMITED else None,
            }

        return stats
    except Exception as exc:
        logger.error(f"get_system_stats error: {exc}")
        return {"error": str(exc)}


def get_top_processes(n: int = 10) -> list:
    """Return the top-N CPU-consuming processes."""
    try:
        import psutil
        procs = []
        for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            try:
                procs.append(p.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        procs.sort(key=lambda x: x.get("cpu_percent", 0), reverse=True)
        return procs[:n]
    except Exception as exc:
        logger.error(f"get_top_processes error: {exc}")
        return []


def format_stats_text(stats: Dict[str, Any]) -> str:
    """Format system stats as a human-readable string for the chat panel."""
    if "error" in stats:
        return f"⚠️ Could not read system stats: {stats['error']}"

    cpu  = stats.get("cpu", {})
    ram  = stats.get("ram", {})
    bat  = stats.get("battery")
    net  = stats.get("network", {})
    disks = stats.get("disks", [])

    lines = [
        f"🖥️ **CPU**: {cpu.get('percent', '?')}% @ {cpu.get('freq_mhz', '?')} MHz ({cpu.get('threads', '?')} threads)",
        f"💾 **RAM**: {ram.get('used_gb', '?')} / {ram.get('total_gb', '?')} GB ({ram.get('percent', '?')}%)",
    ]
    for d in disks[:2]:
        lines.append(f"💿 **Disk {d['device']}**: {d['used_gb']}/{d['total_gb']} GB ({d['percent']}%)")
    lines.append(f"🌐 **Net**: ↑{net.get('bytes_sent_mb','?')} MB  ↓{net.get('bytes_recv_mb','?')} MB")
    if bat:
        plug = "🔌 Plugged" if bat.get("plugged") else "🔋 On Battery"
        lines.append(f"🔋 **Battery**: {bat.get('percent', '?')}% — {plug}")
    return "\n".join(lines)
