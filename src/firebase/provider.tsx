'use client';

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  firestore: null,
  storage: null,
});

export function FirebaseProvider({
  children,
  app,
  auth,
  firestore,
  storage,
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}) {
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};

export const useFirebaseApp = () => {
    const { app } = useFirebase();
    if (!app) {
        throw new Error('Firebase app not available. Make sure you are wrapping your component in FirebaseProvider.');
    }
    return app;
}

export const useAuth = () => {
    const { auth } = useFirebase();
    if (!auth) {
        throw new Error('Firebase Auth not available. Make sure you are wrapping your component in FirebaseProvider.');
    }
    return auth;
}

export const useFirestore = () => {
    const { firestore } = useFirebase();
    if (!firestore) {
        throw new Error('Firebase Firestore not available. Make sure you are wrapping your component in FirebaseProvider.');
    }
    return firestore;
}

export const useStorage = () => {
    const { storage } = useFirebase();
    if (!storage) {
        throw new Error('Firebase Storage not available. Make sure you are wrapping your component in FirebaseProvider.');
    }
    return storage;
}
