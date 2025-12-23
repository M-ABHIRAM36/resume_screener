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
    model = load_bert_model()
    a = model.encode([text1])[0]
    b = model.encode([text2])[0]
    sim = cosine_similarity([a], [b])[0][0]
    return float(np.clip(sim, -1.0, 1.0))


def keyword_similarity(text1: str, text2: str) -> float:
    vect = TfidfVectorizer(stop_words='english', max_features=5000)
    docs = [text1 or '', text2 or '']
    try:
        X = vect.fit_transform(docs)
        sim = cosine_similarity(X[0:1], X[1:2])[0][0]
        return float(sim)
    except Exception:
        return 0.0


def compute_score(bert_sim: float, tfidf_sim: float, skill_ratio: float) -> float:
    # inputs in range [-1,1] for bert_sim, but semantic sim expected positive; clip to [0,1]
    bs = max(0.0, min(1.0, (bert_sim + 1.0) / 2.0)) if bert_sim < 0 else max(0.0, min(1.0, bert_sim))
    ts = max(0.0, min(1.0, tfidf_sim))
    sr = max(0.0, min(1.0, skill_ratio))
    final = 0.6 * bs + 0.3 * ts + 0.1 * sr
    return float(final)
