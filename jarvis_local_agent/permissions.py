"""
JARVIS THIRU — Permissions Manager
Normal, Confirm, and Restricted enforcement for OS operations.
"""
from typing import Dict, Any

PERMISSION_LEVELS = {
    "READ_ONLY": 0,
    "NORMAL": 1,
    "CONFIRM": 2,
    "RESTRICTED": 3
}

DANGEROUS_ACTIONS = {
    "shutdown", "restart", "reboot", "format_disk",
    "delete_file", "kill_system_process", "modify_registry"
}

class PermissionManager:
    def __init__(self, default_level: str = "NORMAL"):
        self.current_level = default_level

    def set_level(self, level: str):
        if level in PERMISSION_LEVELS:
            self.current_level = level
            return True
        return False

    def check_permission(self, action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        action_lower = action.lower()
        if action_lower in DANGEROUS_ACTIONS:
            return {
                "allowed": False,
                "requires_confirmation": True,
                "reason": f"Action '{action}' is potentially destructive and requires explicit user confirmation."
            }
        
        if self.current_level == "READ_ONLY" and not action_lower.startswith(("get", "read", "inspect", "view", "list")):
            return {
                "allowed": False,
                "requires_confirmation": False,
                "reason": "Agent is in READ_ONLY mode. Write and execute operations are locked."
            }
            
        return {
            "allowed": True,
            "requires_confirmation": False,
            "reason": "Permitted under NORMAL policy."
        }
