from pydantic import BaseModel
from typing import List, Optional

class AnalyzeResponse(BaseModel):
    candidateId: str
    name: str
    email: str
    phone: Optional[str] = None
    skills: List[str]
    missingSkills: List[str]
    experience: int
    internships: Optional[List[str]] = None
    college: Optional[str]
    location: Optional[str]
    portfolioLinks: Optional[List[str]] = None
    matchPercentage: int
    score: int
    resumeStrength: str
    jobFitLevel: str
