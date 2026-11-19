import assert from 'node:assert/strict'
import test from 'node:test'

import {
  describeSimilarity,
  hasStyleProfile,
  rankVisualMatches,
  toHouspoProduct,
} from './visualRanking.js'

const emptyPreferences = {
  styles: [],
  characteristics: [],
  colors: [],
  materials: [],
  space: null,
  categories: [],
  budget: null,
  likedProducts: [],
  dislikedProducts: [],
}

function match(id, similarity, title, price) {
  return {
    id,
    title,
    price,
    image: `https://img/${id}.jpg`,
    similarity,
    channel3: {
      id,
      title,
      description: '',
      images: [`https://img/${id}.jpg`],
      offers: [{ price: { price }, domain: 'shop.com', url: 'https://shop.com' }],
      brands: [],
      materials: [],
      key_features: [],
    },
  }
}

const matches = [
  match('a', 0.80, 'Modern Gray Sofa', 900),
  match('b', 0.79, 'Scandinavian Light Wood Sofa', 450),
  match('c', 0.60, 'Traditional Tufted Sofa', 1500),
]

const ids = (list) => list.map((product) => product.id)

test('converts matches with the shared product adapter', () => {
  const product = toHouspoProduct(matches[1])
  assert.equal(product.name, 'Scandinavian Light Wood Sofa')
  assert.equal(product.price, 450)
  assert.ok(product.styles.includes('Scandinavian'))
  assert.equal(product.image, 'https://img/b.jpg')
})

test('without a style profile, order follows visual similarity', () => {
  const { withinBudget, outsideBudget } =
    rankVisualMatches(matches, emptyPreferences)
  assert.deepEqual(ids(withinBudget), ['a', 'b', 'c'])
  assert.equal(outsideBudget.length, 0)
  assert.equal(hasStyleProfile(emptyPreferences), false)
})

test('style profile can lift a slightly less similar product', () => {
  // b looks almost as similar as a (0.79 vs 0.80) and fits the profile.
  const preferences = {
    ...emptyPreferences,
    styles: ['Scandinavian'],
    space: 'Living Room',
  }
  const { withinBudget } = rankVisualMatches(matches, preferences)
  assert.deepEqual(ids(withinBudget), ['b', 'a', 'c'])
  assert.ok(withinBudget[0].matchReasons.some((r) => r.includes('Scandinavian')))
})

test('budget splits products instead of mixing them in', () => {
  const preferences = { ...emptyPreferences, budget: '200-500' }
  const { withinBudget, outsideBudget } =
    rankVisualMatches(matches, preferences)
  assert.deepEqual(ids(withinBudget), ['b'])
  assert.deepEqual(ids(outsideBudget), ['a', 'c'])
})

test('disliked products sink to the bottom', () => {
  const preferences = { ...emptyPreferences, dislikedProducts: ['a'] }
  const { withinBudget } = rankVisualMatches(matches, preferences)
  assert.deepEqual(ids(withinBudget), ['b', 'c', 'a'])
  assert.equal(withinBudget[2].isDisliked, true)
})

test('similarity labels', () => {
  assert.equal(describeSimilarity(0.78), 'Very similar look')
  assert.equal(describeSimilarity(0.66), 'Similar look')
  assert.equal(describeSimilarity(0.5), 'Related look')
  assert.deepEqual(rankVisualMatches([], emptyPreferences).withinBudget, [])
})

test('style profile does not override a clearly better visual match', () => {
  const farther = [
    match('a', 0.80, 'Modern Gray Sofa', 900),
    match('b', 0.62, 'Scandinavian Light Wood Sofa', 450),
    match('c', 0.60, 'Traditional Tufted Sofa', 1500),
  ]
  const preferences = { ...emptyPreferences, styles: ['Scandinavian'] }
  assert.equal(rankVisualMatches(farther, preferences).withinBudget[0].id, 'a')
})
