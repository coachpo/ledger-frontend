import * as React from "react"
import {
  Monitor,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeOptions = [
  {
    label: "Light",
    value: "light",
    icon: Sun,
  },
  {
    label: "Dark",
    value: "dark",
    icon: Moon,
  },
  {
    label: "System",
    value: "system",
    icon: Monitor,
  },
] as const
type ThemeOptionValue = (typeof themeOptions)[number]["value"]

function normalizeTheme(theme: string | undefined): ThemeOptionValue {
  if (theme === "light" || theme === "dark" || theme === "system") {
    return theme
  }

  return "system"
}

function ThemeIcon({ theme }: { theme: ThemeOptionValue }) {
  if (theme === "light") {
    return <Sun className="size-4" />
  }

  if (theme === "dark") {
    return <Moon className="size-4" />
  }

  return <Monitor className="size-4" />
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = mounted ? normalizeTheme(theme) : "system"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full" size="sm" variant="outline">
          <ThemeIcon theme={activeTheme} />
          <span className="hidden sm:inline">Theme</span>
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 min-w-44">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup onValueChange={setTheme} value={activeTheme}>
          {themeOptions.map((option) => {
            const Icon = option.icon

            return (
              <DropdownMenuRadioItem className="gap-2" key={option.value} value={option.value}>
                <Icon className="size-4" />
                {option.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
