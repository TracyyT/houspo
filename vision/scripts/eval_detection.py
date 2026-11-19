"""Milestone 2: detection + crop + category-group search on the
catalog pairs, compared with matching the whole photo.

    python -m scripts.eval_detection
"""
import argparse
import json
import time

import numpy as np
from PIL import Image
from tqdm import tqdm

from houspo_vision import config
from houspo_vision.catalog import load_catalog
from houspo_vision.categories import search_categories
from houspo_vision.crops import make_crop
from houspo_vision.detect import YoloeDetector
from houspo_vision.embed import get_embedder
from houspo_vision.gallery import build_index
from houspo_vision.metrics import first_hit_rank, summarize
from houspo_vision.pipeline import ShopRoom

MODES = ('full', 'box', 'mask')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--embedder', default='siglip2-base')
    parser.add_argument('--detector', default='yoloe-26s-seg.pt')
    parser.add_argument('--conf', type=float, default=0.25)
    parser.add_argument('--limit', type=int, default=0)
    args = parser.parse_args()

    products = load_catalog()
    pairs = json.loads(config.PAIRS_PATH.read_text())
    if args.limit:
        pairs = pairs[:args.limit]

    embedder = get_embedder(args.embedder)
    detector = YoloeDetector(args.detector, conf=args.conf)
    index = build_index(embedder, products)
    pipeline = ShopRoom(detector, embedder, index, products, crop_mode='mask')

    # Warm up both models before timing anything.
    warm = Image.open(config.VISION_DIR / pairs[0]['query_image']).convert('RGB')
    pipeline.analyze(warm)

    ranks = {mode: [] for mode in MODES}
    ranks['whole photo, no detection'] = []
    any_item_ranks, end_to_end_ms, detect_ms, items_per_photo = [], [], [], []
    detected = 0
    per_category = {}

    for pair in tqdm(pairs, desc='photos'):
        image = Image.open(config.VISION_DIR / pair['query_image']).convert('RGB')
        image.thumbnail((1280, 1280))
        allowed = search_categories(pair['category'])

        # End-to-end: everything the API does for one photo.
        start = time.perf_counter()
        result = pipeline.analyze(image, k=10)
        end_to_end_ms.append((time.perf_counter() - start) * 1000)
        detect_ms.append(result['timings_ms']['detect_ms'])
        items_per_photo.append(len(result['items']))

        # Best rank over every detected item, i.e. the user clicks the right one.
        item_ranks = [first_hit_rank([m['id'] for m in item['matches']], pair['correct_ids'])
                      for item in result['items']]
        if not result['items']:
            item_ranks = [first_hit_rank([m['id'] for m in result['room_matches']],
                                         pair['correct_ids'])]
        found = [r for r in item_ranks if r]
        any_item_ranks.append(min(found) if found else None)

        # Per-mode: use the detection that matches the target category.
        detections = detector.detect(image)
        target = next((d for d in detections if d['category'] in allowed), None)
        whole = embedder.embed_images([image])[0]
        ranks['whole photo, no detection'].append(first_hit_rank(
            [pid for pid, _ in index.search(whole, k=10)], pair['correct_ids']))

        if target:
            detected += 1
            crops = [make_crop(image, target, mode) for mode in MODES]
            vectors = embedder.embed_images(crops)
            groups = search_categories(target['category'])
            for mode, vector in zip(MODES, vectors):
                hits = index.search(vector, k=10, category=groups)
                ranks[mode].append(first_hit_rank([pid for pid, _ in hits], pair['correct_ids']))
        else:
            # Missed detection: the app would fall back to the whole photo.
            for mode in MODES:
                ranks[mode].append(ranks['whole photo, no detection'][-1])

        stats = per_category.setdefault(pair['category'], {'n': 0, 'detected': 0, 'mask_top5': 0})
        stats['n'] += 1
        stats['detected'] += bool(target)
        stats['mask_top5'] += bool(ranks['mask'][-1] and ranks['mask'][-1] <= 5)

    results = {
        'embedder': embedder.name,
        'detector': detector.name,
        'device': embedder.device,
        'queries': len(pairs),
        'detection_rate': round(detected / len(pairs), 4),
        'avg_items_per_photo': round(float(np.mean(items_per_photo)), 2),
        'runs': {mode: summarize(r) for mode, r in ranks.items()},
        'any_detected_item': summarize(any_item_ranks),
        'end_to_end_latency': summarize([1] * len(end_to_end_ms), end_to_end_ms),
        'detect_latency': summarize([1] * len(detect_ms), detect_ms),
        'per_category': per_category,
    }
    for key in ('end_to_end_latency', 'detect_latency'):
        results[key] = {k: v for k, v in results[key].items() if 'latency' in k}

    out = config.RESULTS_DIR / 'm2_detection.json'
    out.write_text(json.dumps(results, indent=2))
    print(json.dumps({k: v for k, v in results.items() if k != 'per_category'}, indent=2))


if __name__ == '__main__':
    main()
