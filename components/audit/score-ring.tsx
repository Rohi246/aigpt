'use client';

import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  variant?: 'adoption' | 'opportunity';
  className?: string;
}

export function ScoreRing({
  score,
  max = 100,
  size = 140,
  label,
  sublabel,
  variant = 'adoption',
  className,
}: ScoreRingProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / max));
  const offset = circumference * (1 - pct);
  const color = variant === 'opportunity' ? '#0e7490' : '#1a2238';
  const trackColor = variant === 'opportunity' ? '#0e749033' : '#1a223822';

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-primary tabular-nums">
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
      </div>
      {label && (
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
