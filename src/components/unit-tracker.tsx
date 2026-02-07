'use client';

import { useMemo } from 'react';
import { useProgress } from '@/hooks/use-progress';
import { useUserProfile } from '@/contexts/user-profile-context';
import type { Subject } from '@/lib/types';
import { ALL_SUBJECTS_WITH_UNITS } from '@/lib/neet-syllabus';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from './ui/progress';
import { BrainCircuit, CheckCircle, Clock, ListChecks, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ChapterEditor } from './chapter-editor';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface UnitTrackerProps {
    subject: Subject;
}

const Stat = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string, label: string }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">{value}</span>
        <span className="text-muted-foreground">{label}</span>
    </div>
);

export function UnitTracker({ subject }: UnitTrackerProps) {
    const { progress, isLoaded } = useProgress();
    const { profile, loading: profileLoading } = useUserProfile();

    const unitSyllabus = useMemo(() => {
        if (!profile?.exam) return null;
        const examSyllabus = ALL_SUBJECTS_WITH_UNITS[profile.exam];
        return examSyllabus[subject as keyof typeof examSyllabus] || null;
    }, [profile?.exam, subject]);

    const units = useMemo(() => {
        if (!unitSyllabus || !isLoaded || !progress[subject]) return null;

        return Object.entries(unitSyllabus).map(([unitName, chapters]) => {
            const subjectProgress = progress[subject];
            let completedChapters = 0;
            let totalConfidence = 0;
            let totalMcqs = 0;
            const allRevisions: number[] = [];

            chapters.forEach(chapter => {
                const chapterData = subjectProgress[chapter];
                if (chapterData) {
                    if (chapterData.completed) completedChapters++;
                    totalConfidence += chapterData.confidence || 0;
                    totalMcqs += chapterData.questions || 0;
                    if(chapterData.revisions) allRevisions.push(...chapterData.revisions);
                }
            });

            const completion = chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0;
            const avgConfidence = chapters.length > 0 ? totalConfidence / chapters.length : 0;
            const latestRevision = allRevisions.length > 0 ? Math.max(...allRevisions) : null;

            return {
                name: unitName,
                chapters,
                completion,
                avgConfidence,
                totalMcqs,
                latestRevision,
            };
        });
    }, [unitSyllabus, progress, subject, isLoaded]);

    if (profileLoading || !isLoaded) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }
    
    if (!unitSyllabus) {
        return <p>This subject does not have a unit-based syllabus defined.</p>;
    }
    
    if (!units) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {units.map((unit, index) => (
                <Card key={unit.name} className="bg-card/50 backdrop-blur-sm overflow-hidden">
                    <AccordionItem value={`item-${index}`} className="border-b-0">
                        <AccordionTrigger className="p-6 hover:no-underline hover:bg-muted/50">
                            <div className="w-full pr-4">
                                <h3 className="font-semibold text-xl text-left">{unit.name}</h3>
                                <div className="mt-4 space-y-3 text-left">
                                    <div className="flex items-center gap-4">
                                        <Progress value={unit.completion} className="h-2 flex-1" />
                                        <span className="font-bold text-lg w-20 text-right">{unit.completion.toFixed(0)}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                                        <Stat icon={CheckCircle} value={`${unit.chapters.filter(c => progress[subject]?.[c]?.completed).length}/${unit.chapters.length}`} label="Chapters" />
                                        <Stat icon={BrainCircuit} value={`${unit.avgConfidence.toFixed(0)}%`} label="Confidence" />
                                        <Stat icon={ListChecks} value={unit.totalMcqs.toLocaleString()} label="MCQs" />
                                        {unit.latestRevision && (
                                            <Stat icon={Clock} value={formatDistanceToNow(new Date(unit.latestRevision), { addSuffix: true })} label="Last Revised" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="bg-muted/30">
                               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                                    {unit.chapters.map(chapter => (
                                        <ChapterEditor
                                            key={chapter}
                                            subject={subject}
                                            chapter={chapter}
                                        />
                                    ))}
                               </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            ))}
        </Accordion>
    );
}
