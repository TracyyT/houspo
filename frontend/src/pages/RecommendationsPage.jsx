import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { products } from '../data/products'
import { usePreferences } from '../context/PreferenceContext'
import { getRecommendations } from '../services/recommendationService'


function RecommendationsPage() {
  const navigate = useNavigate()

  const {
    preferences,
    resetPreferences,
    toggleSavedProduct,
    toggleDislikedProduct,
  } = usePreferences()


  const handleStartOver = () => {
    resetPreferences()
    navigate('/')
  }


  const [selectedCategory, setSelectedCategory] =
    useState('All')

  const [sortOption, setSortOption] =
    useState('match')


    const [recommendations] = useState(() =>
    getRecommendations(
        products,
        preferences
    )
    )


  const availableCategories = [
    'All',
    ...new Set(
      recommendations.map(
        (product) => product.category
      )
    ),
  ]


    const visibleRecommendations =
    recommendations.filter(
        (product) =>
        !preferences.dislikedProducts.includes(
            product.id
        )
    )

    const filteredRecommendations =
    selectedCategory === 'All'
        ? visibleRecommendations
        : visibleRecommendations.filter(
            (product) =>
            product.category === selectedCategory
        )


  const sortedRecommendations = [
    ...filteredRecommendations,
  ].sort((a, b) => {
    if (sortOption === 'price-low') {
      return a.price - b.price
    }

    if (sortOption === 'price-high') {
      return b.price - a.price
    }

    return (
      b.recommendationScore -
      a.recommendationScore
    )
  })


  return (
    <main className="recommendations-page">

      <header className="recommendations-nav">
        <Link
          to="/"
          className="onboarding-logo"
        >
          houspo
        </Link>
      </header>


      <section className="recommendations-content">

        <div className="recommendations-heading">
          <span className="section-label">
            CURATED FOR YOU
          </span>

          <h1>
            Your houspo picks.
          </h1>

          <p>
            Based on your style, space, and product
            preferences.
          </p>


          <div className="recommendation-edit-actions">

            <Link
              to="/preferences"
              className="edit-action-button"
            >
              Edit style
            </Link>

            <Link
              to="/spaces"
              className="edit-action-button"
            >
              Change space
            </Link>

            <Link
              to="/categories"
              className="edit-action-button"
            >
              Edit categories
            </Link>

            <button
              className="start-over-link"
              onClick={handleStartOver}
            >
              <strong>Start over</strong>
            </button>

          </div>
        </div>


        <div className="profile-summary">

        <span className="profile-summary-label">
            Your selections
        </span>

        <div className="profile-summary-values">

            {preferences.styles.length > 0 && (
            <span>
                {preferences.styles.join(', ')}
            </span>
            )}

            {preferences.space && (
            <>
                <span className="summary-divider">•</span>

                <span>
                {preferences.space}
                </span>
            </>
            )}

            {preferences.categories.length > 0 && (
            <>
                <span className="summary-divider">•</span>

                <span>
                {preferences.categories.join(', ')}
                </span>
            </>
            )}

        </div>

        </div>


        <div className="recommendation-controls">

          <div className="category-filters">

            {availableCategories.map((category) => (
              <button
                key={category}
                className={`filter-button ${
                  selectedCategory === category
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}

          </div>


          <div className="sort-control">

            <label htmlFor="sort">
              Sort by
            </label>

            <select
              id="sort"
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value)
              }
            >
              <option value="match">
                Best Match
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>
            </select>

          </div>
        </div>


        <section className="recommendation-grid">
        {sortedRecommendations.map((product, index) => {
            const isSaved =
            preferences.savedProducts.includes(product.id)

            return (
            <article
                key={product.id}
                className="product-card"
            >
                <Link
                to={`/product/${product.id}`}
                className="product-card-main-link"
                >
                <div className="product-image-wrapper">
                    <img
                    src={product.image}
                    alt={product.name}
                    />

                    <div className="product-rank">
                    {String(index + 1).padStart(2, '0')}
                    </div>
                </div>

                <div className="product-content">
                    <div className="product-heading-row">
                    <div>
                        <span className="product-category">
                        {product.category}
                        </span>

                        <h2>
                        {product.name}
                        </h2>
                    </div>

                    <span className="product-price">
                        ${product.price}
                    </span>
                    </div>

                    <div className="product-match-section">
                    <div className="match-heading">
                        <span className="match-percentage">
                        {product.matchPercentage}% match
                        </span>

                        <span className="match-label">
                        FOR YOU
                        </span>
                    </div>

                    <div className="match-bar">
                        <div
                        className="match-bar-fill"
                        style={{
                            width:
                            `${product.matchPercentage}%`,
                        }}
                        />
                    </div>

                    {product.matchReasons.length > 0 && (
                        <div className="match-reasons">
                        <span className="why-label">
                            Why this matches you
                        </span>

                        {product.matchReasons
                            .slice(0, 3)
                            .map((reason) => (
                            <span
                                key={reason}
                                className="match-reason"
                            >
                                {reason}
                            </span>
                            ))}
                        </div>
                    )}
                    </div>
                </div>
                </Link>

                <div className="product-feedback">
                <button
                className={`feedback-button ${
                    preferences.savedProducts.includes(product.id)
                    ? 'active'
                    : ''
                }`}
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    toggleSavedProduct(product.id)
                }}
                >
                    {isSaved
                    ? '♥ Saved'
                    : '♡ Save'}
                </button>

                <button
                className="feedback-button subtle"
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    toggleDislikedProduct(product.id)
                }}
                >
                × Not my style
                </button>
                </div>
            </article>
            )
        })}
        </section>

      </section>

    </main>
  )
}


export default RecommendationsPage