'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { BrainDumpNote } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StickyNote } from './sticky-note';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUserProfile } from '@/contexts/user-profile-context';

type Mood = 'stressed' | 'tired' | 'confused' | 'calm' | 'motivated';

const moods: { name: Mood; emoji: string; color: string }[] = [
    { name: 'stressed', emoji: '😥', color: 'bg-red-200/50 dark:bg-red-900/30' },
    { name: 'tired', emoji: '😴', color: 'bg-blue-200/50 dark:bg-blue-900/30' },
    { name: 'confused', emoji: '🤔', color: 'bg-yellow-200/50 dark:bg-yellow-900/30' },
    { name: 'calm', emoji: '😌', color: 'bg-green-200/50 dark:bg-green-900/30' },
    { name: 'motivated', emoji: '🔥', color: 'bg-orange-200/50 dark:bg-orange-900/30' },
];

export function BrainDumpWall() {
    const firestore = useFirestore();
    const { profile, loading: profileLoading } = useUserProfile();
    const { toast } = useToast();
    const [notes, setNotes] = useState<BrainDumpNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [selectedMood, setSelectedMood] = useState<Mood>('calm');
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        if (profileLoading) {
            setLoading(true);
            return;
        }
        if (!profile) {
            setLoading(false);
            return;
        }

        const notesRef = collection(firestore, 'brainDumps');
        const q = query(notesRef, where('expiresAt', '>', new Date()), orderBy('expiresAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BrainDumpNote));
            setNotes(notesList);
            setLoading(false);
        }, async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'brainDumps',
                operation: 'list'
            }, serverError);
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, profile, profileLoading]);
    
    const handlePostNote = () => {
        if (!profile) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to post to the wall.'});
            return;
        }
        if (newNote.trim().length === 0) return;
        setIsPosting(true);

        const notesRef = collection(firestore, 'brainDumps');
        const now = new Date();
        const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const newNoteData = {
            text: newNote,
            mood: selectedMood,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiry)
        };

        addDoc(notesRef, newNoteData)
            .then(() => {
                setNewNote('');
                toast({ title: 'Your thought is on the wall.', description: 'It will disappear in 24 hours.'});
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: notesRef.path,
                    operation: 'create',
                    requestResourceData: newNoteData,
                }, serverError);
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsPosting(false);
            });
    };

    return (
        <div className="space-y-6">
             <div className="p-4 border rounded-lg bg-card/80 space-y-4">
                <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Share a thought anonymously..."
                    className="w-full h-24 text-base bg-background"
                    maxLength={280}
                    disabled={isPosting}
                />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Mood:</span>
                        {moods.map(mood => (
                            <Button
                                key={mood.name}
                                variant={selectedMood === mood.name ? 'secondary' : 'ghost'}
                                size="icon"
                                onClick={() => setSelectedMood(mood.name)}
                                className={`rounded-full h-10 w-10 ${selectedMood === mood.name ? mood.color : ''}`}
                                aria-label={`Select mood: ${mood.name}`}
                                disabled={isPosting}
                            >
                                {mood.emoji}
                            </Button>
                        ))}
                    </div>
                    <Button onClick={handlePostNote} disabled={isPosting || newNote.trim().length === 0} className="w-full sm:w-auto">
                        {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Post Anonymously
                    </Button>
                </div>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : !profile ? (
                <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg border border-dashed">
                   <h3 className="text-lg font-semibold">Please log in</h3>
                   <p className="text-sm mt-2">You need to be logged in to see the Brain Dump Wall.</p>
               </div>
            ) : notes.length === 0 ? (
                 <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg border border-dashed">
                    <h3 className="text-lg font-semibold">The wall is clear</h3>
                    <p className="text-sm mt-2">Be the first to share a thought.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {notes.map(note => <StickyNote key={note.id} note={note} />)}
                </div>
            )}
        </div>
    );
}
