import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { categories } from '../data/categories'
import { usePreferences } from '../context/PreferenceContext'

function CategoriesPage() {
  const navigate = useNavigate()
  const {
    preferences,
    toggleCategory,
  } = usePreferences()

  return (
    <main className="categories-page">

      <header className="onboarding-header">
        <Link to="/spaces" className="back-link">
          ← Back
        </Link>

        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <div className="step-indicator">
          <span>Step 3</span>

          <div className="progress-track">
            <div className="progress-fill progress-fill-full" />
          </div>
        </div>
      </header>


      <section className="categories-content">

        <div className="categories-heading">
          <span className="section-label">
            WHAT ARE YOU LOOKING FOR?
          </span>

          <h1>Choose what you want to discover.</h1>

          <p>
            Select one or more product categories.
            You can always change these later.
          </p>
        </div>


        <section className="category-grid">
          {categories.map((category) => {
            const selected =
              preferences.categories.includes(category.name)

            return (
              <button
                key={category.id}
                className={`category-card ${
                  selected ? 'selected' : ''
                }`}
                onClick={() =>
                  toggleCategory(category.name)
                }
              >
                <div className="category-card-top">
                  <span className="category-name">
                    {category.name}
                  </span>

                  <span className="category-toggle">
                    {selected ? '✓' : '+'}
                  </span>
                </div>

                <p>
                  {category.description}
                </p>

                <div className="subcategory-list">
                  {category.subcategories.map((item) => (
                    <span key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </section>


        <footer className="categories-footer">
          <div className="selection-summary">
            {preferences.categories.length === 0
              ? 'Select at least one category'
              : `${preferences.categories.length} ${
                  preferences.categories.length === 1
                    ? 'category'
                    : 'categories'
                } selected`}
          </div>

          <button
            className="continue-button"
            disabled={
              preferences.categories.length === 0
            }
            onClick={() => navigate('/refinements')}
          >
            <span>Continue</span>
            <span>→</span>
          </button>
        </footer>

      </section>
    </main>
  )
}

export default CategoriesPage