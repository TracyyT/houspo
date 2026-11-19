# Real room photos

Put room photos here as `001.jpg`, `002.jpg`, ... Use photos you took or have permission to use. Photos are git-ignored (they can contain location data); only `labels.json` is committed.

Label them with the labeling page:

```bash
python -m scripts.label_real      # then open http://localhost:8002
```

For each detected item, tick every candidate that's a close match (same kind of item with a similar shape, color and material). Use "No good match" when nothing fits, or "Not a real item" for a wrong detection. Candidates are pooled from several models and shuffled, so the labels don't favor the model being tested.

`labels.json` (written by the page):

```json
[
  {
    "image": "001.jpg",
    "items": [
      { "key": "001.jpg#0", "label": "couch", "category": "sofa",
        "box": [0, 700, 600, 1280], "status": "ok", "correct_ids": ["<channel3 product id>"] }
    ]
  }
]
```

`status` is `ok` (labeled), `wrong` (not a real item) or `unlabeled`. Boxes are in pixels of the photo resized to fit within 1280 px.
