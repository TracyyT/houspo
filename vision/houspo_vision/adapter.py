"""A small learned layer on top of frozen SigLIP 2 room-crop embeddings.

Room photos and catalog photos look different (lighting, angle,
clutter). The adapter learns to move a room-crop embedding toward
where that product's catalog photo sits, without touching the
catalog embeddings, so the catalog never needs re-embedding.

    q' = normalize(q + q @ W + b)

W starts at zero, so an untrained adapter changes nothing.
"""
import numpy as np


class QueryAdapter:
    def __init__(self, weight, bias):
        self.weight = np.asarray(weight, dtype=np.float32)
        self.bias = np.asarray(bias, dtype=np.float32)

    @classmethod
    def load(cls, path):
        data = np.load(path)
        return cls(data['weight'], data['bias'])

    def save(self, path):
        np.savez(path, weight=self.weight, bias=self.bias)

    def __call__(self, vectors):
        vectors = np.asarray(vectors, dtype=np.float32)
        out = vectors + vectors @ self.weight + self.bias
        return out / np.linalg.norm(out, axis=-1, keepdims=True)


def train_adapter(queries, targets, gallery, same_product=None, epochs=300,
                  lr=1e-3, weight_decay=1e-4, temperature=0.05,
                  val_queries=None, val_targets=None, val_same=None, seed=0):
    """Contrastive training against the whole (training) gallery.

    queries:  (n, d) room-crop embeddings
    targets:  (n,) index of each query's product in `gallery`
    gallery:  (m, d) catalog embeddings, kept frozen
    same_product: optional (n, m) bool mask of other listings of the
        same product, which are excluded from the negatives.
    Returns (adapter, best_epoch).
    """
    import torch

    torch.manual_seed(seed)
    q = torch.tensor(queries, dtype=torch.float32)
    t = torch.tensor(targets, dtype=torch.long)
    g = torch.tensor(gallery, dtype=torch.float32)
    d = q.shape[1]

    weight = torch.zeros(d, d, requires_grad=True)
    bias = torch.zeros(d, requires_grad=True)
    optimizer = torch.optim.AdamW([weight, bias], lr=lr, weight_decay=weight_decay)

    def forward(x):
        out = x + x @ weight + bias
        return out / out.norm(dim=-1, keepdim=True)

    def masked_logits(x, mask):
        logits = forward(x) @ g.T / temperature
        if mask is not None:
            logits = logits.masked_fill(torch.tensor(mask), float('-inf'))
        return logits

    def val_top1():
        with torch.no_grad():
            logits = masked_logits(torch.tensor(val_queries, dtype=torch.float32), val_same)
            return (logits.argmax(1) == torch.tensor(val_targets)).float().mean().item()

    best = (-1.0, 0, weight.detach().clone(), bias.detach().clone())
    for epoch in range(1, epochs + 1):
        optimizer.zero_grad()
        loss = torch.nn.functional.cross_entropy(masked_logits(q, same_product), t)
        loss.backward()
        optimizer.step()

        if val_queries is not None and (epoch % 10 == 0 or epoch == epochs):
            score = val_top1()
            if score > best[0]:
                best = (score, epoch, weight.detach().clone(), bias.detach().clone())

    if val_queries is None:
        return QueryAdapter(weight.detach().numpy(), bias.detach().numpy()), epochs
    _, best_epoch, best_weight, best_bias = best
    return QueryAdapter(best_weight.numpy(), best_bias.numpy()), best_epoch
