import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const PreferenceContext = createContext()

const defaultPreferences = {
  styles: [],
  characteristics: [],
  colors: [],
  materials: [],
  space: null,
  categories: [],
  subcategories: [],
  budget: null,
  savedProducts: [],
  likedProducts: [],
  dislikedProducts: [],
}

export function PreferenceProvider({ children }) {
    const [preferences, setPreferences] = useState(() => {
    const savedPreferences =
        localStorage.getItem('houspoPreferences')

    if (savedPreferences) {
        const parsedPreferences =
        JSON.parse(savedPreferences)

        return {
        ...defaultPreferences,
        ...parsedPreferences,
        }
    }

    return defaultPreferences
    })

    useEffect(() => {
    localStorage.setItem(
        'houspoPreferences',
        JSON.stringify(preferences)
    )
    }, [preferences])

    const toggleSavedProduct = (productId) => {
    setPreferences((current) => ({
        ...current,

        savedProducts:
        current.savedProducts.includes(productId)
            ? current.savedProducts.filter(
                (id) => id !== productId
            )
            : [...current.savedProducts, productId],
     }))
    }


    const toggleLikedProduct = (productId) => {
    setPreferences((current) => ({
        ...current,

        likedProducts:
        current.likedProducts.includes(productId)
            ? current.likedProducts.filter(
                (id) => id !== productId
            )
            : [...current.likedProducts, productId],

        dislikedProducts:
        current.dislikedProducts.filter(
            (id) => id !== productId
        ),
    }))
    }


    const toggleDislikedProduct = (productId) => {
    setPreferences((current) => ({
        ...current,

        dislikedProducts:
        current.dislikedProducts.includes(productId)
            ? current.dislikedProducts.filter(
                (id) => id !== productId
            )
            : [...current.dislikedProducts, productId],

        likedProducts:
        current.likedProducts.filter(
            (id) => id !== productId
        ),
    }))
    }


  const toggleStyle = (style) => {
    setPreferences((current) => {
      const exists = current.styles.includes(style)

      return {
        ...current,

        styles: exists
          ? current.styles.filter(
              (item) => item !== style
            )
          : [...current.styles, style],
      }
    })
  }


  const toggleCharacteristic = (characteristic) => {
    setPreferences((current) => {
      const exists =
        current.characteristics.includes(characteristic)

      return {
        ...current,

        characteristics: exists
          ? current.characteristics.filter(
              (item) => item !== characteristic
            )
          : [
              ...current.characteristics,
              characteristic,
            ],
      }
    })
  }

    const selectBudget = (budget) => {
        setPreferences((current) => ({
            ...current,
            budget,
        }))
    }
    
  const selectSpace = (space) => {
    setPreferences((current) => ({
      ...current,
      space,
    }))
  }


  const toggleCategory = (category) => {
    setPreferences((current) => {
      const exists =
        current.categories.includes(category)

      return {
        ...current,

        categories: exists
          ? current.categories.filter(
              (item) => item !== category
            )
          : [...current.categories, category],
      }
    })
  }


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
          : [...current.colors, color],
      }
    })
  }


  const toggleMaterial = (material) => {
    setPreferences((current) => {
      const exists =
        current.materials.includes(material)

      return {
        ...current,

        materials: exists
          ? current.materials.filter(
              (item) => item !== material
            )
          : [...current.materials, material],
      }
    })
  }


    const resetPreferences = () => {
    setPreferences((current) => ({
        ...defaultPreferences,
        savedProducts: current.savedProducts,
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
  return useContext(PreferenceContext)
}