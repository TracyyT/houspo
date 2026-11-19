"""Label real room photos: which catalog products are a close match
for each detected item.

    python -m scripts.label_real            # prepare candidates, then serve
    open http://localhost:8002

Candidates come from several systems (pooled and shuffled) so the
labels don't favour whichever model is being evaluated. Every click
saves to eval/real/labels.json.
"""
import argparse
import json
import mimetypes
import random
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from houspo_vision import config
from houspo_vision.adapter import QueryAdapter
from houspo_vision.catalog import gallery_image, image_path_for, load_catalog
from houspo_vision.categories import search_categories
from houspo_vision.crops import box_crop
from houspo_vision.detect import YoloeDetector
from houspo_vision.embed import get_embedder
from houspo_vision.gallery import build_index
from houspo_vision.images import open_rgb, try_open_rgb

PAGE = Path(__file__).parent / 'label_page' / 'index.html'
CANDIDATES = config.DATA_DIR / 'label_candidates.json'
LABELS = config.REAL_DIR / 'labels.json'
PHOTO_TYPES = ('*.jpg', '*.jpeg', '*.png')


def real_photos():
    return sorted(p for pattern in PHOTO_TYPES for p in config.REAL_DIR.glob(pattern))


def prepare(max_items=6, per_system=5, max_candidates=15):
    products = load_catalog()
    by_id = {p['id']: p for p in products}
    detector = YoloeDetector(prompt_set='v3')
    siglip, clip = get_embedder('siglip2-base'), get_embedder('clip-b32')
    siglip_index, clip_index = build_index(siglip, products), build_index(clip, products)
    adapter_path = config.VISION_DIR / 'models' / 'adapter_siglip2.npz'
    adapter = QueryAdapter.load(adapter_path) if adapter_path.exists() else None
    rng = random.Random(42)

    photos = []
    for path in real_photos():
        image = try_open_rgb(path)
        if image is None:
            continue
        image.thumbnail((1280, 1280))
        items = []
        for number, det in enumerate(detector.detect(image, max_items=max_items)):
            crop = box_crop(image, det['box'])
            group = search_categories(det['category'])
            s = siglip.embed_images([crop])
            c = clip.embed_images([crop])
            pools = [
                siglip_index.search(s[0], k=per_system, category=group),
                siglip_index.search(s[0], k=per_system),
                clip_index.search(c[0], k=per_system, category=group),
            ]
            if adapter is not None:
                pools.append(siglip_index.search(adapter(s)[0], k=per_system, category=group))
            ids = list(dict.fromkeys(pid for pool in pools for pid, _ in pool))[:max_candidates]
            rng.shuffle(ids)
            items.append({
                'key': f'{path.name}#{number}',
                'label': det['label'],
                'category': det['category'],
                'box': det['box'],
                'candidates': [{
                    'id': pid,
                    'title': by_id[pid]['title'],
                    'price': by_id[pid]['price'],
                    'image': image_path_for(gallery_image(by_id[pid])['url']).name,
                } for pid in ids],
            })
        photos.append({'image': path.name, 'width': image.size[0],
                       'height': image.size[1], 'items': items})
        print(f'{path.name}: {len(items)} items')

    CANDIDATES.write_text(json.dumps(photos))
    return photos


class Handler(BaseHTTPRequestHandler):
    def _send(self, body, content_type='application/json', status=200):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/':
            return self._send(PAGE.read_bytes(), 'text/html; charset=utf-8')
        if self.path == '/data':
            labels = json.loads(LABELS.read_text()) if LABELS.exists() else []
            return self._send(json.dumps({'photos': json.loads(CANDIDATES.read_text()),
                                          'labels': labels}).encode())
        for prefix, folder in (('/photo/', config.REAL_DIR), ('/product/', config.IMAGE_DIR)):
            if self.path.startswith(prefix):
                path = (folder / self.path[len(prefix):]).resolve()
                if path.parent == folder.resolve() and path.exists():
                    if prefix == '/photo/':
                        # Serve photos upright and small, like the app does.
                        import io
                        image = open_rgb(path)
                        image.thumbnail((1280, 1280))
                        buffer = io.BytesIO()
                        image.save(buffer, 'JPEG', quality=85)
                        return self._send(buffer.getvalue(), 'image/jpeg')
                    return self._send(path.read_bytes(),
                                      mimetypes.guess_type(path.name)[0] or 'image/jpeg')
        self._send(b'not found', 'text/plain', 404)

    def do_POST(self):
        if self.path != '/save':
            return self._send(b'not found', 'text/plain', 404)
        body = self.rfile.read(int(self.headers['Content-Length']))
        labels = json.loads(body)
        LABELS.write_text(json.dumps(labels, indent=1))
        self._send(b'{"saved": true}')

    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8002)
    parser.add_argument('--reuse', action='store_true',
                        help='skip the models and reuse the last candidates')
    args = parser.parse_args()

    if not (args.reuse and CANDIDATES.exists()):
        prepare()
    print(f'Labeling page: http://localhost:{args.port}  (Ctrl-C to stop)')
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()


if __name__ == '__main__':
    main()
