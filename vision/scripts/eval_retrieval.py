"""Retrieval accuracy and latency on the catalog pairs.

    python -m scripts.eval_retrieval --models clip-b32 siglip2-base
"""
import argparse
import json
import time

import numpy as np

from houspo_vision import config
from houspo_vision.catalog import gallery_image, image_path_for, load_catalog
from houspo_vision.embed import get_embedder
from houspo_vision.index import VectorIndex
from houspo_vision.metrics import first_hit_rank, summarize


def gallery_for(products):
    ids, paths, categories = [], [], []
    for product in products:
        img = gallery_image(product)
        if img and image_path_for(img['url']).exists():
            ids.append(product['id'])
            paths.append(image_path_for(img['url']))
            categories.append(product['category'])
    return ids, paths, categories


def load_or_embed(embedder, paths):
    cache = config.EMBED_DIR / f'{embedder.name}_gallery.npz'
    keys = np.array([p.name for p in paths])
    if cache.exists():
        saved = np.load(cache)
        if np.array_equal(saved['keys'], keys):
            return saved['vectors']
    vectors = embedder.embed_images(paths)
    np.savez(cache, keys=keys, vectors=vectors)
    return vectors


def evaluate(embedder, index, pairs, gated=False, k=10):
    ranks, latencies = [], []
    embedder.embed_images([config.VISION_DIR / pairs[0]['query_image']])  # warm up
    for pair in pairs:
        start = time.perf_counter()
        query = embedder.embed_images([config.VISION_DIR / pair['query_image']])[0]
        hits = index.search(query, k=k,
                            category=pair['category'] if gated else None)
        latencies.append((time.perf_counter() - start) * 1000)
        ranks.append(first_hit_rank([pid for pid, _ in hits], pair['correct_ids']))
    return summarize(ranks, latencies)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--models', nargs='+', default=['clip-b32', 'siglip2-base'])
    parser.add_argument('--out', default='m1_catalog_pairs.json')
    args = parser.parse_args()

    products = load_catalog()
    pairs = json.loads(config.PAIRS_PATH.read_text())
    ids, paths, categories = gallery_for(products)
    print(f'gallery: {len(ids)} products, queries: {len(pairs)}')

    results = {'gallery_size': len(ids), 'queries': len(pairs), 'runs': {}}
    for name in args.models:
        embedder = get_embedder(name)
        index = VectorIndex(load_or_embed(embedder, paths), ids, categories)
        results['device'] = embedder.device
        for gated in (False, True):
            label = f'{name} | full photo' + (' | oracle category' if gated else '')
            results['runs'][label] = evaluate(embedder, index, pairs, gated)
            print(label, results['runs'][label])

        subset_path = config.EVAL_DIR / 'channel3_subset.json'
        if subset_path.exists():
            wanted = set(json.loads(subset_path.read_text()))
            subset = [p for p in pairs if p['query_id'] in wanted]
            label = f'{name} | full photo | channel3 subset'
            results['runs'][label] = evaluate(embedder, index, subset)
            print(label, results['runs'][label])

    (config.RESULTS_DIR / args.out).write_text(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
