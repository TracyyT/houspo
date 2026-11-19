import os
from pathlib import Path

from dotenv import load_dotenv

VISION_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = VISION_DIR.parent

# Reuse the backend's .env so keys live in one place.
load_dotenv(REPO_DIR / 'server' / '.env')
load_dotenv(VISION_DIR / '.env')

DATA_DIR = VISION_DIR / 'data'
CACHE_DIR = DATA_DIR / 'channel3_cache'
IMAGE_DIR = DATA_DIR / 'images'
EMBED_DIR = DATA_DIR / 'embeddings'
CATALOG_PATH = DATA_DIR / 'catalog.json'
BUDGET_PATH = DATA_DIR / 'channel3_budget.json'

EVAL_DIR = VISION_DIR / 'eval'
PAIRS_PATH = EVAL_DIR / 'catalog_pairs.json'
REAL_DIR = EVAL_DIR / 'real'
RESULTS_DIR = VISION_DIR / 'results'

CHANNEL3_API_KEY = os.getenv('CHANNEL3_API_KEY', '')
CHANNEL3_BASE_URL = 'https://api.trychannel3.com'

# Credit caps. Cached responses never count.
# Image search is capped at 50 calls; find-products-in-image
# is charged 1 + 1 per detected item, so it gets its own cap.
BUDGET_LIMITS = {
    'text_search': int(os.getenv('C3_TEXT_SEARCH_LIMIT', 40)),
    'image_search': int(os.getenv('C3_IMAGE_SEARCH_LIMIT', 50)),
    'find_in_image_credits': int(os.getenv('C3_FIND_IN_IMAGE_CREDIT_LIMIT', 60)),
}

for folder in (DATA_DIR, CACHE_DIR, IMAGE_DIR, EMBED_DIR, RESULTS_DIR):
    folder.mkdir(parents=True, exist_ok=True)
