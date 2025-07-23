
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
    
    window.addEventListener('companyInfoChanged', handleStorageChange);
    return () => {
        window.removeEventListener('companyInfoChanged', handleStorageChange);
    };
  }, []);

  return (
    <div className={cn('flex items-center gap-3 text-primary', className)}>
      {companyInfo?.logoUrl ? (
        <Image src={companyInfo.logoUrl} alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
      ) : (
        <Wrench className="h-8 w-8" />
      )}
      {!iconOnly && companyInfo?.name && (
        <div>
            <span className="text-xl font-bold tracking-tight">{companyInfo.name}</span>
        </div>
      )}
    </div>
  );
}
