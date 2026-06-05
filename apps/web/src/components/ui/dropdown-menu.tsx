'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const Ctx = React.createContext<DropdownMenuContextValue>({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen, open } = React.useContext(Ctx);
  const child = asChild && React.isValidElement(children) ? children : <button>{children}</button>;
  return React.cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen(!open);
    },
  });
}

export function DropdownMenuContent({
  children,
  className,
  align = 'start',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
}) {
  const { open, setOpen } = React.useContext(Ctx);
  React.useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { setOpen } = React.useContext(Ctx);
  return (
    <button
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      onClick={() => { onClick?.(); setOpen(false); }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />;
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>{children}</div>;
}
