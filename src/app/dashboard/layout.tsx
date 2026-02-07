
'use client';
import { ProgressProvider } from '@/contexts/progress-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SyllabusProvider } from '@/contexts/syllabus-context';

function DashboardAuthWrapper({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && !profile.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [profile, loading, router]);
  
  if (loading || !profile?.onboardingCompleted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SyllabusProvider>
      <ProgressProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ProgressProvider>
    </SyllabusProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthWrapper>
      {children}
    </DashboardAuthWrapper>
  );
}
