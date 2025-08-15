
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { defaultTheme } = props;
  const [key, setKey] = React.useState(0);

  // Força a remontagem do provider quando o tema padrão (do usuário) muda
  React.useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [defaultTheme]);


  return (
    <NextThemesProvider key={key} {...props}>
      {children}
    </NextThemesProvider>
  )
}
