# Milestone 2: detection + crop + category search

Same 509 room → product pairs and 719-product catalog as Milestone 1, using SigLIP 2 base for all image embeddings. Latencies are measured on an Apple Silicon laptop (MPS) with the models already loaded.

## Effect of detection on retrieval (YOLOE-26s, confidence 0.25)

For each photo we take the detection that matches the target product, crop it, and search only that category's group. If the target wasn't detected, the search falls back to the whole photo.

| Query | Recall@1 | Recall@5 | Recall@10 | MRR |
|---|---|---|---|---|
| CLIP ViT-B/32, whole photo (Milestone 1 baseline) | 40.3% | 68.6% | 77.2% | 0.524 |
| SigLIP 2, whole photo | 52.7% | 77.2% | 83.5% | 0.634 |
| SigLIP 2, whole photo + detected category | 55.6% | 82.7% | 90.8% | 0.675 |
| SigLIP 2, mask cutout + detected category | 51.3% | 76.8% | 84.9% | 0.626 |
| **SigLIP 2, box crop + detected category** | **63.3%** | **85.3%** | **91.2%** | **0.732** |

Box crops beat mask cutouts. The cutout puts the item on a plain white background, which loses legs, shadows and context. It also cuts off parts of the item wherever the mask is imperfect.

## Detector prompts and settings

| Detector | Prompts | Conf | Target detected | Items / photo | Right product under a detected item (top 5) | …or in the whole-room row | p50 / p95 end-to-end |
|---|---|---|---|---|---|---|---|
| YOLOE-26s | 24 specific | 0.25 | 54.2% | 3.8 | 46.2% | – | 130 / 168 ms |
| **YOLOE-26s** | **37 incl. generic** | **0.25** | **84.9%** | **5.4** | **73.5%** | **88.6%** | **153 / 181 ms** |
| YOLOE-26s | 37 incl. generic | 0.10 | 88.0% | 6.3 | 75.4% | 88.6% | 164 / 180 ms |
| YOLOE-26m | 37 incl. generic | 0.10 | 87.4% | 6.1 | 76.2% | 88.2% | 266 / 291 ms |

Specific prompts like "dining chair" or "pendant light" alone missed whole categories. Detection was 0% for dining chairs and pendant lights, 4% for office chairs, and 17% for floor lamps. Adding generic prompts ("chair", "lamp", "cushion", "shelf") that search a group of categories raised those to 95–100%.

The two "right product" columns count a hit when the product appears in the top 5 of *any* list the user can open: a detected item's matches, or the whole-room row. Because they count several lists, they aren't comparable with the single-list recall in the first table.

## Chosen settings

YOLOE-26s with generic prompts, a confidence threshold of 0.25, and box crops. Lowering the threshold to 0.10 adds about one extra item per photo, which is more clutter for 2 points. The medium model doubles detection time for no gain.

## Weakest categories (box crop, top 5)

Planters 55%, sectionals 62%, mirrors 64%, TV stands 68%. Mirrors and planters look much alike across products, and sectional photos often crop the item. TV stands and benches are still often missed (40% and 33% detected).
