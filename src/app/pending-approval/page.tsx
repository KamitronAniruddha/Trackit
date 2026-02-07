'use client';

import { useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Copy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { NeetProgressLogo } from '@/components/icons';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumCodeActivator } from '@/components/premium-code-activator';

export default function PendingApprovalPage() {
    const { profile, loading } = useUserProfile();
    const { signOut } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    if (loading || !profile) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Fetching your account status...</p>
                </div>
            </div>
        );
    }
    
    const handleCopyToClipboard = () => {
        if (!profile?.accessCode) return;
        navigator.clipboard.writeText(profile.accessCode);
        toast({ title: 'Access Code Copied!', description: 'Your code has been copied to the clipboard.' });
    };

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto mb-4">
                        <NeetProgressLogo className="h-16 w-16" />
                    </div>
                    <CardTitle className="text-3xl">Account Activation</CardTitle>
                    <CardDescription className="text-base">
                        Your account is in demo mode. Activate premium access using one of the methods below to unlock all features.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="admin" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="admin">Activate with Admin</TabsTrigger>
                            <TabsTrigger value="code">Enter Activation Code</TabsTrigger>
                        </TabsList>
                        <TabsContent value="admin" className="pt-6">
                             <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                                <p className="text-sm text-muted-foreground">Provide this code to an admin</p>
                                <div className="relative">
                                    <p className="text-5xl font-mono font-bold tracking-widest text-primary">
                                        {profile.accessCode}
                                    </p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute -top-2 -right-2 h-8 w-8"
                                        onClick={handleCopyToClipboard}
                                        aria-label="Copy access code"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="code" className="pt-6">
                            <PremiumCodeActivator />
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button onClick={() => router.push('/dashboard')} variant="secondary" className="w-full">
                        Back to Dashboard
                    </Button>
                    <Button onClick={() => signOut()} variant="outline" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
