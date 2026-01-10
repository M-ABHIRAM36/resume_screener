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
    """Extract skills from text with improved matching"""
    if not text:
        return []
    
    text_l = (text or '').lower()
    skills_list = load_skills()
    found_skills = []
    seen = set()
    
    # Skill variations mapping
    skill_variations = {
        'javascript': ['js', 'javascript', 'ecmascript', 'es6', 'es7', 'nodejs', 'node.js'],
        'typescript': ['ts', 'typescript'],
        'react': ['react', 'reactjs', 'react.js', 'reactjs'],
        'node.js': ['nodejs', 'node.js', 'node', 'nodejs'],
        'python': ['python', 'py', 'python3'],
        'java': ['java', 'j2ee', 'j2se'],
        'c++': ['c++', 'cpp', 'c plus plus'],
        'c#': ['c#', 'csharp', 'dotnet', '.net'],
        'sql': ['sql', 'mysql', 'postgresql', 'sql server'],
        'mongodb': ['mongodb', 'mongo', 'nosql'],
        'aws': ['aws', 'amazon web services', 's3', 'ec2'],
        'docker': ['docker', 'dockerfile', 'containers'],
        'kubernetes': ['kubernetes', 'k8s', 'kube'],
        'git': ['git', 'github', 'gitlab', 'version control'],
        'html': ['html', 'html5'],
        'css': ['css', 'css3', 'styling'],
        'rest': ['rest', 'restful', 'rest api'],
        'graphql': ['graphql', 'gql'],
    }
    
    # Check for exact matches and variations
    for skill in skills_list:
        if not skill:
            continue
        
        skill_lower = skill.lower()
        
        # Direct match
        if skill_lower in text_l:
            if skill_lower not in seen:
                seen.add(skill_lower)
                found_skills.append(skill)
            continue
        
        # Check variations
        if skill_lower in skill_variations:
            for variant in skill_variations[skill_lower]:
                if variant in text_l:
                    if skill_lower not in seen:
                        seen.add(skill_lower)
                        found_skills.append(skill)
                    break
        
        # Word boundary matching (e.g., "react" should match "react" but not "reaction")
        import re
        pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if re.search(pattern, text_l):
            if skill_lower not in seen:
                seen.add(skill_lower)
                found_skills.append(skill)
    
    # Also look for common tech keywords that might not be in skills.json
    common_tech_keywords = {
        'express': 'Express',
        'angular': 'Angular',
        'vue': 'Vue.js',
        'django': 'Django',
        'flask': 'Flask',
        'spring': 'Spring Boot',
        'laravel': 'Laravel',
        'ruby': 'Ruby',
        'rails': 'Ruby on Rails',
        'php': 'PHP',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'tensorflow': 'TensorFlow',
        'pytorch': 'PyTorch',
        'pandas': 'Pandas',
        'numpy': 'NumPy',
        'scikit-learn': 'Scikit-learn',
        'selenium': 'Selenium',
        'jira': 'JIRA',
        'agile': 'Agile',
        'scrum': 'Scrum',
    }
    
    for keyword, display_name in common_tech_keywords.items():
        if keyword in text_l and display_name.lower() not in seen:
            seen.add(display_name.lower())
            found_skills.append(display_name)
    
    return found_skills
