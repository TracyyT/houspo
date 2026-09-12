import {
  Link,
  useLocation,
} from 'react-router-dom'

import { usePreferences } from '../context/PreferenceContext'
import { products } from '../data/products'

function MyStylePage() {
  const { preferences } =
    usePreferences()

  const location =
    useLocation()

  const hasPreferences =
    preferences.styles.length > 0 ||
    preferences.characteristics.length > 0 ||
    preferences.colors.length > 0 ||
    preferences.materials.length > 0 ||
    preferences.space ||
    preferences.categories.length > 0

  // Get full saved product data
  // stored in localStorage.
  const persistentSavedProducts =
    Object.values(
      preferences.savedProductDetails || {}
    )

  // Keep old demo products working too.
  const staticSavedProducts =
    products.filter((product) =>
      preferences.savedProducts.some(
        (savedId) =>
          String(savedId) ===
          String(product.id)
      )
    )

  // Combine saved products from both sources.
  const allSavedProducts = [
    ...persistentSavedProducts,
    ...staticSavedProducts,
  ]

  // Remove duplicate products by ID.
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

  // Count repeated saved values
  // and rank the most common ones.
  const countValues = (
    items,
    key
  ) => {
    const counts = {}

    items.forEach((item) => {
      ;(item[key] || []).forEach(
        (value) => {
          counts[value] =
            (counts[value] || 0) + 1
        }
      )
    })

    return Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .map(([value]) => value)
  }

  // Learn the user's strongest
  // patterns from saved products.
  const learnedStyles =
    countValues(
      savedProducts,
      'styles'
    ).slice(0, 3)

  const learnedColors =
    countValues(
      savedProducts,
      'colors'
    ).slice(0, 3)

  const learnedMaterials =
    countValues(
      savedProducts,
      'materials'
    ).slice(0, 3)

  const learnedCharacteristics =
    countValues(
      savedProducts,
      'characteristics'
    ).slice(0, 3)

  const learnedCategories =
    countValues(
      savedProducts,
      'categories'
    ).slice(0, 3)

  // Some products store category
  // as one string instead of an array.
  const categoryCounts = {}

  savedProducts.forEach((product) => {
    if (!product.category) {
      return
    }

    categoryCounts[
      product.category
    ] =
      (
        categoryCounts[
          product.category
        ] || 0
      ) + 1
  })

  const learnedSingleCategories =
    Object.entries(
      categoryCounts
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .map(([category]) => category)
      .slice(0, 3)

  const finalLearnedCategories =
    learnedCategories.length > 0
      ? learnedCategories
      : learnedSingleCategories

  return (
    <main className="my-style-page">

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

      <section className="my-style-content">

        <div className="my-style-heading">

          <span className="section-label">
            YOUR STYLE
          </span>

          <h1>
            Your design profile.
          </h1>

          <p>
            The preferences houspo uses to find pieces
            that feel more like you.
          </p>

        </div>

        {!hasPreferences ? (

          <div className="my-style-empty">

            <h2>
              No style profile yet.
            </h2>

            <p>
              Complete the style quiz to start
              building your personalized profile.
            </p>

            <Link
              to="/preferences"
              className="my-style-edit-button"
            >
              Find Your Style
            </Link>

          </div>

        ) : (

          <>

            <div className="my-style-grid">

              <section className="my-style-card">

                <span>
                  STYLE
                </span>

                <div className="my-style-tags">

                  {preferences.styles.length >
                  0 ? (

                    preferences.styles.map(
                      (style) => (
                        <span key={style}>
                          {style}
                        </span>
                      )
                    )

                  ) : (

                    <p>
                      Not selected
                    </p>

                  )}

                </div>

              </section>

              <section className="my-style-card">

                <span>
                  SPACE
                </span>

                <div className="my-style-tags">

                  {preferences.space ? (

                    <span>
                      {preferences.space}
                    </span>

                  ) : (

                    <p>
                      Not selected
                    </p>

                  )}

                </div>

              </section>

              <section className="my-style-card">

                <span>
                  CHARACTERISTICS
                </span>

                <div className="my-style-tags">

                  {preferences.characteristics.length >
                  0 ? (

                    preferences.characteristics.map(
                      (characteristic) => (
                        <span
                          key={
                            characteristic
                          }
                        >
                          {characteristic}
                        </span>
                      )
                    )

                  ) : (

                    <p>
                      Not selected
                    </p>

                  )}

                </div>

              </section>

              <section className="my-style-card">

                <span>
                  COLORS
                </span>

                <div className="my-style-tags">

                  {preferences.colors.length >
                  0 ? (

                    preferences.colors.map(
                      (color) => (
                        <span key={color}>
                          {color}
                        </span>
                      )
                    )

                  ) : (

                    <p>
                      Not selected
                    </p>

                  )}

                </div>

              </section>

              <section className="my-style-card">

                <span>
                  MATERIALS
                </span>

                <div className="my-style-tags">

                  {preferences.materials.length >
                  0 ? (

                    preferences.materials.map(
                      (material) => (
                        <span
                          key={material}
                        >
                          {material}
                        </span>
                      )
                    )

                  ) : (

                    <p>
                      Not selected
                    </p>

                  )}

                </div>

              </section>

              <section className="my-style-card">

                <span>
                  CATEGORIES
                </span>

                <div className="my-style-tags">

                  {preferences.categories.length >
                  0 ? (

                    preferences.categories.map(
                      (category) => (
                        <span
                          key={category}
                        >
                          {category}
                        </span>
                      )
                    )

                  ) : (

                    <p>
                      Not selected
                    </p>

                  )}

                </div>

              </section>

            </div>

            {savedProducts.length > 0 && (

              <section className="learned-style-section">

                <span className="section-label">
                  LEARNED FROM YOUR SAVES
                </span>

                <h2>
                  houspo is getting to know your taste.
                </h2>

                <div className="learned-style-grid">

                  <div className="learned-style-card">

                    <span>
                      Top styles
                    </span>

                    <div className="my-style-tags">

                      {learnedStyles.length >
                      0 ? (

                        learnedStyles.map(
                          (style) => (
                            <span
                              key={style}
                            >
                              {style}
                            </span>
                          )
                        )

                      ) : (

                        <p>
                          Not enough data yet
                        </p>

                      )}

                    </div>

                  </div>

                  <div className="learned-style-card">

                    <span>
                      Colors you save
                    </span>

                    <div className="my-style-tags">

                      {learnedColors.length >
                      0 ? (

                        learnedColors.map(
                          (color) => (
                            <span
                              key={color}
                            >
                              {color}
                            </span>
                          )
                        )

                      ) : (

                        <p>
                          Not enough data yet
                        </p>

                      )}

                    </div>

                  </div>

                  <div className="learned-style-card">

                    <span>
                      Materials you save
                    </span>

                    <div className="my-style-tags">

                      {learnedMaterials.length >
                      0 ? (

                        learnedMaterials.map(
                          (material) => (
                            <span
                              key={material}
                            >
                              {material}
                            </span>
                          )
                        )

                      ) : (

                        <p>
                          Not enough data yet
                        </p>

                      )}

                    </div>

                  </div>

                  <div className="learned-style-card">

                    <span>
                      Features you save
                    </span>

                    <div className="my-style-tags">

                      {learnedCharacteristics.length >
                      0 ? (

                        learnedCharacteristics.map(
                          (characteristic) => (
                            <span
                              key={
                                characteristic
                              }
                            >
                              {characteristic}
                            </span>
                          )
                        )

                      ) : (

                        <p>
                          Not enough data yet
                        </p>

                      )}

                    </div>

                  </div>

                  <div className="learned-style-card">

                    <span>
                      Categories you save
                    </span>

                    <div className="my-style-tags">

                      {finalLearnedCategories.length >
                      0 ? (

                        finalLearnedCategories.map(
                          (category) => (
                            <span
                              key={category}
                            >
                              {category}
                            </span>
                          )
                        )

                      ) : (

                        <p>
                          Not enough data yet
                        </p>

                      )}

                    </div>

                  </div>

                </div>

              </section>

            )}

            <div className="my-style-actions">

              <Link
                to="/preferences"
                className="my-style-edit-button"
              >
                Edit my style
              </Link>

            </div>

          </>

        )}

      </section>

    </main>
  )
}

export default MyStylePage