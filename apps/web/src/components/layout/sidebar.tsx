'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, BookOpen, Music, Gamepad2, Tv, MessageCircle, History, BookMarked, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',              label: 'Home',          icon: Home },
  { href: '/trending',      label: 'Trending',      icon: TrendingUp },
  { href: '/shorts',        label: 'Shorts',        icon: Tv },
  { href: '/explore/education', label: 'Education', icon: BookOpen },
  { href: '/explore/music', label: 'Music',         icon: Music },
  { href: '/explore/gaming', label: 'Gaming',       icon: Gamepad2 },
];

const libraryItems = [
  { href: '/history',   label: 'History',       icon: History },
  { href: '/liked',     label: 'Liked Videos',  icon: ThumbsUp },
  { href: '/saved',     label: 'Saved',         icon: BookMarked },
  { href: '/messages',  label: 'Messages',      icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r overflow-y-auto hidden md:block">
      <nav className="p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <div className="pt-4 border-t mt-4">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Library</p>
          {libraryItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
