'use client';

import { useEffect, useRef } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, getDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export function RealtimeToastNotifier() {
    const { profile: currentUser } = useUserProfile();
    const firestore = useFirestore();
    const { toast, dismiss } = useToast();
    const router = useRouter();
    const initialLoadDone = useRef(false);

    const handleAccept = async (request: any) => {
        if (!currentUser) return;
        
        const followDocRef = doc(collection(firestore, 'follows'));
        const requestDocRef = doc(firestore, 'followRequests', request.id);

        const batch = writeBatch(firestore);
        batch.set(followDocRef, {
            followerId: request.fromUserId,
            followedId: currentUser.uid,
        });
        batch.delete(requestDocRef);

        try {
            await batch.commit();
            toast({ title: "Request Accepted", description: `You are now followed by ${request.fromUserName}.`});
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: 'Could not accept request.'});
        }
    };
    
    const handleDecline = async (requestId: string) => {
        try {
            await deleteDoc(doc(firestore, 'followRequests', requestId));
            toast({ title: "Request Declined"});
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: 'Could not decline request.'});
        }
    };

    useEffect(() => {
        if (!currentUser) {
            initialLoadDone.current = false;
            return;
        }

        // Delay to prevent toasts on initial page load
        const timer = setTimeout(() => {
            if (currentUser) { // Re-check user in case of logout during timeout
                initialLoadDone.current = true;
            }
        }, 5000);

        // --- Listener for new Follow Requests ---
        const reqQuery = query(collection(firestore, 'followRequests'), where('toUserId', '==', currentUser.uid));
        const unsubRequests = onSnapshot(reqQuery, (snapshot) => {
            if (!initialLoadDone.current) return;
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newRequest = {id: change.doc.id, ...change.doc.data()};
                    const { id: toastId } = toast({
                        title: "New Follow Request",
                        duration: Infinity,
                        description: (
                            <div>
                                <p className="mb-2">{newRequest.fromUserName} wants to follow you.</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => { handleAccept(newRequest); dismiss(toastId); }}>Accept</Button>
                                    <Button size="sm" variant="secondary" onClick={() => { handleDecline(newRequest.id); dismiss(toastId); }}>Decline</Button>
                                </div>
                            </div>
                        ),
                    });
                }
            });
        });

        // --- Listener for accepted Follow Requests ---
        const followQuery = query(collection(firestore, 'follows'), where('followerId', '==', currentUser.uid));
        const unsubFollows = onSnapshot(followQuery, (snapshot) => {
            if (!initialLoadDone.current) return;
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const followData = change.doc.data();
                    const followedUserDoc = await getDoc(doc(firestore, 'users', followData.followedId));
                    if (followedUserDoc.exists()) {
                        toast({
                            title: "Follow Request Accepted",
                            description: `You are now following ${followedUserDoc.data().displayName}.`
                        });
                    }
                }
            });
        });

        // --- Listener for new Direct Messages ---
        const dmQuery = query(collection(firestore, 'conversations'), where('memberIds', 'array-contains', currentUser.uid));
        const unsubDMs = onSnapshot(dmQuery, (snapshot) => {
            if (!initialLoadDone.current) return;
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const conv = change.doc.data();
                    if (conv.lastMessageSenderId && conv.lastMessageSenderId !== currentUser.uid) {
                        const otherUserId = conv.memberIds.find((id: string) => id !== currentUser.uid);
                        const otherUserName = conv.membersInfo[otherUserId]?.displayName || 'Someone';
                        toast({
                            title: `New message from ${otherUserName}`,
                            description: conv.lastMessage,
                            action: <ToastAction altText="View" onClick={() => router.push(`/dashboard/messages/direct/${change.doc.id}`)}>View</ToastAction>
                        });
                    }
                }
            });
        });

        // --- Listener for new Group Messages ---
        const groupQuery = query(collection(firestore, 'groups'), where('memberIds', 'array-contains', currentUser.uid));
        const unsubGroups = onSnapshot(groupQuery, (snapshot) => {
            if (!initialLoadDone.current) return;
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const group = change.doc.data();
                    if (group.lastMessageSenderId && group.lastMessageSenderId !== currentUser.uid) {
                        toast({
                            title: `New message in ${group.name}`,
                            description: `${group.lastMessageSenderName}: ${group.lastMessage}`,
                            action: <ToastAction altText="View" onClick={() => router.push(`/dashboard/messages/group/${change.doc.id}`)}>View</ToastAction>
                        });
                    }
                }
            });
        });

        return () => {
            clearTimeout(timer);
            unsubRequests();
            unsubFollows();
            unsubDMs();
            unsubGroups();
        };

    }, [currentUser, firestore, router, toast, dismiss]);

    return null; // This component doesn't render anything
}
