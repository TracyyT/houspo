import assert from 'node:assert/strict'
import test from 'node:test'

import { scoreProduct } from './recommendationService.js'

const preferences = {
  styles: ['Scandinavian'],
  characteristics: [],
  colors: [],
  materials: [],
  space: null,
  categories: [],
  budget: null,
  likedProducts: [],
  dislikedProducts: [],
}

const sofa = {
  id: 'a',
  category: 'Seating',
  subcategory: 'Sofa',
  price: 500,
  styles: ['Modern'],
  characteristics: [],
  colors: [],
  materials: [],
  spaces: ['Living Room'],
}

test('no category points when no category was selected', () => {
  const result = scoreProduct(sofa, preferences, [sofa])
  assert.equal(result.matchPercentage, 0)
  assert.ok(!result.reasons.includes('Matches your selected category'))
})

test('category points when a matching category was selected', () => {
  const withCategory = { ...preferences, categories: ['Furniture'] }
  const result = scoreProduct(sofa, withCategory, [sofa])
  assert.ok(result.reasons.includes('Matches your selected category'))
  assert.equal(result.matchPercentage, 57)
})
