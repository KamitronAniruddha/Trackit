
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, query, where, onSnapshot, doc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface FollowRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhotoURL?: string;
}

export function FollowRequestsPopover() {
    const firestore = useFirestore();
    const { profile: currentUser } = useUserProfile();
    const { toast } = useToast();
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        const q = query(collection(firestore, 'followRequests'), where('toUserId', '==', currentUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FollowRequest));
            setRequests(requestList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching follow requests:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, firestore]);
    
    const handleAccept = async (request: FollowRequest) => {
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

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {requests.length > 0 && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Follow Requests</h4>
                        <p className="text-sm text-muted-foreground">
                            Accept or decline requests from other users.
                        </p>
                    </div>
                    <ScrollArea className="h-72">
                        {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                        {!loading && requests.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No new requests.</p>}
                        {!loading && requests.length > 0 && (
                            <div className="space-y-2">
                                {requests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={req.fromUserPhotoURL || undefined} />
                                                <AvatarFallback>{req.fromUserName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-medium text-sm">{req.fromUserName}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" onClick={() => handleAccept(req)}>Accept</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleDecline(req.id)}>Decline</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}
