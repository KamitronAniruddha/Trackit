'use client';

import { useProgress } from '@/hooks/use-progress';
import { useSyllabus } from '@/contexts/syllabus-context';
import type { Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/contexts/user-profile-context';
import { ChapterEditor } from './chapter-editor';

interface ChapterTrackerProps {
  subject: Subject;
}

export function ChapterTracker({ subject }: ChapterTrackerProps) {
  const { progress, isLoaded } = useProgress();
  const { profile, loading: profileLoading } = useUserProfile();
  const { syllabuses, loading: syllabusLoading } = useSyllabus();

  if (profileLoading || syllabusLoading || !profile?.exam || !syllabuses || !syllabuses[profile.exam]) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
        </div>
    );
  }
  
  const examSyllabus = syllabuses[profile.exam];
  const chapters = examSyllabus?.[subject]?.chapters || [];
  const subjectProgress = progress[subject];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {!isLoaded || !subjectProgress ? (
        Array.from({ length: chapters.length || 12 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))
      ) : chapters.map((chapter) => (
          <ChapterEditor
            key={chapter}
            subject={subject}
            chapter={chapter}
          />
        )
      )}
    </div>
  );
}
