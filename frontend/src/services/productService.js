import { normalizeProduct } from './productAdapter'

const API_URL =
  'https://houspo-backend.onrender.com/api/products/search'

export async function searchProducts({
  query = 'furniture and furnishings',
  limit = 30,
} = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      query,
      limit,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Product search failed: ${response.status}`
    )
  }

  const data = await response.json()

  console.log(
    'RAW CHANNEL3 RESPONSE:',
    data
  )

  const rawProducts =
    data.products ??
    data.results ??
    data.items ??
    []

  const normalizedProducts =
    rawProducts.map(normalizeProduct)

  console.log(
    'NORMALIZED PRODUCTS:',
    normalizedProducts
  )

  return normalizedProducts
}

// Search multiple product queries and combine the results
export async function searchMultipleProducts(
  queries = []
) {
  const uniqueQueries = [
    ...new Set(
      queries
        .filter(Boolean)
        .map((query) =>
          query.trim().toLowerCase()
        )
    ),
  ].slice(0, 3)

  if (uniqueQueries.length === 0) {
    return searchProducts()
  }

  const searchResults =
    await Promise.all(
      uniqueQueries.map((query) =>
        searchProducts({
          query,
          limit: 30,
        })
      )
    )

  const allProducts =
    searchResults.flat()

  // Remove the same product if it appears
  // in more than one search
  const uniqueProducts =
    Array.from(
      new Map(
        allProducts.map((product) => [
          String(product.id),
          product,
        ])
      ).values()
    )

  console.log(
    'MERGED PRODUCT POOL:',
    uniqueProducts.length
  )

  return uniqueProducts
}