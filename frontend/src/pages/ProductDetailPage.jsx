import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { products } from '../data/products'

import {
  getSimilarProducts,
} from '../services/similarityService'

import { usePreferences } from '../context/PreferenceContext'

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    preferences,
    toggleSavedProduct,
  } = usePreferences()

  // Load the currently active Channel3
  // catalog from the recommendations page.
  const cachedApiProducts = useMemo(() => {
    try {
      return (
        JSON.parse(
          sessionStorage.getItem(
            'houspoActiveProducts'
          )
        ) || []
      )
    } catch {
      return []
    }
  }, [])

  // Use live products when available.
  // Fall back to local demo products.
  const productCatalog =
    cachedApiProducts.length > 0
      ? cachedApiProducts
      : products

  // Prefer the product passed through
  // navigation so live API products work.
  const product =
    location.state?.product ??
    productCatalog.find(
      (item) =>
        String(item.id) === String(id)
    )

  const [imageIndex, setImageIndex] =
    useState(0)

  const [
    shuffleCount,
    setShuffleCount,
  ] = useState(0)

  const [
    isLoadingSimilar,
    setIsLoadingSimilar,
  ] = useState(false)

  // Reset the gallery and scroll up
  // when a different product is opened.
  useEffect(() => {
    setImageIndex(0)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [id])

  const similarProducts = useMemo(() => {
    if (!product) {
      return []
    }

    const matches = getSimilarProducts(
      productCatalog,
      product,
      true
    )

    // Keep only the strongest matches as candidates.
    // This prevents weaker matches from jumping above
    // products that are actually more similar.
    const candidatePool =
      matches.slice(0, 12)

    // On first load, show the best
    // matches in ranked order.
    if (shuffleCount === 0) {
      return candidatePool.slice(0, 6)
    }

    // Keep the strongest two matches
    // and shuffle the other strong options.
    const strongestMatches =
      candidatePool.slice(0, 2)

    const remainingMatches =
      candidatePool.slice(2)

    const shuffledRemaining =
      [...remainingMatches].sort(
        () => Math.random() - 0.5
      )

    return [
      ...strongestMatches,
      ...shuffledRemaining,
    ].slice(0, 6)
  }, [
    product,
    productCatalog,
    shuffleCount,
  ])

  // Keep all hooks above this return.
  if (!product) {
    return (
      <main className="product-detail-page">

        <div className="product-detail-container">

          <p>
            Product not found.
          </p>

          <Link to="/recommendations">
            Back to recommendations
          </Link>

        </div>

      </main>
    )
  }

  // Use all available product images.
  // Remove empty image values.
  const productImages =
    (
      product.images?.length
        ? product.images
        : [product.image]
    ).filter(Boolean)

  // Always keep at least one image
  // available for the gallery.
  const safeProductImages =
    productImages.length > 0
      ? productImages
      : ['/image-placeholder.png']

  const isSaved =
    preferences.savedProducts.some(
      (productId) =>
        String(productId) ===
        String(product.id)
    )

  const showPreviousImage = () => {
    setImageIndex((current) =>
      current === 0
        ? safeProductImages.length - 1
        : current - 1
    )
  }

  const showNextImage = () => {
    setImageIndex((current) =>
      current ===
      safeProductImages.length - 1
        ? 0
        : current + 1
    )
  }

  const handleMoreLikeThis = () => {
    setIsLoadingSimilar(true)

    setTimeout(() => {
      setShuffleCount(
        (current) => current + 1
      )

      setIsLoadingSimilar(false)
    }, 350)
  }

  return (
    <main className="product-detail-page">

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
                '/recommendations' ||
              location.pathname.startsWith(
                '/product/'
              )
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

      <div className="product-detail-container">

        <button
          className="product-detail-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <section className="product-detail-layout">

          <div className="product-gallery">

            <div className="product-main-image">

              <img
                src={
                  safeProductImages[
                    imageIndex
                  ] ||
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

              {safeProductImages.length >
                1 && (
                <>
                  <button
                    className="gallery-arrow left"
                    onClick={
                      showPreviousImage
                    }
                    aria-label="Previous image"
                  >
                    ←
                  </button>

                  <button
                    className="gallery-arrow right"
                    onClick={
                      showNextImage
                    }
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}

            </div>

            {safeProductImages.length >
              1 && (
              <div className="product-thumbnails">

                {safeProductImages.map(
                  (image, index) => (
                    <button
                      key={`${image}-${index}`}
                      className={`product-thumbnail ${
                        imageIndex === index
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setImageIndex(index)
                      }
                    >

                      <img
                        src={
                          image ||
                          '/image-placeholder.png'
                        }
                        alt={`${product.name || 'Product'} view ${
                          index + 1
                        }`}
                        onError={(
                          event
                        ) => {
                          event.currentTarget.onerror =
                            null

                          event.currentTarget.src =
                            '/image-placeholder.png'
                        }}
                      />

                    </button>
                  )
                )}

              </div>
            )}

          </div>

          <div className="product-detail-info">

            <span className="product-detail-category">
              {product.category ||
                'Home'}

              {product.subcategory && (
                <>
                  {' / '}
                  {product.subcategory}
                </>
              )}
            </span>

            <h1>
              {product.name ||
                'Untitled product'}
            </h1>

            <p className="product-detail-price">
              {typeof product.price ===
              'number'
                ? `$${product.price}`
                : 'Price unavailable'}
            </p>

            <div className="product-detail-status">

              {product.rating !== null &&
                product.rating !==
                  undefined && (
                  <span className="product-rating">
                    ★ {product.rating}

                    {product.reviewCount !==
                      null &&
                      product.reviewCount !==
                        undefined && (
                        <span>
                          {' '}
                          (
                          {
                            product.reviewCount
                          }
                          {' '}
                          reviews)
                        </span>
                      )}
                  </span>
                )}

              {product.availability && (
                <span
                  className={`product-availability ${
                    product.availability ===
                    'Low Stock'
                      ? 'low-stock'
                      : ''
                  }`}
                >
                  {product.availability}
                </span>
              )}

            </div>

            <div className="product-detail-actions">

              <button
                className={`detail-action-button ${
                  isSaved
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  toggleSavedProduct(
                    product.id,
                    product
                  )
                }
              >
                {isSaved
                  ? '♥ Saved'
                  : '♡ Save'}
              </button>

            </div>

            {product.seller?.url && (
              <a
                href={product.seller.url}
                target="_blank"
                rel="noreferrer"
                className="seller-link"
              >
                View at{' '}
                {product.seller.name ||
                  'retailer'}
                {' '}
                ↗
              </a>
            )}

            <div className="product-detail-meta">

              {product.styles?.length >
                0 && (
                <div>
                  <span>
                    STYLE
                  </span>

                  <p>
                    {product.styles.join(
                      ', '
                    )}
                  </p>
                </div>
              )}

              {product.colors?.length >
                0 && (
                <div>
                  <span>
                    COLORS
                  </span>

                  <p>
                    {product.colors.join(
                      ', '
                    )}
                  </p>
                </div>
              )}

              {product.materials?.length >
                0 && (
                <div>
                  <span>
                    MATERIAL
                  </span>

                  <p>
                    {product.materials.join(
                      ', '
                    )}
                  </p>
                </div>
              )}

              {product.spaces?.length >
                0 && (
                <div>
                  <span>
                    FOR
                  </span>

                  <p>
                    {product.spaces.join(
                      ', '
                    )}
                  </p>
                </div>
              )}

              {product.dimensions &&
                product.dimensions.width !==
                  undefined &&
                product.dimensions.depth !==
                  undefined &&
                product.dimensions.height !==
                  undefined && (
                  <div>
                    <span>
                      DIMENSIONS
                    </span>

                    <p>
                      {
                        product.dimensions
                          .width
                      }
                      {' × '}
                      {
                        product.dimensions
                          .depth
                      }
                      {' × '}
                      {
                        product.dimensions
                          .height
                      }
                      {' '}
                      {
                        product.dimensions
                          .unit || ''
                      }
                    </p>
                  </div>
                )}

            </div>

          </div>

        </section>

        <section className="similar-products-section">

          <div className="similar-products-header">

            <div className="similar-products-heading">

              <h2>
                Inspired by this piece
              </h2>

              <p>
                Selected by shared style,
                color, material, space,
                and product type.
              </p>

            </div>

            <button
              className="more-like-this-button"
              onClick={
                handleMoreLikeThis
              }
              disabled={
                isLoadingSimilar
              }
            >
              {isLoadingSimilar
                ? 'Finding pieces...'
                : 'More like this ↻'}
            </button>

          </div>

          {isLoadingSimilar ? (

            <div className="similar-loading">

              <div className="loading-spinner" />

              <span>
                Finding similar pieces...
              </span>

            </div>

          ) : similarProducts.length ===
            0 ? (

            <div className="similar-empty-state">
              <p>
                No similar pieces found yet.
              </p>
            </div>

          ) : (

            <div className="similar-products-grid">

              {similarProducts.map(
                (similarProduct) => (

                  <Link
                    key={
                      similarProduct.id
                    }
                    to={`/product/${similarProduct.id}`}
                    state={{
                      product:
                        similarProduct,
                    }}
                    className="similar-product-card"
                  >

                    <img
                      src={
                        similarProduct.image ||
                        '/image-placeholder.png'
                      }
                      alt={
                        similarProduct.name ||
                        'Furniture product'
                      }
                      onError={(
                        event
                      ) => {
                        event.currentTarget.onerror =
                          null

                        event.currentTarget.src =
                          '/image-placeholder.png'
                      }}
                    />

                    <span>
                      {
                        similarProduct.category ||
                        'Home'
                      }
                    </span>

                    <h3>
                      {
                        similarProduct.name ||
                        'Untitled product'
                      }
                    </h3>

                    <p>
                      {typeof similarProduct.price ===
                      'number'
                        ? `$${similarProduct.price}`
                        : 'Price unavailable'}
                    </p>

                  </Link>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  )
}

export default ProductDetailPage