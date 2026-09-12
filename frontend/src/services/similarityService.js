function countMatches(firstValues = [], secondValues = []) {
  return firstValues.filter((value) =>
    secondValues.includes(value)
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
        product.id !== selectedProduct.id
    )

    .map((product) => {
      let score = 0

      const colorMatches = countMatches(
        product.colors,
        selectedProduct.colors
      )

      const styleMatches = countMatches(
        product.styles,
        selectedProduct.styles
      )

      const materialMatches = countMatches(
        product.materials,
        selectedProduct.materials
      )


      // Exact product type is the strongest signal.
      if (
        product.subcategory ===
        selectedProduct.subcategory
      ) {
        score += strongMatch ? 8 : 5
      }


      // Products can still be related by broad category.
      if (
        product.category ===
        selectedProduct.category
      ) {
        score += strongMatch ? 5 : 3
      }


      // More Like This puts extra emphasis on color.
      score +=
        colorMatches * (strongMatch ? 5 : 3)

      score +=
        styleMatches * (strongMatch ? 3 : 2)

      score += materialMatches * 2


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