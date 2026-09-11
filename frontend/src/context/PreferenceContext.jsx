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
}

export function PreferenceProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const savedPreferences =
      sessionStorage.getItem('houspoPreferences')

    if (savedPreferences) {
      return JSON.parse(savedPreferences)
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