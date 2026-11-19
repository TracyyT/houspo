"""Exact cosine search. The catalog is a few thousand vectors,
so a matrix product is faster and simpler than an ANN index."""
import numpy as np


class VectorIndex:
    def __init__(self, vectors, ids, categories=None):
        self.vectors = np.asarray(vectors, dtype=np.float32)
        self.ids = list(ids)
        self.categories = list(categories) if categories is not None else None

    def search(self, query, k=10, category=None):
        scores = self.vectors @ np.asarray(query, dtype=np.float32)
        if category is not None and self.categories is not None:
            mask = np.array([c == category for c in self.categories])
            scores = np.where(mask, scores, -np.inf)
        k = min(k, len(self.ids))
        top = np.argpartition(-scores, k - 1)[:k]
        top = top[np.argsort(-scores[top])]
        return [(self.ids[i], float(scores[i])) for i in top if np.isfinite(scores[i])]
