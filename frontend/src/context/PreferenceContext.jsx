import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const PreferenceContext =
  createContext()

const defaultPreferences = {
  styles: [],
  characteristics: [],
  colors: [],
  materials: [],
  space: null,
  categories: [],
  subcategories: [],
  budget: null,

  // IDs of products the user saved.
  savedProducts: [],

  // Full product data for saved items.
  savedProductDetails: {},

  likedProducts: [],
  dislikedProducts: [],
}

export function PreferenceProvider({
  children,
}) {
  const [
    preferences,
    setPreferences,
  ] = useState(() => {
    const savedPreferences =
      localStorage.getItem(
        'houspoPreferences'
      )

    if (savedPreferences) {
      try {
        const parsedPreferences =
          JSON.parse(
            savedPreferences
          )

        return {
          ...defaultPreferences,
          ...parsedPreferences,

          // Support users who already had
          // preferences saved before this field.
          savedProductDetails:
            parsedPreferences
              .savedProductDetails ||
            {},
        }
      } catch {
        return defaultPreferences
      }
    }

    return defaultPreferences
  })

  // Keep preferences saved across
  // browser sessions.
  useEffect(() => {
    localStorage.setItem(
      'houspoPreferences',
      JSON.stringify(preferences)
    )
  }, [preferences])

  // Save or remove a product.
  //
  // productDetails is optional so older
  // calls using only an ID still work.
  const toggleSavedProduct = (
    productId,
    productDetails = null
  ) => {
    setPreferences((current) => {
      const isSaved =
        current.savedProducts.some(
          (id) =>
            String(id) ===
            String(productId)
        )

      // Remove saved product + its details.
      if (isSaved) {
        const updatedDetails = {
          ...current.savedProductDetails,
        }

        delete updatedDetails[
          String(productId)
        ]

        return {
          ...current,

          savedProducts:
            current.savedProducts.filter(
              (id) =>
                String(id) !==
                String(productId)
            ),

          savedProductDetails:
            updatedDetails,
        }
      }

      // Add product ID and store its
      // complete data when available.
      return {
        ...current,

        savedProducts: [
          ...current.savedProducts,
          productId,
        ],

        savedProductDetails:
          productDetails
            ? {
                ...current.savedProductDetails,

                [String(productId)]:
                  productDetails,
              }
            : current.savedProductDetails,
      }
    })
  }

  // Like a product and remove it
  // from dislikes if necessary.
  const toggleLikedProduct = (
    productId
  ) => {
    setPreferences((current) => ({
      ...current,

      likedProducts:
        current.likedProducts.includes(
          productId
        )
          ? current.likedProducts.filter(
              (id) => id !== productId
            )
          : [
              ...current.likedProducts,
              productId,
            ],

      dislikedProducts:
        current.dislikedProducts.filter(
          (id) => id !== productId
        ),
    }))
  }

  // Dislike a product and remove it
  // from likes if necessary.
  const toggleDislikedProduct = (
    productId
  ) => {
    setPreferences((current) => ({
      ...current,

      dislikedProducts:
        current.dislikedProducts.includes(
          productId
        )
          ? current.dislikedProducts.filter(
              (id) => id !== productId
            )
          : [
              ...current.dislikedProducts,
              productId,
            ],

      likedProducts:
        current.likedProducts.filter(
          (id) => id !== productId
        ),
    }))
  }

  // Add or remove a selected style.
  const toggleStyle = (style) => {
    setPreferences((current) => {
      const exists =
        current.styles.includes(style)

      return {
        ...current,

        styles: exists
          ? current.styles.filter(
              (item) => item !== style
            )
          : [
              ...current.styles,
              style,
            ],
      }
    })
  }

  // Add or remove a characteristic.
  const toggleCharacteristic = (
    characteristic
  ) => {
    setPreferences((current) => {
      const exists =
        current.characteristics.includes(
          characteristic
        )

      return {
        ...current,

        characteristics: exists
          ? current.characteristics.filter(
              (item) =>
                item !==
                characteristic
            )
          : [
              ...current.characteristics,
              characteristic,
            ],
      }
    })
  }

  // Store the selected budget.
  const selectBudget = (budget) => {
    setPreferences((current) => ({
      ...current,
      budget,
    }))
  }

  // Store the selected room.
  const selectSpace = (space) => {
    setPreferences((current) => ({
      ...current,
      space,
    }))
  }

  // Add or remove a category.
  const toggleCategory = (
    category
  ) => {
    setPreferences((current) => {
      const exists =
        current.categories.includes(
          category
        )

      return {
        ...current,

        categories: exists
          ? current.categories.filter(
              (item) =>
                item !== category
            )
          : [
              ...current.categories,
              category,
            ],
      }
    })
  }

  // Add or remove a color.
  const toggleColor = (color) => {
    setPreferences((current) => {
      const exists =
        current.colors.includes(color)

      return {
        ...current,

        colors: exists
          ? current.colors.filter(
              (item) => item !== color
            )
          : [
              ...current.colors,
              color,
            ],
      }
    })
  }

  // Add or remove a material.
  const toggleMaterial = (
    material
  ) => {
    setPreferences((current) => {
      const exists =
        current.materials.includes(
          material
        )

      return {
        ...current,

        materials: exists
          ? current.materials.filter(
              (item) =>
                item !== material
            )
          : [
              ...current.materials,
              material,
            ],
      }
    })
  }

  // Restart the quiz but keep the
  // user's saved collection.
  const resetPreferences = () => {
    setPreferences((current) => ({
      ...defaultPreferences,

      savedProducts:
        current.savedProducts,

      savedProductDetails:
        current.savedProductDetails,
    }))
  }

  return (
    <PreferenceContext.Provider
      value={{
        preferences,
        toggleStyle,
        toggleCharacteristic,
        selectSpace,
        toggleCategory,
        toggleColor,
        toggleMaterial,
        selectBudget,
        toggleSavedProduct,
        toggleLikedProduct,
        toggleDislikedProduct,
        resetPreferences,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  )
}

export function usePreferences() {
  return useContext(
    PreferenceContext
  )
}