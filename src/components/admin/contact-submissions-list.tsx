
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';

interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: { toDate: () => Date };
    isRead: boolean;
}

export function ContactSubmissionsList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const submissionsRef = collection(firestore, 'contactSubmissions');
        const q = query(submissionsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const submissionList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as ContactSubmission));
            setSubmissions(submissionList);
            setLoading(false);
            setError(null);
        }, (err: any) => {
            console.error("Error fetching contact submissions:", err);
            setError("You don't have permission to view contact submissions. Check Firestore security rules.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);
    
    const toggleReadStatus = async (submission: ContactSubmission) => {
        const submissionRef = doc(firestore, 'contactSubmissions', submission.id);
        try {
            await updateDoc(submissionRef, { isRead: !submission.isRead });
            toast({
                title: `Message marked as ${!submission.isRead ? 'read' : 'unread'}.`
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to update status: ${e.message}` });
        }
    };
    
    const handleDelete = async (submissionId: string) => {
        const submissionRef = doc(firestore, 'contactSubmissions', submissionId);
        try {
            await deleteDoc(submissionRef);
            toast({
                title: 'Message Deleted',
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to delete message: ${e.message}` });
        }
    };

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
    
    if(submissions.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No contact messages.</p>
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {submissions.map(submission => (
                <AccordionItem value={submission.id} key={submission.id} className={cn(!submission.isRead && "bg-muted/30")}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4 items-center">
                            <div className='flex flex-col items-start'>
                                <span className={cn('font-semibold', !submission.isRead && 'text-primary')}>{submission.name}</span>
                                <span className='text-sm text-muted-foreground'>{submission.email}</span>
                            </div>
                            <div className='text-sm text-muted-foreground'>
                                {submission.createdAt ? formatDistanceToNow(submission.createdAt.toDate(), { addSuffix: true }) : ''}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 bg-muted/50 rounded-md">
                            <p className="font-semibold mb-2">Message:</p>
                            <blockquote className="border-l-4 pl-4 text-muted-foreground whitespace-pre-wrap">{submission.message}</blockquote>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => toggleReadStatus(submission)}>
                                {submission.isRead ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                Mark as {submission.isRead ? 'Unread' : 'Read'}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this message.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(submission.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
