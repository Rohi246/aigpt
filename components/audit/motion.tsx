'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  initial?: any;
  animate?: any;
  exit?: any;
  key?: string | number;
};

/**
 * Lightweight motion wrapper. We avoid adding framer-motion as a dependency.
 * Uses CSS animations for fade transitions via AnimatePresence-like keyed swapping.
 */
export function motion(props: MotionDivProps) {
  const { initial, animate, exit, className, ...rest } = props;
  return <div className={cn('animate-fade-in-up', className)} {...rest} />;
}

export const MotionDiv = motion;

export function AnimatePresence({ children, mode }: { children: ReactNode; mode?: 'wait' }) {
  return <>{children}</>;
}
