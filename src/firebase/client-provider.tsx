'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider {...firebaseServices}>
      {children}
    </FirebaseProvider>
  );
}
