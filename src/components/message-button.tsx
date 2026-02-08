
'use client';
import { useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface MessageButtonProps {
    targetUserId: string;
}

export function MessageButton({ targetUserId }: MessageButtonProps) {
    const { profile: currentUser } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleMessage = async () => {
        if (!currentUser || currentUser.uid === targetUserId) return;

        setIsLoading(true);
        try {
            const conversationId = [currentUser.uid, targetUserId].sort().join('_');
            const convRef = doc(firestore, 'conversations', conversationId);
            const convSnap = await getDoc(convRef);

            if (!convSnap.exists()) {
                // Fetch target user's profile to store in membersInfo
                const targetUserRef = doc(firestore, 'users', targetUserId);
                const targetUserSnap = await getDoc(targetUserRef);
                if (!targetUserSnap.exists()) {
                    throw new Error("Target user profile not found.");
                }
                const targetUserData = targetUserSnap.data();

                await setDoc(convRef, {
                    memberIds: [currentUser.uid, targetUserId],
                    membersInfo: {
                        [currentUser.uid]: {
                            displayName: currentUser.displayName,
                            photoURL: currentUser.photoURL,
                        },
                        [targetUserId]: {
                            displayName: targetUserData.displayName,
                            photoURL: targetUserData.photoURL,
                        }
                    },
                    createdAt: serverTimestamp(),
                    lastMessageAt: serverTimestamp(),
                });
            }

            router.push(`/dashboard/messages/direct/${conversationId}`);
        } catch (error: any) {
            console.error("Error starting conversation:", error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not start conversation.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser || currentUser.uid === targetUserId) {
        return null; // Don't show button for self or if not logged in
    }

    return (
        <Button variant="outline" size="sm" onClick={handleMessage} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
            Message
        </Button>
    );
}
