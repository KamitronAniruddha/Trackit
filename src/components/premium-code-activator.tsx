'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

export function PremiumCodeActivator() {
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const firestore = useFirestore();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!profile) {
      toast({ variant: 'destructive', title: 'You are not logged in.' });
      return;
    }
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      toast({ variant: 'destructive', title: 'Please enter a code.' });
      return;
    }

    setIsActivating(true);

    try {
        const codeRef = doc(firestore, 'premiumCodes', trimmedCode);
        const userRef = doc(firestore, 'users', profile.uid);

        // Run a transaction to make it atomic
        await runTransaction(firestore, async (transaction) => {
            const codeDoc = await transaction.get(codeRef);
            if (!codeDoc.exists()) {
                throw new Error('This code is invalid or has already been used.');
            }
            
            transaction.delete(codeRef);
            transaction.update(userRef, { isPremium: true, accountStatus: 'active' });
        });
        
        // Toast is handled by the context detecting the premium status change
        setCode('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-4">
        <p className="text-sm text-center text-muted-foreground">If you have received an activation code from an admin, enter it below.</p>
        <div className="flex w-full items-center space-x-2">
            <Input
                type="text"
                placeholder="Enter code..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isActivating}
                className="font-mono tracking-widest text-lg h-12"
            />
            <Button onClick={handleActivate} disabled={isActivating || !code.trim()}>
                {isActivating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Sparkles className="mr-2 h-4 w-4" />
                )}
                Activate
            </Button>
        </div>
    </div>
  );
}
