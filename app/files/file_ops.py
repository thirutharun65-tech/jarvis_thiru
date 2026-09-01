"""
JARVIS THIRU — File Intelligence
File searching, reading, organizing, and project scanning utilities.
"""
import os
import shutil
import hashlib
from pathlib import Path
from typing import List, Tuple, Dict
from app.utils.logger import get_logger

logger = get_logger("FileOps")

def search_files(directory: str, keyword: str, limit: int = 20) -> List[str]:
    """Search for files containing a keyword in their name."""
    results = []
    try:
        base_dir = Path(directory).expanduser()
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if keyword.lower() in file.lower():
                    results.append(os.path.join(root, file))
                    if len(results) >= limit:
                        return results
    except Exception as exc:
        logger.error(f"search_files error: {exc}")
    return results

def get_file_info(path: str) -> str:
    """Return file size and extension info."""
    try:
        p = Path(path).expanduser()
        if not p.exists():
            return f"File not found: {path}"
        
        stat = p.stat()
        size_mb = stat.st_size / (1024 * 1024)
        ext = p.suffix or "No extension"
        
        return f"File: {p.name}\nSize: {size_mb:.2f} MB\nExtension: {ext}\nPath: {p.absolute()}"
    except Exception as exc:
        return f"Error getting info for {path}: {exc}"

def find_duplicates(directory: str) -> Dict[str, List[str]]:
    """Find duplicate files in a directory by size and SHA-256 hash."""
    from collections import defaultdict
    hashes = defaultdict(list)
    try:
        base_dir = Path(directory).expanduser()
        for p in base_dir.rglob("*"):
            if p.is_file():
                try:
                    # Skip massive files to avoid freezing
                    if p.stat().st_size > 50 * 1024 * 1024:
                        continue
                    
                    h = hashlib.sha256()
                    with open(p, "rb") as f:
                        for chunk in iter(lambda: f.read(65536), b""):
                            h.update(chunk)
                    hashes[h.hexdigest()].append(str(p))
                except Exception:
                    continue
                    
        # Filter only duplicates
        return {k: v for k, v in hashes.items() if len(v) > 1}
    except Exception as exc:
        logger.error(f"find_duplicates error: {exc}")
        return {}

def organize_folder(directory: str) -> Tuple[bool, str]:
    """
    Organize a folder by moving files into subfolders based on extension.
    (e.g., Images, Documents, Videos, Code)
    """
    EXT_MAP = {
        "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg"],
        "Documents": [".pdf", ".doc", ".docx", ".txt", ".xlsx", ".pptx", ".csv"],
        "Videos": [".mp4", ".mkv", ".avi", ".mov"],
        "Audio": [".mp3", ".wav", ".flac", ".aac"],
        "Archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
        "Code": [".py", ".js", ".html", ".css", ".json", ".cpp", ".c", ".java"]
    }
    
    try:
        base_dir = Path(directory).expanduser()
        if not base_dir.is_dir():
            return False, f"Not a valid directory: {directory}"
            
        moved_count = 0
        for p in base_dir.iterdir():
            if not p.is_file():
                continue
                
            ext = p.suffix.lower()
            category = "Others"
            
            for cat, exts in EXT_MAP.items():
                if ext in exts:
                    category = cat
                    break
                    
            cat_dir = base_dir / category
            cat_dir.mkdir(exist_ok=True)
            
            try:
                shutil.move(str(p), str(cat_dir / p.name))
                moved_count += 1
            except Exception as e:
                logger.warning(f"Could not move {p.name}: {e}")
                
        return True, f"Organized {moved_count} files in {directory} into categorized folders."
    except Exception as exc:
        return False, f"Folder organization error: {exc}"
