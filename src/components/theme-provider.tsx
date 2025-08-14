
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const themes = ["dark", "light", "slate", "stone", "rose", "green", "orange"];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      themes={themes}
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}
