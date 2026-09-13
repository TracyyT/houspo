// Use the local backend while developing
// the AI recommendation feature.
const API_BASE_URL =
  'http://localhost:3001'

// Create an AI style profile from the
// user's quiz preferences.
export async function createAIStyleProfile(
  preferences
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai/style-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          preferences,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(
        `Style profile failed: ${response.status}`
      )
    }

    const data =
      await response.json()

    if (
      !data.aiUsed ||
      !data.profile
    ) {
      return null
    }

    return data.profile
  } catch (error) {
    console.error(
      'AI style profile unavailable:',
      error
    )

    return null
  }
}

// Ask AI to score products against
// the generated style profile.
export async function scoreProductsWithAI(
  styleProfile,
  products
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai/score-products`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          styleProfile,
          products,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(
        `AI scoring failed: ${response.status}`
      )
    }

    const data =
      await response.json()

    if (!data.aiUsed) {
      return []
    }

    return data.scores || []
  } catch (error) {
    console.error(
      'AI product scoring unavailable:',
      error
    )

    return []
  }
}