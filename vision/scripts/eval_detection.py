"""Milestone 2: detection + crop + category-group search on the
catalog pairs, compared with matching the whole photo.

    python -m scripts.eval_detection
"""
import argparse
import json
import time

import numpy as np
from tqdm import tqdm

from houspo_vision import config
from houspo_vision.catalog import load_catalog
from houspo_vision.categories import search_categories
from houspo_vision.crops import make_crop
from houspo_vision.detect import YoloeDetector
from houspo_vision.embed import get_embedder
from houspo_vision.gallery import build_index
from houspo_vision.images import open_rgb
from houspo_vision.metrics import first_hit_rank, summarize
from houspo_vision.pipeline import ShopRoom

MODES = ('full', 'box', 'mask')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--embedder', default='siglip2-base')
    parser.add_argument('--detector', default='yoloe-26s-seg.pt')
    parser.add_argument('--conf', type=float, default=0.25)
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--tag', default='')
    args = parser.parse_args()

    products = load_catalog()
    pairs = json.loads(config.PAIRS_PATH.read_text())
    if args.limit:
        pairs = pairs[:args.limit]

    embedder = get_embedder(args.embedder)
    detector = YoloeDetector(args.detector, conf=args.conf)
    index = build_index(embedder, products)
    pipeline = ShopRoom(detector, embedder, index, products, crop_mode='box')

    # Warm up both models before timing anything.
    warm = open_rgb(config.VISION_DIR / pairs[0]['query_image'])
    pipeline.analyze(warm)

    ranks = {mode: [] for mode in MODES}
    ranks['whole photo, no detection'] = []
    any_item_ranks, with_room_row, end_to_end_ms, detect_ms, items_per_photo = [], [], [], [], []
    detected = 0
    per_category = {}

    for pair in tqdm(pairs, desc='photos'):
        image = open_rgb(config.VISION_DIR / pair['query_image'])
        image.thumbnail((1280, 1280))

        # End-to-end: everything the API does for one photo.
        start = time.perf_counter()
        result = pipeline.analyze(image, k=10)
        end_to_end_ms.append((time.perf_counter() - start) * 1000)
        detect_ms.append(result['timings_ms']['detect_ms'])
        items_per_photo.append(len(result['items']))

        # Best rank over every detected item, i.e. the user clicks the right one.
        item_ranks = [first_hit_rank([m['id'] for m in item['matches']], pair['correct_ids'])
                      for item in result['items']]
        found = [r for r in item_ranks if r]
        any_item_ranks.append(min(found) if found else None)
        room_rank = first_hit_rank([m['id'] for m in result['room_matches']],
                                   pair['correct_ids'])
        found += [room_rank] if room_rank else []
        with_room_row.append(min(found) if found else None)

        # Per-mode: use the detection that matches the target category.
        detections = detector.detect(image)
        target = next((d for d in detections
                       if pair['category'] in search_categories(d['category'])), None)
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

        stats = per_category.setdefault(pair['category'], {'n': 0, 'detected': 0, 'box_top5': 0})
        stats['n'] += 1
        stats['detected'] += bool(target)
        stats['box_top5'] += bool(ranks['box'][-1] and ranks['box'][-1] <= 5)

    results = {
        'embedder': embedder.name,
        'detector': detector.name,
        'device': embedder.device,
        'queries': len(pairs),
        'detection_rate': round(detected / len(pairs), 4),
        'avg_items_per_photo': round(float(np.mean(items_per_photo)), 2),
        'runs': {mode: summarize(r) for mode, r in ranks.items()},
        'conf': args.conf,
        'any_detected_item': summarize(any_item_ranks),
        'any_item_or_room_row': summarize(with_room_row),
        'end_to_end_latency': summarize([1] * len(end_to_end_ms), end_to_end_ms),
        'detect_latency': summarize([1] * len(detect_ms), detect_ms),
        'per_category': per_category,
    }
    for key in ('end_to_end_latency', 'detect_latency'):
        results[key] = {k: v for k, v in results[key].items() if 'latency' in k}

    out = config.RESULTS_DIR / f'm2_detection{args.tag}.json'
    out.write_text(json.dumps(results, indent=2))
    print(json.dumps({k: v for k, v in results.items() if k != 'per_category'}, indent=2))


if __name__ == '__main__':
    main()
