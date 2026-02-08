
'use client';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Star, Gem, Loader2, Calendar, Target } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import type { DailyGoal } from './goal-dashboard';

// Points History Component
interface PointLog {
    id: string;
    points: number;
    reason: string;
    createdAt: Timestamp;
}

const PointsHistory = () => {
    const { profile } = useUserProfile();
    const firestore = useFirestore();
    const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        setLoading(true);
        const logsRef = collection(firestore, 'users', profile.uid, 'pointLogs');
        const q = query(logsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointLog));
            setPointLogs(logs);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [profile, firestore]);

    if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    if (pointLogs.length === 0) return <p className="text-center text-muted-foreground py-8">No points history found.</p>;

    return (
         <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
                {pointLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                            <p className="font-medium">{log.reason}</p>
                            <p className="text-xs text-muted-foreground">{format(log.createdAt.toDate(), 'PPpp')}</p>
                        </div>
                        <p className="font-bold text-lg text-blue-500">+{log.points}</p>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};

// Streak History Component
const StreakHistory = () => {
    const { profile } = useUserProfile();
    const firestore = useFirestore();
    const [completedGoals, setCompletedGoals] = useState<DailyGoal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        setLoading(true);
        const goalsRef = collection(firestore, 'users', profile.uid, 'dailyGoals');
        const q = query(
            goalsRef,
            where('completed', '==', true),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyGoal));
            setCompletedGoals(goals);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, firestore]);
    
    if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    if (completedGoals.length === 0) return <p className="text-center text-muted-foreground py-8">No completed goal days found.</p>;
    
    return (
        <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
                {completedGoals.map(goal => (
                    <div key={goal.id} className="p-4 rounded-lg bg-muted/50">
                        <p className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4"/> {format(new Date(goal.date.replace(/-/g, '/')), 'MMMM do, yyyy')}</p>
                        <ul className="mt-2 ml-4 space-y-1 list-disc list-inside text-sm text-muted-foreground">
                            {goal.goals.map((sub, index) => <li key={index}>{sub.chapter || sub.text}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};


const StatDisplay = ({ icon: Icon, value, label, iconClass, onClick }: { icon: React.ElementType, value: string | number, label: string, iconClass?: string, onClick: () => void }) => (
    <button onClick={onClick} className="text-left w-full h-full">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg h-full transition-colors hover:bg-muted">
            <Icon className={`h-8 w-8 ${iconClass}`} />
            <div>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </div>
    </button>
);


export function StreakTracker() {
  const { profile, loading } = useUserProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogView, setDialogView] = useState<'streak' | 'points' | null>(null);

  const renderContent = () => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatDisplay
                icon={Flame}
                value={profile?.currentStreak || 0}
                label="Current Streak"
                iconClass="text-orange-500"
                onClick={() => { setDialogView('streak'); setDialogOpen(true); }}
            />
             <StatDisplay
                icon={Star}
                value={profile?.longestStreak || 0}
                label="Longest Streak"
                iconClass="text-yellow-400"
                onClick={() => { setDialogView('streak'); setDialogOpen(true); }}
            />
            <StatDisplay
                icon={Gem}
                value={(profile?.totalPoints || 0).toLocaleString()}
                label="Total Points"
                iconClass="text-blue-500"
                onClick={() => { setDialogView('points'); setDialogOpen(true); }}
            />
        </div>
    );
  }
  
  const dialogTitle = dialogView === 'streak' ? 'Streak History' : 'Points History';
  const dialogDescription = dialogView === 'streak'
        ? 'A history of all your completed daily goals.'
        : 'A detailed log of all the points you have earned.';
  const DialogIcon = dialogView === 'streak' ? Target : Star;

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Gamified Progress</CardTitle>
            <CardDescription>Complete daily goals to extend your streak and earn points.</CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><DialogIcon className="h-5 w-5"/>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {dialogView === 'streak' && <StreakHistory />}
                    {dialogView === 'points' && <PointsHistory />}
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
