'use client';

import { cn } from '@/lib/utils';
import { Check, X, MinusCircle, AlertCircle } from 'lucide-react';

type Status = 'detected' | 'not_detected' | 'unable_to_verify';

interface StatusBadgeProps {
  status: Status;
  confidence?: 'high' | 'medium' | 'low';
  className?: string;
  compact?: boolean;
}

export function StatusBadge({ status, confidence, className, compact }: StatusBadgeProps) {
  const config = {
    detected: {
      label: compact ? 'Detected' : 'Detected',
      icon: Check,
      classes: 'bg-success/10 text-success border-success/30',
    },
    not_detected: {
      label: compact ? 'Not detected' : 'Not detected',
      icon: X,
      classes: 'bg-destructive/10 text-destructive border-destructive/30',
    },
    unable_to_verify: {
      label: compact ? 'Unable to verify' : 'Unable to verify',
      icon: AlertCircle,
      classes: 'bg-warning/10 text-warning border-warning/30',
    },
  } as const;

  const c = config[status];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        c.classes,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {c.label}
      {!compact && confidence && confidence !== 'high' && (
        <span className="opacity-60">· {confidence} confidence</span>
      )}
    </span>
  );
}
