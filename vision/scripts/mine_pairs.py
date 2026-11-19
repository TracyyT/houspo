"""Turn catalog lifestyle shots into labeled room -> product pairs.

A product's in-room photo is the query; that product (and listings
with the same title from other retailers) is the correct answer.

    python -m scripts.mine_pairs
"""
import json
import random
from collections import Counter, defaultdict

from houspo_vision import config
from houspo_vision.catalog import (gallery_image, image_path_for, is_lifestyle,
                                   load_catalog, title_key)
from houspo_vision.imagehash import dhash, hamming


def main(seed=7, max_per_category=25):
    # Keep the existing pairs so earlier results stay comparable;
    # only categories without pairs get new ones.
    existing = json.loads(config.PAIRS_PATH.read_text()) if config.PAIRS_PATH.exists() else []
    covered = {pair['category'] for pair in existing}

    products = load_catalog()
    by_title = defaultdict(set)
    for product in products:
        by_title[title_key(product)].add(product['id'])

    if not any(is_lifestyle(img) for p in products for img in p['images']):
        sample = [p['images'][:3] for p in products[:3]]
        print('No lifestyle shot types found. Sample image entries:')
        print(json.dumps(sample, indent=1))
        return

    pairs = []
    skipped = Counter()
    for product in products:
        if product['category'] in covered:
            continue
        main_image = gallery_image(product)
        if not main_image or not image_path_for(main_image['url']).exists():
            skipped['no gallery image'] += 1
            continue
        main_hash = dhash(image_path_for(main_image['url']))
        for img in product['images']:
            if not is_lifestyle(img) or img['url'] == main_image['url']:
                continue
            path = image_path_for(img['url'])
            if not path.exists():
                skipped['download failed'] += 1
                continue
            if hamming(dhash(path), main_hash) <= 6:
                skipped['same picture as product photo'] += 1
                continue
            pairs.append({
                'query_id': f'{product["id"]}:{len(pairs)}',
                'query_url': img['url'],
                'query_image': str(path.relative_to(config.VISION_DIR)),
                'product_id': product['id'],
                'category': product['category'],
                'correct_ids': sorted(by_title[title_key(product)]),
            })
            break  # one query per product keeps the set balanced

    random.Random(seed).shuffle(pairs)
    per_category = Counter()
    kept = list(existing)
    for pair in pairs:
        if per_category[pair['category']] < max_per_category:
            per_category[pair['category']] += 1
            kept.append(pair)

    config.PAIRS_PATH.write_text(json.dumps(kept, indent=1))
    print(f'{len(kept)} pairs written to {config.PAIRS_PATH.name} '
          f'({len(kept) - len(existing)} new)')
    print('new pairs by category:', dict(per_category))
    print('skipped:', dict(skipped))


if __name__ == '__main__':
    main()
