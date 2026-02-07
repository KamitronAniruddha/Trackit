'use client';

import { SubjectProgressCard } from '@/components/subject-progress-card';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Loader2 } from 'lucide-react';
import { ExamCountdownCard } from '@/components/exam-countdown-card';

export default function DashboardPage() {
  const { profile, loading } = useUserProfile();

  if (loading || !profile) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const exam = profile.exam;

  const neetSubjects: ('physics' | 'chemistry' | 'biology')[] = ['physics', 'chemistry', 'biology'];
  const jeeSubjects: ('physics' | 'chemistry' | 'mathematics')[] = ['physics', 'chemistry', 'mathematics'];

  const subjects = exam === 'JEE' ? jeeSubjects : neetSubjects;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome, {profile.displayName}!</h1>
        <p className="text-muted-foreground mt-2">Here&apos;s a snapshot of your {exam} preparation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {subjects.map(subject => <SubjectProgressCard key={subject} subject={subject} />)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ExamCountdownCard />
        </div>
      </div>

    </div>
  );
}
