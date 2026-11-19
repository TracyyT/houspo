from PIL import Image, ImageOps, UnidentifiedImageError


def upright(image):
    """Apply the EXIF orientation tag. Phone photos are often stored
    sideways with a tag that says how to rotate them."""
    return ImageOps.exif_transpose(image).convert('RGB')


def open_rgb(path):
    with Image.open(path) as image:
        return upright(image)


def try_open_rgb(path):
    """Like open_rgb, but returns None (with a warning) for files that
    aren't readable images, e.g. a saved web page named .jpg."""
    try:
        return open_rgb(path)
    except (UnidentifiedImageError, OSError) as error:
        print(f'skipping {path.name}: not a readable image ({error.__class__.__name__})')
        return None
