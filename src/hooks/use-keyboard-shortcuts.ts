import * as React from "react"
import { useNavigate } from "react-router-dom"

export function useKeyboardShortcuts(portfolioId?: string) {
  const navigate = useNavigate()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Cmd/Ctrl + K for search (future feature)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        // Future: Open search dialog
        return
      }

      // Navigation shortcuts (only when portfolio is selected)
      if (!portfolioId) return

      // Alt/Option + number keys for navigation
      if (event.altKey && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        switch (event.key) {
          case "1":
            event.preventDefault()
            navigate(`/portfolios/${portfolioId}`)
            break
          case "2":
            event.preventDefault()
            navigate(`/portfolios/${portfolioId}/trades/new`)
            break
          case "3":
            event.preventDefault()
            navigate(`/portfolios/${portfolioId}/transactions`)
            break
          case "4":
            event.preventDefault()
            navigate(`/portfolios/${portfolioId}/analysis`)
            break
        }
      }

      // T for new trade (when not in input)
      if (event.key === "t" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        navigate(`/portfolios/${portfolioId}/trades/new`)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate, portfolioId])
}
