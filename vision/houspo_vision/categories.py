"""Room items we look for, and which catalog categories each
detection is allowed to match against.

Specific prompts ("dining chair") map to one category. Generic
prompts ("chair") catch items the specific ones miss and search
a wider group. Easily confused categories (sofa vs. sectional)
also search each other.
"""

# Detector prompt -> category or generic group.
PROMPTS = {
    'sofa': 'sofa',
    'couch': 'sofa',
    'sectional sofa': 'sectional',
    'armchair': 'armchair',
    'chair': 'chair',
    'dining chair': 'dining chair',
    'office chair': 'office chair',
    'stool': 'chair',
    'coffee table': 'coffee table',
    'side table': 'side table',
    'dining table': 'dining table',
    'table': 'table',
    'desk': 'desk',
    'bed': 'bed',
    'nightstand': 'nightstand',
    'dresser': 'dresser',
    'cabinet': 'storage',
    'tv stand': 'tv stand',
    'media console': 'tv stand',
    'bookshelf': 'bookshelf',
    'shelf': 'bookshelf',
    'bench': 'bench',
    'lamp': 'lamp',
    'floor lamp': 'floor lamp',
    'table lamp': 'table lamp',
    'pendant light': 'pendant light',
    'chandelier': 'pendant light',
    'ceiling light': 'pendant light',
    'rug': 'rug',
    'carpet': 'rug',
    'mirror': 'mirror',
    'framed wall art': 'wall art',
    'painting': 'wall art',
    'potted plant': 'planter',
    'vase': 'vase',
    'throw pillow': 'throw pillow',
    'cushion': 'throw pillow',
}

GENERIC = {
    'chair': {'dining chair', 'armchair', 'office chair'},
    'table': {'coffee table', 'side table', 'dining table', 'desk', 'nightstand'},
    'storage': {'dresser', 'tv stand', 'nightstand', 'bookshelf'},
    'lamp': {'floor lamp', 'table lamp', 'pendant light'},
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
    if category in GENERIC:
        return set(GENERIC[category])
    allowed = {category}
    for group in GROUPS:
        if category in group:
            allowed |= group
    return allowed
