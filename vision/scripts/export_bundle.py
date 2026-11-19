"""Write the deploy bundle (catalog + catalog embeddings) used by the
cloud vision service, so it doesn't need the downloaded product images.

    python -m scripts.export_bundle
"""
from houspo_vision import config
from houspo_vision.catalog import load_catalog
from houspo_vision.embed import get_embedder
from houspo_vision.gallery import save_bundle

BUNDLE_DIR = config.DATA_DIR / 'bundle'


def main():
    embedder = get_embedder('siglip2-base')
    count = save_bundle(BUNDLE_DIR, embedder, load_catalog())
    size = sum(f.stat().st_size for f in BUNDLE_DIR.iterdir()) / 1e6
    print(f'bundle: {count} products, {size:.1f} MB in {BUNDLE_DIR}')


if __name__ == '__main__':
    main()
