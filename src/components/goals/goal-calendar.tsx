'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { DailyGoal } from './goal-dashboard';
import { Skeleton } from '../ui/skeleton';

interface GoalCalendarProps {
    selectedDate: Date | undefined;
    onSelectDate: (date: Date | undefined) => void;
}

export function GoalCalendar({ selectedDate, onSelectDate }: GoalCalendarProps) {
  const { profile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!profile) {
        if (!profileLoading) setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const goalsRef = collection(firestore, 'users', profile.uid, 'dailyGoals');
    const q = query(
      goalsRef,
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const monthlyGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyGoal));
      setGoals(monthlyGoals);
      setIsLoading(false);
    }, () => {
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile, firestore, currentMonth, profileLoading]);

  const completedDays = goals.filter(g => g.completed).map(g => parse(g.date, 'yyyy-MM-dd', new Date()));
  
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const failedDays = goals
    .filter(g => !g.completed && g.date < todayString)
    .map(g => parse(g.date, 'yyyy-MM-dd', new Date()));
  
  const modifiers = {
    completed: completedDays,
    failed: failedDays
  };
  
  if (isLoading) {
    return <Skeleton className="w-[280px] h-[330px] mx-auto" />
  }

  return (
     <div className="flex justify-center">
        <Calendar
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate}
            onSelect={onSelectDate}
            modifiers={modifiers}
            modifiersClassNames={{
                completed: 'bg-green-500/20 text-green-700 dark:text-green-300 rounded-md',
                failed: 'bg-destructive/20 text-destructive dark:text-destructive rounded-md',
            }}
            className="p-0"
            classNames={{
                day_selected: 'bg-primary text-primary-foreground',
                day_today: 'bg-accent/50 text-accent-foreground rounded-md',
                head_cell: 'w-full',
            }}
            showOutsideDays
            disabled={(date) => date < new Date("2000-01-01")}
        />
    </div>
  );
}
