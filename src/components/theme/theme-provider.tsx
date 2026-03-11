import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from "next-themes"

const VALID_THEMES = new Set(["light", "dark", "system"])

function ThemePreferenceGuard() {
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    if (theme && !VALID_THEMES.has(theme)) {
      setTheme("system")
    }
  }, [setTheme, theme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemePreferenceGuard />
      {children}
    </NextThemesProvider>
  )
}
