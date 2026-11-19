import base64
import io

import numpy as np
import pytest
from PIL import Image

from houspo_vision.crops import box_crop, mask_crop, padded_box
from houspo_vision.index import VectorIndex
from houspo_vision.pipeline import ShopRoom

PRODUCTS = [
    {'id': 'sofa1', 'title': 'Sofa', 'brand': 'A', 'price': 900, 'url': 'u',
     'category': 'sofa', 'images': [{'url': 'i1', 'shot_type': 'hero', 'is_cleaned': None}]},
    {'id': 'sect1', 'title': 'Sectional', 'brand': 'B', 'price': 1500, 'url': 'u',
     'category': 'sectional', 'images': [{'url': 'i2', 'shot_type': 'hero', 'is_cleaned': None}]},
    {'id': 'lamp1', 'title': 'Lamp', 'brand': 'C', 'price': 80, 'url': 'u',
     'category': 'floor lamp', 'images': [{'url': 'i3', 'shot_type': 'hero', 'is_cleaned': None}]},
]


class FakeDetector:
    name = 'fake'

    def __init__(self, detections):
        self.detections = detections

    def detect(self, image, max_items=12):
        return self.detections[:max_items]


class FakeEmbedder:
    name = 'fake'

    def embed_images(self, images):
        # Every crop looks most like the lamp.
        return np.array([[0.2, 0.1, 1.0]] * len(images), dtype=np.float32)


def make_pipeline(detections):
    index = VectorIndex(np.eye(3, dtype=np.float32), ['sofa1', 'sect1', 'lamp1'],
                        ['sofa', 'sectional', 'floor lamp'])
    return ShopRoom(FakeDetector(detections), FakeEmbedder(), index, PRODUCTS)


SOFA = {'label': 'sofa', 'category': 'sofa', 'confidence': 0.9,
        'box': [10, 10, 60, 40], 'polygon': [[10, 10], [60, 10], [60, 40], [10, 40]]}


def test_detection_only_matches_its_category_group():
    result = make_pipeline([SOFA]).analyze(Image.new('RGB', (100, 80)))
    item = result['items'][0]
    # The lamp is the closest vector, but a sofa may only match sofas/sectionals.
    assert [m['id'] for m in item['matches']] == ['sofa1', 'sect1']
    assert item['matches'][0]['image'] == 'i1'
    # The whole-photo row is always there.
    assert result['room_matches'][0]['id'] == 'lamp1'
    assert set(result['timings_ms']) == {'detect_ms', 'embed_ms', 'search_ms'}


def test_adapter_changes_item_matches_only():
    from houspo_vision.adapter import QueryAdapter
    # Maps the crop's vector onto the sectional's direction.
    weight = np.zeros((3, 3), dtype=np.float32)
    weight[2, 1] = 10.0
    pipeline = make_pipeline([SOFA])
    pipeline.adapter = QueryAdapter(weight, np.zeros(3, dtype=np.float32))
    result = pipeline.analyze(Image.new('RGB', (100, 80)))
    assert result['items'][0]['matches'][0]['id'] == 'sect1'
    assert result['room_matches'][0]['id'] == 'lamp1'


def test_untrained_adapter_is_identity(tmp_path):
    from houspo_vision.adapter import QueryAdapter
    adapter = QueryAdapter(np.zeros((3, 3)), np.zeros(3))
    vectors = np.array([[0.6, 0.8, 0.0]], dtype=np.float32)
    np.testing.assert_allclose(adapter(vectors), vectors, atol=1e-6)
    adapter.save(tmp_path / 'a.npz')
    np.testing.assert_allclose(QueryAdapter.load(tmp_path / 'a.npz')(vectors), vectors, atol=1e-6)


def test_no_detections_falls_back_to_whole_photo():
    result = make_pipeline([]).analyze(Image.new('RGB', (100, 80)))
    assert result['items'] == []
    assert result['room_matches'][0]['id'] == 'lamp1'


def test_generic_prompts_search_their_group():
    from houspo_vision.categories import PROMPTS, search_categories
    assert search_categories(PROMPTS['chair']) == {'dining chair', 'armchair', 'office chair'}
    assert 'pendant light' in search_categories(PROMPTS['lamp'])
    assert search_categories('sofa') == {'sofa', 'sectional'}


def test_prompt_sets():
    from houspo_vision.categories import PROMPT_SETS, search_categories
    v2, v2_negatives = PROMPT_SETS['v2']
    v3, v3_negatives = PROMPT_SETS['v3']
    assert v2_negatives == [] and 'ceiling fan' in v3_negatives
    assert set(v2) < set(v3)
    assert not set(v3) & set(v3_negatives)
    assert 'tv stand' in search_categories('desk')
    assert search_categories(v3['pouf']) == {'ottoman', 'bench'}


def test_bundle_round_trip(tmp_path, monkeypatch):
    import houspo_vision.gallery as gallery

    class Named:
        name = 'fake'

    index = VectorIndex(np.eye(3, dtype=np.float32), ['sofa1', 'sect1', 'lamp1'],
                        ['sofa', 'sectional', 'floor lamp'])
    monkeypatch.setattr(gallery, 'build_index', lambda embedder, products: index)
    for product in PRODUCTS:
        product['raw'] = {'id': product['id'], 'title': product['title']}
    assert gallery.save_bundle(tmp_path, Named(), PRODUCTS) == 3
    products, loaded = gallery.load_bundle(tmp_path, 'fake')
    assert [p['id'] for p in products] == ['sofa1', 'sect1', 'lamp1']
    assert products[0]['raw']['title'] == 'Sofa'
    assert loaded.search(np.array([0, 0, 1.0]), k=1, category='floor lamp')[0][0] == 'lamp1'
    # The service can answer from the bundle alone.
    pipeline = ShopRoom(FakeDetector([SOFA]), FakeEmbedder(), loaded, products)
    assert pipeline.analyze(Image.new('RGB', (50, 50)))['items'][0]['matches'][0]['id'] == 'sofa1'


def test_crops():
    image = Image.new('RGB', (100, 100), (0, 0, 0))
    assert padded_box([10, 10, 50, 50], (100, 100), pad=0.1) == (6, 6, 54, 54)
    assert box_crop(image, [0, 0, 100, 100]).size == (100, 100)
    cut = mask_crop(image, [0, 0, 100, 100], [[0, 0], [50, 0], [50, 100], [0, 100]], pad=0)
    assert cut.getpixel((10, 50)) == (0, 0, 0)
    assert cut.getpixel((90, 50)) == (255, 255, 255)


def image_b64(size=(64, 48)):
    buffer = io.BytesIO()
    Image.new('RGB', size, (200, 180, 160)).save(buffer, 'JPEG')
    return base64.b64encode(buffer.getvalue()).decode()


@pytest.fixture
def client(monkeypatch):
    from fastapi.testclient import TestClient
    from service.app import create_app
    monkeypatch.delenv('VISION_API_KEY', raising=False)
    app = create_app(lambda: make_pipeline([SOFA]))
    with TestClient(app) as test_client:
        yield test_client


def test_service_round_trip(client):
    assert client.get('/health').json()['ready'] is True
    response = client.post('/detect-and-match',
                           json={'image_base64': 'data:image/jpeg;base64,' + image_b64()})
    assert response.status_code == 200
    assert response.json()['items'][0]['category'] == 'sofa'


def test_service_rejects_bad_images(client):
    assert client.post('/detect-and-match', json={'image_base64': '!!'}).status_code == 400
    not_image = base64.b64encode(b'hello').decode()
    assert client.post('/detect-and-match', json={'image_base64': not_image}).status_code == 400


def test_service_applies_phone_rotation():
    from service.app import decode_image
    # A 60x40 landscape picture stored with "rotate 90" in its EXIF,
    # the way phones save portrait photos.
    image = Image.new('RGB', (60, 40), (10, 20, 30))
    exif = Image.Exif()
    exif[0x0112] = 6
    buffer = io.BytesIO()
    image.save(buffer, 'JPEG', exif=exif)
    decoded = decode_image(base64.b64encode(buffer.getvalue()).decode())
    assert decoded.size == (40, 60)


def test_service_key(client, monkeypatch):
    monkeypatch.setenv('VISION_API_KEY', 'secret')
    body = {'image_base64': image_b64()}
    assert client.post('/detect-and-match', json=body).status_code == 401
    assert client.post('/detect-and-match', json=body,
                       headers={'X-Vision-Key': 'secret'}).status_code == 200
