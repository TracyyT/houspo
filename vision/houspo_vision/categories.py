"""Room items we look for, and which catalog categories each
detection is allowed to match against.

Some pairs are easy to confuse from a photo (a sofa vs. a
sectional, a nightstand vs. a side table), so a detection
searches its whole group instead of a single category.
"""

# Detector prompt -> catalog category.
PROMPTS = {
    'sofa': 'sofa',
    'sectional sofa': 'sectional',
    'armchair': 'armchair',
    'coffee table': 'coffee table',
    'side table': 'side table',
    'dining table': 'dining table',
    'dining chair': 'dining chair',
    'bed': 'bed',
    'nightstand': 'nightstand',
    'dresser': 'dresser',
    'bookshelf': 'bookshelf',
    'desk': 'desk',
    'office chair': 'office chair',
    'tv stand': 'tv stand',
    'bench': 'bench',
    'floor lamp': 'floor lamp',
    'table lamp': 'table lamp',
    'pendant light': 'pendant light',
    'area rug': 'rug',
    'wall mirror': 'mirror',
    'framed wall art': 'wall art',
    'potted plant': 'planter',
    'vase': 'vase',
    'throw pillow': 'throw pillow',
}

GROUPS = [
    {'sofa', 'sectional'},
    {'side table', 'nightstand'},
    {'coffee table', 'side table'},
    {'dining chair', 'armchair', 'office chair'},
    {'floor lamp', 'table lamp'},
    {'desk', 'dining table'},
    {'dresser', 'tv stand'},
]


def search_categories(category):
    allowed = {category}
    for group in GROUPS:
        if category in group:
            allowed |= group
    return allowed
