"""Catalog-side embeddings, computed once and cached on disk."""
import numpy as np

from . import config
from .catalog import gallery_image, image_path_for
from .index import VectorIndex


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


def build_index(embedder, products):
    ids, paths, categories = gallery_for(products)
    return VectorIndex(load_or_embed(embedder, paths), ids, categories)


# A deploy bundle is everything the service needs to answer requests
# without the downloaded product images: the catalog fields it returns
# and the precomputed catalog embeddings.
BUNDLE_FIELDS = ('id', 'title', 'brand', 'price', 'url', 'category', 'images', 'raw')


def save_bundle(folder, embedder, products):
    from .catalog import gallery_image
    import json
    from pathlib import Path

    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    index = build_index(embedder, products)
    kept = set(index.ids)
    slim = []
    for product in products:
        if product['id'] not in kept:
            continue
        item = {field: product.get(field) for field in BUNDLE_FIELDS}
        image = gallery_image(product)
        item['images'] = [image] if image else []
        slim.append(item)
    (folder / 'catalog.json').write_text(json.dumps(slim))
    np.savez(folder / f'gallery_{embedder.name}.npz', ids=np.array(index.ids),
             categories=np.array(index.categories), vectors=index.vectors)
    return len(slim)


def load_bundle(folder, embedder_name):
    import json
    from pathlib import Path

    folder = Path(folder)
    products = json.loads((folder / 'catalog.json').read_text())
    data = np.load(folder / f'gallery_{embedder_name}.npz')
    index = VectorIndex(data['vectors'], [str(i) for i in data['ids']],
                        [str(c) for c in data['categories']])
    return products, index
