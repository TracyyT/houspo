import numpy as np

from houspo_vision.index import VectorIndex
from houspo_vision.metrics import first_hit_rank, summarize


def test_first_hit_rank():
    assert first_hit_rank(['a', 'b', 'c'], ['c']) == 3
    assert first_hit_rank(['a', 'b'], ['z']) is None
    assert first_hit_rank([1, 2], ['2']) == 2


def test_summarize():
    result = summarize([1, 3, None, 6], [10, 20, 30, 40], ks=(1, 5))
    assert result['recall@1'] == 0.25
    assert result['recall@5'] == 0.5
    assert result['mrr'] == round((1 + 1 / 3 + 1 / 6) / 4, 4)
    assert result['latency_p50_ms'] == 25.0


def test_index_orders_and_gates_by_category():
    vectors = np.eye(3, dtype=np.float32)
    index = VectorIndex(vectors, ['sofa1', 'lamp1', 'sofa2'],
                        ['sofa', 'lamp', 'sofa'])
    query = np.array([0.1, 1.0, 0.5], dtype=np.float32)
    assert [i for i, _ in index.search(query, k=3)] == ['lamp1', 'sofa2', 'sofa1']
    assert [i for i, _ in index.search(query, k=3, category='sofa')] == ['sofa2', 'sofa1']
