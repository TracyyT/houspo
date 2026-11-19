"""Cross-validated comparison of plain SigLIP 2 vs. SigLIP 2 + adapter,
then train the final adapter on all products.

Products are split into 5 folds (listings of the same product stay
together). Each fold's test photos are scored by an adapter trained
on the other 4 folds, so every reported query is unseen in training.

    python -m scripts.train_adapter
"""
import argparse
import hashlib
import json
import random

import numpy as np

from houspo_vision import config
from houspo_vision.adapter import train_adapter
from houspo_vision.catalog import load_catalog, title_key
from houspo_vision.categories import search_categories
from houspo_vision.embed import get_embedder
from houspo_vision.gallery import build_index
from houspo_vision.metrics import first_hit_rank, summarize

FOLDS = 5


def fold_of(group):
    return int(hashlib.md5(group.encode()).hexdigest(), 16) % FOLDS


def rank(index, vector, detected_category, correct_ids):
    allowed = search_categories(detected_category) if detected_category else None
    hits = index.search(vector, k=10, category=allowed)
    return first_hit_rank([pid for pid, _ in hits], correct_ids)


def training_set(rows, vectors, product_ids, gallery_ids, groups, rng):
    """Queries, targets and duplicate masks for the given products."""
    position = {pid: i for i, pid in enumerate(gallery_ids)}
    picked = [i for i, row in enumerate(rows)
              if row['product_id'] in product_ids and row['product_id'] in position]
    rng.shuffle(picked)
    targets = np.array([position[rows[i]['product_id']] for i in picked])
    group_of = [groups[pid] for pid in gallery_ids]
    same = np.array([[group_of[t] == g and j != t for j, g in enumerate(group_of)]
                     for t in targets], dtype=bool)
    return vectors[picked], targets, same


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--embedder', default='siglip2-base')
    parser.add_argument('--features', default='features_siglip2-base-patch16-224_yoloe-26s-seg-v3')
    parser.add_argument('--epochs', type=int, default=300)
    args = parser.parse_args()

    products = load_catalog()
    groups = {p['id']: title_key(p) for p in products}
    rows = json.loads((config.EMBED_DIR / f'{args.features}.json').read_text())
    vectors = np.load(config.EMBED_DIR / f'{args.features}.npy')
    feature_of = {row['image']: i for i, row in enumerate(rows)}

    embedder = get_embedder(args.embedder)
    index = build_index(embedder, products)

    pairs = json.loads(config.PAIRS_PATH.read_text())
    pairs = [p for p in pairs if p['query_image'].split('/')[-1] in feature_of]

    rng = random.Random(0)
    base_ranks, adapted_ranks, best_epochs, per_fold = [], [], [], []
    for fold in range(FOLDS):
        test_products = {pid for pid, g in groups.items() if fold_of(g) == fold}
        train_groups = sorted({g for pid, g in groups.items() if fold_of(g) != fold})
        rng.shuffle(train_groups)
        val_groups = set(train_groups[:len(train_groups) // 8])
        train_products = {pid for pid, g in groups.items()
                          if fold_of(g) != fold and g not in val_groups}
        val_products = {pid for pid, g in groups.items() if g in val_groups}

        # Train only against the training fold's catalog photos.
        train_gallery = [i for i, pid in enumerate(index.ids) if pid not in test_products]
        gallery_ids = [index.ids[i] for i in train_gallery]
        gallery = index.vectors[train_gallery]

        q, t, same = training_set(rows, vectors, train_products, gallery_ids, groups, rng)
        vq, vt, vsame = training_set(rows, vectors, val_products, gallery_ids, groups, rng)
        adapter, best_epoch = train_adapter(q, t, gallery, same, epochs=args.epochs,
                                            val_queries=vq, val_targets=vt, val_same=vsame)
        best_epochs.append(best_epoch)

        fold_pairs = [p for p in pairs if p['product_id'] in test_products]
        fb, fa = [], []
        for pair in fold_pairs:
            row = rows[feature_of[pair['query_image'].split('/')[-1]]]
            vector = vectors[feature_of[pair['query_image'].split('/')[-1]]]
            fb.append(rank(index, vector, row['detected_category'], pair['correct_ids']))
            fa.append(rank(index, adapter(vector[None])[0], row['detected_category'],
                           pair['correct_ids']))
        base_ranks += fb
        adapted_ranks += fa
        per_fold.append({'fold': fold, 'train_photos': len(q), 'test_queries': len(fold_pairs),
                         'best_epoch': best_epoch,
                         'base_recall@5': summarize(fb)['recall@5'],
                         'adapter_recall@5': summarize(fa)['recall@5']})
        print(per_fold[-1])

    # Final adapter: all products, epoch count from cross-validation.
    epochs = int(np.median(best_epochs))
    q, t, same = training_set(rows, vectors, set(groups), index.ids, groups, rng)
    final, _ = train_adapter(q, t, index.vectors, same, epochs=epochs)
    out = config.VISION_DIR / 'models' / 'adapter_siglip2.npz'
    final.save(out)

    results = {
        'features': args.features,
        'folds': FOLDS,
        'final_epochs': epochs,
        'training_photos': len(q),
        'siglip2_box_crop': summarize(base_ranks),
        'siglip2_box_crop_adapter': summarize(adapted_ranks),
        'per_fold': per_fold,
    }
    (config.RESULTS_DIR / 'm4_adapter.json').write_text(json.dumps(results, indent=2))
    print(json.dumps({k: v for k, v in results.items() if k != 'per_fold'}, indent=2))
    print('saved', out)


if __name__ == '__main__':
    main()
