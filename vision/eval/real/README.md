# Real room photos

Put room photos here as `001.jpg`, `002.jpg`, ... Use photos you took or have permission to use.

Labels live in `labels.json`. Each detected item lists the catalog products that count as a correct match:

```json
[
  {
    "image": "001.jpg",
    "items": [
      { "category": "sofa", "bbox": [120, 340, 860, 720], "correct_ids": ["<channel3 product id>"] }
    ]
  }
]
```

`bbox` is `[x1, y1, x2, y2]` in pixels of the original photo. Exact products are rarely in the catalog, so `correct_ids` holds products judged a close visual match (same type, shape, color and material).
