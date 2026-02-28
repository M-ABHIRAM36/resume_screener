import json
import re
from typing import List
from pathlib import Path

SKILLS_PATH = Path(__file__).parent.parent / 'data' / 'skills.json'

_skills = None

# Canonical skill mapping: canonical_name -> [variations]
SKILL_VARIATIONS = {
    'JavaScript': ['js', 'javascript', 'ecmascript', 'es6', 'es7'],
    'TypeScript': ['ts', 'typescript'],
    'React': ['react', 'reactjs', 'react.js'],
    'Node.js': ['nodejs', 'node.js'],
    'Python': ['python', 'python3', 'python 3'],
    'Java': ['java', 'j2ee', 'j2se'],
    'C++': ['c++', 'cpp', 'c plus plus'],
    'C#': ['c#', 'csharp', 'c sharp'],
    'C': ['\\bc\\b'],
    '.NET': ['dotnet', '.net', 'asp.net'],
    'SQL': ['sql'],
    'MySQL': ['mysql'],
    'PostgreSQL': ['postgresql', 'postgres'],
    'MongoDB': ['mongodb', 'mongo'],
    'NoSQL': ['nosql'],
    'AWS': ['aws', 'amazon web services'],
    'Docker': ['docker', 'dockerfile'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'Git': ['git'],
    'GitHub': ['github'],
    'GitLab': ['gitlab'],
    'HTML': ['html', 'html5'],
    'CSS': ['css', 'css3'],
    'REST API': ['rest', 'restful', 'rest api', 'restful api'],
    'GraphQL': ['graphql', 'gql'],
    'Express': ['express', 'expressjs', 'express.js'],
    'Angular': ['angular', 'angularjs'],
    'Vue.js': ['vue', 'vuejs', 'vue.js'],
    'Next.js': ['next.js', 'nextjs'],
    'Django': ['django'],
    'Flask': ['flask'],
    'FastAPI': ['fastapi'],
    'Spring Boot': ['spring boot', 'springboot'],
    'Spring': ['spring'],
    'Laravel': ['laravel'],
    'Ruby': ['ruby'],
    'Ruby on Rails': ['rails', 'ruby on rails', 'ror'],
    'PHP': ['php'],
    'Swift': ['swift'],
    'Kotlin': ['kotlin'],
    'Go': ['golang'],
    'Rust': ['rust'],
    'TensorFlow': ['tensorflow', 'tf'],
    'PyTorch': ['pytorch'],
    'Pandas': ['pandas'],
    'NumPy': ['numpy'],
    'Scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn'],
    'Selenium': ['selenium'],
    'JIRA': ['jira'],
    'Agile': ['agile'],
    'Scrum': ['scrum'],
    'CI/CD': ['ci/cd', 'cicd', 'ci cd'],
    'Terraform': ['terraform'],
    'Jenkins': ['jenkins'],
    'Redis': ['redis'],
    'Elasticsearch': ['elasticsearch', 'elastic search'],
    'Kafka': ['kafka', 'apache kafka'],
    'RabbitMQ': ['rabbitmq', 'rabbit mq'],
    'Tailwind CSS': ['tailwind', 'tailwindcss', 'tailwind css'],
    'Bootstrap': ['bootstrap'],
    'SASS': ['sass', 'scss'],
    'Linux': ['linux'],
    'Bash': ['bash', 'shell scripting', 'shell'],
    'Power BI': ['power bi', 'powerbi'],
    'Tableau': ['tableau'],
    'Excel': ['excel', 'ms excel', 'microsoft excel'],
    'Figma': ['figma'],
    'Postman': ['postman'],
    'Swagger': ['swagger', 'openapi'],
}


def load_skills():
    global _skills
    if _skills is None:
        try:
            _skills = [s.lower() for s in json.loads(SKILLS_PATH.read_text())]
        except Exception:
            _skills = []
    return _skills


def extract_skills(text: str) -> List[str]:
    """Extract skills from text with canonical naming and word-boundary matching"""
    if not text:
        return []
    
    text_lower = text.lower()
    skills_list = load_skills()
    found_skills = set()
    
    # Step 1: Check canonical variations (with word boundaries)
    for canonical_name, variations in SKILL_VARIATIONS.items():
        canonical_lower = canonical_name.lower()
        # Skip if already found
        if canonical_lower in found_skills:
            continue
        
        for variant in variations:
            # Use word-boundary regex for accurate matching
            pattern = r'\b' + re.escape(variant) + r'\b'
            if re.search(pattern, text_lower, re.IGNORECASE):
                found_skills.add(canonical_lower)
                break
    
    # Step 2: Check skills from skills.json using word boundaries
    for skill in skills_list:
        if not skill or skill.lower() in found_skills:
            continue
        
        # Use word-boundary regex
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower, re.IGNORECASE):
            found_skills.add(skill.lower())
    
    # Step 3: Map normalized skills back to canonical display names
    result = []
    for skill_lower in found_skills:
        # Check if it's in our canonical mapping
        canonical = None
        for canonical_name, variations in SKILL_VARIATIONS.items():
            if skill_lower == canonical_name.lower():
                canonical = canonical_name
                break
        
        if canonical:
            result.append(canonical)
        else:
            # Find original case from skills.json
            original = next((s for s in skills_list if s.lower() == skill_lower), None)
            if original:
                result.append(original)
            else:
                result.append(skill_lower.title())
    
    # Deduplicate by lowercase version
    seen = set()
    final_result = []
    for skill in result:
        skill_lower = skill.lower()
        if skill_lower not in seen:
            seen.add(skill_lower)
            final_result.append(skill)
    
    return final_result
