
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban, Loader2, Send } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from './ui/button';
import { useState } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface BannedScreenProps {
    banExpiresAt: Date | null;
}

export function BannedScreen({ banExpiresAt }: BannedScreenProps) {
    const { signOut } = useUser();
    const { profile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const expiryMessage = banExpiresAt 
        ? `Your access will be restored on ${banExpiresAt.toLocaleString()}.`
        : "This is a permanent ban.";

    const handleSubmitRequest = async () => {
        if (!profile || !reason.trim()) return;
        setIsSubmitting(true);
        try {
            const batch = writeBatch(firestore);

            // Step 1: Create the unban request document.
            const requestRef = doc(collection(firestore, 'unbanRequests'));
            batch.set(requestRef, {
                userId: profile.uid,
                userName: profile.displayName,
                userEmail: profile.email,
                reason: reason.trim(),
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            
            // Step 2: Update the user's profile to indicate a pending request.
            const userDocRef = doc(firestore, 'users', profile.uid);
            batch.update(userDocRef, { hasPendingUnbanRequest: true });

            await batch.commit();

            toast({ title: 'Request Sent', description: 'An administrator will review your request.' });
            setIsDialogOpen(false);
            setReason('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not send your request.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center border-destructive shadow-2xl shadow-destructive/10">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit">
                        <Ban className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-3xl mt-4">Account Suspended</CardTitle>
                    <CardDescription className="text-base">
                        Your account has been suspended by an administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-md">
                        <p className="font-semibold">{expiryMessage}</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <div className="text-center px-4">
                        {profileLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        ) : profile?.hasPendingUnbanRequest ? (
                            <p className="text-sm text-muted-foreground">Your unban request is pending review.</p>
                        ) : (
                            <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>Request Review</Button>
                        )}
                        </div>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Request Unban Review</DialogTitle>
                                <DialogDescription>
                                    Explain why you believe your account should be unbanned. An administrator will review your request.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea
                                    placeholder="Please be respectful and clear in your reasoning..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={6}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleSubmitRequest} disabled={!reason.trim() || isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    <Button onClick={() => signOut()} variant="outline" className="w-full text-lg py-6">
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
