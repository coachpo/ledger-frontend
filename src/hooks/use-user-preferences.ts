import * as React from "react"

interface UserPreferences {
  defaultMarketTab: string | null
  defaultAnalysisTab: string | null
}

const PREFERENCES_KEY = "portfolio-app-preferences"
const VALID_ANALYSIS_TABS = new Set(["pnl", "allocation", "historical"])

function getDefaultPreferences(): UserPreferences {
  return {
    defaultMarketTab: null,
    defaultAnalysisTab: null,
  }
}

function sanitizeAnalysisTab(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  return VALID_ANALYSIS_TABS.has(value) ? value : null
}

function sanitizeMarketTab(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function sanitizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") {
    return getDefaultPreferences()
  }

  const candidate = value as Partial<UserPreferences>

  return {
    defaultMarketTab: sanitizeMarketTab(candidate.defaultMarketTab),
    defaultAnalysisTab: sanitizeAnalysisTab(candidate.defaultAnalysisTab),
  }
}

function persistPreferences(preferences: UserPreferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
}

function getStoredPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const sanitized = sanitizePreferences(parsed)

      if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
        persistPreferences(sanitized)
      }

      return sanitized
    }
  } catch (error) {
    console.error("Failed to load preferences:", error)
  }

  return getDefaultPreferences()
}

function savePreferences(preferences: UserPreferences) {
  try {
    persistPreferences(sanitizePreferences(preferences))
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
