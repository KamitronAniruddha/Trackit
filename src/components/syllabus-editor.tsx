'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, AlertTriangle, Download, BookCopy, Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ALL_SUBJECTS } from '@/lib/neet-syllabus';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { SyllabusPdfLayout } from './syllabus-pdf-layout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SyllabusDoc {
    id: string;
    exam: 'NEET' | 'JEE';
    subject: string;
    chapters: string[];
}

type SyllabusData = {
    [exam in 'NEET' | 'JEE']: {
        [subject: string]: {
            id: string;
            chapters: string[];
        };
    };
};

interface SubjectEditorProps {
    exam: 'NEET' | 'JEE';
    subjectKey: string;
    subjectData: { id: string; chapters: string[] };
    onSave: () => Promise<void>;
}

const SubjectEditorDialog: React.FC<SubjectEditorProps> = ({ exam, subjectKey, subjectData, onSave }) => {
    const [chapters, setChapters] = useState<string[]>(subjectData.chapters);
    const [newChapter, setNewChapter] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const subjectTitle = subjectKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    const renumberChapters = (chapterList: string[]): string[] => {
      return chapterList.map((chapter, index) => {
        const chapterText = chapter.replace(/^\d+\.\s*/, '');
        return `${index + 1}. ${chapterText}`;
      });
    };

    const handleAddChapter = () => {
        if (newChapter.trim()) {
            const newChapters = [...chapters, newChapter.trim()];
            setChapters(renumberChapters(newChapters));
            setNewChapter('');
        }
    };

    const handleRemoveChapter = (index: number) => {
        const newChapters = chapters.filter((_, i) => i !== index);
        setChapters(renumberChapters(newChapters));
    };

    const handleMoveChapter = (index: number, direction: 'up' | 'down') => {
        const newChapters = [...chapters];
        if (direction === 'up' && index > 0) {
            [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]];
            setChapters(renumberChapters(newChapters));
        } else if (direction === 'down' && index < chapters.length - 1) {
            [newChapters[index + 1], newChapters[index]] = [newChapters[index], newChapters[index + 1]];
            setChapters(renumberChapters(newChapters));
        }
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditingText(chapters[index].replace(/^\d+\.\s*/, ''));
    };

    const finishEditing = (index: number) => {
        if (editingText.trim()) {
            const newChapters = [...chapters];
            newChapters[index] = editingText.trim();
            setChapters(renumberChapters(newChapters));
        }
        setEditingIndex(null);
        setEditingText('');
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const syllabusRef = doc(firestore, 'syllabuses', subjectData.id);
        try {
            await setDoc(syllabusRef, {
                exam,
                subject: subjectKey,
                chapters: chapters,
            });
            toast({
                title: 'Syllabus Saved',
                description: `Changes for ${subjectTitle} have been saved.`,
            });
            onSave();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="text-2xl">Editing: {subjectTitle}</DialogTitle>
                <DialogDescription>
                    Add, remove, edit, and reorder chapters for this subject.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow my-4 -mx-6 px-6 overflow-y-hidden">
                <ScrollArea className="h-full pr-4">
                    <ul className="space-y-2">
                        {chapters.map((chapter, index) => (
                            <li key={`${chapter}-${index}`} className="group flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                               {editingIndex === index ? (
                                    <Input
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onBlur={() => finishEditing(index)}
                                        onKeyDown={(e) => e.key === 'Enter' && finishEditing(index)}
                                        autoFocus
                                        className="flex-1 h-8"
                                    />
                               ) : (
                                    <span className="flex-1 font-medium">{chapter}</span>
                               )}

                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(index)}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveChapter(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveChapter(index, 'down')} disabled={index === chapters.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveChapter(index)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
             <div className="flex items-center gap-2 mt-auto pt-4 border-t">
                <Input
                    placeholder="Add a new chapter..."
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    onKeyDown={(e) => {if(e.key === 'Enter') {e.preventDefault(); handleAddChapter()}}}
                    className="h-9"
                />
                <Button onClick={handleAddChapter} size="icon" className="h-9 w-9 shrink-0"><Plus /></Button>
            </div>
            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button variant="outline" disabled={isSaving}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};


export function SyllabusEditor() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [syllabuses, setSyllabuses] = useState<SyllabusData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);

    const [isDownloading, setIsDownloading] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [pdfContent, setPdfContent] = useState<{exam: 'NEET' | 'JEE', syllabus: any} | null>(null);

    const fetchSyllabuses = useCallback(async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(firestore, 'syllabuses'));
            const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SyllabusDoc));
            
            const structuredData: SyllabusData = {
                NEET: {},
                JEE: {},
            };
            
            docs.forEach(doc => {
                if (doc.exam && doc.subject) {
                    structuredData[doc.exam][doc.subject] = {
                        id: doc.id,
                        chapters: doc.chapters,
                    };
                }
            });

            setSyllabuses(structuredData);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error fetching syllabuses',
                description: error.message || 'Could not load data from Firestore.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [firestore, toast]);

    useEffect(() => {
        fetchSyllabuses();
    }, [fetchSyllabuses]);

    useEffect(() => {
        if (pdfContent && pdfRef.current) {
            html2canvas(pdfRef.current, { scale: 3, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / pdfWidth;
                const finalHeight = imgHeight / ratio;
                let heightLeft = finalHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = heightLeft - finalHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
                    heightLeft -= pdfHeight;
                }
                pdf.save(`${pdfContent.exam}-Syllabus.pdf`);
                setPdfContent(null);
                setIsDownloading(false);
            }).catch(e => {
                console.error("Error generating PDF:", e);
                setPdfContent(null);
                setIsDownloading(false);
                toast({
                    variant: 'destructive',
                    title: 'Download Failed',
                    description: 'Could not generate PDF. Please try again.',
                });
            });
        }
    }, [pdfContent, toast]);


    const handleDownload = (exam: 'NEET' | 'JEE') => {
        setIsDownloading(true);
        const syllabusToDownload = ALL_SUBJECTS[exam];
        setPdfContent({ exam, syllabus: syllabusToDownload });
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            const batch = writeBatch(firestore);

            for (const exam of ['NEET', 'JEE'] as const) {
                const subjects = ALL_SUBJECTS[exam];
                for (const subjectName of Object.keys(subjects)) {
                    const docId = `${exam.toLowerCase()}-${subjectName}`;
                    const chapters = subjects[subjectName as keyof typeof subjects];
                    const docRef = doc(firestore, 'syllabuses', docId);
                    batch.set(docRef, {
                        exam,
                        subject: subjectName,
                        chapters,
                    });
                }
            }

            await batch.commit();
            toast({
                title: 'Seeding complete!',
                description: 'Default syllabus data has been written to Firestore.',
            });
            await fetchSyllabuses();
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Seeding failed',
                description: error.message || 'Could not seed default syllabus data.',
            });
        } finally {
            setIsSeeding(false);
        }
    };
    
    const renderSyllabusGrid = (exam: 'NEET' | 'JEE') => {
        if (!syllabuses) return null;
        const examSyllabus = ALL_SUBJECTS[exam];
        const subjectKeys = Object.keys(examSyllabus);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectKeys.map(subjectKey => {
                    const subjectData = syllabuses?.[exam]?.[subjectKey] ?? { id: `${exam.toLowerCase()}-${subjectKey}`, chapters: [] };
                    const subjectTitle = subjectKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    const chapterCount = subjectData.chapters.length;

                    return (
                        <Dialog key={subjectKey}>
                            <Card className="flex flex-col bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg hover:border-primary/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3"><BookCopy className="text-primary"/> {subjectTitle}</CardTitle>
                                    <CardDescription>{chapterCount} chapters</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <ScrollArea className="h-40">
                                        <ul className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                                            {subjectData.chapters.slice(0, 5).map((chap, i) => <li key={i} className="truncate">{chap}</li>)}
                                            {chapterCount > 5 && <li>...and {chapterCount - 5} more</li>}
                                        </ul>
                                    </ScrollArea>
                                </CardContent>
                                <CardFooter>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">
                                            <Edit className="mr-2 h-4 w-4"/>
                                            Manage Chapters
                                        </Button>
                                    </DialogTrigger>
                                </CardFooter>
                            </Card>
                            <SubjectEditorDialog exam={exam} subjectKey={subjectKey} subjectData={subjectData} onSave={fetchSyllabuses} />
                        </Dialog>
                    );
                })}
            </div>
        );
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            {pdfContent && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                    <div ref={pdfRef}>
                        <SyllabusPdfLayout exam={pdfContent.exam} allSyllabus={pdfContent.syllabus} />
                    </div>
                </div>
            )}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Seed Database</CardTitle>
                        <CardDescription>Populate Firestore with the default syllabus data from the application code.</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isSeeding}>
                                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                                Seed Default Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will overwrite any existing syllabus data in Firestore with the default values from the application code. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSeedData} disabled={isSeeding} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Overwrite and Seed"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
            </Card>

            <Tabs defaultValue="neet">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="neet">NEET Syllabus</TabsTrigger>
                    <TabsTrigger value="jee">JEE Syllabus</TabsTrigger>
                </TabsList>
                <TabsContent value="neet" className="mt-6">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => handleDownload('NEET')} disabled={isDownloading || isLoading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                    {renderSyllabusGrid('NEET')}
                </TabsContent>
                <TabsContent value="jee" className="mt-6">
                     <div className="flex justify-end mb-4">
                        <Button onClick={() => handleDownload('JEE')} disabled={isDownloading || isLoading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                    {renderSyllabusGrid('JEE')}
                </TabsContent>
            </Tabs>
        </div>
    );
}
