import { Link } from 'react-router-dom'

import { products } from '../data/products'

import { usePreferences } from '../context/PreferenceContext'


function SavedPage() {
  const {
    preferences,
    toggleSavedProduct,
  } = usePreferences()

  const savedProducts = products.filter(
    (product) =>
      preferences.savedProducts.some(
        (savedId) =>
          Number(savedId) === Number(product.id)
      )
  )
  

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
            <Link to="/recommendations">
            Explore
            </Link>

            <Link to="/preferences">
                Find Your Style
            </Link>

            <Link to="/saved">
            Saved
            </Link>

            <Link to="/#about">
            About
            </Link>

            <Link to="/my-style">
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
                    className="saved-product-link"
                  >

                    <div className="saved-image-wrapper">
                      <img
                        src={product.image}
                        alt={product.name}
                      />
                    </div>

                    <span className="saved-product-category">
                      {product.category}
                    </span>

                    <div className="saved-product-heading">

                      <h2>
                        {product.name}
                      </h2>

                      <span>
                        ${product.price}
                      </span>

                    </div>

                  </Link>


                  <button
                    className="saved-remove-button"
                    onClick={() =>
                      toggleSavedProduct(product.id)
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