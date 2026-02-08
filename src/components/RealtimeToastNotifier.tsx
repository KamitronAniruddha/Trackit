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

    // Use a ref to prevent toasts on initial page load after login.
    const initialDelayPassed = useRef(false);

    // This effect handles the 5-second delay. It only re-runs when the user logs in/out.
    useEffect(() => {
        initialDelayPassed.current = false; // Reset on user change
        if (!currentUser) return; // No user, do nothing

        const timer = setTimeout(() => {
            initialDelayPassed.current = true;
        }, 5000);

        return () => clearTimeout(timer);
    }, [currentUser?.uid]); // Stable dependency on user ID


    // This effect manages all listeners. It also only re-runs on login/logout.
    useEffect(() => {
        if (!currentUser?.uid) {
            return;
        }
        const userId = currentUser.uid;

        // Define handlers inside so they close over the stable `userId`
        const handleAccept = async (request: any) => {
            if (!userId) return;
            const batch = writeBatch(firestore);
            // Create a new document in the 'follows' collection
            batch.set(doc(collection(firestore, 'follows')), {
                followerId: request.fromUserId,
                followedId: userId,
            });
            // Delete the original follow request
            batch.delete(doc(firestore, 'followRequests', request.id));
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

        // --- Helper to create listeners that only act on real changes ---
        const createListener = (query: any, processChange: (change: any) => void) => {
            let isFirstSnapshot = true;
            return onSnapshot(query, (snapshot) => {
                // Do nothing until the initial 5-second delay has passed.
                if (!initialDelayPassed.current) return;
                
                // For the very first data dump from this listener, ignore it.
                // After that, process all subsequent real-time changes.
                if (isFirstSnapshot) {
                    isFirstSnapshot = false;
                    return;
                }

                snapshot.docChanges().forEach(processChange);
            });
        };
        
        const unsubscribers: (() => void)[] = [];

        // --- Listener for new Follow Requests ---
        const reqQuery = query(collection(firestore, 'followRequests'), where('toUserId', '==', userId));
        unsubscribers.push(createListener(reqQuery, (change) => {
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
        }));

        // --- Listener for accepted Follow Requests ---
        const followQuery = query(collection(firestore, 'follows'), where('followerId', '==', userId));
        unsubscribers.push(createListener(followQuery, async (change) => {
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
        }));

        // --- Listener for new Direct Messages ---
        const dmQuery = query(collection(firestore, 'conversations'), where('memberIds', 'array-contains', userId));
        unsubscribers.push(createListener(dmQuery, (change) => {
            if (change.type === 'modified') {
                const conv = change.doc.data();
                if (conv.lastMessageSenderId && conv.lastMessageSenderId !== userId) {
                    const otherUserId = conv.memberIds.find((id: string) => id !== userId);
                    const otherUserName = conv.membersInfo[otherUserId]?.displayName || 'Someone';
                    toast({
                        title: `New message from ${otherUserName}`,
                        description: conv.lastMessage,
                        action: <ToastAction altText="View" onClick={() => router.push(`/dashboard/messages/direct/${change.doc.id}`)}>View</ToastAction>
                    });
                }
            }
        }));
        
        // --- Listener for new Group Messages ---
        const groupQuery = query(collection(firestore, 'groups'), where('memberIds', 'array-contains', userId));
        unsubscribers.push(createListener(groupQuery, (change) => {
             if (change.type === 'modified') {
                const group = change.doc.data();
                if (group.lastMessageSenderId && group.lastMessageSenderId !== userId) {
                    toast({
                        title: `New message in ${group.name}`,
                        description: `${group.lastMessageSenderName}: ${group.lastMessage}`,
                        action: <ToastAction altText="View" onClick={() => router.push(`/dashboard/messages/group/${change.doc.id}`)}>View</ToastAction>
                    });
                }
            }
        }));

        // --- Cleanup ---
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [currentUser?.uid, firestore, router, toast, dismiss]);

    return null;
}
