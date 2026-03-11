import * as React from "react"

interface UserPreferences {
  defaultMarketTab: string | null
  defaultAnalysisTab: string | null
}

const PREFERENCES_KEY = "portfolio-app-preferences"

function getStoredPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Failed to load preferences:", error)
  }
  return {
    defaultMarketTab: null,
    defaultAnalysisTab: null,
  }
}

function savePreferences(preferences: UserPreferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.error("Failed to save preferences:", error)
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(getStoredPreferences)

  const updatePreferences = React.useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((current) => {
      const updated = { ...current, ...updates }
      savePreferences(updated)
      return updated
    })
  }, [])

  return {
    preferences,
    updatePreferences,
  }
}
