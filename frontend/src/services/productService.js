import { normalizeProduct } from './productAdapter'

const API_URL =
  'http://localhost:3001/api/products/search'

export async function searchProducts({
  query = 'furniture and furnishings',
  limit = 10,
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