// Normalize values so matching is
// consistent across API and quiz data.
function normalizeValues(values = []) {
  return values
    .filter(Boolean)
    .map((value) =>
      String(value)
        .trim()
        .toLowerCase()
    )
}

// Count matching values without
// worrying about capitalization.
function countMatches(
  productValues = [],
  userValues = []
) {
  const normalizedProductValues =
    normalizeValues(productValues)

  const normalizedUserValues =
    normalizeValues(userValues)

  return normalizedProductValues.filter(
    (value) =>
      normalizedUserValues.includes(
        value
      )
  ).length
}

// Return the actual values that match
// between the product and user choices.
function getMatchedValues(
  productValues = [],
  userValues = []
) {
  const normalizedUserValues =
    normalizeValues(userValues)

  return productValues.filter(
    (value) =>
      normalizedUserValues.includes(
        String(value)
          .trim()
          .toLowerCase()
      )
  )
}

function getBudgetRange(budget) {
  switch (budget) {
    case 'under-200':
      return {
        min: 0,
        max: 200,
      }

    case '200-500':
      return {
        min: 200,
        max: 500,
      }

    case '500-1000':
      return {
        min: 500,
        max: 1000,
      }

    case '1000-plus':
      return {
        min: 1000,
        max: Infinity,
      }

    default:
      return null
  }
}

function calculateMaximumScore(
  preferences
) {
  let maxScore = 0

  // Each selected style can contribute 3 points.
  maxScore +=
    preferences.styles.length * 3

  // Each selected characteristic
  // can contribute 2 points.
  maxScore +=
    preferences.characteristics.length * 2

  // Space match.
  if (preferences.space) {
    maxScore += 4
  }

  // Budget match.
  if (preferences.budget) {
    maxScore += 4
  }

  // Category match.
  if (
    preferences.categories.length > 0
  ) {
    maxScore += 4
  }

  // Color + material preferences.
  maxScore +=
    preferences.colors.length

  maxScore +=
    preferences.materials.length

  return maxScore
}

function calculateFeedbackScore(
  product,
  products,
  preferences
) {
  let feedbackScore = 0

  // Only explicitly liked products should
  // influence future recommendation ranking.
  //
  // Saved products are bookmarks only and
  // should not move products around.
  const likedProducts =
    products.filter((item) =>
      preferences.likedProducts.includes(
        item.id
      )
    )

  // Disliked products are negative signals.
  const dislikedProducts =
    products.filter((item) =>
      preferences.dislikedProducts.includes(
        item.id
      )
    )

  likedProducts.forEach(
    (likedProduct) => {
      if (
        likedProduct.id === product.id
      ) {
        return
      }

      // Style is the strongest learned signal.
      feedbackScore +=
        countMatches(
          product.styles,
          likedProduct.styles
        ) * 2

      // Characteristics also describe taste.
      feedbackScore +=
        countMatches(
          product.characteristics,
          likedProduct.characteristics
        ) * 1.5

      // Materials and colors are supporting signals.
      feedbackScore +=
        countMatches(
          product.materials,
          likedProduct.materials
        )

      feedbackScore +=
        countMatches(
          product.colors,
          likedProduct.colors
        )

      // Same broad category.
      if (
        product.category &&
        likedProduct.category &&
        normalizeValues([
            product.category,
            ])[0] ===
            normalizeValues([
            likedProduct.category,
            ])[0]
      ) {
        feedbackScore += 1
      }

      // Same specific product type.
      if (
        product.subcategory &&
        likedProduct.subcategory &&
        normalizeValues([
            product.subcategory,
        ])[0] ===
        normalizeValues([
            likedProduct.subcategory,
        ])[0]
        ) {
        feedbackScore += 1
        }
    }
  )

  dislikedProducts.forEach(
    (dislikedProduct) => {
      if (
        dislikedProduct.id ===
        product.id
      ) {
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
        product.category &&
        dislikedProduct.category &&
        normalizeValues([
            product.category,
        ])[0] ===
        normalizeValues([
            dislikedProduct.category,
        ])[0]
        ) {
        feedbackScore -= 1
        }

      if (
        product.subcategory &&
        dislikedProduct.subcategory &&
        normalizeValues([
            product.subcategory,
        ])[0] ===
        normalizeValues([
            dislikedProduct.subcategory,
        ])[0]
        ) {
        feedbackScore -= 1
        }
    }
  )

  return feedbackScore
}

export function scoreProduct(
  product,
  preferences,
  products
) {
  let score = 0
  const reasons = []

    const styleMatches =
    countMatches(
        product.styles,
        preferences.styles
    )

    if (styleMatches > 0) {
    score += styleMatches * 3

    const matchedStyles =
        getMatchedValues(
        product.styles,
        preferences.styles
        )

    reasons.push(
        `Matches your ${matchedStyles
        .slice(0, 2)
        .join(' + ')} style`
    )
    }

  const characteristicMatches =
    countMatches(
        product.characteristics,
        preferences.characteristics
    )

    if (characteristicMatches > 0) {
    score +=
        characteristicMatches * 2

    const matchedCharacteristics =
        getMatchedValues(
        product.characteristics,
        preferences.characteristics
        )

    reasons.push(
        `Fits ${matchedCharacteristics
        .slice(0, 2)
        .join(' + ')}`
    )
    }


  if (
    preferences.space &&
    normalizeValues(
        product.spaces
    ).includes(
        String(preferences.space)
        .trim()
        .toLowerCase()
    )
    ) {
    score += 4

    reasons.push(
      `Works in your ${preferences.space}`
    )
  }


  if (
    normalizeValues(
        preferences.categories
    ).includes(
        String(product.category)
        .trim()
        .toLowerCase()
    )
    ) {
    score += 4

    reasons.push(
      `Matches your ${product.category} search`
    )
  }

  const colorMatches =
    countMatches(
        product.colors,
        preferences.colors
    )

    if (colorMatches > 0) {
    score += colorMatches

    const matchedColors =
        getMatchedValues(
        product.colors,
        preferences.colors
        )

    reasons.push(
        `Matches your ${matchedColors
        .slice(0, 2)
        .join(' + ')} palette`
    )
    }

  const materialMatches =
    countMatches(
        product.materials,
        preferences.materials
    )

    if (materialMatches > 0) {
    score += materialMatches

    const matchedMaterials =
        getMatchedValues(
        product.materials,
        preferences.materials
        )

    reasons.push(
        `Uses ${matchedMaterials
        .slice(0, 2)
        .join(' + ')}`
    )
    }

  const budgetRange =
    getBudgetRange(
      preferences.budget
    )

  if (budgetRange) {
    const isWithinBudget =
      product.price >=
        budgetRange.min &&
      product.price <=
        budgetRange.max

    if (isWithinBudget) {
      score += 4

      reasons.push(
        'Fits your budget'
      )
    }
  }

  // Base score only uses explicit quiz choices.
  // This is what the match percentage displays.
  const baseScore = score

  const maximumScore =
    calculateMaximumScore(
      preferences
    )

  // Learned feedback can affect ordering,
  // but saved/bookmarked products do not.
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
            (
              baseScore /
              maximumScore
            ) * 100
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
  const normalizedCategories =
    normalizeValues(
        preferences.categories
    )

    const hasMatchingCategories =
    normalizedCategories.length === 0 ||
    products.some((product) =>
        normalizedCategories.includes(
        String(product.category)
            .trim()
            .toLowerCase()
        )
    )

  return products
    .map((product, index) => {
      const result =
        scoreProduct(
          product,
          preferences,
          products
        )

      return {
        ...product,

        // Keep original position for stable
        // ordering when scores are tied.
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
      if (
        preferences.categories.length ===
          0 ||
        !hasMatchingCategories
      ) {
        return true
      }

      return normalizedCategories.includes(
        String(product.category)
          .trim()
          .toLowerCase()
        )
    })

    .sort((a, b) => {
      const scoreDifference =
        b.recommendationScore -
        a.recommendationScore

      if (scoreDifference !== 0) {
        return scoreDifference
      }

      return (
        a.originalOrder -
        b.originalOrder
      )
    })
}

// Blend the existing recommendation score
// with AI scores for a small group of products.
export function blendAIScores(
  products,
  aiScores,
  aiWeight = 0.3
) {
  if (
    !Array.isArray(aiScores) ||
    aiScores.length === 0
  ) {
    return products
  }

  const aiScoreMap =
    new Map(
      aiScores.map((item) => [
        String(item.id),
        {
          score: Number(item.score),
          reason: item.reason,
        },
      ])
    )

  const productsWithAIScores =
    products.filter((product) =>
      aiScoreMap.has(
        String(product.id)
      )
    )

  if (
    productsWithAIScores.length === 0
  ) {
    return products
  }

  // Find the range of the existing
  // recommendation scores.
  const ruleScores =
    productsWithAIScores.map(
      (product) =>
        product.recommendationScore
    )

  const minimumRuleScore =
    Math.min(...ruleScores)

  const maximumRuleScore =
    Math.max(...ruleScores)

  const ruleWeight =
    1 - aiWeight

  return products
    .map((product, index) => {
      const aiResult =
        aiScoreMap.get(
          String(product.id)
        )

      // If AI did not score this product,
      // leave its normal ranking untouched.
      if (!aiResult) {
        return {
          ...product,
          hybridScore: null,
          aiScore: null,
          aiReason: null,
          aiOriginalOrder: index,
        }
      }

      // Convert the existing rule score
      // into the same 0-100 range as AI.
      const normalizedRuleScore =
        maximumRuleScore ===
        minimumRuleScore
          ? 100
          : (
              (
                product.recommendationScore -
                minimumRuleScore
              ) /
              (
                maximumRuleScore -
                minimumRuleScore
              )
            ) * 100

      const hybridScore =
        normalizedRuleScore *
          ruleWeight +
        aiResult.score *
          aiWeight

      return {
        ...product,

        // Keep the existing score available.
        ruleRecommendationScore:
          product.recommendationScore,

        normalizedRuleScore:
          Math.round(
            normalizedRuleScore
          ),

        aiScore:
          aiResult.score,

        aiReason:
          aiResult.reason,

        hybridScore,

        aiOriginalOrder: index,
      }
    })

    // This function will only be used
    // with the top AI candidate group.
    .sort((a, b) => {
      const aScore =
        a.hybridScore ??
        -Infinity

      const bScore =
        b.hybridScore ??
        -Infinity

      const difference =
        bScore - aScore

      if (difference !== 0) {
        return difference
      }

      return (
        a.aiOriginalOrder -
        b.aiOriginalOrder
      )
    })
}

// Preferences
//      ↓
// recommendationService.js
//      ↓
// scored + ranked products
//      ↓
// RecommendationsPage