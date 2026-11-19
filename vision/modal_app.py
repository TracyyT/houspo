"""houspo vision service on Modal (CPU only, scales to zero).

Before the first deploy:
    python -m scripts.export_bundle
    modal secret create houspo-vision VISION_API_KEY=<long random string>
Deploy:
    modal deploy modal_app.py
"""
from pathlib import Path

import modal

HERE = Path(__file__).parent
REMOTE = '/root/vision'

image = (
    modal.Image.debian_slim(python_version='3.12')
    .apt_install('git', 'libgl1', 'libglib2.0-0')
    # CPU-only PyTorch: much smaller image, and no GPU is used.
    .pip_install('torch', 'torchvision', index_url='https://download.pytorch.org/whl/cpu')
    .pip_install(
        'numpy>=1.26',
        'pillow>=10.0',
        'requests>=2.31',
        'python-dotenv>=1.0',
        'transformers>=4.49',
        'sentencepiece>=0.2',
        'protobuf>=4.25',
        'ultralytics>=8.4',
        'git+https://github.com/ultralytics/CLIP.git',
        'fastapi>=0.115',
    )
    .env({
        'VISION_BUNDLE': f'{REMOTE}/bundle',
        'HF_HOME': '/root/hf',
        'YOLO_CONFIG_DIR': '/root/.ultralytics',
        'PYTHONPATH': REMOTE,
    })
    .workdir(REMOTE)
    .add_local_dir(HERE / 'houspo_vision', f'{REMOTE}/houspo_vision', copy=True,
                   ignore=['**/__pycache__'])
    .add_local_dir(HERE / 'service', f'{REMOTE}/service', copy=True,
                   ignore=['**/__pycache__'])
    .add_local_dir(HERE / 'models', f'{REMOTE}/models', copy=True)
    .add_local_dir(HERE / 'data' / 'bundle', f'{REMOTE}/bundle', copy=True)
)


def download_models():
    """Bake model weights into the image so cold starts don't download them."""
    from houspo_vision.detect import YoloeDetector
    from houspo_vision.embed import SiglipEmbedder

    SiglipEmbedder(device='cpu')
    YoloeDetector(device='cpu')


image = image.run_function(download_models)

app = modal.App('houspo-vision')


@app.function(
    image=image,
    cpu=2.0,
    memory=6144,
    # Cost controls: nothing runs while idle, at most one container,
    # and an idle container shuts down after 2 minutes.
    min_containers=0,
    max_containers=1,
    scaledown_window=120,
    timeout=120,
    secrets=[modal.Secret.from_name('houspo-vision')],
)
@modal.asgi_app()
def web():
    from service.app import create_app
    return create_app()
