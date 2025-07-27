
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const themes = ["dark", "light", "system", "default", "slate", "stone", "rose", "green", "orange"];
const themeClasses = ["theme-default", "theme-slate", "theme-stone", "theme-rose", "theme-green", "theme-orange"];

const ThemeWatcher = () => {
  const { theme } = useTheme();

  React.useEffect(() => {
    // Remove todas as classes de tema existentes do body
    document.body.classList.remove(...themeClasses);

    // Adiciona a classe do tema atual se não for light, dark ou system
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
       document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return null;
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      themes={themes}
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <ThemeWatcher />
      {children}
    </NextThemesProvider>
  )
}
