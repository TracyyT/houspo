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
}

export function PreferenceProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const savedPreferences =
      sessionStorage.getItem('houspoPreferences')

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
    sessionStorage.setItem(
      'houspoPreferences',
      JSON.stringify(preferences)
    )
  }, [preferences])


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
    setPreferences(defaultPreferences)
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