"""Open-vocabulary furniture and decor detection with YOLOE."""
from .categories import PROMPT_SETS


class YoloeDetector:
    def __init__(self, weights='yoloe-26s-seg.pt', conf=0.25, device=None,
                 prompt_set='v3'):
        from ultralytics import YOLOE
        self.name = f"{weights.replace('.pt', '')}-{prompt_set}"
        self.model = YOLOE(weights)
        self.categories, negatives = PROMPT_SETS[prompt_set]
        self.negatives = set(negatives)
        self.prompts = list(self.categories) + list(negatives)
        try:
            self.model.set_classes(self.prompts)
        except TypeError:
            # Older ultralytics versions need the text embeddings passed in.
            self.model.set_classes(self.prompts, self.model.get_text_pe(self.prompts))
        self.conf = conf
        self.device = device

    def detect(self, image, max_items=12):
        result = self.model.predict(image, conf=self.conf, agnostic_nms=True,
                                    device=self.device, verbose=False)[0]
        if result.boxes is None or len(result.boxes) == 0:
            return []
        boxes = result.boxes.xyxy.cpu().numpy()
        scores = result.boxes.conf.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy().astype(int)
        polygons = result.masks.xy if result.masks is not None else [None] * len(boxes)

        detections = []
        for box, score, cls, polygon in zip(boxes, scores, classes, polygons):
            prompt = self.prompts[cls]
            if prompt in self.negatives:
                continue
            detections.append({
                'label': prompt,
                'category': self.categories[prompt],
                'confidence': round(float(score), 3),
                'box': [round(float(v), 1) for v in box],
                'polygon': ([[round(float(x), 1), round(float(y), 1)] for x, y in polygon]
                            if polygon is not None and len(polygon) else None),
            })
        detections.sort(key=lambda d: d['confidence'], reverse=True)
        return detections[:max_items]
