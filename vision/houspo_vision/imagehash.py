"""Difference hash, used to drop eval pairs where the 'room' photo
is really the same picture as the product photo."""
from PIL import Image


def dhash(path, size=8):
    image = Image.open(path).convert('L').resize((size + 1, size))
    pixels = list(image.tobytes())
    bits = 0
    for row in range(size):
        for col in range(size):
            left = pixels[row * (size + 1) + col]
            right = pixels[row * (size + 1) + col + 1]
            bits = (bits << 1) | (left > right)
    return bits


def hamming(a, b):
    return bin(a ^ b).count('1')
