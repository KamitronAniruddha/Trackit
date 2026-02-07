
'use client';

import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Home, ArrowLeft } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { NeetProgressLogo } from '@/components/icons';
import { AdminNav } from '@/components/admin/admin-nav';
import { DeveloperCredit } from '@/components/developer-credit';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useUserProfile();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const loading = profileLoading || userLoading;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!['admin', 'subadmin'].includes(profile?.role || '')) {
        toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
        });
        router.replace('/dashboard');
      }
    }
  }, [user, profile, loading, router, toast]);

  if (loading || !user || !['admin', 'subadmin'].includes(profile?.role || '')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <NeetProgressLogo className="h-6 w-6" />
                        <span className="">Exam Tracker</span>
                    </Link>
                </div>
                <div className="flex-1 py-4">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <AdminNav />
                    </nav>
                </div>
            </div>
        </div>
        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                 <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" />
                 </Button>
                 <div className="w-full flex-1">
                    <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                 </div>
                 <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Go to main dashboard</span>
                    </Link>
                 </Button>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
                {children}
                <DeveloperCredit />
            </main>
        </div>
    </div>
  );
}
