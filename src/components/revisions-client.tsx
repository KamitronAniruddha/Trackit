
'use client';

import { useMemo, useState, useTransition } from 'react';
import { useProgress } from '@/hooks/use-progress';
import { useSyllabus } from '@/contexts/syllabus-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookCheck, History, Wand2 } from 'lucide-react';
import type { Subject } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { generateTimetableAction } from '@/app/dashboard/revisions/actions';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { PremiumFeatureLock } from './premium-lock';

export function RevisionsClient() {
  const { progress, revisions, logRevision, isLoaded: progressLoaded } = useProgress();
  const { syllabuses, loading: syllabusLoading } = useSyllabus();
  const { profile, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  const [isGenerating, startGenerating] = useTransition();
  const [generatedTimetable, setGeneratedTimetable] = useState<string | null>(null);
  const [isTimetableDialogOpen, setIsTimetableDialogOpen] = useState(false);
  const [currentSubjectTimetable, setCurrentSubjectTimetable] = useState('');

  const loading = syllabusLoading || profileLoading || !progressLoaded;

  const completedSubjects = useMemo(() => {
    if (loading || !profile?.exam || !syllabuses || !syllabuses[profile.exam]) {
      return [];
    }
    
    const examSyllabus = syllabuses[profile.exam];
    if (!examSyllabus) return [];

    const subjectsForExam = Object.keys(examSyllabus) as Subject[];
    const completed: Subject[] = [];

    subjectsForExam.forEach(subject => {
      if (subject === 'chemistry') return; 
      
      const subjectProgress = progress[subject];
      const subjectSyllabusChapters = examSyllabus?.[subject]?.chapters;
      if (!subjectProgress || !subjectSyllabusChapters || subjectSyllabusChapters.length === 0) return;

      const totalChapters = subjectSyllabusChapters.length;
      const completedChapters = subjectSyllabusChapters.filter(ch => subjectProgress[ch]?.completed).length;

      if (totalChapters > 0 && totalChapters === completedChapters) {
        completed.push(subject);
      }
    });

    if (profile.exam === 'NEET' || profile.exam === 'JEE') {
        const chemSubjects: Subject[] = ['physical-chemistry', 'organic-chemistry', 'inorganic-chemistry'];
        let allChemCompleted = true;
        for (const subj of chemSubjects) {
            const subjectProgress = progress[subj];
            const subjectSyllabusChapters = examSyllabus?.[subj]?.chapters;
             if (!subjectProgress || !subjectSyllabusChapters || subjectSyllabusChapters.length === 0) {
                 allChemCompleted = false;
                 break;
             };
            const total = subjectSyllabusChapters.length;
            const done = subjectSyllabusChapters.filter(ch => subjectProgress[ch]?.completed).length;
            if(total === 0 || total !== done) {
                allChemCompleted = false;
                break;
            }
        }
        if(allChemCompleted) {
            completed.push('chemistry');
        }
    }


    return completed;
  }, [progress, syllabuses, profile, loading]);

  const handleGenerateTimetable = (subject: Subject) => {
    if (!profile?.exam) return;

    const subjectTitle = subject.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    setCurrentSubjectTimetable(subjectTitle);
    setGeneratedTimetable(null);
    setIsTimetableDialogOpen(true);

    startGenerating(async () => {
        const result = await generateTimetableAction(subjectTitle, profile.exam!);
        if (result.error) {
            toast({ variant: 'destructive', title: 'AI Error', description: result.error });
            setIsTimetableDialogOpen(false);
        } else {
            setGeneratedTimetable(result.timetableHtml || null);
        }
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile?.isPremium) {
    return <PremiumFeatureLock featureName="AI Revision Hub" description="Generate AI-powered revision plans and track your revision history." />;
  }

  return (
    <>
      {completedSubjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg border border-dashed">
            <BookCheck className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">No Subjects Completed Yet</h3>
            <p className="text-sm mt-2">Complete all chapters in a subject to unlock revision tools here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedSubjects.map(subject => {
            const revisionHistory = revisions[subject] || [];
            const revisionCount = revisionHistory.length;
            const subjectTitle = subject.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            
            return (
                <Card key={subject} className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{subjectTitle}</span>
                            <div className="text-sm font-semibold flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full">
                                <BookCheck className="h-4 w-4" />
                                Completed
                            </div>
                        </CardTitle>
                        <CardDescription>
                            You have completed all chapters in this subject.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Revision History</h4>
                            {revisionCount > 0 ? (
                                <ScrollArea className="max-h-24">
                                <div className="space-y-2 text-sm text-muted-foreground pr-4">
                                    {revisionHistory.slice().reverse().map((entry, index) => (
                                      <p key={index}>
                                          <span className='font-semibold text-foreground'>{revisionCount - index}.</span> {format(entry.timestamp.toDate(), "PP")}
                                          <span className="ml-2 text-muted-foreground/80">({formatDistanceToNow(entry.timestamp.toDate(), { addSuffix: true })})</span>
                                      </p>
                                    ))}
                                </div>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground">No revisions logged yet.</p>
                            )}
                        </div>
                         <div className="border-t pt-4 flex flex-col sm:flex-row gap-2">
                             <Button className="flex-1" variant="outline" onClick={() => handleGenerateTimetable(subject)}>
                                <Wand2 className="mr-2 h-4 w-4" /> Generate AI Timetable
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )
          })}
        </div>
      )}
      
      <Dialog open={isTimetableDialogOpen} onOpenChange={setIsTimetableDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl">AI Revision Timetable for {currentSubjectTimetable}</DialogTitle>
                <DialogDescription>
                    Here is a suggested 7-day revision plan to solidify your knowledge.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4 pr-6">
                {isGenerating ? (
                     <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p>Your AI coach is crafting the perfect plan...</p>
                    </div>
                ) : (
                    generatedTimetable && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: generatedTimetable }} />
                )}
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
