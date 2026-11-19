# Milestone 4: real room photos

**Test set:** 29 room photos (the photos themselves are git-ignored). YOLOE detected 172 items, which were hand-labeled with `scripts/label_real.py`:
- 165 were real furniture or decor, so detection precision is **95.9%**. The other 7 were false detections.
- 34 had no close match anywhere in the 779-product catalog (mostly chairs and lamps), so they show catalog gaps, not model errors.
- **131 items had at least one close match** (1.9 on average). These are the scored items.

**How an item is scored:** a system scores an item when one of its detections overlaps the labeled box (IoU ≥ 0.5). Its rank is the position of the first product labeled as a close match.

**Candidate pool:** each item showed the labeler the top 5 from several systems: SigLIP 2 with and without the category filter, CLIP with the filter, and SigLIP 2 + adapter. The candidates were shuffled, at most 15 per item. Top-5 numbers are therefore judged for every detection system below. Products ranked 6–10 may never have been shown, so Recall@10 is a lower bound.

| System | Recall@1 | Recall@5 | Recall@10* | MRR |
|---|---|---|---|---|
| CLIP ViT-B/32, detected box (v3 prompts) | 22.9% | 63.4% | 73.3% | 0.388 |
| SigLIP 2, detected box (v2 prompts) | 36.6% | 73.3% | 84.0% | 0.512 |
| SigLIP 2, detected box (v3 prompts) | 37.4% | 74.8% | 85.5% | 0.522 |
| **SigLIP 2 + adapter, detected box (v3 prompts)** | **37.4%** | **78.6%** | 85.5% | **0.527** |

\*Lower bound; see above.

**Latency:** 163 ms p50 and 256 ms p95 end to end (detection plus all items), on an Apple Silicon laptop (MPS).

## Reading the results

- **SigLIP 2 vs CLIP:** SigLIP 2 roughly doubles Recall@5 gains over CLIP's starting point: +11.4 to +15.2 points Recall@5, and +14.5 points Recall@1.
- **New prompts (v3):** +1.5 points Recall@5 over v2. That's within noise for 131 items, but there was no loss, and false detections stayed low (95.9% precision).
- **Adapter:** +3.8 points Recall@5 on real photos, with no change at Recall@1. On its own that's within noise (±7 points at n=131). It is switched on because it also gains on the catalog set under 5-fold cross-validation, with improvements in every fold (Recall@5 +3.7, Recall@1 +5.7), and it never hurt.
- **Real rooms are harder than catalog photos.** Recall@1 drops from about 69% on catalog photos to about 37% here. Real rooms are cluttered, the lighting varies, and an exact product is rarely in the catalog. Matches in real rooms are usually "close in style" rather than identical.
- **Catalog coverage is a real limit.** 21% of real items had no close match among 779 products. A larger catalog would help more than a better model for those items.
- **Whole-photo search wasn't scored.** It was run, but its results weren't in the candidate pool, so they weren't labeled.
