'use client';

import Link from 'next/link';
import { useProgress } from '@/hooks/use-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Subject } from '@/lib/types';
import { BookOpen, Dna, FlaskConical, Atom, Hexagon, Calculator } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useSyllabus } from '@/contexts/syllabus-context';

const subjectDetails: Record<Subject, { name: string; icon: React.ElementType; color: string; href?: string }> = {
  physics: { name: 'Physics', icon: BookOpen, color: 'text-chart-1' },
  'physical-chemistry': { name: 'Physical', icon: FlaskConical, color: 'text-chart-2', href: '/dashboard/physical-chemistry' },
  'organic-chemistry': { name: 'Organic', icon: Hexagon, color: 'text-chart-4', href: '/dashboard/organic-chemistry' },
  'inorganic-chemistry': { name: 'Inorganic', icon: Atom, color: 'text-chart-5', href: '/dashboard/inorganic-chemistry' },
  biology: { name: 'Biology', icon: Dna, color: 'text-chart-3' },
  chemistry: { name: 'Chemistry', icon: FlaskConical, color: 'text-chart-2' },
  mathematics: { name: 'Mathematics', icon: Calculator, color: 'text-chart-4' },
};

interface SubjectProgressCardProps {
  subject: Subject;
}

export function SubjectProgressCard({ subject }: SubjectProgressCardProps) {
  const { progress, isLoaded: progressLoaded } = useProgress();
  const { profile, loading: profileLoading } = useUserProfile();
  const { syllabuses, loading: syllabusLoading } = useSyllabus();

  const isLoading = !progressLoaded || profileLoading || syllabusLoading;

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }
  
  if (!profile?.exam || !syllabuses || !syllabuses[profile.exam]) {
      return <Skeleton className="h-[200px] w-full" />;
  }

  let totalChapters = 0;
  let completedChapters = 0;
  const examSyllabus = syllabuses[profile.exam];

  if (subject === 'chemistry') {
    const chemSubjects: Subject[] = ['physical-chemistry', 'organic-chemistry', 'inorganic-chemistry'];
    
    chemSubjects.forEach(s => {
        const subSyllabusChapters = examSyllabus?.[s]?.chapters || [];
        if (examSyllabus && subSyllabusChapters.length > 0) {
            totalChapters += subSyllabusChapters.length;

            const subProgress = progress[s];
            if (subProgress) {
                completedChapters += subSyllabusChapters.filter(chapter => subProgress[chapter]?.completed).length;
            }
        }
    });

  } else {
    const syllabusChapters = examSyllabus?.[subject]?.chapters || [];
    totalChapters = syllabusChapters.length;

    const subjectProgress = progress[subject];
    if (subjectProgress) {
        completedChapters = syllabusChapters.filter((chapter) => subjectProgress[chapter]?.completed).length;
    }
  }
  
  const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  
  const { name, icon: Icon, color, href } = subjectDetails[subject];
  const linkHref = href || `/dashboard/${subject}`;

  return (
    <Link href={linkHref} className="block group">
      <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">{name}</CardTitle>
          <Icon className={`h-7 w-7 text-muted-foreground ${color} transition-transform group-hover:scale-110`} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {completedChapters}<span className="text-xl text-muted-foreground">/{totalChapters}</span>
          </div>
          <p className="text-xs text-muted-foreground">Chapters completed</p>
          <Progress value={progressPercentage} className="mt-4 h-2" />
        </CardContent>
      </Card>
    </Link>
  );
}
