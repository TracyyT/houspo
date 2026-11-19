import numpy as np


def first_hit_rank(ranked_ids, correct_ids):
    """1-based rank of the first correct product, or None."""
    correct = set(map(str, correct_ids))
    for rank, product_id in enumerate(ranked_ids, start=1):
        if str(product_id) in correct:
            return rank
    return None


def summarize(ranks, latencies_ms=None, ks=(1, 5, 10)):
    n = len(ranks)
    result = {'queries': n}
    for k in ks:
        hits = sum(1 for r in ranks if r is not None and r <= k)
        result[f'recall@{k}'] = round(hits / n, 4) if n else 0.0
    result['mrr'] = round(sum(1 / r for r in ranks if r) / n, 4) if n else 0.0
    if latencies_ms:
        lat = np.asarray(latencies_ms)
        result['latency_p50_ms'] = round(float(np.percentile(lat, 50)), 1)
        result['latency_p95_ms'] = round(float(np.percentile(lat, 95)), 1)
    return result
