'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

interface UnbanRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    reason: string;
    status: 'pending' | 'reviewed';
    createdAt: { toDate: () => Date };
}

export function UnbanRequestsList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [requests, setRequests] = useState<UnbanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                const requestsRef = collection(firestore, 'unbanRequests');
                const querySnapshot = await getDocs(requestsRef);
                const requestList = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    } as UnbanRequest))
                    .filter(req => req.status === 'pending')
                    .sort((a, b) => {
                        if (!a.createdAt) return 1;
                        if (!b.createdAt) return -1;
                        return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
                    });

                setRequests(requestList);
            } catch (err: any) {
                console.error("Error fetching unban requests:", err);
                setError("You don't have permission to view unban requests. Check Firestore security rules.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [firestore]);
    
    const handleRequest = async (request: UnbanRequest, approve: boolean) => {
        try {
            const batch = writeBatch(firestore);

            // 1. Update the request status
            const requestRef = doc(firestore, 'unbanRequests', request.id);
            batch.update(requestRef, { status: 'reviewed' });

            // 2. Update the user's pending status and ban status if approved
            const userRef = doc(firestore, 'users', request.userId);
            const userUpdatePayload: any = {
                hasPendingUnbanRequest: false,
            };
            if (approve) {
                userUpdatePayload.isBanned = false;
                userUpdatePayload.banExpiresAt = null;
            }
            batch.update(userRef, userUpdatePayload);

            await batch.commit();

            // 3. Update UI
            setRequests(requests.filter(r => r.id !== request.id));
            toast({
                title: `Request ${approve ? 'Approved' : 'Rejected'}`,
                description: `${request.userName} has been ${approve ? 'unbanned' : 'kept banned'}.`,
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to process request: ${e.message}` });
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if(requests.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No pending unban requests.</p>
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {requests.map(request => (
                <AccordionItem value={request.id} key={request.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <div className='flex flex-col items-start'>
                                <span className='font-semibold'>{request.userName}</span>
                                <span className='text-sm text-muted-foreground'>{request.userEmail}</span>
                            </div>
                            <div className='text-sm text-muted-foreground'>
                                {request.createdAt ? formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true }) : ''}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 bg-muted/50 rounded-md">
                            <p className="font-semibold mb-2">Reason:</p>
                            <blockquote className="border-l-4 pl-4 text-muted-foreground">{request.reason}</blockquote>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => handleRequest(request, false)}>
                                <X className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            <Button size="sm" onClick={() => handleRequest(request, true)}>
                                <Check className="mr-2 h-4 w-4" />
                                Approve & Unban
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
