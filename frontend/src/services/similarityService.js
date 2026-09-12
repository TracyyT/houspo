function normalizeValues(values = []) {
  return values
    .filter(Boolean)
    .map((value) =>
      String(value)
        .trim()
        .toLowerCase()
    )
}

function countMatches(
  firstValues = [],
  secondValues = []
) {
  const normalizedFirst =
    normalizeValues(firstValues)

  const normalizedSecond =
    normalizeValues(secondValues)

  return normalizedFirst.filter(
    (value) =>
      normalizedSecond.includes(value)
  ).length
}

export function getSimilarProducts(
  products,
  selectedProduct,
  strongMatch = false
) {
  if (!selectedProduct) {
    return []
  }

  return products
    .filter(
      (product) =>
        String(product.id) !==
        String(selectedProduct.id)
    )
    .map((product) => {
      let score = 0

      const colorMatches =
        countMatches(
          product.colors,
          selectedProduct.colors
        )

      const styleMatches =
        countMatches(
          product.styles,
          selectedProduct.styles
        )

      const materialMatches =
        countMatches(
          product.materials,
          selectedProduct.materials
        )

      const spaceMatches =
        countMatches(
          product.spaces,
          selectedProduct.spaces
        )

      const characteristicMatches =
        countMatches(
          product.characteristics,
          selectedProduct.characteristics
        )

      // Exact product type is the strongest signal.
      if (
        product.subcategory &&
        selectedProduct.subcategory &&
        product.subcategory ===
          selectedProduct.subcategory
      ) {
        score += strongMatch ? 10 : 7
      }

      // Broad category is still an important signal.
      if (
        product.category &&
        selectedProduct.category &&
        product.category ===
          selectedProduct.category
      ) {
        score += strongMatch ? 6 : 4
      }

      // Products intended for the same room
      // should feel more closely related.
      score +=
        spaceMatches *
        (strongMatch ? 5 : 3)

      // Color is visually important for
      // "More like this."
      score +=
        colorMatches *
        (strongMatch ? 5 : 3)

      // Style helps keep the visual direction
      // consistent.
      score +=
        styleMatches *
        (strongMatch ? 4 : 3)

      // Shared materials are useful but
      // slightly less important than style.
      score +=
        materialMatches * 2

      // Shared product features give extra
      // context for live Channel3 products.
      score +=
        characteristicMatches

      return {
        ...product,
        similarityScore: score,
      }
    })
    .filter(
      (product) =>
        product.similarityScore > 0
    )
    .sort(
      (a, b) =>
        b.similarityScore -
        a.similarityScore
    )
}