"""Small Channel3 client with a response cache and a hard credit budget.

Every request is cached on disk by its payload, so re-running an
evaluation never spends credits twice. Requests that would go over
the budget raise BudgetExceeded instead of calling the API.
"""
import base64
import hashlib
import json
from pathlib import Path

import requests

from . import config


class BudgetExceeded(RuntimeError):
    pass


class Budget:
    def __init__(self, path=config.BUDGET_PATH, limits=None):
        self.path = Path(path)
        self.limits = limits or config.BUDGET_LIMITS
        self.used = {key: 0 for key in self.limits}
        if self.path.exists():
            self.used.update(json.loads(self.path.read_text()))

    def remaining(self, key):
        return self.limits[key] - self.used.get(key, 0)

    def require(self, key, amount=1):
        if self.remaining(key) < amount:
            raise BudgetExceeded(
                f'{key}: need {amount}, {self.remaining(key)} left '
                f'(limit {self.limits[key]})'
            )

    def spend(self, key, amount=1):
        self.used[key] = self.used.get(key, 0) + amount
        self.path.write_text(json.dumps(self.used, indent=2))

    def summary(self):
        return {
            key: f'{self.used.get(key, 0)}/{limit}'
            for key, limit in self.limits.items()
        }


def _cache_key(endpoint, payload):
    raw = json.dumps({'endpoint': endpoint, **payload}, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


class Channel3Client:
    def __init__(self, api_key=None, cache_dir=config.CACHE_DIR, budget=None,
                 session=None):
        self.api_key = api_key if api_key is not None else config.CHANNEL3_API_KEY
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.budget = budget or Budget()
        self.session = session or requests.Session()
        self.last_cached = False

    def _post(self, endpoint, payload, budget_key, cost=1, timeout=60):
        path = self.cache_dir / f'{_cache_key(endpoint, payload)}.json'
        self.last_cached = path.exists()
        if self.last_cached:
            return json.loads(path.read_text())

        if not self.api_key:
            raise RuntimeError('CHANNEL3_API_KEY is not set (server/.env)')

        self.budget.require(budget_key, cost)
        response = self.session.post(
            f'{config.CHANNEL3_BASE_URL}{endpoint}',
            headers={'x-api-key': self.api_key, 'Content-Type': 'application/json'},
            json=payload,
            timeout=timeout,
        )
        response.raise_for_status()
        data = response.json()

        actual_cost = cost
        if budget_key == 'find_in_image_credits':
            # 1 credit for the call plus 1 per detected thing.
            actual_cost = 1 + len(data.get('results', data.get('items', [])))
        self.budget.spend(budget_key, actual_cost)

        path.write_text(json.dumps(data))
        return data

    def text_search(self, query, limit=30):
        return self._post('/v1/search', {'query': query, 'limit': limit},
                          'text_search')

    def image_search(self, image_path, limit=10):
        b64 = base64.b64encode(Path(image_path).read_bytes()).decode()
        return self._post('/v1/search', {'base64_image': b64, 'limit': limit},
                          'image_search')

    def find_products_in_image(self, image_path, limit=5, max_items=10):
        # Reserve the worst case before calling.
        self.budget.require('find_in_image_credits', 1 + max_items)
        b64 = base64.b64encode(Path(image_path).read_bytes()).decode()
        return self._post('/experimental/find-products-in-image',
                          {'base64_image': b64, 'limit': limit},
                          'find_in_image_credits', cost=1 + max_items)


def products_from_response(data):
    return data.get('products') or data.get('results') or data.get('items') or []
