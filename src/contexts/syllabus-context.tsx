
'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { Subject } from '@/lib/types';

interface Syllabus {
    id: string;
    exam: 'NEET' | 'JEE';
    subject: string;
    chapters: string[];
}

export type SyllabusData = {
    [exam in 'NEET' | 'JEE']?: {
        [subject in Subject]?: {
            id: string;
            chapters: string[];
        };
    };
};

interface SyllabusContextType {
  syllabuses: SyllabusData | null;
  loading: boolean;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

export function SyllabusProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const [syllabuses, setSyllabuses] = useState<SyllabusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) {
            setLoading(false);
            return;
        }

        const syllabusColRef = collection(firestore, 'syllabuses');
        const unsubscribe = onSnapshot(syllabusColRef, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Syllabus));
            
            const structuredData: SyllabusData = {
                NEET: {},
                JEE: {},
            };
            
            docs.forEach(doc => {
                if (doc.exam && doc.subject) {
                    if (!structuredData[doc.exam]) {
                        structuredData[doc.exam] = {};
                    }
                    structuredData[doc.exam]![doc.subject as Subject] = {
                        id: doc.id,
                        chapters: doc.chapters,
                    };
                }
            });

            setSyllabuses(structuredData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching syllabus:", error);
            setSyllabuses(null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);
    
    const value = useMemo(() => ({ syllabuses, loading }), [syllabuses, loading]);

    return (
        <SyllabusContext.Provider value={value}>
            {children}
        </SyllabusContext.Provider>
    );
}

export const useSyllabus = () => {
    const context = useContext(SyllabusContext);
    if (context === undefined) {
        throw new Error('useSyllabus must be used within a SyllabusProvider');
    }
    return context;
};
