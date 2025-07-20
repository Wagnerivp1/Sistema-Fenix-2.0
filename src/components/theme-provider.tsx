"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const themes = ["light", "dark", "system", "default", "slate", "stone", "rose", "green", "orange"];
const themeClasses = ["theme-default", "theme-slate", "theme-stone", "theme-rose", "theme-green", "theme-orange"];

const ThemeWatcher = () => {
  const { theme } = useTheme();

  React.useEffect(() => {
    // Remove todas as classes de tema existentes
    document.documentElement.classList.remove(...themeClasses);

    // Adiciona a classe do tema atual se não for light, dark ou system
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
       document.documentElement.classList.add(`theme-${theme}`);
    } else if (theme === 'system') {
       // Se o tema do sistema for escuro, o tema padrão é 'default' no modo escuro
       const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
       if(systemTheme === 'dark') {
          document.documentElement.classList.add(`theme-default`);
       }
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
      enableSystem
    >
      <ThemeWatcher />
      {children}
    </NextThemesProvider>
  )
}
