import { Link, useLocation, } from 'react-router-dom'
import { usePreferences } from '../context/PreferenceContext'
import { products } from '../data/products'

function MyStylePage() {
  const { preferences } = usePreferences()
  const location = useLocation()
  const hasPreferences =
    preferences.styles.length > 0 ||
    preferences.characteristics.length > 0 ||
    preferences.colors.length > 0 ||
    preferences.materials.length > 0 ||
    preferences.space ||
    preferences.categories.length > 0
    const savedProducts = products.filter((product) =>
        preferences.savedProducts.includes(product.id)
        )

        const countValues = (items, key) => {
        const counts = {}

        items.forEach((item) => {
            ;(item[key] || []).forEach((value) => {
            counts[value] = (counts[value] || 0) + 1
            })
        })

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([value]) => value)
        }

        const learnedStyles =
        countValues(savedProducts, 'styles').slice(0, 3)

        const learnedColors =
        countValues(savedProducts, 'colors').slice(0, 3)

        const learnedMaterials =
        countValues(savedProducts, 'materials').slice(0, 3)
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
                location.pathname === '/recommendations'
                    ? 'active'
                    : ''
                }
            >
                Explore
            </Link>

            <Link
                to="/saved"
                className={
                location.pathname === '/saved'
                    ? 'active'
                    : ''
                }
            >
                Saved
            </Link>

            <Link
                to="/about"
                className={
                location.pathname === '/about'
                    ? 'active'
                    : ''
                }
            >
                About
            </Link>

            <Link
                to="/my-style"
                className={
                location.pathname === '/my-style'
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

        <h1>Your design profile.</h1>

        <p>
            The preferences houspo uses to find pieces
            that feel more like you.
        </p>
        </div>

        {!hasPreferences ? (
          <div className="my-style-empty">
            <h2>No style profile yet.</h2>

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
                <span>STYLE</span>

                <div className="my-style-tags">
                  {preferences.styles.length > 0 ? (
                    preferences.styles.map((style) => (
                      <span key={style}>
                        {style}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>SPACE</span>

                <div className="my-style-tags">
                  {preferences.space ? (
                    <span>
                      {preferences.space}
                    </span>
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>CHARACTERISTICS</span>

                <div className="my-style-tags">
                  {preferences.characteristics.length > 0 ? (
                    preferences.characteristics.map(
                      (characteristic) => (
                        <span key={characteristic}>
                          {characteristic}
                        </span>
                      )
                    )
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>COLORS</span>

                <div className="my-style-tags">
                  {preferences.colors.length > 0 ? (
                    preferences.colors.map((color) => (
                      <span key={color}>
                        {color}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>MATERIALS</span>

                <div className="my-style-tags">
                  {preferences.materials.length > 0 ? (
                    preferences.materials.map((material) => (
                      <span key={material}>
                        {material}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>

              <section className="my-style-card">
                <span>CATEGORIES</span>

                <div className="my-style-tags">
                  {preferences.categories.length > 0 ? (
                    preferences.categories.map((category) => (
                      <span key={category}>
                        {category}
                      </span>
                    ))
                  ) : (
                    <p>Not selected</p>
                  )}
                </div>
              </section>
            </div>
{savedProducts.length > 0 && (
  <section className="learned-style-section">
    <span className="section-label">
      LEARNED FROM YOUR ACTIVITY
    </span>

    <h2>
      houspo is getting to know your taste.
    </h2>

    <div className="learned-style-grid">
      <div className="learned-style-card">
        <span>Top styles</span>

        <div className="my-style-tags">
          {learnedStyles.map((style) => (
            <span key={style}>
              {style}
            </span>
          ))}
        </div>
      </div>

      <div className="learned-style-card">
        <span>Colors you saved</span>

        <div className="my-style-tags">
          {learnedColors.map((color) => (
            <span key={color}>
              {color}
            </span>
          ))}
        </div>
      </div>

      <div className="learned-style-card">
        <span>Materials you saved</span>

        <div className="my-style-tags">
          {learnedMaterials.map((material) => (
            <span key={material}>
              {material}
            </span>
          ))}
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