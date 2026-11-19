"""Build a fixed product catalog so evaluations are repeatable
and don't spend Channel3 credits on every run."""
import hashlib
import io
import json
import re

import requests
from PIL import Image

from . import config
from .channel3 import products_from_response

# Detectable room items -> the text query used to fill the catalog.
CATEGORY_QUERIES = {
    'sofa': 'sofa couch',
    'sectional': 'sectional sofa',
    'armchair': 'accent armchair',
    'coffee table': 'coffee table',
    'side table': 'side table end table',
    'dining table': 'dining table',
    'dining chair': 'dining chair',
    'bed': 'bed frame upholstered',
    'nightstand': 'nightstand bedside table',
    'dresser': 'dresser chest of drawers',
    'bookshelf': 'bookshelf bookcase',
    'desk': 'desk home office',
    'office chair': 'office desk chair',
    'tv stand': 'tv stand media console',
    'bench': 'entryway bench',
    'floor lamp': 'floor lamp',
    'table lamp': 'table lamp',
    'pendant light': 'pendant light chandelier',
    'rug': 'area rug',
    'mirror': 'wall mirror',
    'wall art': 'framed wall art print',
    'planter': 'indoor planter pot',
    'vase': 'decorative vase',
    'throw pillow': 'throw pillow',
}

LIFESTYLE_WORDS = ('lifestyle', 'in_context', 'in-context', 'context',
                   'scene', 'room', 'styled', 'environment')
CLEAN_WORDS = ('product', 'cutout', 'packshot', 'white', 'clean', 'studio',
               'front', 'main', 'primary')


def _image_entry(image):
    if isinstance(image, str):
        return {'url': image, 'shot_type': '', 'is_cleaned': None, 'alt': ''}
    shot = ''
    for key in ('shot_type', 'type', 'image_type', 'kind', 'category'):
        if isinstance(image.get(key), str):
            shot = image[key]
            break
    return {
        'url': image.get('url') or image.get('src') or '',
        'shot_type': shot.lower(),
        'is_cleaned': image.get('is_cleaned_image'),
        'alt': image.get('alt_text') or image.get('alt') or '',
    }


def normalize_product(raw, category):
    offer = (raw.get('offers') or [{}])[0]
    price = (offer.get('price') or {}).get('price')
    images = [_image_entry(img) for img in raw.get('images') or []]
    images = [img for img in images if img['url']]
    brands = raw.get('brands') or []
    brand = brands[0].get('name', '') if brands and isinstance(brands[0], dict) else (
        brands[0] if brands else '')
    return {
        'id': str(raw.get('id')),
        'title': raw.get('title') or '',
        'brand': brand,
        'price': float(price) if price is not None else None,
        'url': offer.get('url', ''),
        'category': category,
        'images': images,
    }


def is_lifestyle(image):
    shot = image['shot_type']
    if shot:
        return any(word in shot for word in LIFESTYLE_WORDS)
    return False


def gallery_image(product):
    """The clean product photo used as the catalog side of retrieval."""
    images = product['images']
    for img in images:
        if img['is_cleaned']:
            return img
    for img in images:
        if img['shot_type'] and any(w in img['shot_type'] for w in CLEAN_WORDS):
            return img
    non_lifestyle = [img for img in images if not is_lifestyle(img)]
    return (non_lifestyle or images or [None])[0]


def title_key(product):
    """Same product sold by several retailers often shares a title."""
    title = re.sub(r'[^a-z0-9 ]', ' ', product['title'].lower())
    return ' '.join(title.split()[:8])


def build_catalog(client, per_query=30, categories=None):
    catalog = {}
    for category, query in (categories or CATEGORY_QUERIES).items():
        data = client.text_search(query, limit=per_query)
        for raw in products_from_response(data):
            product = normalize_product(raw, category)
            if product['id'] and product['images'] and product['id'] not in catalog:
                catalog[product['id']] = product
    products = list(catalog.values())
    config.CATALOG_PATH.write_text(json.dumps(products, indent=1))
    return products


def load_catalog():
    return json.loads(config.CATALOG_PATH.read_text())


def image_path_for(url):
    return config.IMAGE_DIR / f'{hashlib.sha1(url.encode()).hexdigest()[:20]}.jpg'


def download_image(url, max_side=640, session=None):
    """Download once, resize, store as JPEG. Returns the path or None."""
    path = image_path_for(url)
    if path.exists():
        return path
    session = session or requests
    try:
        response = session.get(url, timeout=20, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh) houspo-eval/1.0'})
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content)).convert('RGB')
    except Exception:
        return None
    image.thumbnail((max_side, max_side))
    image.save(path, 'JPEG', quality=90)
    return path
