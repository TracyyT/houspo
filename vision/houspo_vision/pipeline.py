"""Shop this room: detect items in a room photo and find
visually similar catalog products for each one."""
import time

from .categories import search_categories
from .crops import make_crop

PRODUCT_FIELDS = ('id', 'title', 'brand', 'price', 'url', 'category')


def _thin(polygon, max_points=80):
    if not polygon or len(polygon) <= max_points:
        return polygon
    step = len(polygon) / max_points
    return [polygon[int(i * step)] for i in range(max_points)]


class ShopRoom:
    def __init__(self, detector, embedder, index, products, crop_mode='box'):
        self.detector = detector
        self.embedder = embedder
        self.index = index
        self.products = {p['id']: p for p in products}
        self.crop_mode = crop_mode

    def _product_card(self, product_id, similarity):
        from .catalog import gallery_image
        product = self.products[product_id]
        card = {field: product.get(field) for field in PRODUCT_FIELDS}
        image = gallery_image(product)
        card['image'] = image['url'] if image else ''
        card['similarity'] = round(similarity, 4)
        return card

    def analyze(self, image, k=8, max_items=8, crop_mode=None):
        crop_mode = crop_mode or self.crop_mode
        timings = {}

        start = time.perf_counter()
        detections = self.detector.detect(image, max_items=max_items)
        timings['detect_ms'] = (time.perf_counter() - start) * 1000

        start = time.perf_counter()
        # The whole photo is embedded too, so there is always a
        # "matches for this room" row even if an item was missed.
        crops = [make_crop(image, d, crop_mode) for d in detections] + [image]
        vectors = self.embedder.embed_images(crops)
        room_vector = vectors[-1]
        timings['embed_ms'] = (time.perf_counter() - start) * 1000

        start = time.perf_counter()
        items = []
        for number, (detection, vector) in enumerate(zip(detections, vectors)):
            hits = self.index.search(vector, k=k,
                                     category=search_categories(detection['category']))
            items.append({
                'id': f'item-{number}',
                **{key: detection[key] for key in ('label', 'category', 'confidence', 'box')},
                'polygon': _thin(detection.get('polygon')),
                'matches': [self._product_card(pid, score) for pid, score in hits],
            })

        room_matches = [self._product_card(pid, score)
                        for pid, score in self.index.search(room_vector, k=k)]
        timings['search_ms'] = (time.perf_counter() - start) * 1000

        return {
            'width': image.size[0],
            'height': image.size[1],
            'items': items,
            'room_matches': room_matches,
            'timings_ms': {key: round(value, 1) for key, value in timings.items()},
        }
