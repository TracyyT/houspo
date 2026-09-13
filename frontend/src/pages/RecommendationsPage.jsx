import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import { products } from '../data/products'
import { usePreferences } from '../context/PreferenceContext'

import {
  getRecommendations,
  blendAIScores,
} from '../services/recommendationService'

import {
  searchMultipleProducts,
} from '../services/productService'

import {
  createAIStyleProfile,
  scoreProductsWithAI,
} from '../services/aiRecommendationService'

// Prevent duplicate AI requests while
// the same request is already running.
const aiRequestCache = new Map()

function RecommendationsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    preferences,
    resetPreferences,
    toggleSavedProduct,
    toggleDislikedProduct,
  } = usePreferences()

  const [searchTerm, setSearchTerm] =
    useState('')

  const [showNavbar, setShowNavbar] =
    useState(true)

  const [
    recentlyDisliked,
    setRecentlyDisliked,
  ] = useState(null)

    const [priceRange, setPriceRange] =
    useState(
        preferences.budget || 'all'
    )

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('All')

  const [sortOption, setSortOption] =
    useState('match')

  const [apiProducts, setApiProducts] =
    useState([])

  const [
    isLoadingProducts,
    setIsLoadingProducts,
  ] = useState(true)

  const [
    productLoadError,
    setProductLoadError,
  ] = useState(false)

  const [aiScores, setAIScores] =
    useState([])

  const [
    aiCandidateIds,
    setAICandidateIds,
  ] = useState([])

  const uniqueSearchQueries =
    useMemo(() => {
      const space =
        preferences.space || 'home'

      const category =
        preferences.categories[0] ||
        'furniture'

      const styleQueries =
        preferences.styles
          .slice(0, 2)
          .map((style) =>
            `${style} ${space} ${category} furniture`
              .toLowerCase()
          )

      const broadQuery =
        `${space} ${category} adult home furniture`
          .toLowerCase()

      const queries = [
        ...styleQueries,
      ]

      if (
        preferences.budget ===
        'under-200'
      ) {
        queries.push(
          `affordable ${space} ${category} furniture`
            .toLowerCase()
        )
      } else {
        queries.push(broadQuery)
      }

      if (queries.length < 3) {
        queries.push(broadQuery)
      }

      return [
        ...new Set(queries),
      ].slice(0, 3)
    }, [
      preferences.styles,
      preferences.space,
      preferences.categories,
      preferences.budget,
    ])

  const productCacheKey =
    `houspoApiProducts:${uniqueSearchQueries.join('|')}`

  const handleStartOver = () => {
    resetPreferences()
    navigate('/')
  }

  const matchesPriceRange = (price) => {
    if (typeof price !== 'number') {
      return priceRange === 'all'
    }

    switch (priceRange) {
      case 'under-200':
        return price < 200

      case '200-500':
        return (
          price >= 200 &&
          price <= 500
        )

      case '500-1000':
        return (
          price > 500 &&
          price <= 1000
        )

      case '1000-plus':
        return price > 1000

      default:
        return true
    }
  }

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY =
        window.scrollY

      if (currentScrollY <= 20) {
        setShowNavbar(true)
      } else if (
        currentScrollY > lastScrollY
      ) {
        setShowNavbar(false)
      } else {
        setShowNavbar(true)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener(
      'scroll',
      handleScroll
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])

  useEffect(() => {
    async function loadProducts() {
      const cachedProducts =
        sessionStorage.getItem(
          productCacheKey
        )

      if (cachedProducts) {
        try {
          const parsedProducts =
            JSON.parse(cachedProducts)

          setApiProducts(
            parsedProducts
          )

          setProductLoadError(false)

          sessionStorage.setItem(
            'houspoActiveProducts',
            JSON.stringify(
              parsedProducts
            )
          )

          setIsLoadingProducts(false)

          return
        } catch {
          sessionStorage.removeItem(
            productCacheKey
          )
        }
      }

      try {
        setIsLoadingProducts(true)
        setProductLoadError(false)

        const fetchedProducts =
          await searchMultipleProducts(
            uniqueSearchQueries
          )

        setApiProducts(
          fetchedProducts
        )

        sessionStorage.setItem(
          productCacheKey,
          JSON.stringify(
            fetchedProducts
          )
        )

        sessionStorage.setItem(
          'houspoActiveProducts',
          JSON.stringify(
            fetchedProducts
          )
        )
      } catch (error) {
        console.error(
          'CHANNEL3 ERROR:',
          error
        )

        setApiProducts([])
        setProductLoadError(true)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [
    productCacheKey,
    uniqueSearchQueries,
  ])

  const productSource =
    isLoadingProducts
      ? []
      : apiProducts.length > 0
        ? apiProducts
        : products

  const recommendations =
    getRecommendations(
      productSource,
      preferences
    )

  const aiPreferenceKey =
    JSON.stringify({
      styles:
        preferences.styles,
      characteristics:
        preferences.characteristics,
      colors:
        preferences.colors,
      materials:
        preferences.materials,
      space:
        preferences.space,
      categories:
        preferences.categories,
      budget:
        preferences.budget,
    })

  const productCatalogKey =
    productSource
      .map((product) =>
        String(product.id)
      )
      .join('|')

  const aiCacheKey =
    `houspoAI:${aiPreferenceKey}:${productCatalogKey}`

  useEffect(() => {
    let cancelled = false

    async function loadAIRecommendations() {
      if (
        isLoadingProducts ||
        recommendations.length === 0
      ) {
        return
      }

      const cachedAI =
        sessionStorage.getItem(
          aiCacheKey
        )

      if (cachedAI) {
        try {
          const parsedAI =
            JSON.parse(cachedAI)

          setAIScores(
            parsedAI.scores || []
          )

          setAICandidateIds(
            parsedAI.candidateIds || []
          )

          return
        } catch {
          sessionStorage.removeItem(
            aiCacheKey
          )
        }
      }

      const aiCandidates =
        recommendations.slice(0, 15)

      const candidateIds =
        aiCandidates.map(
          (product) =>
            String(product.id)
        )

      try {
        let request =
          aiRequestCache.get(
            aiCacheKey
          )

        if (!request) {
          request = (async () => {
            const styleProfile =
              await createAIStyleProfile(
                preferences
              )

            if (!styleProfile) {
              return null
            }

            const scores =
              await scoreProductsWithAI(
                styleProfile,
                aiCandidates
              )

            if (scores.length === 0) {
              return null
            }

            return {
              scores,
              candidateIds,
            }
          })()

          aiRequestCache.set(
            aiCacheKey,
            request
          )
        }

        const result =
          await request

        if (
          cancelled ||
          !result
        ) {
          return
        }

        setAIScores(
          result.scores
        )

        setAICandidateIds(
          result.candidateIds
        )

        sessionStorage.setItem(
          aiCacheKey,
          JSON.stringify(result)
        )
      } catch (error) {
        console.error(
          'AI recommendations unavailable:',
          error
        )
      }
    }

    loadAIRecommendations()

    return () => {
      cancelled = true
    }
  }, [
    aiCacheKey,
    isLoadingProducts,
  ])

  const rankedRecommendations =
    useMemo(() => {
      if (
        aiScores.length === 0 ||
        aiCandidateIds.length === 0
      ) {
        return recommendations
      }

      const recommendationMap =
        new Map(
          recommendations.map(
            (product) => [
              String(product.id),
              product,
            ]
          )
        )

      const aiCandidates =
        aiCandidateIds
          .map((id) =>
            recommendationMap.get(
              String(id)
            )
          )
          .filter(Boolean)

      if (aiCandidates.length === 0) {
        return recommendations
      }

      const rerankedCandidates =
        blendAIScores(
          aiCandidates,
          aiScores,
          0.3
        )

      const candidateIdSet =
        new Set(
          aiCandidateIds.map(String)
        )

      const remainingProducts =
        recommendations.filter(
          (product) =>
            !candidateIdSet.has(
              String(product.id)
            )
        )

      return [
        ...rerankedCandidates,
        ...remainingProducts,
      ]
    }, [
      recommendations,
      aiScores,
      aiCandidateIds,
    ])

  const availableCategories = [
    'All',
    ...new Set(
      rankedRecommendations
        .map(
          (product) =>
            product.category
        )
        .filter(Boolean)
    ),
  ]

  const visibleRecommendations =
    rankedRecommendations.filter(
      (product) => {
        const isNotDisliked =
          !preferences.dislikedProducts.some(
            (productId) =>
              String(productId) ===
              String(product.id)
          )

        const searchableText = [
          product.name,
          product.category,
          product.subcategory,
          ...(product.styles || []),
          ...(product.characteristics || []),
          ...(product.colors || []),
          ...(product.materials || []),
          ...(product.spaces || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch =
          searchableText.includes(
            searchTerm
              .toLowerCase()
              .trim()
          )

        const matchesPrice =
          matchesPriceRange(
            product.price
          )

        return (
          isNotDisliked &&
          matchesSearch &&
          matchesPrice
        )
      }
    )

  const filteredRecommendations =
    selectedCategory === 'All'
      ? visibleRecommendations
      : visibleRecommendations.filter(
          (product) =>
            product.category ===
            selectedCategory
        )

  const sortedRecommendations = [
    ...filteredRecommendations,
  ].sort((a, b) => {
    if (sortOption === 'price-low') {
      const priceA =
        typeof a.price === 'number'
          ? a.price
          : Infinity

      const priceB =
        typeof b.price === 'number'
          ? b.price
          : Infinity

      return priceA - priceB
    }

    if (sortOption === 'price-high') {
      const priceA =
        typeof a.price === 'number'
          ? a.price
          : -Infinity

      const priceB =
        typeof b.price === 'number'
          ? b.price
          : -Infinity

      return priceB - priceA
    }

    return 0
  })

  return (
    <main className="recommendations-page">
      <header
        className={`recommendations-nav ${
          showNavbar
            ? 'nav-visible'
            : 'nav-hidden'
        }`}
      >
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

      <section className="recommendations-content">
        <div className="recommendations-heading">
          <span className="section-label">
            CURATED FOR YOU
          </span>

          <h1>
            Your houspo picks.
          </h1>

          <p>
            Based on your style,
            space, and product
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
              <strong>
                Start over
              </strong>
            </button>
          </div>
        </div>

        <div className="profile-summary">
          <span className="profile-summary-label">
            Your selections
          </span>

          <div className="profile-summary-values">
            {preferences.styles.length >
              0 && (
              <span>
                {preferences.styles.join(
                  ', '
                )}
              </span>
            )}

            {preferences.space && (
              <>
                <span className="summary-divider">
                  •
                </span>

                <span>
                  {preferences.space}
                </span>
              </>
            )}

            {preferences.categories
              .length > 0 && (
              <>
                <span className="summary-divider">
                  •
                </span>

                <span>
                  {preferences.categories.join(
                    ', '
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="recommendation-search">
          <input
            type="text"
            placeholder="Search furniture, styles, materials..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>

        <div className="recommendation-controls">
          <div className="category-filters">
            {availableCategories.map(
              (category) => (
                <button
                  key={category}
                  className={`filter-button ${
                    selectedCategory ===
                    category
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                >
                  {category}
                </button>
              )
            )}
          </div>

          <div className="price-filter">
            <label htmlFor="price-filter">
              Price
            </label>

            <select
              id="price-filter"
              value={priceRange}
              onChange={(event) =>
                setPriceRange(
                  event.target.value
                )
              }
            >
              <option value="all">
                All prices
              </option>

              <option value="under-200">
                Under $200
              </option>

              <option value="200-500">
                $200–$500
              </option>

              <option value="500-1000">
                $500–$1,000
              </option>

              <option value="1000-plus">
                $1,000+
              </option>
            </select>
          </div>

          <div className="sort-control">
            <label htmlFor="sort">
              Sort by
            </label>

            <select
              id="sort"
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value
                )
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

        {productLoadError && (
          <div className="product-load-notice">
            <span>
              Live products are temporarily
              unavailable. Showing houspo
              demo picks instead.
            </span>
          </div>
        )}

        {recentlyDisliked && (
          <div className="undo-dislike-message">
            <span>
              Removed from your picks.
            </span>

            <button
              onClick={() => {
                toggleDislikedProduct(
                  recentlyDisliked
                )

                setRecentlyDisliked(
                  null
                )
              }}
            >
              Undo
            </button>
          </div>
        )}

        {isLoadingProducts ? (
          <section className="recommendation-grid">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <article
                key={index}
                className="product-card skeleton-card"
              >
                <div className="skeleton-image" />

                <div className="product-content">
                  <div className="skeleton-line skeleton-small" />
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-price" />
                  <div className="skeleton-line skeleton-match" />
                  <div className="skeleton-line skeleton-reason" />
                  <div className="skeleton-line skeleton-reason short" />
                </div>

                <div className="product-feedback">
                  <div className="skeleton-button" />
                  <div className="skeleton-button" />
                </div>
              </article>
            ))}
          </section>
        ) : sortedRecommendations.length ===
          0 ? (
          <div className="recommendation-empty-state">
            <h2>
              No products found.
            </h2>

            <p>
              Try a different search
              term or adjust your
              filters.
            </p>
          </div>
        ) : (
          <section className="recommendation-grid">
            {sortedRecommendations.map(
              (product, index) => {
                const isSaved =
                  preferences.savedProducts.some(
                    (productId) =>
                      String(productId) ===
                      String(product.id)
                  )

                return (
                  <article
                    key={product.id}
                    className="product-card"
                  >
                    <Link
                      to={`/product/${product.id}`}
                      state={{
                        product,
                      }}
                      className="product-card-main-link"
                    >
                      <div className="product-image-wrapper">
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

                        <div className="product-rank">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </div>
                      </div>

                      <div className="product-content">
                        <div className="product-heading-row">
                          <div>
                            <span className="product-category">
                              {
                                product.category ||
                                'Home'
                              }
                            </span>

                            <h2>
                              {
                                product.name ||
                                'Untitled product'
                              }
                            </h2>
                          </div>

                          <span className="product-price">
                            {typeof product.price ===
                            'number'
                              ? `$${product.price}`
                              : 'Price unavailable'}
                          </span>
                        </div>

                        <div className="product-match-section">
                          <div className="match-heading">
                            <span className="match-percentage">
                              {
                                product.matchPercentage
                              }
                              % match
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

                          {product.matchReasons
                            .length >
                            0 && (
                            <div className="match-reasons">
                              <span className="why-label">
                                Why this
                                matches you
                              </span>

                              {product.matchReasons
                                .slice(
                                  0,
                                  3
                                )
                                .map(
                                  (
                                    reason
                                  ) => (
                                    <span
                                      key={
                                        reason
                                      }
                                      className="match-reason"
                                    >
                                      {
                                        reason
                                      }
                                    </span>
                                  )
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="product-feedback">
                      <button
                        className={`feedback-button ${
                          isSaved
                            ? 'active'
                            : ''
                        }`}
                        onClick={(
                          event
                        ) => {
                          event.preventDefault()
                          event.stopPropagation()

                          toggleSavedProduct(
                            product.id,
                            product
                          )
                        }}
                      >
                        {isSaved
                          ? '♥ Saved'
                          : '♡ Save'}
                      </button>

                      <button
                        className="feedback-button subtle"
                        onClick={(
                          event
                        ) => {
                          event.preventDefault()
                          event.stopPropagation()

                          toggleDislikedProduct(
                            product.id
                          )

                          setRecentlyDisliked(
                            product.id
                          )
                        }}
                      >
                        × Not my style
                      </button>
                    </div>
                  </article>
                )
              }
            )}
          </section>
        )}
      </section>
    </main>
  )
}

export default RecommendationsPage