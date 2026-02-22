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

const subjectDetails: Record<Subject, { name: string; icon: React.ElementType; color: string; href?: string; gradient: string }> = {
  physics: { name: 'Physics', icon: BookOpen, color: 'text-blue-400', href: '/dashboard/physics', gradient: 'from-blue-500/10 to-transparent' },
  'physical-chemistry': { name: 'Physical', icon: FlaskConical, color: 'text-rose-400', href: '/dashboard/physical-chemistry', gradient: 'from-rose-500/10 to-transparent' },
  'organic-chemistry': { name: 'Organic', icon: Hexagon, color: 'text-amber-400', href: '/dashboard/organic-chemistry', gradient: 'from-amber-500/10 to-transparent' },
  'inorganic-chemistry': { name: 'Inorganic', icon: Atom, color: 'text-teal-400', href: '/dashboard/inorganic-chemistry', gradient: 'from-teal-500/10 to-transparent' },
  biology: { name: 'Biology', icon: Dna, color: 'text-green-400', href: '/dashboard/biology', gradient: 'from-green-500/10 to-transparent' },
  chemistry: { name: 'Chemistry', icon: FlaskConical, color: 'text-rose-400', href: '/dashboard/chemistry', gradient: 'from-rose-500/10 to-transparent' },
  mathematics: { name: 'Mathematics', icon: Calculator, color: 'text-cyan-400', href: '/dashboard/mathematics', gradient: 'from-cyan-500/10 to-transparent' },
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
    return <Skeleton className="h-[180px] w-full" />;
  }
  
  if (!profile?.exam || !syllabuses || !syllabuses[profile.exam]) {
      return <Skeleton className="h-[180px] w-full" />;
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
  
  const { name, icon: Icon, color, href, gradient } = subjectDetails[subject];
  const linkHref = href || `/dashboard/${subject}`;

  return (
    <Link href={linkHref} className="block group">
      <Card className={`h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        <div className="absolute -top-8 -right-8 h-24 w-24 opacity-20 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500">
            <Icon className={`h-full w-full ${color}`} />
        </div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 z-10">
          <CardTitle className="text-xl font-bold">{name}</CardTitle>
        </CardHeader>
        <CardContent className="z-10">
          <div className="text-4xl font-extrabold">
            {completedChapters}<span className="text-2xl text-muted-foreground">/{totalChapters}</span>
          </div>
          <p className="text-xs text-muted-foreground">Chapters completed</p>
          <Progress value={progressPercentage} className="mt-4 h-2" indicatorClassName={color.replace('text-', 'bg-')}/>
        </CardContent>
      </Card>
    </Link>
  );
}