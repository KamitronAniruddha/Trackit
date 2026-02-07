'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, query, where, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
    targetUserId: string;
}

export function FollowButton({ targetUserId }: FollowButtonProps) {
    const { profile: currentUser } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [operationPending, setOperationPending] = useState(false);
    const [followDocId, setFollowDocId] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser || currentUser.uid === targetUserId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const followsQuery = query(
            collection(firestore, 'follows'),
            where('followerId', '==', currentUser.uid),
            where('followedId', '==', targetUserId)
        );

        const unsubscribe = onSnapshot(followsQuery, (snapshot) => {
            if (snapshot.empty) {
                setIsFollowing(false);
                setFollowDocId(null);
            } else {
                setIsFollowing(true);
                setFollowDocId(snapshot.docs[0].id);
            }
            setIsLoading(false);
            setOperationPending(false);
        }, (error) => {
            console.error("Error checking follow status:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not check follow status.'
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, targetUserId, firestore, toast]);

    const handleFollow = async () => {
        if (!currentUser || operationPending) return;
        setOperationPending(true);
        try {
            await addDoc(collection(firestore, 'follows'), {
                followerId: currentUser.uid,
                followedId: targetUserId,
            });
        } catch (e: any) {
            console.error("Error following user: ", e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
            setOperationPending(false);
        }
    };

    const handleUnfollow = async () => {
        if (!currentUser || !followDocId || operationPending) return;
        setOperationPending(true);
        try {
            await deleteDoc(doc(firestore, 'follows', followDocId));
        } catch (e: any) {
            console.error("Error unfollowing user: ", e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
            setOperationPending(false);
        }
    };

    if (!currentUser || currentUser.uid === targetUserId) {
        return null; // Don't show button on your own posts or if not logged in
    }

    if (isLoading) {
        return <Button variant="outline" size="sm" disabled className="w-28"><Loader2 className="h-4 w-4 animate-spin" /></Button>
    }

    if (isFollowing) {
        return <Button variant="outline" size="sm" onClick={handleUnfollow} disabled={operationPending} className="w-28">
            {operationPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <><UserCheck className="mr-2 h-4 w-4" /> Following</>}
        </Button>
    }

    return <Button size="sm" onClick={handleFollow} disabled={operationPending} className="w-28">
         {operationPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <><UserPlus className="mr-2 h-4 w-4" /> Follow</>}
    </Button>
}
