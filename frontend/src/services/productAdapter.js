export function normalizeProduct(apiProduct) {
  const offer = apiProduct.offers?.[0]

  const category = apiProduct.categories?.[0]

  const imageUrls =
    apiProduct.images?.map((image) =>
      typeof image === 'string'
        ? image
        : image?.url
    ).filter(Boolean) ?? []

  return {
    id: apiProduct.id,

    name:
      apiProduct.title ??
      'Untitled product',

    description:
      apiProduct.description ??
      '',

    category:
      typeof category === 'string'
        ? category
        : category?.name ?? 'Home',

    subcategory: '',

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
          : offer?.availability ?? 'Unknown',

    rating: null,

    reviewCount: 0,

    dimensions: null,

    styles: [],

    characteristics:
      apiProduct.key_features ?? [],

    colors: [],

    materials:
      apiProduct.materials ?? [],

    spaces: [],

    brands:
      apiProduct.brands ?? [],
  }
}