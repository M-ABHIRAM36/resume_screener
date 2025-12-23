from pydantic import BaseModel
from typing import List, Optional

class AnalyzeResponse(BaseModel):
    candidateId: str
    name: str
    email: str
    skills: List[str]
    missingSkills: List[str]
    experience: int
    college: Optional[str]
    location: Optional[str]
    matchPercentage: int
    score: int
    resumeStrength: str
    jobFitLevel: str
