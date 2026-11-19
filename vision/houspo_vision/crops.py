"""Turn a detection into the image that gets embedded."""
from PIL import Image, ImageDraw


def padded_box(box, size, pad=0.08):
    x1, y1, x2, y2 = box
    width, height = size
    dx, dy = (x2 - x1) * pad, (y2 - y1) * pad
    return (max(0, int(x1 - dx)), max(0, int(y1 - dy)),
            min(width, int(x2 + dx)), min(height, int(y2 + dy)))


def box_crop(image, box, pad=0.08):
    return image.crop(padded_box(box, image.size, pad))


def mask_crop(image, box, polygon, pad=0.08, background=(255, 255, 255)):
    """Keep only the object's pixels on a plain background,
    which looks more like a catalog product photo."""
    if not polygon or len(polygon) < 3:
        return box_crop(image, box, pad)
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).polygon([tuple(map(float, p)) for p in polygon], fill=255)
    plain = Image.new('RGB', image.size, background)
    cut = Image.composite(image, plain, mask)
    return cut.crop(padded_box(box, image.size, pad))


def make_crop(image, detection, mode):
    if mode == 'full':
        return image
    if mode == 'box':
        return box_crop(image, detection['box'])
    if mode == 'mask':
        return mask_crop(image, detection['box'], detection.get('polygon'))
    raise ValueError(f'unknown crop mode: {mode}')
