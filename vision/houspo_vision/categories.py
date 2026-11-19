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

# Milestone 4 additions, measured separately in the eval.
NEW_PROMPTS = {
    'ottoman': 'ottoman',
    'pouf': 'ottoman',
    'wall hanging': 'wall decor',
    'macrame wall hanging': 'wall decor',
    'tv console': 'tv stand',
}

# Things that look like furniture or decor to the detector but
# aren't sold here. Detections with these labels are dropped,
# which stops e.g. a ceiling fan being matched as a lamp.
NEGATIVE_PROMPTS = [
    'ceiling fan',
    'television',
    'window',
    'door',
    'window blinds',
    'cardboard box',
    'person',
]

PROMPT_SETS = {
    # Milestone 2: specific + generic prompts.
    'v2': (PROMPTS, []),
    # Milestone 4: new categories and negative prompts.
    'v3': ({**PROMPTS, **NEW_PROMPTS}, NEGATIVE_PROMPTS),
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
    {'desk', 'tv stand'},
    {'ottoman', 'bench'},
    {'wall decor', 'wall art'},
]


def search_categories(category):
    if category in GENERIC:
        return set(GENERIC[category])
    allowed = {category}
    for group in GROUPS:
        if category in group:
            allowed |= group
    return allowed
