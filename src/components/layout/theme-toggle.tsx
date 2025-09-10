
'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Palette } from 'lucide-react';

const themeOptions = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'stone', label: 'Stone', icon: Palette },
  { value: 'orange', label: 'Orange', icon: Palette },
  { value: 'rose', label: 'Rose', icon: Palette },
  { value: 'green', label: 'Green', icon: Palette },
  { value: 'zinc', label: 'Zinc', icon: Palette },
];

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const currentTheme = themeOptions.find(t => t.value === theme) || themeOptions[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <CurrentIcon className="h-5 w-5" />
          <span>Tema: {currentTheme.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {themeOptions.map(option => (
          <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)}>
            <option.icon className="mr-2 h-4 w-4" />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
