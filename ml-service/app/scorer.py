from typing import Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# load model at import time to reuse
_bert_model = None

def load_bert_model():
    global _bert_model
    if _bert_model is None:
        _bert_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _bert_model


def semantic_similarity(text1: str, text2: str) -> float:
    """Compute semantic similarity with clipping to [0, 1]"""
    model = load_bert_model()
    a = model.encode([text1])[0]
    b = model.encode([text2])[0]
    sim = cosine_similarity([a], [b])[0][0]
    # Clip to [0, 1] range
    return float(np.clip(sim, 0.0, 1.0))


def keyword_similarity(text1: str, text2: str) -> float:
    """Compute TF-IDF similarity with clipping to [0, 1]"""
    vect = TfidfVectorizer(stop_words='english', max_features=5000)
    docs = [text1 or '', text2 or '']
    try:
        X = vect.fit_transform(docs)
        sim = cosine_similarity(X[0:1], X[1:2])[0][0]
        # Clip to [0, 1] range
        return float(np.clip(sim, 0.0, 1.0))
    except Exception:
        return 0.0


def compute_score(bert_sim: float, tfidf_sim: float, skill_ratio: float) -> float:
    """
    Compute final score with improved weighting and safety constraints.
    Weights: Skills 45%, BERT (semantic) 40%, TF-IDF (keywords) 15%
    
    Safety:
    - All inputs are clipped to [0, 1]
    - Weight sum = 0.45 + 0.40 + 0.15 = 1.0 (guaranteed)
    - Output is clipped to [0, 1]
    """
    # Normalize all inputs to [0, 1] range
    bs = np.clip(bert_sim, 0.0, 1.0)
    ts = np.clip(tfidf_sim, 0.0, 1.0)
    sr = np.clip(skill_ratio, 0.0, 1.0)
    
    # Weighted score: Skills (45%), BERT (40%), TF-IDF (15%)
    final = 0.45 * sr + 0.40 * bs + 0.15 * ts
    
    # Ensure final score is in [0, 1]
    final = np.clip(final, 0.0, 1.0)
    
    return float(final)
