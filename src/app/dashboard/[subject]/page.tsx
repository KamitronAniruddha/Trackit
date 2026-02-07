'use client';
import { notFound, useParams } from 'next/navigation';
import { ChapterTracker } from '@/components/chapter-tracker';
import type { Subject } from '@/lib/types';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useSyllabus } from '@/contexts/syllabus-context';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UnitTracker } from '@/components/unit-tracker';

export default function SubjectPage() {
  const params = useParams();
  const subject = params.subject as string;
  const { profile, loading: profileLoading } = useUserProfile();
  const { syllabuses, loading: syllabusLoading } = useSyllabus();

  const loading = profileLoading || syllabusLoading;

  if (loading || !profile || !syllabuses || !subject) {
    return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const examSyllabus = syllabuses[profile.exam!];
  const validSubjects = examSyllabus ? Object.keys(examSyllabus) : [];

  if (!validSubjects.includes(subject)) {
    notFound();
  }

  const subjectTitle = subject
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Syllabus Tracker - {subjectTitle}</h1>
        <p className="text-muted-foreground">
          Update your progress to get accurate AI recommendations.
        </p>
      </div>

      <Tabs defaultValue="chapters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>
        <TabsContent value="chapters" className="mt-6">
          <ChapterTracker subject={subject as Subject} />
        </TabsContent>
        <TabsContent value="units" className="mt-6">
          <UnitTracker subject={subject as Subject} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
