# houspo

**Personalized interior design discovery powered by live product data and AI.**

houspo helps users discover furniture, decor, and lighting that match their personal interior style. Users build a style profile through a preference quiz, and houspo combines recommendation logic, live product data, and AI-assisted ranking to curate products specifically for them.

## Live Demo

**[Visit houspo →](https://houspo-nu.vercel.app/)**

## Features

- Interactive interior style preference quiz
- Space, product category, color, material, and budget preferences
- Live furniture, decor, and lighting discovery
- Personalized product match scores and explanations
- AI-generated interior style profiles
- Hybrid recommendation ranking using houspo's matching algorithm and AI scoring
- Multi-category product discovery
- Search, category, price, and sorting filters
- Save products for later
- "Not my style" feedback to improve recommendation ordering
- Personalized "My Style" page based on saved products
- Product detail pages with similar product recommendations
- Responsive interface for desktop and mobile
- Graceful fallback when live product or AI services are unavailable

## How Recommendations Work

houspo uses a hybrid recommendation system rather than relying entirely on AI.

1. Live products are retrieved based on the user's space and selected product categories.
2. Product data is normalized and filtered before recommendation scoring.
3. houspo's rule-based recommendation system evaluates products against the user's styles, colors, materials, space, categories, budget, and feedback.
4. The strongest candidates are evaluated using an AI-generated style profile.
5. Final rankings combine **70% houspo recommendation logic** with **30% AI scoring**.

This approach keeps recommendations grounded in explicit user preferences while allowing AI to better evaluate overall aesthetic compatibility.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- CSS

### Backend

- Node.js
- Express
- REST APIs

### APIs & AI

- OpenAI API
- Channel3 API

### Deployment

- Vercel — frontend
- Render — backend

## Architecture

```text
User Preferences
      ↓
Live Product Discovery
      ↓
Product Normalization & Filtering
      ↓
houspo Recommendation Scoring
      ↓
Top Recommendation Candidates
      ↓
AI Style Profile & Product Scoring
      ↓
Hybrid Ranking
70% Rules + 30% AI
      ↓
Personalized Recommendations

## Reliability

houspo is designed so AI enhances the recommendation system rather than being required for it. If AI scoring is unavailable, the application falls back to houspo's rule-based recommendations. Live product requests also include fallback behavior so the core experience remains usable when an external service is temporarily unavailable.
