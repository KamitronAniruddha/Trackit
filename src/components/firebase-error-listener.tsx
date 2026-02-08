'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
        // This will throw an unhandled exception, which Next.js will catch and display in the development overlay.
        // This is intentional for providing maximum debugging context during development.
        throw error;
    };

    errorEmitter.on('permission-error', handleError);

    // It's important to not have a cleanup function here, as the listener should be global.
    // If we did, navigating between pages would remove the listener.
  }, []);

  return null;
}
