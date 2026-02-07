
'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useFirestore } from '@/firebase/provider';
import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Loader2, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SetGoalDialog } from './set-goal-dialog';
import { StreakTracker } from './streak-tracker';
import { GoalCalendar } from './goal-calendar';
import type { Subject } from '@/lib/types';
import { useProgress } from '@/hooks/use-progress';
import { cn } from '@/lib/utils';

export interface SubGoal {
  type: 'chapter' | 'custom';
  subject?: Subject;
  chapter?: string;
  text?: string;
  completed: boolean;
}

export interface DailyGoal {
  id: string; // date string
  userId: string;
  date: string; // YYYY-MM-DD
  goals: SubGoal[];
  completed: boolean; // True if all sub-goals are completed
}

export function GoalDashboard() {
  const { profile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { updateProgress } = useProgress();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null | undefined>(undefined);
  const [isCompleting, setIsCompleting] = useState<number | null>(null);
  const [isSetGoalDialogOpen, setIsSetGoalDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const todayString = format(new Date(), 'yyyy-MM-dd');
  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const isDateInPast = selectedDateString ? selectedDateString < todayString : false;

  useEffect(() => {
    if (!profile || !selectedDateString) {
      if (!profileLoading) {
          setIsLoading(false);
          setSelectedGoal(null);
      }
      return;
    }

    setIsLoading(true);
    const goalRef = doc(firestore, 'users', profile.uid, 'dailyGoals', selectedDateString);
    const unsubscribe = onSnapshot(goalRef, (docSnap) => {
      if (docSnap.exists()) {
        setSelectedGoal({ id: docSnap.id, ...docSnap.data() } as DailyGoal);
      } else {
        setSelectedGoal(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile, firestore, selectedDateString, profileLoading]);

  const updateStreakAndPoints = async () => {
    if (!profile) return;

    await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', profile.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document not found");

        const userData = userDoc.data();
        let currentStreak = userData.currentStreak || 0;
        let longestStreak = userData.longestStreak || 0;
        let totalPoints = userData.totalPoints || 0;
        const lastCompleted = userData.lastGoalCompletedDate; // This is a 'YYYY-MM-DD' string

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');
        
        let newStreak;

        if (lastCompleted === yesterdayStr) {
          newStreak = currentStreak + 1;
        } else if (lastCompleted === todayStr) {
          return;
        } else {
          newStreak = 1;
        }

        let pointsEarned = 10;
        let bonusMessage = '';
        
        const streakMilestones: {[key: number]: number} = { 7: 50, 14: 100, 30: 200 };

        if (streakMilestones[newStreak]) {
            const bonus = streakMilestones[newStreak];
            pointsEarned += bonus;
            bonusMessage = ` You earned a ${bonus} point bonus for your ${newStreak}-day streak!`;
        }
        
        totalPoints += pointsEarned;

        if (newStreak > longestStreak) {
          longestStreak = newStreak;
        }
        
        transaction.update(userRef, { 
            currentStreak: newStreak, 
            longestStreak,
            totalPoints,
            lastGoalCompletedDate: todayStr,
        });
        
        toast({
            title: 'All Goals Achieved! 🎉',
            description: `You earned ${pointsEarned} points.${bonusMessage} Keep up the great work!`,
        });
    });
  }

  const completeSubGoal = async (goalIndex: number) => {
    if (!profile || !selectedGoal || !selectedDateString || selectedGoal.goals[goalIndex].completed) return;
    
    setIsCompleting(goalIndex);

    try {
        const wasAlreadyAllCompleted = selectedGoal.completed;
        const goalRef = doc(firestore, 'users', profile.uid, 'dailyGoals', selectedDateString);

        const newGoals = [...selectedGoal.goals];
        newGoals[goalIndex].completed = true;

        const allNowCompleted = newGoals.every(g => g.completed);
        
        const goalToComplete = selectedGoal.goals[goalIndex];
        if (goalToComplete.type === 'chapter' && goalToComplete.chapter && goalToComplete.subject) {
            updateProgress(goalToComplete.subject, goalToComplete.chapter, { completed: true });
        }

        await setDoc(goalRef, {
            goals: newGoals,
            completed: allNowCompleted,
        }, { merge: true });

        const isToday = selectedDateString === todayString;
        if (allNowCompleted && !wasAlreadyAllCompleted) {
             if (isToday) {
                await updateStreakAndPoints();
             } else {
                 toast({
                     title: 'All Goals Achieved! 🎉',
                     description: `Great job completing your goals for ${selectedDateString}.`,
                 });
             }
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Uh oh!',
            description: `Could not complete goal: ${e.message}`,
        });
    } finally {
        setIsCompleting(null);
    }
  };

  const getGoalText = (goal: SubGoal) => {
    if (goal.type === 'custom') return goal.text;
    if (goal.type === 'chapter') return goal.chapter;
    return 'Unnamed Goal';
  }

  const renderGoalContent = () => {
    if (isLoading || selectedGoal === undefined) {
      return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!selectedGoal) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 h-48">
          <p className="text-muted-foreground">{isDateInPast ? "No goals were set for this day." : "No goals set for this date."}</p>
          {!isDateInPast && (
            <Button onClick={() => setIsSetGoalDialogOpen(true)}>
              <Plus className="mr-2" /> Set Goals
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          {selectedGoal.goals.map((goal, index) => (
            <div key={index} className={cn("flex items-center justify-between p-3 rounded-lg", goal.completed ? "bg-green-500/10" : "bg-muted/50")}>
              <div>
                <p className={cn("font-semibold", goal.completed && "line-through text-muted-foreground")}>
                  {getGoalText(goal)}
                </p>
                {goal.subject && <p className="text-xs text-muted-foreground">{goal.subject.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}</p>}
              </div>
              {!goal.completed && !isDateInPast && (
                <Button size="sm" onClick={() => completeSubGoal(index)} disabled={isCompleting === index}>
                    {isCompleting === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4"/>}
                    Done
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
            {!isDateInPast && (
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSetGoalDialogOpen(true)}
                  disabled={selectedGoal.completed}
                  >
                  <Edit className="mr-2 h-4 w-4" /> Edit Goals
              </Button>
            )}
        </div>
      </div>
    );
  };
  
  const cardTitle = selectedDateString === todayString
    ? "Today's Goals"
    : `Goals for ${selectedDate ? format(selectedDate, 'MMMM do') : ''}`;

  return (
    <>
      <div className="flex flex-col gap-6">
        <StreakTracker />
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
              <div className="flex flex-col items-center md:col-span-1">
                  <h3 className="text-xl font-semibold mb-2">Goal Calendar</h3>
                  <p className="text-sm text-muted-foreground mb-4">Select a date to view or set goals.</p>
                  <GoalCalendar 
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
              </div>
              <div className="md:col-span-2 md:border-l md:pl-8">
                  <div className="flex flex-row items-center justify-between">
                      <div>
                          <h3 className="text-xl font-semibold">{cardTitle}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                              {selectedDateString === todayString
                                  ? "Check off your goals to build momentum."
                                  : "A look at your goals for the selected date."}
                          </p>
                      </div>
                  </div>
                  <div className="mt-6">
                      {renderGoalContent()}
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>

      <SetGoalDialog 
        isOpen={isSetGoalDialogOpen} 
        onOpenChange={setIsSetGoalDialogOpen} 
        existingGoals={selectedGoal?.goals || []}
        date={selectedDate}
      />
    </>
  );
}
