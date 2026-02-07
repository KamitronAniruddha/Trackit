'use client';
import { useUserProfile } from '@/contexts/user-profile-context';
import { BannedScreen } from '@/components/banned-screen';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const publicRoutes = ['/login', '/signup'];

export function AppGuard({ children }: { children: React.ReactNode }) {
    const { profile, loading: profileLoading } = useUserProfile();
    const { user, signOut, loading: userLoading } = useUser();
    const { toast } = useToast();
    const pathname = usePathname();
    const router = useRouter();

    const loading = profileLoading || userLoading;

    useEffect(() => {
        // Automatically sign out deleted users
        if (profile?.isDeleted && user) {
            signOut().then(() => {
                toast({
                    variant: 'destructive',
                    title: 'Account Deleted',
                    description: 'This account has been deleted by an administrator.',
                });
            });
        }
    }, [profile, user, signOut, toast]);

    useEffect(() => {
        if (loading) {
            return; // Wait until user and profile are loaded
        }

        // If not logged in, redirect to login for any non-public page
        if (!user && !publicRoutes.includes(pathname)) {
            router.replace('/login');
            return;
        }

        // If logged in, but profile is not yet loaded, wait.
        if (user && !profile) {
            return;
        }
        
        // At this point, user and profile are loaded.
        if (user && profile) {
            // If the user is an admin, let them pass. 
            // The AdminLayout will handle its own security for /admin routes.
            // This avoids redirecting admins to onboarding, etc.
            if (profile.role === 'admin') {
                return;
            }

            // From here on, we are only dealing with non-admin users.
            const { accountStatus, onboardingCompleted } = profile;

            // Rule: Handle pending approval first
            if (accountStatus === 'pending_approval') {
                if (pathname !== '/pending-approval') {
                    router.replace('/pending-approval');
                }
                return; // Stop further checks
            }

            // Rule: Handle onboarding
            if (!onboardingCompleted) {
                if (pathname !== '/onboarding') {
                    router.replace('/onboarding');
                }
                return; // Stop further checks
            }

            // Rule: If user is fully onboarded and active, but on a "flow" page, redirect them to dashboard.
            if (onboardingCompleted && pathname === '/onboarding') {
                router.replace('/dashboard');
            }
        }
    }, [loading, user, profile, pathname, router]);


    // Show loading screen for all non-public pages while auth state is resolving
    if (loading && !publicRoutes.includes(pathname)) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // For authenticated users, perform access control checks
    if (user && profile) {
        // Handle banned users
        const isBanned = profile.isBanned === true;
        const banExpires = profile.banExpiresAt ? profile.banExpiresAt.toDate() : null;
        const banIsActive = isBanned && (!banExpires || banExpires > new Date());
        
        if (banIsActive) {
            return <BannedScreen banExpiresAt={banExpires} />;
        }
        
        // Handle deleted users (should be caught by useEffect but here for safety)
        if (profile.isDeleted) {
            return (
                <div className="flex h-screen items-center justify-center bg-background">
                     <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-destructive" />
                        <p className="text-muted-foreground">Account deleted. Signing out...</p>
                    </div>
                </div>
            );
        }
    }
    
    return <>{children}</>;
}
