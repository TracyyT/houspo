"""Image embedding models behind one small interface."""
import numpy as np
import torch
from PIL import Image

from .images import open_rgb, upright


def pick_device():
    if torch.cuda.is_available():
        return 'cuda'
    if torch.backends.mps.is_available():
        return 'mps'
    return 'cpu'


def _load(images):
    return [upright(img) if isinstance(img, Image.Image) else open_rgb(img)
            for img in images]


def _normalize(features):
    # Newer transformers versions return an output object
    # instead of a plain tensor.
    if not torch.is_tensor(features):
        features = features.pooler_output
    features = features.float()
    return (features / features.norm(dim=-1, keepdim=True)).cpu().numpy()


class OpenClipEmbedder:
    def __init__(self, model_name='ViT-B-32', pretrained='laion2b_s34b_b79k',
                 device=None):
        import open_clip
        self.name = f'clip-{model_name.lower()}'
        self.device = device or pick_device()
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained)
        self.model.eval().to(self.device)

    @torch.no_grad()
    def embed_images(self, images, batch_size=32):
        out = []
        for start in range(0, len(images), batch_size):
            batch = torch.stack([self.preprocess(img) for img in
                                 _load(images[start:start + batch_size])])
            out.append(_normalize(self.model.encode_image(batch.to(self.device))))
        return np.concatenate(out) if out else np.zeros((0, 512), dtype=np.float32)


class SiglipEmbedder:
    def __init__(self, model_id='google/siglip2-base-patch16-224', device=None):
        from transformers import AutoModel, AutoProcessor
        self.name = 'siglip2-' + model_id.split('siglip2-')[-1]
        self.device = device or pick_device()
        self.processor = AutoProcessor.from_pretrained(model_id)
        self.model = AutoModel.from_pretrained(model_id).eval().to(self.device)

    @torch.no_grad()
    def embed_images(self, images, batch_size=32):
        out = []
        for start in range(0, len(images), batch_size):
            inputs = self.processor(images=_load(images[start:start + batch_size]),
                                    return_tensors='pt').to(self.device)
            out.append(_normalize(self.model.get_image_features(**inputs)))
        return np.concatenate(out) if out else np.zeros((0, 768), dtype=np.float32)


EMBEDDERS = {
    'clip-b32': lambda: OpenClipEmbedder('ViT-B-32', 'laion2b_s34b_b79k'),
    'siglip2-base': lambda: SiglipEmbedder('google/siglip2-base-patch16-224'),
}


def get_embedder(name):
    return EMBEDDERS[name]()
