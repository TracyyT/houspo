"""Retrieval on hand-labeled real room photos.

    python -m scripts.eval_real

A labeled item counts for a system when one of that system's detections
overlaps it (IoU >= 0.5); the item's rank is where the first product
labeled as a close match appears in that detection's results. Items the
system doesn't detect count as misses. Products nobody labeled are
treated as not matching (they were never shown to the labeler).
"""
import json
import time

import numpy as np

from houspo_vision import config
from houspo_vision.adapter import QueryAdapter
from houspo_vision.catalog import load_catalog
from houspo_vision.categories import search_categories
from houspo_vision.crops import box_crop
from houspo_vision.detect import YoloeDetector
from houspo_vision.embed import get_embedder
from houspo_vision.gallery import build_index
from houspo_vision.images import open_rgb, try_open_rgb
from houspo_vision.metrics import first_hit_rank, summarize
from houspo_vision.pipeline import ShopRoom


def iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1])
    x2, y2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    union = area(a) + area(b) - inter
    return inter / union if union else 0.0


def best_overlap(box, detections, threshold=0.5):
    scored = [(iou(box, d['box']), d) for d in detections]
    scored = [s for s in scored if s[0] >= threshold]
    return max(scored, key=lambda s: s[0])[1] if scored else None


def main():
    labels = json.loads((config.REAL_DIR / 'labels.json').read_text())
    products = load_catalog()

    siglip, clip = get_embedder('siglip2-base'), get_embedder('clip-b32')
    indexes = {'siglip': build_index(siglip, products), 'clip': build_index(clip, products)}
    embedders = {'siglip': siglip, 'clip': clip}
    detectors = {'v2': YoloeDetector(prompt_set='v2'), 'v3': YoloeDetector(prompt_set='v3')}
    adapter_path = config.VISION_DIR / 'models' / 'adapter_siglip2.npz'
    adapter = QueryAdapter.load(adapter_path) if adapter_path.exists() else None

    systems = {
        'CLIP ViT-B/32, detected box (v3 prompts)': ('clip', 'v3', None),
        'SigLIP 2, detected box (v2 prompts)': ('siglip', 'v2', None),
        'SigLIP 2, detected box (v3 prompts)': ('siglip', 'v3', None),
    }
    if adapter is not None:
        systems['SigLIP 2 + adapter, detected box (v3 prompts)'] = ('siglip', 'v3', adapter)

    ranks = {name: [] for name in systems}
    ranks['SigLIP 2, whole photo (no detection)'] = []
    labeled = no_match = wrong = 0
    latencies = []
    production = ShopRoom(detectors['v3'], siglip, indexes['siglip'], products)
    production.analyze(open_rgb(config.REAL_DIR / labels[0]['image']))  # warm up

    for photo in labels:
        image = try_open_rgb(config.REAL_DIR / photo['image'])
        if image is None:
            continue
        image.thumbnail((1280, 1280))

        start = time.perf_counter()
        production.analyze(image)
        latencies.append((time.perf_counter() - start) * 1000)

        detections = {name: d.detect(image) for name, d in detectors.items()}
        whole = siglip.embed_images([image])[0]
        whole_hits = [pid for pid, _ in indexes['siglip'].search(whole, k=10)]

        for item in photo['items']:
            if item['status'] == 'wrong':
                wrong += 1
                continue
            if item['status'] != 'ok':
                continue
            labeled += 1
            if not item['correct_ids']:
                no_match += 1
                continue
            ranks['SigLIP 2, whole photo (no detection)'].append(
                first_hit_rank(whole_hits, item['correct_ids']))
            for name, (embed_name, prompt_set, item_adapter) in systems.items():
                det = best_overlap(item['box'], detections[prompt_set])
                if det is None:
                    ranks[name].append(None)
                    continue
                vector = embedders[embed_name].embed_images([box_crop(image, det['box'])])
                if item_adapter is not None:
                    vector = item_adapter(vector)
                hits = indexes[embed_name].search(vector[0], k=10,
                                                  category=search_categories(det['category']))
                ranks[name].append(first_hit_rank([pid for pid, _ in hits], item['correct_ids']))

    judged = labeled + wrong
    results = {
        'photos': len(labels),
        'labeled_items': judged,
        'detection_precision_v3': round(labeled / judged, 4) if judged else None,
        'items_with_no_close_match_in_catalog': no_match,
        'items_scored': len(ranks['SigLIP 2, whole photo (no detection)']),
        'runs': {name: summarize(r) for name, r in ranks.items()},
        'end_to_end_latency': {k: v for k, v in summarize([1] * len(latencies), latencies).items()
                               if 'latency' in k},
        'device': siglip.device,
    }
    (config.RESULTS_DIR / 'm4_real_photos.json').write_text(json.dumps(results, indent=2))
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
