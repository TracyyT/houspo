// Build a prompt that asks AI to score
// how well products match a style profile.
export function buildProductScoringPrompt(
  styleProfile,
  products
) {
  const simplifiedProducts =
    products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      styles: product.styles,
      characteristics:
        product.characteristics,
      colors: product.colors,
      materials: product.materials,
      spaces: product.spaces,
    }))

  return `
You are helping rank furniture products
for an interior design recommendation app.

User style profile:

${JSON.stringify(
  styleProfile,
  null,
  2
)}

Products:

${JSON.stringify(
  simplifiedProducts,
  null,
  2
)}

Score every product from 0 to 100 based on
how well it matches the user's style profile.

Consider:
- overall style
- priorities
- desired product traits
- traits the user wants to avoid
- colors
- materials
- furniture type
- budget

Return ONLY valid JSON.

Use exactly this structure:

{
  "scores": [
    {
      "id": "product id",
      "score": 0,
      "reason": "short explanation"
    }
  ]
}

Rules:
- Include every supplied product exactly once.
- Keep each reason under 15 words.
- Score from 0 to 100.
- Do not use markdown.
- Do not include anything outside the JSON.
`
}