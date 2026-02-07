'use client';

import { useState } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut } from 'lucide-react';
import { NeetProgressLogo } from './icons';

export function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { profile } = useUserProfile();
  const { signOut } = useUser();
  const { toast } = useToast();

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setPin(value);
      setError('');
    }
  };

  const handleVerify = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits.');
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      if (profile?.loginCode === pin) {
        toast({ title: 'Unlocked!', description: 'Welcome back.' });
        onUnlock();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
        toast({ variant: 'destructive', title: 'Incorrect PIN' });
      }
      setVerifying(false);
    }, 500);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4">
        <Card className="relative w-full max-w-md overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-card to-secondary/10" />
            <div className="relative">
                <CardHeader className="text-center items-center">
                     <Avatar className="h-24 w-24 border-4 border-primary/20 mb-4">
                        <AvatarImage src={profile?.photoURL ?? undefined} alt={profile?.displayName} />
                        <AvatarFallback className="text-3xl">
                            {profile?.displayName?.charAt(0).toUpperCase() ?? 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName}</CardTitle>
                    <CardDescription>Enter your 4-digit PIN to unlock.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <Input
                            type="password"
                            value={pin}
                            onChange={handlePinChange}
                            maxLength={4}
                            placeholder="&#x2022;&#x2022;&#x2022;&#x2022;"
                            className="text-center text-4xl font-mono tracking-[0.5em] h-20"
                            autoFocus
                        />
                        {error && <p className="text-sm text-center text-destructive">{error}</p>}
                        <Button type="submit" className="w-full text-lg" disabled={verifying || pin.length !== 4}>
                            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Unlock
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="pt-4">
                    <Button variant="link" className="text-muted-foreground w-full" onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Not you? Log out
                    </Button>
                </CardFooter>
            </div>
        </Card>
    </main>
  );
}
