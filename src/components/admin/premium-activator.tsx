
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { logActivity } from '@/lib/activity-logger';

export function PremiumActivator() {
  const [accessCode, setAccessCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();

  const handleActivate = async () => {
    if (!adminProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in as an admin.' });
      return;
    }
    if (accessCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Access codes must be 6 digits long.',
      });
      return;
    }
    setIsActivating(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('accessCode', '==', accessCode), where('accountStatus', '==', 'demo'));
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Activation Failed',
          description: 'No demo user found with this access code.',
        });
        setIsActivating(false);
        return;
      }
      
      const batch = writeBatch(firestore);
      let activatedUserName = '';
      let activatedUserId = '';

      querySnapshot.forEach(doc => {
        activatedUserName = doc.data().displayName;
        activatedUserId = doc.id;
        const userRef = doc.ref;
        batch.update(userRef, {
          isPremium: true,
          accountStatus: 'active',
        });
      });

      await batch.commit();
      
      toast({
        title: 'Activation Successful!',
        description: `${activatedUserName} has been granted premium access.`,
      });

      logActivity({
        firestore,
        actorId: adminProfile.uid,
        actorName: adminProfile.displayName,
        action: 'PREMIUM_ACTIVATED_WITH_CODE',
        targetId: activatedUserId,
        targetName: activatedUserName,
      });

      setAccessCode('');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error during activation',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Activate Premium Membership</CardTitle>
        <CardDescription>
          Enter a user's 6-digit access code to grant them full premium access to the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder="Access Code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={6}
            disabled={isActivating}
            className="font-mono tracking-widest text-lg h-12"
          />
          <Button onClick={handleActivate} disabled={isActivating || accessCode.length !== 6}>
            {isActivating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Activate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
