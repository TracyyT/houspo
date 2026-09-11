import { Link } from 'react-router-dom'

import { spaces } from '../data/spaces'
import { usePreferences } from '../context/PreferenceContext'

function SpacesPage() {
  const { preferences, selectSpace } = usePreferences()

  return (
    <main className="spaces-page">

      <header className="onboarding-header">
        <Link to="/preferences" className="back-link">
          ← Back
        </Link>

        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <div className="step-indicator">
          <span>Step 2 of 2</span>

          <div className="progress-track">
            <div className="progress-fill progress-fill-full" />
          </div>
        </div>
      </header>

      <section className="spaces-content">

        <div className="spaces-heading">
          <span className="section-label">
            YOUR SPACE
          </span>

          <h1>What space are you designing?</h1>

          <p>
            Choose the room or space you want inspiration for.
          </p>
        </div>

        <section className="space-grid">
          {spaces.map((space) => {
            const selected =
              preferences.space === space.name

            return (
              <button
                key={space.id}
                className={`space-card ${
                  selected ? 'selected' : ''
                }`}
                onClick={() => selectSpace(space.name)}
              >
                <div className="space-image-wrapper">
                  <img
                    src={space.image}
                    alt={`${space.name} interior`}
                  />

                  <div className="space-image-overlay" />

                  {selected && (
                    <div className="selection-check">
                      ✓
                    </div>
                  )}
                </div>

                <div className="space-card-footer">
                  <span>{space.name}</span>
                </div>
              </button>
            )
          })}
        </section>

        <footer className="spaces-footer">
          <div className="selection-summary">
            {preferences.space
              ? `${preferences.space} selected`
              : 'Select one space to continue'}
          </div>

          <button
            className="continue-button"
            disabled={!preferences.space}
          >
            <span>Continue</span>
            <span>→</span>
          </button>
        </footer>

      </section>
    </main>
  )
}

export default SpacesPage