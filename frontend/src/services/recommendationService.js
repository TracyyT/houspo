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


export function scoreProduct(product, preferences) {
  let score = 0
  const reasons = []


  const styleMatches = countMatches(
    product.styles,
    preferences.styles
  )

  if (styleMatches > 0) {
    score += styleMatches * 3

    const matchedStyles = product.styles.filter(
      (style) => preferences.styles.includes(style)
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
      product.characteristics.filter(
        (item) =>
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

    reasons.push('Matches your color preferences')
  }


  const materialMatches = countMatches(
    product.materials,
    preferences.materials
  )

  if (materialMatches > 0) {
    score += materialMatches

    reasons.push('Matches your material preferences')
  }


  const maximumScore =
    calculateMaximumScore(preferences)

  const matchPercentage =
    maximumScore === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (score / maximumScore) * 100
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
    .map((product) => {
      const result = scoreProduct(
        product,
        preferences
      )

      return {
        ...product,

        recommendationScore:
          result.score,

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

    .sort(
      (a, b) =>
        b.recommendationScore -
        a.recommendationScore
    )
}

// Preferences
//      ↓
// recommendationService.js
//      ↓
// ranked products
//      ↓
// RecommendationsPage