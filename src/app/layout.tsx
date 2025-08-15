
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { useCurrentUser } from '@/hooks/use-current-user';

// Componente para aplicar o tema do usuário logado
function UserThemeApplier({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const theme = user?.theme || 'dark';

  if (isLoading) {
    // Evita piscar a tela com o tema padrão antes de carregar o do usuário
    return <div className="h-screen w-full bg-background" />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem={false}
      themes={["light", "dark", "slate", "stone", "rose", "green", "orange"]}
    >
      {children}
    </ThemeProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body>
        <UserThemeApplier>
          {children}
          <Toaster />
        </UserThemeApplier>
      </body>
    </html>
  );
}
