
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyInfo } from '@/lib/storage';
import type { CompanyInfo } from '@/types';

interface BibleVerse {
  verseText: string;
  verseReference: string;
}

const localVerses: BibleVerse[] = [
  { verseText: "Tudo posso naquele que me fortalece.", verseReference: "Filipenses 4:13" },
  { verseText: "O Senhor é o meu pastor; nada me faltará.", verseReference: "Salmos 23:1" },
  { verseText: "Porque para Deus nada é impossível.", verseReference: "Lucas 1:37" },
  { verseText: "O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.", verseReference: "Provérbios 16:9" },
  { verseText: "Deleitem-se no Senhor, e ele atenderá aos desejos do seu coração.", verseReference: "Salmos 37:4" },
  { verseText: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", verseReference: "1 Pedro 5:7" },
];

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    onLoginPage?: boolean;
}

export function Logo({ className, iconOnly = false, onLoginPage = false }: LogoProps) {
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);
  const [verse, setVerse] = React.useState<BibleVerse | null>(null);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
    };

    fetchCompanyInfo();

    const handleStorageChange = () => fetchCompanyInfo();
    
    setVerse(localVerses[Math.floor(Math.random() * localVerses.length)]);
    
    window.addEventListener('companyInfoChanged', handleStorageChange);
    return () => {
        window.removeEventListener('companyInfoChanged', handleStorageChange);
    };
  }, []);

  if (onLoginPage) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-4 text-primary', className)}>
            {companyInfo?.logoUrl ? (
                <Image src={companyInfo.logoUrl} alt="Logo" width={64} height={64} className="h-16 w-16 object-contain" />
            ) : (
                <Wrench className="h-16 w-16" />
            )}
             {companyInfo?.name && (
                <span className="text-3xl font-bold tracking-tight">{companyInfo.name}</span>
            )}
        </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 text-primary', className)}>
      {companyInfo?.logoUrl ? (
        <Image src={companyInfo.logoUrl} alt="Logo" width={48} height={48} className="h-12 w-12 object-contain" />
      ) : (
        <Wrench className="h-12 w-12" />
      )}
      <div className="flex items-baseline gap-4">
        {!iconOnly && companyInfo?.name && (
            <span className="text-3xl font-bold tracking-tight">{companyInfo.name}</span>
        )}
         {verse && !onLoginPage && (
            <div className="text-sm text-muted-foreground italic hidden md:block">
              <p>"{verse.verseText}"</p>
              <p className="text-right font-semibold text-xs mt-1">- {verse.verseReference}</p>
            </div>
        )}
      </div>
    </div>
  );
}
