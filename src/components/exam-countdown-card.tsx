'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const getExamDates = (exam: 'NEET' | 'JEE', year: number): { name: string; date: Date }[] => {
    if (exam === 'NEET') {
        // First Sunday of May
        const mayFirst = new Date(year, 4, 1);
        const dayOfWeek = mayFirst.getDay();
        const firstSunday = 1 + (7 - dayOfWeek) % 7;
        return [{ name: 'NEET', date: new Date(year, 4, firstSunday) }];
    }
    if (exam === 'JEE') {
        // Approx. Jan 24th for 1st attempt
        const janAttempt = new Date(year, 0, 24, 9);
        // Approx. April 4th for 2nd attempt
        const aprilAttempt = new Date(year, 3, 4, 9);
        return [
            { name: 'Jan Attempt', date: janAttempt },
            { name: 'Apr Attempt', date: aprilAttempt },
        ];
    }
    return [];
};


const calculateTimeLeft = (targetDate: Date) => {
    const difference = +targetDate - +new Date();
    let timeLeft = {
        total: difference,
        totalWeeks: 0,
        totalDays: 0,
        totalHours: 0,
        totalMinutes: 0,
        totalSeconds: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    };

    if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        timeLeft = {
            total: difference,
            totalWeeks: Math.floor(totalDays / 7),
            totalDays: totalDays,
            totalHours: totalHours,
            totalMinutes: totalMinutes,
            totalSeconds: totalSeconds,
            weeks: Math.floor(totalDays / 7),
            days: totalDays % 7,
            hours: totalHours % 24,
            minutes: totalMinutes % 60,
            seconds: totalSeconds % 60,
        };
    }

    return timeLeft;
};

type CountdownData = {
    name: string;
    date: Date;
    timeLeft: ReturnType<typeof calculateTimeLeft>;
};

export function ExamCountdownCard() {
    const { profile, loading } = useUserProfile();
    const [examDates, setExamDates] = useState<{ name: string; date: Date }[]>([]);
    const [timeLefts, setTimeLefts] = useState<ReturnType<typeof calculateTimeLeft>[]>([]);
    const [selectedCountdownIndex, setSelectedCountdownIndex] = useState<number | null>(null);

    useEffect(() => {
        if (profile?.exam && profile.targetYear) {
            setExamDates(getExamDates(profile.exam, profile.targetYear));
        }
    }, [profile]);

    useEffect(() => {
        if (examDates.length === 0) return;

        const calculateAll = () => {
            setTimeLefts(examDates.map(ed => calculateTimeLeft(ed.date)));
        };

        calculateAll();
        const timer = setInterval(calculateAll, 1000);

        return () => clearInterval(timer);
    }, [examDates]);
    
    if (loading) {
        return <Skeleton className="h-[150px] w-full" />;
    }

    if (!profile || examDates.length === 0 || timeLefts.length === 0) {
        return null;
    }

    const isJee = profile.exam === 'JEE';

    const renderDialogContent = (countdown: CountdownData) => {
        if (!countdown) return null;
        const hasExamPassed = countdown.timeLeft.total <= 0;
        return (
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Countdown to {isJee ? countdown.name : 'NEET'} {profile.targetYear}</DialogTitle>
                    <DialogDescription className="text-center">
                        Estimated Exam Date: {countdown.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </DialogDescription>
                </DialogHeader>
                {hasExamPassed ? (
                     <div className="text-center py-8">
                        <p className="text-2xl font-bold">The exam has passed!</p>
                        <p className="text-muted-foreground">Congratulations on completing your exam!</p>
                    </div>
                ) : (
                    <Tabs defaultValue="breakdown" className="w-full pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                            <TabsTrigger value="totals">Totals</TabsTrigger>
                        </TabsList>
                        <TabsContent value="breakdown" className="pt-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center bg-secondary/50 p-4 rounded-lg">
                                    <p className="text-4xl font-bold text-primary">{countdown.timeLeft.weeks}</p>
                                    <p className="text-muted-foreground">Weeks</p>
                                </div>
                                <div className="text-center bg-secondary/50 p-4 rounded-lg">
                                    <p className="text-4xl font-bold text-primary">{countdown.timeLeft.days}</p>
                                    <p className="text-muted-foreground">Days</p>
                                </div>
                                <div className="text-center bg-secondary/50 p-4 rounded-lg">
                                    <p className="text-4xl font-bold text-primary">{countdown.timeLeft.hours}</p>
                                    <p className="text-muted-foreground">Hours</p>
                                </div>
                                <div className="text-center bg-secondary/50 p-4 rounded-lg">
                                    <p className="text-4xl font-bold text-primary">{countdown.timeLeft.minutes}</p>
                                    <p className="text-muted-foreground">Minutes</p>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="totals" className="pt-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                                    <span className="text-muted-foreground">Total Weeks</span>
                                    <span className="font-bold text-primary text-lg">{countdown.timeLeft.totalWeeks.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                                    <span className="text-muted-foreground">Total Days</span>
                                    <span className="font-bold text-primary text-lg">{countdown.timeLeft.totalDays.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                                    <span className="text-muted-foreground">Total Hours</span>
                                    <span className="font-bold text-primary text-lg">{countdown.timeLeft.totalHours.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                                    <span className="text-muted-foreground">Total Minutes</span>
                                    <span className="font-bold text-primary text-lg">{countdown.timeLeft.totalMinutes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                                    <span className="text-muted-foreground">Total Seconds</span>
                                    <span className="font-bold text-primary text-lg">{countdown.timeLeft.totalSeconds.toLocaleString()}</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        );
    }

    if (isJee) {
        const selectedCountdownData = selectedCountdownIndex !== null && timeLefts[selectedCountdownIndex]
        ? {
            name: examDates[selectedCountdownIndex].name,
            date: examDates[selectedCountdownIndex].date,
            timeLeft: timeLefts[selectedCountdownIndex],
        }
        : null;
        
        return (
            <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedCountdownIndex(null)}>
                <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-primary/10 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-medium">JEE Countdown</CardTitle>
                        <Timer className="h-7 w-7 text-muted-foreground text-primary" />
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center pt-2">
                        <div className="grid grid-cols-2 gap-4 w-full">
                            {examDates.map((exam, index) => {
                                if (!timeLefts[index]) return <Skeleton key={exam.name} className="h-[90px] w-full" />;
                                const timeLeft = timeLefts[index];
                                const hasExamPassed = timeLeft.total <= 0;
                                return (
                                    <DialogTrigger asChild key={exam.name} onClick={() => setSelectedCountdownIndex(index)}>
                                        <div className="text-center p-4 rounded-lg bg-secondary/50 cursor-pointer group hover:bg-primary/10 transition-colors flex flex-col justify-center items-center h-full">
                                            <p className="text-sm font-semibold text-muted-foreground">{exam.name}</p>
                                            {hasExamPassed ? (
                                                <div className="py-1 mt-1">
                                                    <p className="text-xl font-bold">Passed</p>
                                                </div>
                                            ) : (
                                                <div className="mt-1">
                                                    <div className="text-4xl font-bold tracking-tighter text-primary">
                                                        {timeLeft.totalDays}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground -mt-1">Days</p>
                                                </div>
                                            )}
                                        </div>
                                    </DialogTrigger>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
                {selectedCountdownData && renderDialogContent(selectedCountdownData)}
            </Dialog>
        );
    }

    // NEET
    const neetTimeLeft = timeLefts[0];
    const neetExamDate = examDates[0];
    const neetHasExamPassed = neetTimeLeft.total <= 0;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer group bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-medium">Time Left</CardTitle>
                        <Timer className="h-7 w-7 text-muted-foreground text-primary transition-transform group-hover:scale-110" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pt-2">
                        {neetHasExamPassed ? (
                             <div className="text-center py-4">
                                <p className="text-2xl font-bold">The exam has passed!</p>
                                <p className="text-muted-foreground">Hope you did great!</p>
                            </div>
                        ) : (
                             <div className="text-center">
                                <div className="text-6xl font-bold tracking-tighter text-primary">
                                    {neetTimeLeft.totalDays}
                                </div>
                                <p className="text-lg text-muted-foreground -mt-1">Days to Go</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </DialogTrigger>
            {renderDialogContent({ ...neetExamDate, timeLeft: neetTimeLeft })}
        </Dialog>
    );
}
