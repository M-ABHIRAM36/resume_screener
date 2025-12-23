import json
from typing import List
from pathlib import Path

SKILLS_PATH = Path(__file__).parent.parent / 'data' / 'skills.json'

_skills = None


def load_skills():
    global _skills
    if _skills is None:
        try:
            _skills = [s.lower() for s in json.loads(SKILLS_PATH.read_text())]
        except Exception:
            _skills = []
    return _skills


def extract_skills(text: str) -> List[str]:
    text_l = (text or '').lower()
    skills = []
    for s in load_skills():
        if s and s in text_l:
            skills.append(s)
    # return unique preserving order
    seen = set()
    out = []
    for s in skills:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out
