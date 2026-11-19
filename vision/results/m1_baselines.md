# Milestone 1: retrieval baselines

**Task:** given an in-room (lifestyle) photo of a product, find that product in a fixed catalog of 719 products from Channel3, using each product's main (hero) photo.

**Test set:** 509 room → product pairs across 24 categories, mined from Channel3 lifestyle shots. A pair is dropped if its room photo is a near-duplicate of the product photo. The same product listed by another retailer (same brand and title) also counts as correct.

**Latency:** embedding the query plus searching, with the model already loaded, on an Apple Silicon laptop (MPS).

## Full test set (509 queries)

| Model | Recall@1 | Recall@5 | Recall@10 | MRR | p50 / p95 latency |
|---|---|---|---|---|---|
| CLIP ViT-B/32 (LAION-2B), whole photo | 40.3% | 68.6% | 77.2% | 0.524 | 10.6 / 11.8 ms |
| SigLIP 2 base, whole photo | 52.7% | 77.2% | 83.5% | 0.634 | 16.7 / 18.4 ms |
| CLIP, whole photo + known category* | 46.8% | 80.2% | 91.0% | 0.609 | 10.5 / 11.7 ms |
| SigLIP 2, whole photo + known category* | 57.2% | 84.3% | 92.7% | 0.691 | 16.4 / 18.2 ms |

\*"Known category" restricts the search to the product's true category. It is an upper bound for what detection-based category filtering can add, not a real system.

## Channel3 image search vs. local models (same 30 queries)

| System | Recall@1 | Recall@5 | MRR | p50 / p95 latency |
|---|---|---|---|---|
| Channel3 image search (whole index) | 30.0% | 36.7% | 0.348 | 1074 / 1250 ms |
| CLIP ViT-B/32 (719-product catalog) | 30.0% | 66.7% | 0.419 | 10.4 / 11.4 ms |
| SigLIP 2 base (719-product catalog) | 50.0% | 83.3% | 0.636 | 17.7 / 18.7 ms |

This comparison is not apples-to-apples. Channel3 searches its entire product index while the local models search 719 products, which makes Channel3's task much harder. Its latency also includes a network round trip. With only 30 queries, each result has a margin of error of roughly ±15 points.

## Takeaways

- SigLIP 2 beats CLIP by 12.4 points at Recall@1 and 8.6 points at Recall@5, at about 6 ms of extra latency. It becomes the default image embedding.
- Knowing the category adds 7 to 12 points of Recall@5. That gain is what object detection should recover in Milestone 2.
- These query photos are catalog-style and centered on one product. Real room photos will be harder, which is why the real-photo split exists.
