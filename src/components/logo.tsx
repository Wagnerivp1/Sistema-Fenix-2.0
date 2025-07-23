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
  { verseText: "O Senhor é a minha luz e a minha salvação; a quem temerei?", verseReference: "Salmos 27:1" },
  { verseText: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal.", verseReference: "Jeremias 29:11" },
  { verseText: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", verseReference: "Provérbios 3:5" },
  { verseText: "Eu vim para que tenham vida, e a tenham com abundância.", verseReference: "João 10:10" },
  { verseText: "Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias.", verseReference: "Isaías 40:31" },
  { verseText: "Porque o Senhor, teu Deus, é contigo por onde quer que andares.", verseReference: "Josué 1:9" },
  { verseText: "O choro pode durar uma noite, mas a alegria vem pela manhã.", verseReference: "Salmos 30:5" },
  { verseText: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.", verseReference: "1 Tessalonicenses 5:18" },
  { verseText: "Se Deus é por nós, quem será contra nós?", verseReference: "Romanos 8:31" },
  { verseText: "O Senhor te abençoe e te guarde.", verseReference: "Números 6:24" },
  { verseText: "Aquietai-vos e sabei que eu sou Deus.", verseReference: "Salmos 46:10" },
  { verseText: "Eu sou o caminho, e a verdade, e a vida.", verseReference: "João 14:6" },
  { verseText: "No mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", verseReference: "João 16:33" },
  { verseText: "A fé é o firme fundamento das coisas que se esperam e a prova das que não se veem.", verseReference: "Hebreus 11:1" }
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
      <div className="flex flex-col">
        {!iconOnly && companyInfo?.name && (
            <span className="text-3xl font-bold tracking-tight whitespace-nowrap">{companyInfo.name}</span>
        )}
         {verse && !onLoginPage && (
            <div className="text-xs text-muted-foreground italic hidden md:block">
              <p>"{verse.verseText}" - {verse.verseReference}</p>
            </div>
        )}
      </div>
    </div>
  );
}
