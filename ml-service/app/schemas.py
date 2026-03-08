from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class AnalyzeResponse(BaseModel):
    candidateId: str
    name: str
    email: str = ''
    phone: Optional[str] = None
    skills: List[str] = []
    matchedSkills: List[str] = []
    missingSkills: List[str] = []
    experience: int = 0
    internships: Optional[List[str]] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    degree: Optional[str] = None
    location: Optional[str] = None
    portfolioLinks: Optional[List[str]] = None
    matchPercentage: int = 0
    score: int = 0
    resumeStrength: str = 'Weak'
    jobFitLevel: str = 'Low'
    categoryScores: Optional[Dict[str, int]] = None
    bonusFactors: Optional[Dict[str, Any]] = None
