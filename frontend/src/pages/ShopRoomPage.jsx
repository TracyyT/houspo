import {
  Link,
  useLocation,
} from 'react-router-dom'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { usePreferences } from '../context/PreferenceContext'

import {
  prepareRoomPhoto,
  shopRoom,
  warmVisionService,
} from '../services/visionService'

import {
  hasStyleProfile,
  rankVisualMatches,
} from '../services/visualRanking'

import { searchProducts } from '../services/productService'
import { getRecommendations } from '../services/recommendationService'

const ROOM_ID = 'room'

// The last photo and its results are kept for
// this browser tab, so a reload or coming back
// from a product page doesn't lose them.
const STORAGE_KEY = 'houspoShopRoom'

function loadSavedSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY))

    if (saved?.photo?.dataUrl && saved?.result?.visionUsed) {
      return saved
    }
  } catch {
    // Missing or unreadable: start fresh.
  }

  return null
}

function saveSession(photo, result) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ photo, result }))
  } catch {
    // Storage full or blocked: results just won't survive a reload.
  }
}

function clearSavedSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

function firstSelection(result) {
  return (
    result.items[0]?.id ??
    (result.room_matches.length ? ROOM_ID : null)
  )
}

function capitalize(text = '') {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function itemPoints(item) {
  if (item.polygon?.length >= 3) {
    return item.polygon
      .map(([x, y]) => `${x},${y}`)
      .join(' ')
  }

  const [x1, y1, x2, y2] = item.box

  return `${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2}`
}

// One product in the matches panel. Uses the
// same card styles as the recommendations page.
function MatchCard({
  product,
  isSaved,
  showMatchPercentage,
  onSave,
  onDislike,
}) {
  return (
    <article
      className={`product-card shop-room-card ${
        product.isDisliked ? 'is-disliked' : ''
      }`}
    >
      <Link
        to={`/product/${product.id}`}
        state={{ product }}
        className="product-card-main-link"
      >
        <div className="product-image-wrapper">
          <img
            src={product.image || '/image-placeholder.png'}
            alt={product.name || 'Furniture product'}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = '/image-placeholder.png'
            }}
          />

          <div className="shop-room-similarity">
            {product.similarityLabel}
          </div>
        </div>

        <div className="product-content">
          <div className="product-heading-row">
            <div>
              <span className="product-category">
                {product.category || 'Home'}
              </span>

              <h2>{product.name || 'Untitled product'}</h2>
            </div>

            <span className="product-price">
              {product.price > 0
                ? `$${product.price}`
                : 'Price unavailable'}
            </span>
          </div>

          {showMatchPercentage && (
            <div className="product-match-section">
              <div className="match-heading">
                <span className="match-percentage">
                  {product.matchPercentage}% match
                </span>

                <span className="match-label">FOR YOU</span>
              </div>

              <div className="match-bar">
                <div
                  className="match-bar-fill"
                  style={{ width: `${product.matchPercentage}%` }}
                />
              </div>
            </div>
          )}

          {product.matchReasons.length > 0 && (
            <div className="match-reasons">
              {product.matchReasons
                .slice(0, 2)
                .map((reason) => (
                  <span key={reason} className="match-reason">
                    {reason}
                  </span>
                ))}
            </div>
          )}
        </div>
      </Link>

      <div className="product-feedback">
        <button
          className={`feedback-button ${isSaved ? 'active' : ''}`}
          onClick={onSave}
        >
          {isSaved ? '♥ Saved' : '♡ Save'}
        </button>

        <button
          className="feedback-button subtle"
          onClick={onDislike}
        >
          × Not my style
        </button>
      </div>
    </article>
  )
}

function ShopRoomPage() {
  const location = useLocation()
  const fileInputRef = useRef(null)

  const {
    preferences,
    toggleSavedProduct,
    toggleDislikedProduct,
  } = usePreferences()

  // idle → preparing → analyzing → done
  const [savedSession] = useState(loadSavedSession)

  const [status, setStatus] = useState(savedSession ? 'done' : 'idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [photo, setPhoto] = useState(savedSession?.photo ?? null)
  const [result, setResult] = useState(savedSession?.result ?? null)
  const [selectedId, setSelectedId] = useState(
    savedSession ? firstSelection(savedSession.result) : null
  )
  const [hoveredId, setHoveredId] = useState(null)
  const [showOutsideBudget, setShowOutsideBudget] = useState(false)
  const [recentlyDisliked, setRecentlyDisliked] = useState(null)
  const [fallbackProducts, setFallbackProducts] = useState([])
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const [slowStart, setSlowStart] = useState(false)

  useEffect(() => {
    warmVisionService()
  }, [])

  // Explain long waits: the first photo after a
  // quiet period also starts the vision service.
  useEffect(() => {
    if (status !== 'analyzing') {
      return
    }

    const timer = setTimeout(() => setSlowStart(true), 8000)

    return () => clearTimeout(timer)
  }, [status])

  const personalized = hasStyleProfile(preferences)

  const items = result?.items ?? []

  const selectedItem =
    items.find((item) => item.id === selectedId) ?? null

  // Re-rank whenever the selection or the
  // user's preferences (saves, dislikes) change.
  const ranked = useMemo(() => {
    const matches =
      selectedId === ROOM_ID
        ? result?.room_matches ?? []
        : result?.items?.find((item) => item.id === selectedId)
            ?.matches ?? []

    return rankVisualMatches(matches, preferences)
  }, [result, selectedId, preferences])

  const visibleProducts = showOutsideBudget
    ? [...ranked.withinBudget, ...ranked.outsideBudget]
    : ranked.withinBudget

  const handleFile = async (file) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a photo (JPG or PNG).')
      return
    }

    setErrorMessage('')
    setResult(null)
    setSelectedId(null)
    setFallbackProducts([])
    setShowOutsideBudget(false)
    setStatus('preparing')

    let prepared

    try {
      prepared = await prepareRoomPhoto(file)
    } catch (error) {
      console.error('Could not read photo:', error)
      setStatus('idle')
      setErrorMessage(
        "We couldn't read that photo. Try a JPG or PNG."
      )
      return
    }

    setPhoto(prepared)
    setSlowStart(false)
    setStatus('analyzing')

    const data = await shopRoom(prepared.dataUrl)

    setResult(data)
    setStatus('done')

    if (data.visionUsed) {
      // Start with the most confident item.
      setSelectedId(firstSelection(data))
      saveSession(prepared, data)
    } else {
      clearSavedSession()
    }
  }

  // If the vision service is unavailable, show
  // regular recommendations for the user's room.
  useEffect(() => {
    if (status !== 'done' || result?.visionUsed !== false) {
      return
    }

    let cancelled = false

    async function loadFallback() {
      setFallbackLoading(true)

      try {
        const products = await searchProducts({
          query: `${preferences.space || 'living room'} furniture`,
          limit: 30,
        })

        if (!cancelled) {
          setFallbackProducts(
            getRecommendations(products, preferences).slice(0, 6)
          )
        }
      } catch (error) {
        console.error('Fallback products unavailable:', error)
      } finally {
        if (!cancelled) {
          setFallbackLoading(false)
        }
      }
    }

    loadFallback()

    return () => {
      cancelled = true
    }
    // Only when a new result arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, result])

  const selectItem = (id) => {
    setSelectedId(id)
    setShowOutsideBudget(false)
  }

  const isSaved = (productId) =>
    preferences.savedProducts.some(
      (id) => String(id) === String(productId)
    )

  const startOver = () => {
    clearSavedSession()
    setStatus('idle')
    setPhoto(null)
    setResult(null)
    setSelectedId(null)
    setErrorMessage('')
    setRecentlyDisliked(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const panelTitle =
    selectedId === ROOM_ID
      ? 'Matches for the whole room'
      : selectedItem
        ? `Matches for your ${selectedItem.label}`
        : 'Select an item'

  return (
    <main className="recommendations-page shop-room-page">
      <header className="recommendations-nav nav-visible">
        <Link to="/" className="onboarding-logo">
          houspo
        </Link>

        <nav className="main-nav-links">
          <Link to="/recommendations">Explore</Link>

          <Link
            to="/shop-room"
            className={
              location.pathname === '/shop-room' ? 'active' : ''
            }
          >
            Shop a Room
          </Link>

          <Link to="/saved">Saved</Link>
          <Link to="/about">About</Link>
          <Link to="/my-style">My Style</Link>
        </nav>
      </header>

      <section className="recommendations-content">
        <div className="recommendations-heading">
          <span className="section-label">SHOP THIS ROOM</span>

          <h1>Shop the look of a room.</h1>

          <p>
            Upload a photo of a room. houspo finds the furniture
            and decor in it and matches each piece with similar
            products{personalized ? ', ranked for your style and budget' : ''}.
          </p>
        </div>

        {!personalized && (
          <div className="product-load-notice">
            Want results ranked for your taste?{' '}
            <Link to="/preferences" className="edit-preferences-link">
              Take the style quiz
            </Link>
          </div>
        )}

        {status === 'idle' && (
          <label
            className="shop-room-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              handleFile(event.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleFile(event.target.files?.[0])
              }
            />

            <span className="shop-room-dropzone-title">
              Choose a room photo
            </span>

            <span className="shop-room-dropzone-hint">
              or drag it here · resized in your browser, never
              stored
            </span>
          </label>
        )}

        {errorMessage && (
          <div className="product-load-notice shop-room-error">
            {errorMessage}
          </div>
        )}

        {photo && (
          <div className="shop-room-layout">
            <div className="shop-room-photo-column">
              {status === 'done' && (
                <button
                  className="product-detail-back shop-room-back"
                  onClick={startOver}
                >
                  ← Back
                </button>
              )}

              <div className="shop-room-photo">
                <img src={photo.dataUrl} alt="Your room" />

                {status === 'done' && items.length > 0 && (
                  <svg
                    viewBox={`0 0 ${result.width || photo.width} ${
                      result.height || photo.height
                    }`}
                    preserveAspectRatio="none"
                    className="shop-room-overlay"
                  >
                    {items.map((item) => (
                      <polygon
                        key={item.id}
                        points={itemPoints(item)}
                        className={`shop-room-shape ${
                          item.id === selectedId ? 'selected' : ''
                        } ${item.id === hoveredId ? 'hovered' : ''}`}
                        onClick={() => selectItem(item.id)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <title>{capitalize(item.label)}</title>
                      </polygon>
                    ))}
                  </svg>
                )}

                {status === 'done' &&
                  items.map((item) => {
                    const width = result.width || photo.width
                    const height = result.height || photo.height
                    const [x1, y1, x2, y2] = item.box

                    return (
                      <button
                        key={item.id}
                        className={`shop-room-tag ${
                          item.id === selectedId ? 'selected' : ''
                        }`}
                        style={{
                          left: `${((x1 + x2) / 2 / width) * 100}%`,
                          top: `${((y1 + y2) / 2 / height) * 100}%`,
                        }}
                        onClick={() => selectItem(item.id)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {capitalize(item.label)}
                      </button>
                    )
                  })}

                {(status === 'preparing' || status === 'analyzing') && (
                  <div className="shop-room-scanning">
                    <span>
                      {status === 'preparing'
                        ? 'Preparing photo…'
                        : status === 'analyzing' && slowStart
                          ? 'Starting up, the first photo can take up to a minute…'
                          : 'Finding furniture and decor…'}
                    </span>
                  </div>
                )}
              </div>

              {status === 'done' && result.visionUsed && (
                <div className="shop-room-items" role="tablist">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={item.id === selectedId}
                      className={`filter-button ${
                        item.id === selectedId ? 'active' : ''
                      }`}
                      onClick={() => selectItem(item.id)}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {capitalize(item.label)}
                    </button>
                  ))}

                  {result.room_matches.length > 0 && (
                    <button
                      role="tab"
                      aria-selected={selectedId === ROOM_ID}
                      className={`filter-button ${
                        selectedId === ROOM_ID ? 'active' : ''
                      }`}
                      onClick={() => selectItem(ROOM_ID)}
                    >
                      Whole room
                    </button>
                  )}
                </div>
              )}

            </div>

            <div className="shop-room-panel">
              {status === 'analyzing' && (
                <div className="shop-room-panel-message">
                  Looking at your room…
                </div>
              )}

              {status === 'done' && result.visionUsed && (
                <>
                  <div className="shop-room-panel-heading">
                    <h2>{panelTitle}</h2>

                    {selectedItem && (
                      <p className="shop-room-panel-position">
                        Item {items.indexOf(selectedItem) + 1} of{' '}
                        {items.length}
                      </p>
                    )}

                    {items.length === 0 && (
                      <p>
                        We couldn't pick out individual pieces, so
                        these match the room as a whole.
                      </p>
                    )}
                  </div>

                  {recentlyDisliked && (
                    <div className="undo-dislike-message">
                      Moved to the end.
                      <button
                        onClick={() => {
                          toggleDislikedProduct(recentlyDisliked)
                          setRecentlyDisliked(null)
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {visibleProducts.length === 0 && (
                    <div className="shop-room-panel-message">
                      No matches within your budget.
                    </div>
                  )}

                  <div className="recommendation-grid shop-room-grid">
                    {visibleProducts.map((product) => (
                      <MatchCard
                        key={product.id}
                        product={product}
                        isSaved={isSaved(product.id)}
                        showMatchPercentage={personalized}
                        onSave={() =>
                          toggleSavedProduct(product.id, product)
                        }
                        onDislike={() => {
                          toggleDislikedProduct(product.id)
                          setRecentlyDisliked(
                            product.isDisliked ? null : product.id
                          )
                        }}
                      />
                    ))}
                  </div>

                  {ranked.outsideBudget.length > 0 && (
                    <button
                      className="start-over-link"
                      onClick={() =>
                        setShowOutsideBudget((current) => !current)
                      }
                    >
                      {showOutsideBudget
                        ? 'Hide products outside your budget'
                        : `Show ${ranked.outsideBudget.length} more outside your budget`}
                    </button>
                  )}
                </>
              )}

              {status === 'done' && !result.visionUsed && (
                <div className="shop-room-fallback">
                  <div className="shop-room-panel-heading">
                    <h2>Photo matching is unavailable right now</h2>

                    <p>
                      {result.reason === 'busy'
                        ? 'Too many photos at once. Please try again in a minute.'
                        : 'Here are recommendations for your space in the meantime.'}
                    </p>
                  </div>

                  {fallbackLoading && (
                    <div className="shop-room-panel-message">
                      Loading recommendations…
                    </div>
                  )}

                  <div className="recommendation-grid shop-room-grid">
                    {fallbackProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        state={{ product }}
                        className="product-card shop-room-card"
                      >
                        <div className="product-image-wrapper">
                          <img
                            src={product.image || '/image-placeholder.png'}
                            alt={product.name}
                          />
                        </div>

                        <div className="product-content">
                          <div className="product-heading-row">
                            <h2>{product.name}</h2>

                            <span className="product-price">
                              ${product.price}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <Link to="/recommendations" className="edit-action-button">
                    See all recommendations
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default ShopRoomPage
