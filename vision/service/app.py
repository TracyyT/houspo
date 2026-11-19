"""Vision API for Shop this room.

    uvicorn service.app:app --port 8001
"""
import base64
import binascii
import io
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from PIL import Image, UnidentifiedImageError

from houspo_vision.images import upright
from pydantic import BaseModel, Field

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_SIDE = 1280


class ShopRoomRequest(BaseModel):
    image_base64: str = Field(..., description='JPEG or PNG, base64, optional data: prefix')
    k: int = Field(8, ge=1, le=20)
    max_items: int = Field(8, ge=1, le=12)


def decode_image(data):
    if data.startswith('data:'):
        data = data.split(',', 1)[-1]
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(400, 'image_base64 is not valid base64')
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(413, 'image is larger than 8 MB')
    try:
        image = upright(Image.open(io.BytesIO(raw)))
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, 'could not read image')
    image.thumbnail((MAX_SIDE, MAX_SIDE))
    return image


def default_pipeline():
    from houspo_vision.catalog import load_catalog
    from houspo_vision.detect import YoloeDetector
    from houspo_vision.embed import get_embedder
    from houspo_vision.gallery import build_index
    from houspo_vision.pipeline import ShopRoom

    products = load_catalog()
    embedder = get_embedder(os.getenv('VISION_EMBEDDER', 'siglip2-base'))
    detector = YoloeDetector(os.getenv('VISION_DETECTOR', 'yoloe-26s-seg.pt'))
    return ShopRoom(detector, embedder, build_index(embedder, products), products)


def create_app(pipeline_factory=default_pipeline):
    state = {}

    @asynccontextmanager
    async def lifespan(app):
        pipeline = pipeline_factory()
        # The first request on a fresh model is slow, so pay that
        # cost at startup instead of on a user's upload.
        pipeline.analyze(Image.new('RGB', (640, 480), (200, 200, 200)))
        state['pipeline'] = pipeline
        yield
        state.clear()

    app = FastAPI(title='houspo vision', lifespan=lifespan)

    def check_key(key):
        expected = os.getenv('VISION_API_KEY')
        if expected and key != expected:
            raise HTTPException(401, 'invalid key')

    @app.get('/health')
    def health():
        pipeline = state.get('pipeline')
        return {
            'ready': pipeline is not None,
            'detector': getattr(getattr(pipeline, 'detector', None), 'name', None),
            'embedder': getattr(getattr(pipeline, 'embedder', None), 'name', None),
        }

    @app.post('/detect-and-match')
    def detect_and_match(request: ShopRoomRequest,
                         x_vision_key: str | None = Header(default=None)):
        check_key(x_vision_key)
        image = decode_image(request.image_base64)
        return state['pipeline'].analyze(image, k=request.k,
                                         max_items=request.max_items)

    return app


app = create_app()
