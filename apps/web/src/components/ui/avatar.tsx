import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [err, setErr] = React.useState(false);
  if (!src || err) return null;
  return (
    <img
      src={src}
      alt={alt ?? ''}
      onError={() => setErr(true)}
      className={cn('aspect-square h-full w-full object-cover', className)}
    />
  );
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium', className)}>
      {children}
    </div>
  );
}
