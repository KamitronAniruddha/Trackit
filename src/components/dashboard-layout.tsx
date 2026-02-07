
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  FlaskConical,
  Dna,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Loader2,
  Calculator,
  Shield,
  MessageSquare,
  ArrowLeft,
  PieChart,
  ClipboardCheck,
  FileWarning,
  Sun,
  Moon,
  Music,
  Target,
  Lock,
  Camera,
  Timer,
  Eye,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { useState } from 'react';

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
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { NeetProgressLogo } from './icons';
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Button } from '@/components/ui/button';
import { DeveloperCredit } from './developer-credit';
import { cn } from '@/lib/utils';
import { useSpectate } from '@/contexts/spectate-context';
import { useToast } from '@/hooks/use-toast';

const SpectatingAdminBanner = () => {
  const { isSpectating, spectatingUser, stopSpectating } = useSpectate();
  if (!isSpectating || !spectatingUser) return null;

  return (
    <div className="bg-yellow-500 text-yellow-950 p-2 text-center text-sm font-semibold flex items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>Spectating: {spectatingUser.displayName}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-2 py-1 text-yellow-950 hover:bg-yellow-600 hover:text-yellow-950"
        onClick={stopSpectating}
      >
        <LogOutIcon className="mr-2 h-4 w-4" />
        Stop Spectating
      </Button>
    </div>
  );
};

const BeingSpectatedUserBanner = () => {
    const { profile, updateProfileSetting } = useUserProfile();
    const { isSpectating } = useSpectate();
    const { toast } = useToast();
    const [isRevoking, setIsRevoking] = useState(false);
    
    // Don't show this banner to the admin who is spectating
    if (isSpectating) return null;

    const isBeingSpectated = !!profile?.spectatePermission?.spectatingAdminId;
    if (!isBeingSpectated) return null;

    const handleRevoke = async () => {
        setIsRevoking(true);
        try {
          await updateProfileSetting('spectatePermission', {
            status: 'none',
            expiresAt: null,
            grantedAt: null,
            spectatingAdminId: null,
          });
          toast({
            title: 'Permission Revoked',
            description: 'The admin can no longer view your dashboard.',
          });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not revoke permission. Please try again.',
          });
        } finally {
          setIsRevoking(false);
        }
    };

    return (
         <div className="bg-blue-500 text-blue-50 p-2 text-center text-sm font-semibold flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>An admin is currently viewing your dashboard in read-only mode.</span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-blue-50 hover:bg-blue-600 hover:text-blue-50"
                onClick={handleRevoke}
                disabled={isRevoking}
            >
                {isRevoking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
                Stop Session
            </Button>
        </div>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading: userLoading } = useUser({
    redirectOn: 'logout',
    redirectTo: '/login',
  });
  const { profile, loading: profileLoading, updateProfileSetting } = useUserProfile();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const exam = profile?.exam;
  const isPremium = profile?.isPremium;

  let baseMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/physics', label: 'Physics', icon: BookOpen },
  ];

  if (exam === 'NEET') {
    baseMenuItems.push(
      { href: '/dashboard/chemistry', label: 'Chemistry', icon: FlaskConical },
      { href: '/dashboard/biology', label: 'Biology', icon: Dna }
    );
  } else if (exam === 'JEE') {
    baseMenuItems.push(
      { href: '/dashboard/chemistry', label: 'Chemistry', icon: FlaskConical },
      { href: '/dashboard/mathematics', label: 'Mathematics', icon: Calculator }
    );
  }

  const premiumMenuItems = [
    { href: '/dashboard/goals', label: 'Goals', icon: Target, isPremium: true },
    { href: '/dashboard/pomodoro', label: 'Pomodoro', icon: Timer, isPremium: true },
    { href: '/dashboard/revisions', label: 'Revisions', icon: ClipboardCheck, isPremium: true },
    { href: '/dashboard/mistakes', label: 'Mistakes', icon: FileWarning, isPremium: true },
    { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, isPremium: true },
    { href: '/dashboard/agram', label: 'A-gram', icon: Camera, isPremium: true },
    { href: '/dashboard/interpretation', label: 'Interpretation', icon: PieChart, isPremium: true },
    { href: '/dashboard/music', label: 'Music', icon: Music, isPremium: false }, // Music is free
  ];

  const menuItems = [...baseMenuItems, ...premiumMenuItems];

  const loading = userLoading || profileLoading;

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const showBackButton = pathname !== '/dashboard';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <NeetProgressLogo className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">{exam} Tracker</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => {
              const isDisabled = item.isPremium && !isPremium;
              const tooltipContent = isDisabled ? `${item.label} (Premium)` : item.label;

              return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    item.href === '/dashboard/chemistry'
                      ? pathname.startsWith('/dashboard/chemistry') ||
                        pathname.startsWith('/dashboard/physical-chemistry') ||
                        pathname.startsWith('/dashboard/organic-chemistry') ||
                        pathname.startsWith('/dashboard/inorganic-chemistry')
                      : pathname.startsWith(item.href) && (pathname === item.href || pathname.startsWith(`${item.href}/`))
                  }
                  tooltip={{ children: tooltipContent, side: 'right' }}
                  disabled={isDisabled}
                  className={cn(isDisabled && "text-muted-foreground/50 cursor-not-allowed")}
                >
                  <Link href={isDisabled ? '#' : item.href} aria-disabled={isDisabled}>
                    <item.icon />
                    <span>{item.label}</span>
                    {isDisabled && <Lock className="ml-auto h-3 w-3" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )})}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-sidebar-accent">
                <Avatar className="h-9 w-9">
                  {user?.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                  <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="font-semibold">{user?.displayName ?? 'Student'}</span>
                  <span className={cn("text-xs", isPremium ? "text-primary font-semibold" : "text-muted-foreground")}>{isPremium ? "Premium" : "Demo"}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profile?.role === 'admin' && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateProfileSetting('darkMode', !(profile?.darkMode ?? true))}>
                {profile?.darkMode ?? true ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>{profile?.darkMode ?? true ? 'Light Mode' : 'Dark Mode'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SpectatingAdminBanner />
        <BeingSpectatedUserBanner />
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            {showBackButton && (
                <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Right side header content can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        <DeveloperCredit />
      </SidebarInset>
    </SidebarProvider>
  );
}
