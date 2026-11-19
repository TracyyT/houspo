from PIL import Image, ImageOps


def upright(image):
    """Apply the EXIF orientation tag. Phone photos are often stored
    sideways with a tag that says how to rotate them."""
    return ImageOps.exif_transpose(image).convert('RGB')


def open_rgb(path):
    with Image.open(path) as image:
        return upright(image)
