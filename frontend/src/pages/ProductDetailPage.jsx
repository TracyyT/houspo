import {
  Link,
  useNavigate,
  useParams,
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
  const {
    preferences,
    toggleSavedProduct,
  } = usePreferences()


  const product = products.find(
    (item) =>
      item.id === Number(id)
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

  useEffect(() => {
    setImageIndex(0)
    }, [id])



    const similarProducts = useMemo(() => {

    if (!product) {
        return []
    }

    const matches = getSimilarProducts(
        products,
        product,
        true
    )

    const shuffled = [...matches].sort(
        () => Math.random() - 0.5
    )

    return shuffled.slice(0, 6)

    }, [
    product,
    shuffleCount,
    ])


  if (!product) {
    return (
      <main className="product-detail-page">

        <p>Product not found.</p>

        <Link to="/recommendations">
          Back to recommendations
        </Link>

      </main>
    )
  }


  const productImages =
    product.images?.length
      ? product.images
      : [product.image]


  const isSaved =
    preferences.savedProducts.includes(
      product.id
    )


  const showPreviousImage = () => {
    setImageIndex((current) =>
      current === 0
        ? productImages.length - 1
        : current - 1
    )
  }


  const showNextImage = () => {
    setImageIndex((current) =>
      current === productImages.length - 1
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
                src={productImages[imageIndex]}
                alt={product.name}
              />


              {productImages.length > 1 && (
                <>
                  <button
                    className="gallery-arrow left"
                    onClick={showPreviousImage}
                    aria-label="Previous image"
                  >
                    ←
                  </button>

                  <button
                    className="gallery-arrow right"
                    onClick={showNextImage}
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}

            </div>


            {productImages.length > 1 && (
              <div className="product-thumbnails">

                {productImages.map(
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
                        src={image}
                        alt={`${product.name} view ${
                          index + 1
                        }`}
                      />
                    </button>
                  )
                )}

              </div>
            )}

          </div>


          <div className="product-detail-info">

            <span className="product-detail-category">
              {product.category}
              {' / '}
              {product.subcategory}
            </span>

            <h1>{product.name}</h1>

            <p className="product-detail-price">
              ${product.price}
            </p>


            <div className="product-detail-actions">

              <button
                className={`detail-action-button ${
                  isSaved ? 'active' : ''
                }`}
                onClick={() =>
                  toggleSavedProduct(product.id)
                }
              >
                {isSaved
                  ? '♥ Saved'
                  : '♡ Save'}
              </button>


              {/* <button
                className="detail-action-button primary"
                onClick={handleMoreLikeThis}
              >
                More like this
              </button> */}

            </div>


            {product.seller && (
              <a
                href={product.seller.url}
                target="_blank"
                rel="noreferrer"
                className="seller-link"
              >
                View at {product.seller.name} ↗
              </a>
            )}


            <div className="product-detail-meta">

              <div>
                <span>STYLE</span>
                <p>
                  {product.styles.join(', ')}
                </p>
              </div>

              <div>
                <span>COLORS</span>
                <p>
                  {product.colors.join(', ')}
                </p>
              </div>

              <div>
                <span>MATERIAL</span>
                <p>
                  {product.materials.join(', ')}
                </p>
              </div>

              <div>
                <span>FOR</span>
                <p>
                  {product.spaces.join(', ')}
                </p>
              </div>

            </div>

          </div>

        </section>


        <section className="similar-products-section">

            <div className="similar-products-header">

            <div className="similar-products-heading">

                {/* <span className="section-eyebrow">
                INSPIRED BY THIS PIECE
                </span> */}

                <h2>Inspired by this piece</h2>

                <p>
                Selected by shared colors,
                styles, materials, and product type.
                </p>

            </div>


            <button
                className="more-like-this-button"
                onClick={handleMoreLikeThis}
                disabled={isLoadingSimilar}
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

          ) : (

            <div className="similar-products-grid">

              {similarProducts.map(
                (similarProduct) => (

                  <Link
                    key={similarProduct.id}
                    to={`/product/${similarProduct.id}`}
                    className="similar-product-card"
                  >

                    <img
                      src={similarProduct.image}
                      alt={similarProduct.name}
                    />

                    <span>
                      {similarProduct.category}
                    </span>

                    <h3>
                      {similarProduct.name}
                    </h3>

                    <p>
                      ${similarProduct.price}
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