import {
  Link,
  useLocation,
} from 'react-router-dom'

import { products } from '../data/products'
import { usePreferences } from '../context/PreferenceContext'

function SavedPage() {
  const location = useLocation()

  const {
    preferences,
    toggleSavedProduct,
  } = usePreferences()

  // Convert saved product details
  // from an object into an array.
  const persistentSavedProducts =
    Object.values(
      preferences.savedProductDetails || {}
    )

  // Keep old static products working too.
  const staticSavedProducts =
    products.filter((product) =>
      preferences.savedProducts.some(
        (savedId) =>
          String(savedId) ===
          String(product.id)
      )
    )

  // Combine persistent live products
  // with any saved demo products.
  const allSavedProducts = [
    ...persistentSavedProducts,
    ...staticSavedProducts,
  ]

  // Remove duplicates by product ID.
  const savedProducts = [
    ...new Map(
      allSavedProducts.map(
        (product) => [
          String(product.id),
          product,
        ]
      )
    ).values(),
  ]

  return (
    <main className="saved-page">

      <header className="recommendations-nav">

        <Link
          to="/"
          className="onboarding-logo"
        >
          houspo
        </Link>

        <nav className="main-nav-links">

          <Link
            to="/recommendations"
            className={
              location.pathname ===
              '/recommendations'
                ? 'active'
                : ''
            }
          >
            Explore
          </Link>

          <Link
            to="/saved"
            className={
              location.pathname ===
              '/saved'
                ? 'active'
                : ''
            }
          >
            Saved
          </Link>

          <Link
            to="/about"
            className={
              location.pathname ===
              '/about'
                ? 'active'
                : ''
            }
          >
            About
          </Link>

          <Link
            to="/my-style"
            className={
              location.pathname ===
              '/my-style'
                ? 'active'
                : ''
            }
          >
            My Style
          </Link>

        </nav>

      </header>

      <section className="saved-content">

        <div className="saved-heading">

          <span className="section-label">
            YOUR COLLECTION
          </span>

          <h1>
            Saved pieces.
          </h1>

          <p>
            Keep track of products you want
            to come back to later.
          </p>

        </div>

        {savedProducts.length === 0 ? (

          <div className="saved-empty-state">

            <h2>
              Nothing saved yet.
            </h2>

            <p>
              Save pieces from your
              recommendations to collect
              them here.
            </p>

            <Link
              to="/recommendations"
              className="saved-browse-button"
            >
              Browse recommendations
            </Link>

          </div>

        ) : (

          <div className="saved-products-grid">

            {savedProducts.map(
              (product) => (

                <article
                  key={product.id}
                  className="saved-product-card"
                >

                  <Link
                    to={`/product/${product.id}`}
                    state={{ product }}
                    className="saved-product-link"
                  >

                    <div className="saved-image-wrapper">

                      <img
                        src={
                          product.image ||
                          '/image-placeholder.png'
                        }
                        alt={
                          product.name ||
                          'Furniture product'
                        }
                        onError={(event) => {
                          event.currentTarget.onerror =
                            null

                          event.currentTarget.src =
                            '/image-placeholder.png'
                        }}
                      />

                    </div>

                    <span className="saved-product-category">
                      {product.category ||
                        'Home'}
                    </span>

                    <div className="saved-product-heading">

                      <h2>
                        {product.name ||
                          'Untitled product'}
                      </h2>

                      <span>
                        {typeof product.price ===
                        'number'
                          ? `$${product.price}`
                          : 'Price unavailable'}
                      </span>

                    </div>

                  </Link>

                  <button
                    className="saved-remove-button"
                    onClick={() =>
                      toggleSavedProduct(
                        product.id
                      )
                    }
                  >
                    Remove
                  </button>

                </article>

              )
            )}

          </div>

        )}

      </section>

    </main>
  )
}

export default SavedPage