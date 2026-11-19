"""Channel3 image search as an external baseline, on a small fixed
subset so it stays inside the image-search budget.

    python -m scripts.eval_channel3 --n 30
"""
import argparse
import json
import random
import time

from houspo_vision import config
from houspo_vision.channel3 import (BudgetExceeded, Channel3Client,
                                    products_from_response)
from houspo_vision.metrics import first_hit_rank, summarize


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--n', type=int, default=30)
    parser.add_argument('--seed', type=int, default=11)
    args = parser.parse_args()

    pairs = json.loads(config.PAIRS_PATH.read_text())
    subset = random.Random(args.seed).sample(pairs, min(args.n, len(pairs)))
    (config.EVAL_DIR / 'channel3_subset.json').write_text(
        json.dumps([p['query_id'] for p in subset], indent=1))

    client = Channel3Client()
    # Cached reruns would report disk latency, so keep the
    # measured API latency from the first run of each query.
    latency_path = config.DATA_DIR / 'channel3_latency.json'
    saved_latency = json.loads(latency_path.read_text()) if latency_path.exists() else {}
    ranks, latencies = [], []
    for pair in subset:
        start = time.perf_counter()
        try:
            data = client.image_search(config.VISION_DIR / pair['query_image'],
                                       limit=10)
        except BudgetExceeded as error:
            print('stopping, budget reached:', error)
            break
        elapsed = (time.perf_counter() - start) * 1000
        if not client.last_cached:
            saved_latency[pair['query_id']] = elapsed
        if pair['query_id'] in saved_latency:
            latencies.append(saved_latency[pair['query_id']])
        ids = [str(p.get('id')) for p in products_from_response(data)]
        ranks.append(first_hit_rank(ids, pair['correct_ids']))

    latency_path.write_text(json.dumps(saved_latency, indent=1))
    result = summarize(ranks, latencies)
    print(result)
    print('budget used:', client.budget.summary())
    (config.RESULTS_DIR / 'm1_channel3_subset.json').write_text(
        json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
