
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyInfo } from '@/lib/storage';
import type { CompanyInfo } from '@/types';
import { getBibleVerse, BibleVerseOutput } from '@/ai/flows/bible-verse-flow';


export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);
  const [verse, setVerse] = React.useState<BibleVerseOutput | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = React.useState(true);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
    };

    const fetchVerse = async () => {
      setIsLoadingVerse(true);
      try {
        const result = await getBibleVerse();
        setVerse(result);
      } catch (error) {
        console.error("Failed to fetch bible verse", error);
        setVerse(null); // Clear verse on error
      } finally {
        setIsLoadingVerse(false);
      }
    };

    fetchCompanyInfo();
    fetchVerse();

    const handleStorageChange = () => fetchCompanyInfo();
    
    window.addEventListener('companyInfoChanged', handleStorageChange);
    return () => {
        window.removeEventListener('companyInfoChanged', handleStorageChange);
    };
  }, []);

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
         {isLoadingVerse ? (
            <p className="text-sm text-muted-foreground animate-pulse">Carregando versículo...</p>
        ) : verse && (
            <div className="text-sm text-muted-foreground italic hidden md:block">
              <p>"{verse.verseText}"</p>
              <p className="text-right font-semibold text-xs mt-1">- {verse.verseReference}</p>
            </div>
        )}
      </div>
    </div>
  );
}
