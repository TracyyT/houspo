"""Detect and embed the target item in every lifestyle photo once,
so adapter training and evaluation don't re-run the models.

    python -m scripts.cache_features
"""
import argparse
import json

import numpy as np
from tqdm import tqdm

from houspo_vision import config
from houspo_vision.catalog import gallery_image, image_path_for, is_lifestyle, load_catalog
from houspo_vision.categories import search_categories
from houspo_vision.crops import box_crop
from houspo_vision.detect import YoloeDetector
from houspo_vision.embed import get_embedder
from houspo_vision.imagehash import dhash, hamming
from houspo_vision.images import open_rgb


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--embedder', default='siglip2-base')
    parser.add_argument('--detector', default='yoloe-26s-seg.pt')
    parser.add_argument('--prompts', default='v3')
    args = parser.parse_args()

    products = load_catalog()
    embedder = get_embedder(args.embedder)
    detector = YoloeDetector(args.detector, prompt_set=args.prompts)

    rows, crops = [], []
    for product in tqdm(products, desc='products'):
        main_image = gallery_image(product)
        if not main_image or not image_path_for(main_image['url']).exists():
            continue
        main_hash = dhash(image_path_for(main_image['url']))
        for img in product['images']:
            path = image_path_for(img['url'])
            if (not is_lifestyle(img) or img['url'] == main_image['url']
                    or not path.exists() or hamming(dhash(path), main_hash) <= 6):
                continue
            image = open_rgb(path)
            image.thumbnail((1280, 1280))
            target = next((d for d in detector.detect(image)
                           if product['category'] in search_categories(d['category'])), None)
            rows.append({
                'image': path.name,
                'product_id': product['id'],
                'category': product['category'],
                'detected_category': target['category'] if target else None,
            })
            crops.append(box_crop(image, target['box']) if target else image)

    vectors = []
    for start in tqdm(range(0, len(crops), 32), desc='embedding'):
        vectors.append(embedder.embed_images(crops[start:start + 32]))
    vectors = np.concatenate(vectors)

    name = f'features_{embedder.name}_{detector.name}'
    np.save(config.EMBED_DIR / f'{name}.npy', vectors)
    (config.EMBED_DIR / f'{name}.json').write_text(json.dumps(rows))
    detected = sum(r['detected_category'] is not None for r in rows)
    print(f'{len(rows)} lifestyle photos from {len({r["product_id"] for r in rows})} products, '
          f'target detected in {detected / len(rows):.1%}')


if __name__ == '__main__':
    main()
