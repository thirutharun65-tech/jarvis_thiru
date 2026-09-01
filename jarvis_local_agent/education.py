"""
JARVIS THIRU — Computer Science & Engineering Education Agent
Structured modules, practice questions, problem hints, and multilingual support (EN, TA, Tanglish).
"""
from typing import Dict, Any, List

EDUCATION_MODULES = {
    "dsa": {
        "title": "Data Structures & Algorithms",
        "topics": ["Arrays", "Linked Lists", "Stacks & Queues", "Binary Trees", "Graphs", "Dynamic Programming", "Sorting & Searching"],
        "summary": "Core algorithmic techniques, time/space complexity analysis (Big-O), and pointer-based structures."
    },
    "os": {
        "title": "Operating Systems",
        "topics": ["Process Scheduling", "Virtual Memory & Paging", "Deadlocks & Semaphores", "File Systems", "System Calls"],
        "summary": "Kernel architecture, concurrency primitives, thread synchronization, and CPU scheduling."
    },
    "dbms": {
        "title": "Database Management Systems",
        "topics": ["ACID Properties", "Normalization (1NF-BCNF)", "Indexing (B-Tree/Hash)", "SQL vs NoSQL", "Transactions"],
        "summary": "Relational algebra, transaction concurrency control, query optimization, and storage engines."
    },
    "networks": {
        "title": "Computer Networks",
        "topics": ["OSI & TCP/IP Stack", "Routing Algorithms", "HTTP/HTTPS & WebSockets", "DNS & IP Addressing", "Socket Programming"],
        "summary": "Layered protocol stacks, packet switching, transport layer flow/congestion control, and network security."
    }
}

PRACTICE_PROBLEMS = [
    {
        "id": "p1",
        "title": "Reverse a Linked List",
        "category": "dsa",
        "difficulty": "Easy",
        "language": "python",
        "prompt": "Given the head of a singly linked list, reverse the list and return its reversed head.",
        "starterCode": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverseList(head):\n    # Write your solution here\n    pass\n",
        "hint": "Use 3 pointers: prev (None), curr (head), and next_temp. Iterate through the list adjusting pointer directions.",
        "explanation": {
            "en": "Initialize prev to None. Iterate through curr, temporarily store curr.next, point curr.next to prev, then advance prev and curr.",
            "ta": "prev = None என தொடங்கவும். ஒவ்வொரு node-ன் next pointer-ஐ prev-க்கு மாற்றி, முன்னேறி செல்லவும்.",
            "tanglish": "First prev pointer-ah None-la vechitu, curr node-oda next-ah prev-ku point panna vaikanum bro."
        }
    },
    {
        "id": "p2",
        "title": "Binary Search",
        "category": "dsa",
        "difficulty": "Easy",
        "language": "java",
        "prompt": "Implement binary search to find target in a sorted ascending array in O(log N) time.",
        "starterCode": "public class BinarySearch {\n    public static int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n}\n",
        "hint": "Maintain low and high indices. Calculate mid = low + (high - low) / 2 to avoid overflow.",
        "explanation": {
            "en": "Halve search space each step: compare nums[mid] to target. If target is smaller, high = mid - 1; otherwise low = mid + 1.",
            "ta": "வரிசைப்படுத்தப்பட்ட அணியில் நடுப்புள்ளியை (mid) கண்டறிந்து தேடலை பாதியாக குறைக்கவும்.",
            "tanglish": "Sorted array-la mid element kandupidichi, target perusa irundha right side, chinadha irundha left side search panrom."
        }
    }
]

class EducationAgent:
    def get_modules(self) -> Dict[str, Any]:
        return EDUCATION_MODULES

    def get_practice_problems(self, category: str = None) -> List[Dict[str, Any]]:
        if not category:
            return PRACTICE_PROBLEMS
        return [p for p in PRACTICE_PROBLEMS if p["category"] == category.lower()]

    def explain_topic(self, topic: str, lang: str = "EN") -> str:
        t = topic.lower()
        if "linked list" in t:
            if lang == "TA":
                return "இணைக்கப்பட்ட பட்டியல் (Linked List) என்பது அடுத்தடுத்த நினைவக முகவரிகளை (Memory Addresses) இணைக்கும் கணுக்களின் (Nodes) வரிசையாகும்."
            elif lang == "TANGLISH":
                return "Linked List-na continuous memory illama, pointers moolama connect aagura nodes collection bro."
            return "A Linked List is a linear data structure where elements are not stored at contiguous memory locations; elements are linked using pointers."
        return f"Educational analysis for '{topic}' ready."
