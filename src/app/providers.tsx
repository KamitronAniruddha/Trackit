
'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserProfileProvider, useUserProfile } from '@/contexts/user-profile-context';
import { useEffect } from 'react';
import { AppGuard } from '@/components/app-guard';

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();

  useEffect(() => {
    const root = document.documentElement;

    // Dark/Light mode logic
    if (profile?.darkMode === false) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }

    // Theme logic
    const themeClasses = ['jee-theme', 'rose-theme', 'violet-theme', 'green-theme', 'orange-theme', 'blue-theme', 'purple-theme', 'teal-theme', 'crimson-theme'];
    root.classList.remove(...themeClasses);

    const theme = profile?.theme || 'default';

    if (theme === 'default') {
      if (profile?.exam === 'JEE') {
        root.classList.add('jee-theme');
      }
    } else {
      root.classList.add(`${theme}-theme`);
    }
  }, [profile]);

  return <>{children}</>;
}


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
        <UserProfileProvider>
          <ThemeApplicator>
            <AppGuard>
              {children}
            </AppGuard>
          </ThemeApplicator>
          <Toaster />
        </UserProfileProvider>
    </FirebaseClientProvider>
  );
}
