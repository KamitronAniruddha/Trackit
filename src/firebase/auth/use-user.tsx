'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { signOut as firebaseSignOut } from 'firebase/auth';

interface UseUserOptions {
  redirectTo?: string;
  redirectOn?: 'login' | 'logout';
}

export const useUser = (options: UseUserOptions = {}) => {
  const auth = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (options.redirectTo && options.redirectOn) {
        if (options.redirectOn === 'logout' && !currentUser) {
          router.push(options.redirectTo);
        }
        if (options.redirectOn === 'login' && currentUser) {
          router.push(options.redirectTo);
        }
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, router]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    // The onAuthStateChanged listener will handle the user state update and redirection if configured.
  };

  return { user, loading, signOut };
};
