function countMatches(productValues, userValues) {
  if (!productValues || !userValues) {
    return 0
  }

  return productValues.filter((value) =>
    userValues.includes(value)
  ).length
}


function calculateMaximumScore(preferences) {
  let maxScore = 0

  // Each selected style can contribute 3 points
  maxScore += preferences.styles.length * 3

  // Each selected characteristic can contribute 2 points
  maxScore += preferences.characteristics.length * 2

  // Space match
  if (preferences.space) {
    maxScore += 4
  }

  // Category match
  if (preferences.categories.length > 0) {
    maxScore += 4
  }

  // Future color + material preferences
  maxScore += preferences.colors.length

  maxScore += preferences.materials.length

  return maxScore
}
function calculateFeedbackScore(
  product,
  products,
  preferences
) {
  let feedbackScore = 0

  // Saved + explicitly liked products are positive signals
  const positiveProductIds = [
    ...new Set([
      ...preferences.savedProducts,
      ...preferences.likedProducts,
    ]),
  ]

  const positiveProducts = products.filter((item) =>
    positiveProductIds.includes(item.id)
  )

  const dislikedProducts = products.filter((item) =>
    preferences.dislikedProducts.includes(item.id)
  )

  positiveProducts.forEach((positiveProduct) => {
    if (positiveProduct.id === product.id) {
      return
    }

    // Style is the strongest signal
    feedbackScore +=
      countMatches(
        product.styles,
        positiveProduct.styles
      ) * 2

    // Characteristics also say a lot about the user's taste
    feedbackScore +=
      countMatches(
        product.characteristics,
        positiveProduct.characteristics
      ) * 1.5

    // Materials and colors are weaker supporting signals
    feedbackScore +=
      countMatches(
        product.materials,
        positiveProduct.materials
      )

    feedbackScore +=
      countMatches(
        product.colors,
        positiveProduct.colors
      )

    // Same category
    if (
      product.category === positiveProduct.category
    ) {
      feedbackScore += 1
    }

    // Same subcategory is an even more specific match
    if (
      product.subcategory === positiveProduct.subcategory
    ) {
      feedbackScore += 1
    }
  })

  dislikedProducts.forEach((dislikedProduct) => {
    if (dislikedProduct.id === product.id) {
      return
    }

    feedbackScore -=
      countMatches(
        product.styles,
        dislikedProduct.styles
      ) * 2

    feedbackScore -=
      countMatches(
        product.characteristics,
        dislikedProduct.characteristics
      ) * 1.5

    feedbackScore -=
      countMatches(
        product.materials,
        dislikedProduct.materials
      )

    feedbackScore -=
      countMatches(
        product.colors,
        dislikedProduct.colors
      )

    if (
      product.category === dislikedProduct.category
    ) {
      feedbackScore -= 1
    }

    if (
      product.subcategory ===
      dislikedProduct.subcategory
    ) {
      feedbackScore -= 1
    }
  })

  return feedbackScore
}

export function scoreProduct(
  product,
  preferences,
  products
) {
  let score = 0
  const reasons = []


  const styleMatches = countMatches(
    product.styles,
    preferences.styles
  )

  if (styleMatches > 0) {
    score += styleMatches * 3

    const matchedStyles =
      product.styles.filter((style) =>
        preferences.styles.includes(style)
      )

    reasons.push(
      `Matches your ${matchedStyles.join(' + ')} style`
    )
  }


  const characteristicMatches = countMatches(
    product.characteristics,
    preferences.characteristics
  )

  if (characteristicMatches > 0) {
    score += characteristicMatches * 2

    const matchedCharacteristics =
      product.characteristics.filter((item) =>
        preferences.characteristics.includes(item)
      )

    reasons.push(
      `Fits ${matchedCharacteristics
        .slice(0, 2)
        .join(' + ')}`
    )
  }


  if (
    preferences.space &&
    product.spaces.includes(preferences.space)
  ) {
    score += 4

    reasons.push(
      `Works in your ${preferences.space}`
    )
  }


  if (
    preferences.categories.includes(
      product.category
    )
  ) {
    score += 4

    reasons.push(
      `Matches your ${product.category} search`
    )
  }


  const colorMatches = countMatches(
    product.colors,
    preferences.colors
  )

  if (colorMatches > 0) {
    score += colorMatches

    reasons.push(
      'Matches your color preferences'
    )
  }


  const materialMatches = countMatches(
    product.materials,
    preferences.materials
  )

  if (materialMatches > 0) {
    score += materialMatches

    reasons.push(
      'Matches your material preferences'
    )
  }


  const baseScore = score

  const maximumScore =
    calculateMaximumScore(preferences)


  const feedbackScore =
    calculateFeedbackScore(
      product,
      products,
      preferences
    )

  score += feedbackScore


  if (feedbackScore > 0) {
    reasons.push(
      'Similar to products you liked'
    )
  }

  if (feedbackScore < 0) {
    reasons.push(
      'Adjusted using your style feedback'
    )
  }


  const matchPercentage =
    maximumScore === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (baseScore / maximumScore) * 100
          )
        )


  return {
    score,
    matchPercentage,
    reasons,
  }
}

export function getRecommendations(
  products,
  preferences
) {
  return products
    .map((product, index) => {
      const result = scoreProduct(
        product,
        preferences,
        products
      )

      return {
        ...product,

        originalOrder: index,

        recommendationScore:
          preferences.dislikedProducts.includes(
            product.id
          )
            ? result.score - 100
            : result.score,

        matchPercentage:
          result.matchPercentage,

        matchReasons:
          result.reasons,
      }
    })

    .filter((product) => {
      if (preferences.categories.length === 0) {
        return true
      }

      return preferences.categories.includes(
        product.category
      )
    })

    .sort((a, b) => {
      const scoreDifference =
        b.recommendationScore -
        a.recommendationScore

      if (scoreDifference !== 0) {
        return scoreDifference
      }

      return a.originalOrder - b.originalOrder
    })
}

// Preferences
//      ↓
// recommendationService.js
//      ↓
// ranked products
//      ↓
// RecommendationsPage