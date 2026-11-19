import OpenAI from 'openai'
import express from 'express'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import dotenv from 'dotenv'
import {
  buildStyleProfilePrompt,
} from './aiStyleProfile.js'
import {
  buildProductScoringPrompt,
} from './aiProductScoring.js'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())

const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

// The vision service scales to zero, so the first
// photo after a quiet period includes its start-up.
const VISION_TIMEOUT_MS =
  Number(process.env.VISION_TIMEOUT_MS) || 60000

const warmLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

// Start the vision service when someone opens the
// Shop this room page, so it's ready by the time
// they pick a photo. Responds right away.
app.get(
  '/api/vision/warm',
  warmLimiter,
  (req, res) => {
    if (!process.env.VISION_SERVICE_URL) {
      return res.json({ warming: false })
    }

    fetch(
      `${process.env.VISION_SERVICE_URL}/health`,
      { signal: AbortSignal.timeout(VISION_TIMEOUT_MS) }
    ).catch((error) => {
      console.error(
        'Vision warm-up failed:',
        error.message
      )
    })

    res.json({ warming: true })
  }
)

// Shop this room: send a room photo to the
// vision service and return detected items
// with visually similar products.
//
// Registered before the global JSON parser
// because photos are larger than its 100kb limit.
app.post(
  '/api/vision/shop-room',
  visionLimiter,
  express.json({ limit: '8mb' }),
  async (req, res) => {
    const { image } = req.body || {}

    if (
      typeof image !== 'string' ||
      image.length === 0
    ) {
      return res.status(400).json({
        error: 'Image is required',
      })
    }

    // The app still works without the vision
    // service; the frontend falls back to
    // regular product search.
    if (!process.env.VISION_SERVICE_URL) {
      return res.json({
        items: [],
        room_matches: [],
        visionUsed: false,
      })
    }

    try {
      const response = await fetch(
        `${process.env.VISION_SERVICE_URL}/detect-and-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Vision-Key':
              process.env.VISION_API_KEY || '',
          },
          body: JSON.stringify({
            image_base64: image,
            k: 8,
          }),
          signal: AbortSignal.timeout(
            VISION_TIMEOUT_MS
          ),
        }
      )

      if (!response.ok) {
        throw new Error(
          `Vision service failed: ${response.status}`
        )
      }

      const data = await response.json()

      res.json({
        ...data,
        visionUsed: true,
      })
    } catch (error) {
      console.error(
        'Vision service error:',
        error.message
      )

      res.json({
        items: [],
        room_matches: [],
        visionUsed: false,
      })
    }
  }
)

app.use(express.json())
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

app.post('/api/products/search', async (req, res) => {
  try {
    const {
      query = 'home furniture',
      limit = 10,
    } = req.body

    const response = await fetch(
      'https://api.trychannel3.com/v1/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CHANNEL3_API_KEY,
        },
        body: JSON.stringify({
          query,
          limit,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()

      console.error(
        'Channel3 error:',
        response.status,
        errorText
      )

      return res.status(response.status).json({
        error: 'Channel3 request failed',
      })
    }

    const data = await response.json()

    res.json(data)
  } catch (error) {
    console.error('Server error:', error)

    res.status(500).json({
      error: 'Server error',
    })
  }
})

// Create an AI style profile from
// the user's quiz preferences.
app.post(
  '/api/ai/style-profile',
  aiLimiter,
  async (req, res) => {
    try {
      const {
        preferences,
      } = req.body

      if (!preferences) {
        return res.status(400).json({
          error:
            'Preferences are required',
        })
      }

      const prompt =
        buildStyleProfilePrompt(
          preferences
        )

      const response =
        await openai.responses.create({
          model: 'gpt-5.6-luna',
          input: prompt,
        })

      const rawProfile =
        response.output_text

      let profile

      try {
        profile =
          JSON.parse(rawProfile)
      } catch (parseError) {
        console.error(
          'Could not parse AI profile:',
          rawProfile
        )

        throw parseError
      }

      res.json({
        profile,
        aiUsed: true,
      })
    } catch (error) {
      console.error(
        'AI style profile error:',
        error
      )

      // AI failure should not break houspo.
      res.json({
        profile: null,
        aiUsed: false,
      })
    }
  }
)

// Score products against an AI-created
// interior style profile.
app.post(
  '/api/ai/score-products',
  aiLimiter,
  async (req, res) => {
    try {
      const {
        styleProfile,
        products,
      } = req.body

      if (!styleProfile) {
        return res.status(400).json({
          error:
            'Style profile is required',
        })
      }

      if (
        !Array.isArray(products) ||
        products.length === 0
      ) {
        return res.status(400).json({
          error:
            'Products are required',
        })
      }
      const limitedProducts =
         products.slice(0, 15)

      const prompt =
        buildProductScoringPrompt(
            styleProfile,
            limitedProducts
          )

      const response =
        await openai.responses.create({
          model: 'gpt-5.6-luna',
          input: prompt,
        })

      const rawScores =
        response.output_text

      const parsedScores =
        JSON.parse(rawScores)

      res.json({
        scores:
          parsedScores.scores || [],
        aiUsed: true,
      })
    } catch (error) {
      console.error(
        'AI product scoring error:',
        error
      )

      // If AI fails, houspo can keep using
      // the existing rule-based ranking.
      res.json({
        scores: [],
        aiUsed: false,
      })
    }
  }
)

app.listen(PORT, () => {
  console.log(
    `houspo server running on port ${PORT}`
  )
})