import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  colors,
  materials,
} from '../data/refinements'

import {
  usePreferences,
} from '../context/PreferenceContext'


function RefinementsPage() {
  const navigate = useNavigate()

  const {
    preferences,
    toggleColor,
    toggleMaterial,
  } = usePreferences()


  return (
    <main className="refinements-page">

      <header className="onboarding-header">

        <Link
          to="/categories"
          className="back-link"
        >
          ← Back
        </Link>

        <Link
          to="/"
          className="onboarding-logo"
        >
          houspo
        </Link>

        <div className="step-indicator">

          <span>Final touches</span>

          <div className="progress-track">
            <div className="progress-fill progress-fill-full" />
          </div>

        </div>

      </header>


      <section className="refinements-content">

        <div className="refinements-heading">

          <span className="section-label">
            REFINE YOUR PICKS
          </span>

          <h1>
            What feels right to you?
          </h1>

          <p>
            Add a few color and material preferences
            to make your recommendations more personal.
            You can skip anything you are unsure about.
          </p>

        </div>


        <section className="refinement-section">

          <div className="refinement-section-heading">

            <div>
              <span className="refinement-number">
                01
              </span>

              <h2>
                Colors
              </h2>
            </div>

            <span className="optional-label">
              OPTIONAL
            </span>

          </div>


          <div className="color-grid">

            {colors.map((color) => {
              const selected =
                preferences.colors.includes(
                  color.name
                )

              return (
                <button
                  key={color.id}
                  className={`color-option ${
                    selected ? 'selected' : ''
                  }`}
                  onClick={() =>
                    toggleColor(color.name)
                  }
                >

                  <span
                    className="color-swatch"
                    style={{
                      backgroundColor: color.hex,
                    }}
                  />

                  <span className="color-name">
                    {color.name}
                  </span>

                  <span className="color-check">
                    {selected ? '✓' : ''}
                  </span>

                </button>
              )
            })}

          </div>

        </section>


        <section className="refinement-section">

          <div className="refinement-section-heading">

            <div>
              <span className="refinement-number">
                02
              </span>

              <h2>
                Materials
              </h2>
            </div>

            <span className="optional-label">
              OPTIONAL
            </span>

          </div>


          <div className="material-grid">

            {materials.map((material) => {
              const selected =
                preferences.materials.includes(
                  material
                )

              return (
                <button
                  key={material}
                  className={`material-option ${
                    selected ? 'selected' : ''
                  }`}
                  onClick={() =>
                    toggleMaterial(material)
                  }
                >

                  <span>
                    {material}
                  </span>

                  <span className="material-toggle">
                    {selected ? '✓' : '+'}
                  </span>

                </button>
              )
            })}

          </div>

        </section>


        <footer className="refinements-footer">

          <div className="refinement-summary">

            {preferences.colors.length +
              preferences.materials.length === 0
              ? 'No refinements selected'
              : `${
                  preferences.colors.length +
                  preferences.materials.length
                } preferences selected`}

          </div>


          <button
            className="continue-button"
            onClick={() =>
              navigate('/recommendations')
            }
          >
            <span>
              See My Picks
            </span>

            <span>
              →
            </span>
          </button>

        </footer>

      </section>

    </main>
  )
}

export default RefinementsPage