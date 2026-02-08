'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, query, where, addDoc, deleteDoc, doc, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
    targetUserId: string;
}

type FollowState = 'not_following' | 'following' | 'requested';

export function FollowButton({ targetUserId }: FollowButtonProps) {
    const { profile: currentUser } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [followState, setFollowState] = useState<FollowState>('not_following');
    const [isLoading, setIsLoading] = useState(true);
    const [operationPending, setOperationPending] = useState(false);
    
    const [followDocId, setFollowDocId] = useState<string | null>(null);
    const [requestDocId, setRequestDocId] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser || currentUser.uid === targetUserId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const followsQuery = query(collection(firestore, 'follows'), where('followerId', '==', currentUser.uid), where('followedId', '==', targetUserId));
        const requestsQuery = query(collection(firestore, 'followRequests'), where('fromUserId', '==', currentUser.uid), where('toUserId', '==', targetUserId));

        const unsubFollows = onSnapshot(followsQuery, (snapshot) => {
            if (!snapshot.empty) {
                setFollowState('following');
                setFollowDocId(snapshot.docs[0].id);
            } else {
                setFollowState(prev => prev === 'following' ? 'not_following' : prev);
                setFollowDocId(null);
            }
        });
        
        const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
            if (!snapshot.empty) {
                // If we are not already following, set state to requested
                if(followState !== 'following') {
                    setFollowState('requested');
                }
                setRequestDocId(snapshot.docs[0].id);
            } else {
                setFollowState(prev => prev === 'requested' ? 'not_following' : prev);
                setRequestDocId(null);
            }
        });
        
        const fetchData = async () => {
            const [followsSnap, requestsSnap] = await Promise.all([
                getDocs(followsQuery),
                getDocs(requestsQuery),
            ]);
            
            if (!followsSnap.empty) {
                setFollowState('following');
                setFollowDocId(followsSnap.docs[0].id);
            } else if (!requestsSnap.empty) {
                setFollowState('requested');
                setRequestDocId(requestsSnap.docs[0].id);
            } else {
                setFollowState('not_following');
            }
            setIsLoading(false);
        };

        fetchData();

        return () => {
            unsubFollows();
            unsubRequests();
        };
    }, [currentUser, targetUserId, firestore]);

    const handleFollowRequest = async () => {
        if (!currentUser || operationPending) return;
        setOperationPending(true);
        try {
            const requestId = `${currentUser.uid}_${targetUserId}`;
            const requestDocRef = doc(firestore, 'followRequests', requestId);
            await setDoc(requestDocRef, {
                fromUserId: currentUser.uid,
                fromUserName: currentUser.displayName,
                fromUserPhotoURL: currentUser.photoURL,
                toUserId: targetUserId,
                status: 'pending'
            });
            setFollowState('requested');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send follow request.' });
        } finally {
            setOperationPending(false);
        }
    };
    
    const handleCancelRequest = async () => {
        if (!currentUser || !requestDocId || operationPending) return;
        setOperationPending(true);
        try {
            await deleteDoc(doc(firestore, 'followRequests', requestDocId));
            setFollowState('not_following');
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel request.' });
        } finally {
            setOperationPending(false);
        }
    }

    const handleUnfollow = async () => {
        if (!currentUser || !followDocId || operationPending) return;
        setOperationPending(true);
        try {
            await deleteDoc(doc(firestore, 'follows', followDocId));
            setFollowState('not_following');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not unfollow user.' });
        } finally {
            setOperationPending(false);
        }
    };

    if (!currentUser || currentUser.uid === targetUserId) {
        return null;
    }

    if (isLoading) {
        return <Button variant="outline" size="sm" disabled className="w-28"><Loader2 className="h-4 w-4 animate-spin" /></Button>
    }

    if (followState === 'following') {
        return <Button variant="outline" size="sm" onClick={handleUnfollow} disabled={operationPending} className="w-28">
            {operationPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <><UserCheck className="mr-2 h-4 w-4" /> Following</>}
        </Button>
    }
    
    if (followState === 'requested') {
        return <Button variant="secondary" size="sm" onClick={handleCancelRequest} disabled={operationPending} className="w-28">
            {operationPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Clock className="mr-2 h-4 w-4" /> Requested</>}
        </Button>
    }

    return <Button size="sm" onClick={handleFollowRequest} disabled={operationPending} className="w-28">
         {operationPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <><UserPlus className="mr-2 h-4 w-4" /> Follow</>}
    </Button>
}
