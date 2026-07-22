'use client';

import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Activity className="h-5 w-5 text-accent" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-base font-bold tracking-tight text-primary">
            AI Adoption Audit
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Business Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
