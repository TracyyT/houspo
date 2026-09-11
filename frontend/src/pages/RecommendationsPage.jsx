import { Link } from 'react-router-dom'

import { products } from '../data/products'
import { usePreferences } from '../context/PreferenceContext'

import {
  getRecommendations,
} from '../services/recommendationService'


function RecommendationsPage() {
  const { preferences } = usePreferences()

  const recommendations = getRecommendations(
    products,
    preferences
  )

  return (
    <main className="recommendations-page">

      <header className="recommendations-nav">
        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <Link
          to="/categories"
          className="edit-preferences-link"
        >
          Edit preferences
        </Link>
      </header>


      <section className="recommendations-content">

        <div className="recommendations-heading">

          <span className="section-label">
            CURATED FOR YOU
          </span>

          <h1>Your houspo picks.</h1>

          <p>
            Based on your style, space, and product
            preferences.
          </p>

        </div>


        <div className="profile-summary">

          {preferences.styles.map((style) => (
            <span key={style}>
              {style}
            </span>
          ))}

          {preferences.space && (
            <span>
              {preferences.space}
            </span>
          )}

          {preferences.categories.map(
            (category) => (
              <span key={category}>
                {category}
              </span>
            )
          )}

        </div>


        <section className="recommendation-grid">

          {recommendations.map((product, index) => (

            <article
              key={product.id}
              className="product-card"
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
                            width: `${product.matchPercentage}%`,
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

            </article>

          ))}

        </section>

      </section>

    </main>
  )
}

export default RecommendationsPage