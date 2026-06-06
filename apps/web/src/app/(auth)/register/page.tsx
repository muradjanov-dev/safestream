'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Check } from 'lucide-react';
import { GoogleButton } from '@/components/auth/google-button';

const perks = ['Like, save & subscribe', 'Upload your own videos', 'Personalized recommendations', 'Family-safe by default'];

export default function RegisterPage() {
  const router = useRouter();
  const { signInWithGoogle, signInDemo, isLoading, error } = useAuthStore();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      router.push('/');
    } catch {
      /* error shown below */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-8 w-8" />
              <span className="text-2xl font-bold">SafeStream</span>
            </div>
          </div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Join the safe video platform for everyone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1.5">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 shrink-0" /> {p}
              </li>
            ))}
          </ul>

          <GoogleButton onClick={handleGoogle} loading={isLoading} />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" /> or <div className="h-px bg-border flex-1" />
          </div>

          <Button variant="outline" className="w-full" onClick={() => { signInDemo(); router.push('/'); }}>
            Continue as guest
          </Button>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
