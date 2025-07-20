
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
    const fetchCompanyInfo = () => {
        setCompanyInfo(getCompanyInfo());
    };

    fetchCompanyInfo();

    // Listen for storage changes to update the logo/name in real-time
    window.addEventListener('storage', fetchCompanyInfo);
    return () => {
        window.removeEventListener('storage', fetchCompanyInfo);
    };
  }, []);

  const logoUrl = companyInfo?.logoUrl;
  const companyName = companyInfo?.name || 'JL Informática';

  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={`${companyName} Logo`} width={24} height={24} className="h-6 w-6 object-contain" />
      ) : (
        <Wrench className="h-6 w-6" />
      )}
      {!iconOnly && <span className="text-xl font-bold">{companyName}</span>}
    </div>
  );
}
