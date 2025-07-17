import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <Wrench className="h-6 w-6" />
      {!iconOnly && <span className="text-xl font-bold">Assistec Now</span>}
    </div>
  );
}
