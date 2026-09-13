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