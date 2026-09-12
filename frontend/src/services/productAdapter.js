function normalizeText(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => {
    const escapedKeyword =
      keyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      )

    const pattern = new RegExp(
      `\\b${escapedKeyword}\\b`,
      'i'
    )

    return pattern.test(text)
  })
}

function inferStyles(text) {
  const styles = []

  if (
    includesAny(text, [
      'modern',
      'contemporary',
      'sleek',
      'clean lines',
    ])
  ) {
    styles.push('Modern')
  }

  if (
    includesAny(text, [
      'minimal',
      'minimalist',
      'simple design',
      'streamlined',
    ])
  ) {
    styles.push('Minimal')
  }

  if (
    includesAny(text, [
      'scandinavian',
      'nordic',
      'light wood',
    ])
  ) {
    styles.push('Scandinavian')
  }

  if (
    includesAny(text, [
      'traditional',
      'classic',
      'ornate',
      'tufted',
      'rolled arm',
    ])
  ) {
    styles.push('Traditional')
  }

  if (
    includesAny(text, [
      'mid-century',
      'mid century',
      'tapered legs',
      'retro',
    ])
  ) {
    styles.push('Mid-Century')
  }

  if (
    includesAny(text, [
      'industrial',
      'metal frame',
      'distressed wood',
      'factory-inspired',
    ])
  ) {
    styles.push('Industrial')
  }

  if (
    includesAny(text, [
      'boho',
      'bohemian',
      'woven',
      'rattan',
      'natural texture',
    ])
  ) {
    styles.push('Boho')
  }

  if (
    includesAny(text, [
      'farmhouse',
      'rustic',
      'weathered',
      'reclaimed wood',
    ])
  ) {
    styles.push('Farmhouse')
  }

  return [...new Set(styles)]
}

function inferColors(text) {
  const colors = []

  const colorMap = {
    Beige: [
      'beige',
      'cream',
      'ivory',
      'sand',
      'taupe',
    ],
    White: [
      'white',
      'off-white',
    ],
    Black: [
      'black',
      'charcoal',
    ],
    Gray: [
      'gray',
      'grey',
      'silver',
    ],
    Brown: [
      'brown',
      'walnut',
      'espresso',
      'mocha',
    ],
    Blue: [
      'blue',
      'navy',
      'azure',
    ],
    Green: [
      'green',
      'olive',
      'sage',
    ],
    Red: [
      'red',
      'burgundy',
      'maroon',
    ],
    Orange: [
      'orange',
      'terracotta',
      'rust',
    ],
    Yellow: [
      'yellow',
      'mustard',
      'gold',
    ],
    Pink: [
      'pink',
      'blush',
      'rose',
    ],
  }

  Object.entries(colorMap).forEach(
    ([color, keywords]) => {
      if (includesAny(text, keywords)) {
        colors.push(color)
      }
    }
  )

  const neutralColors = [
    'Beige',
    'White',
    'Black',
    'Gray',
    'Brown',
  ]

  if (
    colors.some((color) =>
      neutralColors.includes(color)
    )
  ) {
    colors.push('Neutral')
  }

  return [...new Set(colors)]
}

function inferSpaces(text) {
  const spaces = []

  if (
    includesAny(text, [
      'living room',
      'sofa',
      'couch',
      'loveseat',
      'recliner',
      'coffee table',
      'sectional',
    ])
  ) {
    spaces.push('Living Room')
  }

  if (
    includesAny(text, [
      'bedroom',
      'bed',
      'nightstand',
      'dresser',
      'headboard',
    ])
  ) {
    spaces.push('Bedroom')
  }

  if (
    includesAny(text, [
      'dining room',
      'dining table',
      'dining chair',
      'bar stool',
    ])
  ) {
    spaces.push('Dining Room')
  }

  if (
    includesAny(text, [
      'office',
      'desk',
      'office chair',
      'bookshelf',
    ])
  ) {
    spaces.push('Office')
  }

  if (
    includesAny(text, [
      'entryway',
      'console table',
      'shoe rack',
    ])
  ) {
    spaces.push('Entryway')
  }

  if (
    includesAny(text, [
      'outdoor',
      'patio',
      'garden',
    ])
  ) {
    spaces.push('Outdoor')
  }

  return [...new Set(spaces)]
}

function inferSubcategory(text) {
  const subcategories = [
    {
      label: 'Sectional',
      keywords: ['sectional'],
    },
    {
      label: 'Sofa',
      keywords: ['sofa', 'couch'],
    },
    {
      label: 'Loveseat',
      keywords: ['loveseat'],
    },
    {
      label: 'Recliner',
      keywords: ['recliner', 'reclining'],
    },
    {
      label: 'Armchair',
      keywords: ['armchair', 'accent chair'],
    },
    {
      label: 'Dining Chair',
      keywords: ['dining chair'],
    },
    {
      label: 'Coffee Table',
      keywords: ['coffee table'],
    },
    {
      label: 'Dining Table',
      keywords: ['dining table'],
    },
    {
      label: 'Desk',
      keywords: ['desk'],
    },
    {
      label: 'Bed',
      keywords: ['bed frame', 'platform bed'],
    },
    {
      label: 'Nightstand',
      keywords: ['nightstand'],
    },
    {
      label: 'Dresser',
      keywords: ['dresser'],
    },
    {
      label: 'Bookshelf',
      keywords: [
        'bookshelf',
        'bookcase',
      ],
    },
    {
      label: 'Console Table',
      keywords: ['console table'],
    },
  ]

  const match = subcategories.find(
    ({ keywords }) =>
      includesAny(text, keywords)
  )

  return match?.label ?? ''
}

function inferCategory(subcategory, text) {
  const seating = [
    'Sectional',
    'Sofa',
    'Loveseat',
    'Recliner',
    'Armchair',
    'Dining Chair',
  ]

  const tables = [
    'Coffee Table',
    'Dining Table',
    'Desk',
    'Console Table',
  ]

  const storage = [
    'Dresser',
    'Bookshelf',
    'Nightstand',
  ]

  if (seating.includes(subcategory)) {
    return 'Seating'
  }

  if (tables.includes(subcategory)) {
    return 'Tables'
  }

  if (storage.includes(subcategory)) {
    return 'Storage'
  }

  if (subcategory === 'Bed') {
    return 'Beds'
  }

  if (
    includesAny(text, [
      'lamp',
      'lighting',
      'chandelier',
      'pendant light',
    ])
  ) {
    return 'Lighting'
  }

  return 'Home'
}

export function normalizeProduct(apiProduct) {
  const offer = apiProduct.offers?.[0]

  const imageUrls =
    apiProduct.images
      ?.map((image) =>
        typeof image === 'string'
          ? image
          : image?.url
      )
      .filter(Boolean) ?? []

  const materials =
    apiProduct.materials ?? []

  const characteristics =
    apiProduct.key_features ?? []

  const searchableText = normalizeText([
    apiProduct.title,
    apiProduct.description,
    ...materials,
    ...characteristics,
  ]
    .filter(Boolean)
    .join(' '))

  const subcategory =
    inferSubcategory(searchableText)

  const styles =
    inferStyles(searchableText)

  const colors =
    inferColors(searchableText)

  const spaces =
    inferSpaces(searchableText)

  const category =
    inferCategory(
      subcategory,
      searchableText
    )

  return {
    id: apiProduct.id,

    name:
      apiProduct.title ??
      'Untitled product',

    description:
      apiProduct.description ??
      '',

    category,

    subcategory,

    price:
      Number(
        offer?.price?.price ?? 0
      ),

    image:
      imageUrls[0] ?? '',

    images:
      imageUrls,

    seller: {
      name:
        offer?.domain ??
        'Retailer',

      url:
        offer?.url ??
        '',
    },

    availability:
      offer?.availability === 'InStock'
        ? 'In Stock'
        : offer?.availability === 'OutOfStock'
          ? 'Out of Stock'
          : offer?.availability ??
            'Unknown',

    rating: null,

    reviewCount: 0,

    dimensions: null,

    styles,

    characteristics,

    colors,

    materials,

    spaces,

    brands:
      apiProduct.brands ?? [],
  }
}