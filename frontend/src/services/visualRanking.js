import { normalizeProduct } from './productAdapter.js'
import {
  getBudgetRange,
  scoreProduct,
} from './recommendationService.js'

// The user asked for things that look like
// their photo, so visual similarity leads and
// their style profile breaks ties between
// similar-looking products.
export const VISUAL_WEIGHT = 0.7

// Turn a vision-service match into the same
// product shape the rest of houspo uses.
export function toHouspoProduct(match) {
  const product = match.channel3
    ? normalizeProduct(match.channel3)
    : {
        id: match.id,
        name: match.title || 'Untitled product',
        description: '',
        category: 'Home',
        subcategory: '',
        price: Number(match.price ?? 0),
        image: match.image || '',
        images: match.image ? [match.image] : [],
        seller: { name: 'Retailer', url: match.url || '' },
        availability: 'Unknown',
        styles: [],
        characteristics: [],
        colors: [],
        materials: [],
        spaces: [],
        brands: [],
      }

  return {
    ...product,
    id: product.id ?? match.id,
    image: match.image || product.image,
    visualSimilarity: Number(match.similarity ?? 0),
  }
}

// How similar a match looks, in words.
// Thresholds come from SigLIP 2 similarities
// seen on houspo's catalog.
export function describeSimilarity(similarity) {
  if (similarity >= 0.75) return 'Very similar look'
  if (similarity >= 0.65) return 'Similar look'
  return 'Related look'
}

export function hasStyleProfile(preferences) {
  return Boolean(
    preferences.styles.length ||
      preferences.characteristics.length ||
      preferences.colors.length ||
      preferences.materials.length ||
      preferences.budget ||
      preferences.space
  )
}

// Rank one detected item's matches by a blend
// of visual similarity and the user's style
// profile. Products outside the budget are
// returned separately instead of mixed in.
export function rankVisualMatches(
  matches = [],
  preferences,
  visualWeight = VISUAL_WEIGHT
) {
  const products = matches.map(toHouspoProduct)

  if (products.length === 0) {
    return {
      withinBudget: [],
      outsideBudget: [],
    }
  }

  const similarities = products.map(
    (product) => product.visualSimilarity
  )

  const minimumSimilarity = Math.min(...similarities)
  const maximumSimilarity = Math.max(...similarities)

  const budgetRange = getBudgetRange(
    preferences.budget
  )

  const ranked = products
    .map((product, visualRank) => {
      const result = scoreProduct(
        product,
        preferences,
        products
      )

      // Spread similarity across 0-100 within
      // this item's matches, like the AI blend.
      const visualScore =
        maximumSimilarity === minimumSimilarity
          ? 100
          : ((product.visualSimilarity -
              minimumSimilarity) /
              (maximumSimilarity -
                minimumSimilarity)) *
            100

      const isDisliked =
        preferences.dislikedProducts.some(
          (id) => String(id) === String(product.id)
        )

      const hybridScore =
        visualWeight * visualScore +
        (1 - visualWeight) * result.matchPercentage -
        (isDisliked ? 100 : 0)

      const inBudget =
        !budgetRange ||
        (product.price >= budgetRange.min &&
          product.price <= budgetRange.max)

      return {
        ...product,
        visualRank,
        visualScore: Math.round(visualScore),
        similarityLabel: describeSimilarity(
          product.visualSimilarity
        ),
        matchPercentage: result.matchPercentage,
        matchReasons: result.reasons,
        hybridScore,
        inBudget,
        isDisliked,
      }
    })
    .sort((a, b) => {
      const difference = b.hybridScore - a.hybridScore

      if (difference !== 0) {
        return difference
      }

      return a.visualRank - b.visualRank
    })

  return {
    withinBudget: ranked.filter((product) => product.inBudget),
    outsideBudget: ranked.filter((product) => !product.inBudget),
  }
}
