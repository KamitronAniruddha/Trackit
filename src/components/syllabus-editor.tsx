
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ALL_SUBJECTS } from '@/lib/neet-syllabus';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
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

function SubjectEditor({ exam, subject, initialChapters, docId }: { exam: 'NEET' | 'JEE', subject: string, initialChapters: string[], docId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [chapters, setChapters] = useState(initialChapters.join('\n'));
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const chapterArray = chapters.split('\n').map(c => c.trim()).filter(c => c);
        const syllabusRef = doc(firestore, 'syllabuses', docId);

        try {
            await setDoc(syllabusRef, {
                exam,
                subject,
                chapters: chapterArray,
            });
            toast({
                title: 'Syllabus Saved',
                description: `Changes for ${subject} have been saved.`,
            });
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
        <div className="space-y-4">
            <Textarea
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                rows={15}
                className="bg-background/50 font-mono text-sm"
                placeholder="Enter one chapter per line..."
            />
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
        </div>
    );
}


export function SyllabusEditor() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [syllabuses, setSyllabuses] = useState<SyllabusData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);

    const [isDownloading, setIsDownloading] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [pdfContent, setPdfContent] = useState<{exam: 'NEET' | 'JEE', syllabus: any} | null>(null);

    const fetchSyllabuses = async () => {
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
    };

    useEffect(() => {
        fetchSyllabuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                setPdfContent(null); // Clean up
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
    
    const renderSyllabus = (exam: 'NEET' | 'JEE') => {
        const examSubjects = ALL_SUBJECTS[exam];

        return (
            <Accordion type="single" collapsible className="w-full">
                {Object.keys(examSubjects).map(subjectKey => {
                    const subjectData = syllabuses?.[exam]?.[subjectKey];
                    const docId = subjectData?.id || `${exam.toLowerCase()}-${subjectKey}`;

                    // Capitalize subjectKey for display
                    const subjectTitle = subjectKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    return (
                        <AccordionItem value={subjectKey} key={subjectKey}>
                            <AccordionTrigger className="text-lg font-medium">{subjectTitle}</AccordionTrigger>
                            <AccordionContent>
                                <SubjectEditor 
                                    exam={exam}
                                    subject={subjectKey}
                                    initialChapters={subjectData?.chapters || []}
                                    docId={docId}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
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
                                <AlertDialogAction onClick={handleSeedData}>
                                    Yes, Overwrite and Seed
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
                <TabsContent value="neet" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => handleDownload('NEET')} disabled={isDownloading || isLoading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                    {renderSyllabus('NEET')}
                </TabsContent>
                <TabsContent value="jee" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => handleDownload('JEE')} disabled={isDownloading || isLoading}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                    {renderSyllabus('JEE')}
                </TabsContent>
            </Tabs>
        </div>
    );
}
