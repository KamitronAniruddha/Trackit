'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Home,
  ArrowLeft,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { useUserProfile } from '@/contexts/user-profile-context';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { NeetProgressLogo } from '@/components/icons';
import { AdminNav } from '@/components/admin/admin-nav';
import { DeveloperCredit } from '@/components/developer-credit';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useUserProfile();
  const { user, signOut, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

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

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

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
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 animate-glow">
                <NeetProgressLogo className="h-8 w-8 text-primary" />
                <span className="text-xl font-semibold">Admin Panel</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <AdminNav />
          </SidebarContent>
          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-4 rounded-lg border border-sidebar-border p-3 text-left text-sm transition-colors hover:bg-sidebar-accent">
                  <Avatar className="h-10 w-10">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                    <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() ?? 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <span className="font-semibold">{user?.displayName ?? 'Admin'}</span>
                    <span className="block text-xs text-primary font-semibold capitalize">{profile?.role}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Main Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsLogoutAlertOpen(true);
                  }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
               <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Main Dashboard</span>
                </Link>
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-[fade-in-up_0.5s_ease-out]">
            {children}
          </main>
          <DeveloperCredit />
        </SidebarInset>
      </SidebarProvider>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader className="items-center text-center">
                  <div className="p-3 bg-destructive/10 rounded-full w-fit mb-2">
                      <LogOut className="h-8 w-8 text-destructive" />
                  </div>
                  <AlertDialogTitle className="text-2xl">Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                      You will be logged out of your admin session.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-center gap-2 pt-4">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                      onClick={handleLogout}
                      className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}
                  >
                      Yes, Log Out
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}