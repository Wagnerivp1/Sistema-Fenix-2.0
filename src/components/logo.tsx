
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
        <Image src={companyInfo.logoUrl} alt="Logo" width={48} height={48} className="h-12 w-12 object-contain" />
      ) : (
        <Wrench className="h-12 w-12" />
      )}
      {!iconOnly && companyInfo?.name && (
        <div>
            <span className="text-3xl font-bold tracking-tight">{companyInfo.name}</span>
        </div>
      )}
    </div>
  );
}
