'use client';

import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useSyllabus, type SyllabusData } from '@/contexts/syllabus-context';
import type { Subject } from '@/lib/types';
import { useUserProfile } from '@/contexts/user-profile-context';
import { doc, onSnapshot, setDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

export interface ChapterProgress {
  completed: boolean;
  questions: number;
  confidence: number;
  revisions: number[]; // Array of timestamps
}

export type ProgressState = Record<Subject, Record<string, ChapterProgress>>;

export type RevisionEntry = {
  timestamp: Timestamp;
  questions: number;
};

export type RevisionsState = Record<string, RevisionEntry[]>;


const getInitialState = (exam: 'NEET' | 'JEE', syllabusData: SyllabusData | null): ProgressState => {
  const initialState = {} as ProgressState;
  if (!syllabusData) return initialState;

  const examSyllabus = syllabusData[exam];
  if (!examSyllabus) return initialState;
  
  for (const subjectKey of Object.keys(examSyllabus)) {
    const subject = subjectKey as Subject;
    const subjectData = examSyllabus[subject];
    if(subjectData) {
        initialState[subject] = {};
        for (const chapter of subjectData.chapters) {
          initialState[subject][chapter] = {
            completed: false,
            questions: 0,
            confidence: 50,
            revisions: [],
          };
        }
    }
  }
  return initialState;
};

interface ProgressContextType {
  progress: ProgressState;
  revisions: RevisionsState;
  updateProgress: (subject: Subject, chapter: string, values: Partial<ChapterProgress>) => void;
  logRevision: (subject: Subject, questions: number) => void;
  isLoaded: boolean;
}

export const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useUserProfile();
  const { syllabuses, loading: syllabusLoading } = useSyllabus();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [progress, setProgress] = useState<ProgressState>({} as ProgressState);
  const [revisions, setRevisions] = useState<RevisionsState>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (profileLoading || syllabusLoading || !profile || !profile.onboardingCompleted || !syllabuses) {
      if (!profileLoading && !syllabusLoading) setIsLoaded(true);
      return;
    };

    const docRef = doc(firestore, 'userProgress', profile.uid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      const initialState = getInitialState(profile.exam!, syllabuses);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedProgress = data.progress || {};
        
        for (const subject of Object.keys(initialState) as Subject[]) {
          if (storedProgress[subject]) {
             for (const chapter of Object.keys(initialState[subject])) {
                if (storedProgress[subject][chapter]) {
                    initialState[subject][chapter] = {
                        ...initialState[subject][chapter],
                        ...storedProgress[subject][chapter],
                    }
                }
             }
          }
        }
        setProgress(initialState);
        
        const storedRevisions = data.revisions || {};
        setRevisions(storedRevisions);

      } else {
        setProgress(initialState);
        setRevisions({});
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Failed to subscribe to progress from Firestore", error);
        toast({
            variant: "destructive",
            title: "Loading Error",
            description: "Could not load your progress data. Please check security rules and your connection."
        });
        setIsLoaded(true);
    });
    
    return () => unsubscribe();
  }, [profile, profileLoading, firestore, syllabuses, syllabusLoading, toast]);

  const updateProgress = useCallback(async (subject: Subject, chapter: string, values: Partial<ChapterProgress>) => {
    if (!profile) {
      toast({
        variant: 'destructive',
        title: 'Not signed in',
        description: "You must be signed in to save progress.",
      });
      return;
    }
    
    const docRef = doc(firestore, 'userProgress', profile.uid);

    const updatePayload = {
      progress: {
        [subject]: {
          [chapter]: values,
        },
      },
    };

    try {
      await setDoc(docRef, updatePayload, { merge: true });
    } catch (error: any) {
        console.error("Firebase setDoc failed:", error);
        toast({
            variant: 'destructive',
            title: 'Sync Error',
            description: 'Could not save your progress. Please check your connection.',
        });
    }
  }, [profile, firestore, toast]);


  const logRevision = useCallback(async (subject: Subject, questions: number) => {
    if (!profile || !syllabuses) return;

    const docRef = doc(firestore, 'userProgress', profile.uid);
    const revisionEntry = {
        timestamp: Timestamp.now(),
        questions: questions,
    };
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) {
                const initialProgress = getInitialState(profile.exam!, syllabuses);
                transaction.set(docRef, {
                    progress: initialProgress,
                    revisions: { [subject]: [revisionEntry] }
                });
            } else {
                const currentRevisions = sfDoc.data().revisions?.[subject] || [];
                transaction.update(docRef, {
                    [`revisions.${subject}`]: [...currentRevisions, revisionEntry]
                });
            }
        });
    } catch (e: any) {
        console.error("Failed to log revision transaction:", e);
        toast({
            variant: 'destructive',
            title: 'Sync Error',
            description: 'Could not log your revision. Please try again.',
        });
    }
  }, [profile, firestore, syllabuses, toast]);

  const value = useMemo(() => ({
    progress,
    revisions,
    updateProgress,
    logRevision,
    isLoaded,
  }), [progress, revisions, updateProgress, logRevision, isLoaded]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}
