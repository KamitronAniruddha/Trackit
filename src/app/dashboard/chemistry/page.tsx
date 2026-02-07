
'use client';

import { SubjectProgressCard } from '@/components/subject-progress-card';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Loader2 } from 'lucide-react';

export default function ChemistryPage() {
  const { profile, loading } = useUserProfile();

  if (loading || !profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Chemistry</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress in Physical, Organic, and Inorganic Chemistry.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <SubjectProgressCard subject="physical-chemistry" />
        <SubjectProgressCard subject="organic-chemistry" />
        <SubjectProgressCard subject="inorganic-chemistry" />
      </div>
    </div>
  );
}
