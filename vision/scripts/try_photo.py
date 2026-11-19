"""Send a room photo to the running vision service and save an
annotated copy with the top matches for each detected item.

    uvicorn service.app:app --port 8001          # in one terminal
    python -m scripts.try_photo eval/real/001.jpg
"""
import argparse
import base64
import json
import os
from pathlib import Path

import requests
from PIL import ImageDraw

from houspo_vision import config
from houspo_vision.images import open_rgb


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('photo')
    parser.add_argument('--url', default='http://localhost:8001')
    args = parser.parse_args()

    photo = Path(args.photo)
    image = open_rgb(photo)
    image.thumbnail((1280, 1280))
    image.save(config.DATA_DIR / 'try_upload.jpg', 'JPEG', quality=90)
    body = {'image_base64': base64.b64encode(
        (config.DATA_DIR / 'try_upload.jpg').read_bytes()).decode()}

    # The deployed service needs the shared key (set VISION_API_KEY).
    headers = {'X-Vision-Key': os.environ.get('VISION_API_KEY', '')}
    response = requests.post(f'{args.url}/detect-and-match', json=body,
                             headers=headers, timeout=120)
    response.raise_for_status()
    result = response.json()

    draw = ImageDraw.Draw(image)
    for item in result['items']:
        x1, y1, x2, y2 = item['box']
        draw.rectangle([x1, y1, x2, y2], outline=(255, 90, 40), width=3)
        draw.text((x1 + 4, y1 + 4), f"{item['id']} {item['label']} {item['confidence']:.2f}",
                  fill=(255, 255, 255))
        print(f"\n{item['id']}  {item['label']} ({item['confidence']:.2f})")
        for match in item['matches'][:3]:
            print(f"   {match['similarity']:.3f}  ${match['price'] or '?'}  {match['title'][:70]}")
    print('\nwhole room:')
    for match in result['room_matches'][:3]:
        print(f"   {match['similarity']:.3f}  {match['title'][:70]}")
    print('\ntimings:', result['timings_ms'])

    out_dir = config.DATA_DIR / 'try'
    out_dir.mkdir(exist_ok=True)
    image.save(out_dir / f'{photo.stem}_annotated.jpg', 'JPEG', quality=90)
    (out_dir / f'{photo.stem}.json').write_text(json.dumps(result, indent=1))
    print('saved', out_dir / f'{photo.stem}_annotated.jpg')


if __name__ == '__main__':
    main()
