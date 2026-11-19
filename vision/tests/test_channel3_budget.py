import pytest

from houspo_vision.channel3 import Budget, BudgetExceeded, Channel3Client


class FakeResponse:
    def __init__(self, data):
        self.data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self.data


class FakeSession:
    def __init__(self, data):
        self.calls = 0
        self.data = data

    def post(self, *args, **kwargs):
        self.calls += 1
        return FakeResponse(self.data)


def make_client(tmp_path, limits, data=None):
    budget = Budget(tmp_path / 'budget.json', limits)
    session = FakeSession(data or {'products': [{'id': 'p1'}]})
    client = Channel3Client('key', tmp_path / 'cache', budget, session)
    return client, session


def test_cached_requests_do_not_spend(tmp_path):
    client, session = make_client(tmp_path, {'text_search': 1})
    client.text_search('sofa')
    client.text_search('sofa')
    assert session.calls == 1
    assert client.last_cached
    assert client.budget.used['text_search'] == 1


def test_budget_blocks_new_calls(tmp_path):
    client, session = make_client(tmp_path, {'text_search': 1})
    client.text_search('sofa')
    with pytest.raises(BudgetExceeded):
        client.text_search('lamp')
    assert session.calls == 1


def test_budget_persists(tmp_path):
    client, _ = make_client(tmp_path, {'text_search': 2})
    client.text_search('sofa')
    again = Budget(tmp_path / 'budget.json', {'text_search': 2})
    assert again.remaining('text_search') == 1


def test_find_in_image_charges_per_item(tmp_path):
    image = tmp_path / 'room.jpg'
    image.write_bytes(b'x')
    data = {'results': [{}, {}, {}]}
    client, _ = make_client(tmp_path, {'find_in_image_credits': 14}, data)
    client.find_products_in_image(image, max_items=10)
    assert client.budget.used['find_in_image_credits'] == 4
    with pytest.raises(BudgetExceeded):
        client.find_products_in_image(tmp_path / 'room.jpg', limit=3, max_items=10)
