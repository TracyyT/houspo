# houspo vision

The computer vision service behind **Shop this room**:
1. Detect furniture and decor in a room photo with YOLOE (open vocabulary).
2. Crop each item and embed it with SigLIP 2, plus a small learned adapter.
3. Retrieve visually similar products from the catalog, searching only the item's category group.

## Run locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q
python -m scripts.build_catalog            # Channel3 text search (cached, budget-capped)
uvicorn service.app:app --port 8001
```

Then start the backend with `VISION_SERVICE_URL=http://localhost:8001` and open `/shop-room` in the frontend.

## Reproduce the evaluation

```bash
python -m scripts.mine_pairs               # room -> product pairs from catalog lifestyle photos
python -m scripts.eval_retrieval           # CLIP vs SigLIP 2, whole photo
python -m scripts.eval_detection           # detection + crop + category search
python -m scripts.cache_features && python -m scripts.train_adapter   # 5-fold cross-validated adapter
python -m scripts.label_real && python -m scripts.eval_real            # hand-labeled real photos
```

Results are in `results/`. Channel3 calls are cached, and they stop at the limits in `houspo_vision/config.py`.

## Deploy on Modal (CPU, scales to zero)

`modal_app.py` runs on CPU only. Its settings are `min_containers=0`, `max_containers=1` and `scaledown_window=120`, so nothing runs while it's idle, at most one container ever runs, and it shuts down 2 minutes after the last request.

**Before deploying, set a spending limit** in Modal under Usage & Billing → Workspace budget:
- Set the **spend limit** (out-of-pocket charges after credits) to the lowest value allowed, ideally $0.
- Set the **usage limit** to the monthly credit amount.

When the spend limit is reached, Modal stops workloads that would cost money. The app then falls back to regular recommendations.

```bash
pip install modal && modal setup
python -m scripts.export_bundle            # catalog + embeddings, about 4 MB
modal secret create houspo-vision VISION_API_KEY=<long random string>
modal deploy modal_app.py
```

On the backend (Render), set these:
- `VISION_SERVICE_URL`: the URL printed by `modal deploy`
- `VISION_API_KEY`: the same random string as above

To turn the feature off, remove `VISION_SERVICE_URL` (the app falls back automatically) or run `modal app stop houspo-vision`.
