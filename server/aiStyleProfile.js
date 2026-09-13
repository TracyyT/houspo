// Build a prompt for a structured
// interior design style profile.
export function buildStyleProfilePrompt(
  preferences
) {
  const styles =
    preferences.styles?.join(', ') ||
    'not specified'

  const characteristics =
    preferences.characteristics?.join(
      ', '
    ) || 'not specified'

  const colors =
    preferences.colors?.join(', ') ||
    'not specified'

  const materials =
    preferences.materials?.join(', ') ||
    'not specified'

  const space =
    preferences.space ||
    'not specified'

  const categories =
    preferences.categories?.join(', ') ||
    'not specified'

  const budget =
    preferences.budget ||
    'not specified'

  return `
Create an interior design style profile
for this user.

Selected styles:
${styles}

Preferred characteristics:
${characteristics}

Preferred colors:
${colors}

Preferred materials:
${materials}

Room or space:
${space}

Furniture categories:
${categories}

Budget:
${budget}

Return ONLY valid JSON.

Use exactly this structure:

{
  "styleName": "short style name",
  "summary": "one concise sentence",
  "priorities": [
    "priority",
    "priority",
    "priority"
  ],
  "productTraits": [
    "trait",
    "trait",
    "trait"
  ],
  "avoidTraits": [
    "trait",
    "trait",
    "trait"
  ]
}

Rules:
- Keep all values concise.
- Use plain text only.
- Do not use markdown.
- Do not include text before or after the JSON.
- Base the profile only on the user's preferences.
`
}