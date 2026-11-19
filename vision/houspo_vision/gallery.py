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
