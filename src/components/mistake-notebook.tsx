'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { AddMistakeDialog } from './add-mistake-dialog';
import { Button } from './ui/button';
import { FileWarning, Loader2, Plus, Trash2, CheckSquare, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
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
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Mistake {
    id: string;
    subject: string;
    chapter: string;
    question: string;
    myMistake: string;
    correctConcept: string;
    tags: string[];
    status: 'active' | 'reviewed';
    createdAt: { toDate: () => Date } | null;
}

export function MistakeNotebook() {
    const firestore = useFirestore();
    const { profile } = useUserProfile();
    const { toast } = useToast();
    const [mistakes, setMistakes] = useState<Mistake[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedTag, setSelectedTag] = useState('all');

    useEffect(() => {
        if (!profile) {
            setLoading(false);
            return;
        };

        const mistakesRef = collection(firestore, 'users', profile.uid, 'mistakes');
        const q = query(mistakesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mistakeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mistake));
            setMistakes(mistakeList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching mistakes: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, firestore]);

    const handleDelete = async (mistakeId: string) => {
        if (!profile) return;
        try {
            await deleteDoc(doc(firestore, 'users', profile.uid, 'mistakes', mistakeId));
            toast({ title: "Mistake deleted" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error deleting mistake", description: error.message });
        }
    };

    const toggleStatus = async (mistake: Mistake) => {
         if (!profile) return;
        const newStatus = mistake.status === 'active' ? 'reviewed' : 'active';
        try {
            await updateDoc(doc(firestore, 'users', profile.uid, 'mistakes', mistake.id), { status: newStatus });
            toast({ title: `Mistake marked as ${newStatus}`});
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error updating status", description: error.message });
        }
    };

    const allSubjects = useMemo(() => ['all', ...Array.from(new Set(mistakes.map(m => m.subject)))], [mistakes]);
    const allTags = useMemo(() => ['all', ...Array.from(new Set(mistakes.flatMap(m => m.tags || [])))], [mistakes]);

    const filteredMistakes = useMemo(() => {
        return mistakes.filter(mistake => {
            const subjectMatch = selectedSubject === 'all' || mistake.subject === selectedSubject;
            const tagMatch = selectedTag === 'all' || (mistake.tags && mistake.tags.includes(selectedTag));
            return subjectMatch && tagMatch;
        });
    }, [mistakes, selectedSubject, selectedTag]);
    
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                    <div className='flex items-center gap-2'>
                        <Label htmlFor="subject-filter">Subject:</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger id="subject-filter" className="w-[180px]">
                                <SelectValue placeholder="Filter by subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {allSubjects.map(subject => (
                                    <SelectItem key={subject} value={subject}>
                                        {subject === 'all' ? 'All Subjects' : subject.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Label htmlFor="tag-filter">Tag:</Label>
                        <Select value={selectedTag} onValueChange={setSelectedTag}>
                            <SelectTrigger id="tag-filter" className="w-[180px]">
                                <SelectValue placeholder="Filter by tag" />
                            </SelectTrigger>
                            <SelectContent>
                                {allTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag === 'all' ? 'All Tags' : tag}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Log New Mistake
                </Button>
            </div>
            
            {loading && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}

            {!loading && mistakes.length === 0 && (
                <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg border border-dashed">
                    <FileWarning className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Your Mistake Notebook is Empty</h3>
                    <p className="text-sm mt-2">Start by logging a new mistake to analyze and learn from it.</p>
                </div>
            )}

            {!loading && mistakes.length > 0 && filteredMistakes.length === 0 && (
                 <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg border border-dashed">
                    <Filter className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">No Mistakes Found</h3>
                    <p className="text-sm mt-2">No mistakes match your current filter selection.</p>
                </div>
            )}
            
            {!loading && filteredMistakes.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMistakes.map(mistake => (
                        <Card key={mistake.id} className="flex flex-col bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>{mistake.question}</CardTitle>
                                <CardDescription>{mistake.subject.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')} - {mistake.chapter}</CardDescription>
                                {mistake.createdAt && <p className="text-xs text-muted-foreground pt-1">Logged {formatDistanceToNow(mistake.createdAt.toDate(), { addSuffix: true })}</p>}
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <div>
                                    <h4 className="font-semibold text-destructive/90 text-sm">My Mistake</h4>
                                    <p className="text-sm mt-1 p-2 bg-destructive/5 rounded-md">{mistake.myMistake}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm">Correct Concept</h4>
                                     <p className="text-sm mt-1 p-2 bg-green-500/5 rounded-md">{mistake.correctConcept}</p>
                                </div>
                                 {mistake.tags && mistake.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {mistake.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between items-center border-t pt-4">
                               <Button variant={mistake.status === 'active' ? 'outline' : 'secondary'} size="sm" onClick={() => toggleStatus(mistake)}>
                                   <CheckSquare className="mr-2 h-4 w-4"/>
                                   {mistake.status === 'active' ? 'Mark as Reviewed' : 'Mark as Active'}
                               </Button>
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete this mistake entry.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(mistake.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                               </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            <AddMistakeDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        </>
    );
}
