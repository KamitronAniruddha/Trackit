
'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useFirestore } from '@/firebase/provider';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { UserProfile } from './user-profile-context';

interface SpectateContextType {
  spectatingUser: UserProfile | null;
  isSpectating: boolean;
  startSpectating: (targetUser: UserProfile, adminUser: UserProfile) => Promise<void>;
  stopSpectating: () => Promise<void>;
}

const SpectateContext = createContext<SpectateContextType | undefined>(undefined);

export function SpectateProvider({ children }: { children: React.ReactNode }) {
  const [spectatingUser, setSpectatingUser] = useState<UserProfile | null>(null);
  const [spectateLogId, setSpectateLogId] = useState<string | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('spectatingUser');
      const storedLogId = sessionStorage.getItem('spectateLogId');
      if (storedUser) {
        setSpectatingUser(JSON.parse(storedUser));
      }
      if (storedLogId) {
        setSpectateLogId(storedLogId);
      }
    } catch (error) {
      console.error("Failed to parse spectate data from session storage", error);
      sessionStorage.removeItem('spectatingUser');
      sessionStorage.removeItem('spectateLogId');
    }
  }, []);

  const startSpectating = useCallback(async (targetUser: UserProfile, adminUser: UserProfile) => {
    if (!adminUser || !targetUser) return;

    try {
      // 1. Update user doc with admin ID
      const userDocRef = doc(firestore, 'users', targetUser.uid);
      await updateDoc(userDocRef, {
        'spectatePermission.spectatingAdminId': adminUser.uid,
      });

      // 2. Create a log entry
      const logRef = await addDoc(collection(firestore, 'spectateLogs'), {
        adminId: adminUser.uid,
        adminName: adminUser.displayName,
        userId: targetUser.uid,
        userName: targetUser.displayName,
        startedAt: serverTimestamp(),
      });
      
      // 3. Persist to state and session storage
      sessionStorage.setItem('spectatingUser', JSON.stringify(targetUser));
      sessionStorage.setItem('spectateLogId', logRef.id);
      setSpectatingUser(targetUser);
      setSpectateLogId(logRef.id);

      toast({
        title: `Spectating ${targetUser.displayName}`,
        description: "You are now viewing the user's dashboard in read-only mode.",
      });

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Failed to start spectating:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not start spectate session.' });
    }
  }, [firestore, router, toast]);

  const stopSpectating = useCallback(async () => {
    if (!spectatingUser) return;
    const spectatedUserUid = spectatingUser.uid;

    // Clear state immediately for responsiveness
    sessionStorage.removeItem('spectatingUser');
    sessionStorage.removeItem('spectateLogId');
    setSpectatingUser(null);
    setSpectateLogId(null);

    try {
      // 1. Update user doc to remove admin ID
      const userDocRef = doc(firestore, 'users', spectatedUserUid);
      await updateDoc(userDocRef, {
        'spectatePermission.spectatingAdminId': null,
      });

      // 2. Update log entry with end time
      if (spectateLogId) {
        const logDocRef = doc(firestore, 'spectateLogs', spectateLogId);
        await updateDoc(logDocRef, {
          endedAt: serverTimestamp(),
        });
      }
      
      toast({ title: 'Stopped Spectating', description: `You are now viewing your own dashboard.` });

    } catch (error: any) {
        console.error("Failed to stop spectating:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not stop spectate session cleanly.' });
    } finally {
        window.location.href = '/admin/users';
    }
  }, [spectatingUser, spectateLogId, firestore, toast]);

  const value = useMemo(() => ({
    spectatingUser,
    isSpectating: !!spectatingUser,
    startSpectating,
    stopSpectating,
  }), [spectatingUser, startSpectating, stopSpectating]);

  return (
    <SpectateContext.Provider value={value}>
      {children}
    </SpectateContext.Provider>
  );
}

export const useSpectate = () => {
  const context = useContext(SpectateContext);
  if (context === undefined) {
    throw new Error('useSpectate must be used within a SpectateProvider');
  }
  return context;
};
