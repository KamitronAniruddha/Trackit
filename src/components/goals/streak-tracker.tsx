'use client';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Star, Gem } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const StatDisplay = ({ icon: Icon, value, label, iconClass }: { icon: React.ElementType, value: string | number, label: string, iconClass?: string }) => (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <Icon className={`h-8 w-8 ${iconClass}`} />
        <div>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    </div>
);


export function StreakTracker() {
  const { profile, loading } = useUserProfile();

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
            />
             <StatDisplay
                icon={Star}
                value={profile?.longestStreak || 0}
                label="Longest Streak"
                iconClass="text-yellow-400"
            />
            <StatDisplay
                icon={Gem}
                value={(profile?.totalPoints || 0).toLocaleString()}
                label="Total Points"
                iconClass="text-blue-500"
            />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gamified Progress</CardTitle>
        <CardDescription>Complete daily goals to extend your streak and earn points.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
