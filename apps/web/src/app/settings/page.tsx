'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('safestream-theme', next ? 'dark' : 'light');
  };

  const clearData = () => {
    localStorage.removeItem('safestream-interactions');
    localStorage.removeItem('safestream-uploads');
    location.reload();
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{user.displayName ?? user.username}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="capitalize">{user.role}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {dark ? 'Switch to light mode' : 'Switch to dark mode'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Data & privacy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={clearData} className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Clear history, likes & uploads
            </Button>
            <Button variant="outline" onClick={() => { void logout(); router.push('/login'); }} className="gap-2 w-full sm:w-auto">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
