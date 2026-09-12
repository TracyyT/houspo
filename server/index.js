import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

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

app.listen(PORT, () => {
  console.log(
    `houspo server running on port ${PORT}`
  )
})