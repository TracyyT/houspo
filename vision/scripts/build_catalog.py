"""Fill the fixed catalog from Channel3 text search and download images.

    python -m scripts.build_catalog            # ~24 text-search calls, cached
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from tqdm import tqdm

from houspo_vision.catalog import (build_catalog, download_image, gallery_image,
                                   is_lifestyle, load_catalog)
from houspo_vision.channel3 import Channel3Client
from houspo_vision import config


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--per-query', type=int, default=30)
    parser.add_argument('--skip-search', action='store_true',
                        help='reuse data/catalog.json and only download images')
    args = parser.parse_args()

    if args.skip_search and config.CATALOG_PATH.exists():
        products = load_catalog()
    else:
        client = Channel3Client()
        products = build_catalog(client, per_query=args.per_query)
        print('Channel3 budget used:', client.budget.summary())

    shot_types = Counter(img['shot_type'] or '(none)'
                         for p in products for img in p['images'])
    print(f'{len(products)} products, '
          f'{sum(len(p["images"]) for p in products)} images')
    print('image shot types:', shot_types.most_common(12))
    print('products by category:', Counter(p['category'] for p in products))

    urls = set()
    for product in products:
        main_image = gallery_image(product)
        if main_image:
            urls.add(main_image['url'])
        urls.update(img['url'] for img in product['images'] if is_lifestyle(img))

    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(tqdm(pool.map(download_image, sorted(urls)),
                            total=len(urls), desc='images'))
    print(f'downloaded {sum(r is not None for r in results)}/{len(urls)} images')


if __name__ == '__main__':
    main()
