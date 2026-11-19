from PIL import Image

from houspo_vision.catalog import gallery_image, is_lifestyle, normalize_product, title_key
from houspo_vision.imagehash import dhash, hamming

RAW = {
    'id': 'abc',
    'title': 'Linen Sofa, 84"',
    'brands': [{'name': 'Acme'}],
    'offers': [{'price': {'price': 899}, 'url': 'https://shop/x'}],
    'images': [
        {'url': 'https://img/room.jpg', 'shot_type': 'LIFESTYLE'},
        {'url': 'https://img/front.jpg', 'shot_type': 'product', 'is_cleaned_image': True},
        'https://img/plain.jpg',
    ],
}


def test_normalize_and_gallery_choice():
    product = normalize_product(RAW, 'sofa')
    assert product['price'] == 899.0
    assert product['brand'] == 'Acme'
    assert gallery_image(product)['url'] == 'https://img/front.jpg'
    assert [is_lifestyle(i) for i in product['images']] == [True, False, False]
    assert product['raw']['offers'][0]['price']['price'] == 899
    assert product['raw']['images'][0] == 'https://img/room.jpg'


def test_title_key_groups_retailer_duplicates():
    a = normalize_product({**RAW, 'title': 'Linen Sofa, 84"'}, 'sofa')
    b = normalize_product({**RAW, 'id': 'xyz', 'title': 'linen sofa 84'}, 'sofa')
    assert title_key(a) == title_key(b)


def test_generic_titles_and_other_brands_do_not_group():
    a = normalize_product({**RAW, 'title': 'Coffee Table'}, 'coffee table')
    b = normalize_product({**RAW, 'id': 'xyz', 'title': 'Coffee Table'}, 'coffee table')
    c = normalize_product({**RAW, 'id': 'q', 'brands': [{'name': 'Other'}]}, 'sofa')
    assert title_key(a) != title_key(b)
    assert title_key(c) != title_key(normalize_product(RAW, 'sofa'))


def test_gallery_prefers_hero_over_infographic():
    product = normalize_product({**RAW, 'images': [
        {'url': 'https://img/info.jpg', 'shot_type': 'product_information'},
        {'url': 'https://img/room.jpg', 'shot_type': 'lifestyle'},
        {'url': 'https://img/hero.jpg', 'shot_type': 'hero'},
    ]}, 'sofa')
    assert gallery_image(product)['url'] == 'https://img/hero.jpg'


def test_dhash_matches_resized_copy(tmp_path):
    image = Image.new('RGB', (64, 48))
    for x in range(64):
        for y in range(48):
            image.putpixel((x, y), (x * 4, y * 5, (x * y) % 255))
    image.save(tmp_path / 'a.png')
    image.resize((128, 96)).save(tmp_path / 'b.png')
    assert hamming(dhash(tmp_path / 'a.png'), dhash(tmp_path / 'b.png')) <= 4
