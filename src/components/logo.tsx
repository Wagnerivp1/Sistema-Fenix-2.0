
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompanyInfo } from '@/lib/storage';
import type { CompanyInfo } from '@/types';

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);

  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
        const info = await getCompanyInfo();
        setCompanyInfo(info);
    };

    fetchCompanyInfo();

    const handleStorageChange = () => fetchCompanyInfo();
    
    // Custom event listener since we are not using localStorage anymore for companyInfo
    window.addEventListener('companyInfoChanged', handleStorageChange);
    return () => {
        window.removeEventListener('companyInfoChanged', handleStorageChange);
    };
  }, []);

  const logoUrl = companyInfo?.logoUrl;
  const companyName = companyInfo?.name || 'Assistec Now';

  return (
    <div className={cn('flex items-center gap-3 text-primary', className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={`${companyName} Logo`} width={40} height={40} className="h-10 w-10 object-contain" />
      ) : (
        <Wrench className="h-10 w-10" />
      )}
      {!iconOnly && <span className="text-3xl font-bold">{companyName}</span>}
    </div>
  );
}
