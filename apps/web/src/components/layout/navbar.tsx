'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Search, Bell, Upload, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b px-4 flex items-center gap-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-primary flex-shrink-0">
        <Shield className="h-6 w-6" />
        <span className="hidden sm:inline">SafeStream</span>
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos, channels..."
            className="pl-10"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 flex-shrink-0">
        {user ? (
          <>
            {(user.role === 'creator' || user.role === 'super_admin') && (
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-1 border rounded-md px-3 h-9 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Upload className="h-4 w-4" />Upload
              </Link>
            )}
            <Link href="/notifications" className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent transition-colors">
              <Bell className="h-5 w-5" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.displayName?.[0] ?? user.username[0]}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />Settings
                </DropdownMenuItem>
                {user.role === 'super_admin' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { void logout(); router.push('/auth/login'); }}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className={cn('inline-flex items-center px-3 h-9 rounded-md text-sm font-medium hover:bg-accent transition-colors')}>
              Sign in
            </Link>
            <Link href="/auth/register" className="inline-flex items-center px-3 h-9 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
