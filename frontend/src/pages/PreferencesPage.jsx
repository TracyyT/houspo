import { Link, useNavigate } from 'react-router-dom'

import { stylePreferences } from '../data/stylePreferences'
import { usePreferences } from '../context/PreferenceContext'

function PreferencesPage() {
  const navigate = useNavigate()

  const {
    preferences,
    toggleStyle,
    toggleCharacteristic,
    resetPreferences,
  } = usePreferences()

  const selectedStyleData = stylePreferences.filter((style) =>
    preferences.styles.includes(style.name)
  )

  const relatedPreferences = [
    ...new Set(
      selectedStyleData.flatMap((style) => style.related)
    ),
  ]

  return (
    <main className="preferences-page">

      <header className="onboarding-header">
        <Link to="/" className="back-link">
          ← Back
        </Link>

        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <div className="step-indicator">
          <span>Step 1 of 2</span>

          <div className="progress-track">
            <div className="progress-fill" />
          </div>
        </div>
      </header>


      <section className="preferences-content">

        <div className="preferences-heading">
          <div>
            <span className="section-label">
              YOUR TASTE
            </span>

            <h1>What’s your style?</h1>

            <p>
              Choose the interiors that feel most like you.
              Select as many as you like.
            </p>
          </div>

          {preferences.styles.length > 0 && (
            <button
              className="reset-button"
              onClick={resetPreferences}
            >
              Reset selections
            </button>
          )}
        </div>


        <section className="style-grid">
          {stylePreferences.map((style) => {
            const selected =
              preferences.styles.includes(style.name)

            return (
              <button
                key={style.id}
                className={`style-card ${
                  selected ? 'selected' : ''
                }`}
                onClick={() => toggleStyle(style.name)}
              >
                <div className="style-image-wrapper">
                  <img
                    src={style.image}
                    alt={`${style.name} interior`}
                  />

                  <div className="style-image-overlay" />

                  {selected && (
                    <div className="selection-check">
                      ✓
                    </div>
                  )}
                </div>

                <div className="style-card-footer">
                  <span>{style.name}</span>

                  <span className="style-card-plus">
                    {selected ? '—' : '+'}
                  </span>
                </div>
              </button>
            )
          })}
        </section>


        {relatedPreferences.length > 0 && (
          <section className="related-preferences">

            <div className="related-heading">
              <span className="section-label">
                REFINE YOUR STYLE
              </span>

              <h2>What else feels like you?</h2>

              <p>
                These suggestions are based on the styles
                you selected.
              </p>
            </div>

            <div className="preference-bubbles">
              {relatedPreferences.map((item) => {
                const selected =
                  preferences.characteristics.includes(item)

                return (
                  <button
                    key={item}
                    className={`preference-bubble ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() =>
                      toggleCharacteristic(item)
                    }
                  >
                    {item}

                    {selected && (
                      <span className="bubble-check">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}


        <footer className="preferences-footer">
          <div className="selection-summary">
            {preferences.styles.length === 0 ? (
              <span>Select at least one style to continue</span>
            ) : (
              <span>
                {preferences.styles.length}{' '}
                {preferences.styles.length === 1
                  ? 'style'
                  : 'styles'}{' '}
                selected
              </span>
            )}
          </div>

          <button
            className="continue-button"
            disabled={preferences.styles.length === 0}
            onClick={() => navigate('/spaces')}
          >
            <span>Continue</span>
            <span>→</span>
          </button>
        </footer>

      </section>
    </main>
  )
}

export default PreferencesPage