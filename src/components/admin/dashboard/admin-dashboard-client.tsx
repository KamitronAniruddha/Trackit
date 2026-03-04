'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, onSnapshot, query, where, Timestamp, orderBy, getCountFromServer } from 'firebase/firestore';
import type { UserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart as RechartsPieChart, Cell, LineChart, Line } from 'recharts';
import { Loader2, Users, ShieldQuestion, Gem, Mail, UserPlus, ArrowRight, Activity, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfDay } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityLog, ActivityLogFeed } from './activity-log-feed';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// --- STAT CARD ---
const StatCard = ({ title, value, icon: Icon, description, colorClass, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, colorClass: string, isLoading: boolean }) => (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.5s_ease-out] hover:shadow-lg transition-shadow duration-300">
        <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full ${colorClass} opacity-10 blur-xl animate-[spin_20s_linear_infinite] group-hover:opacity-20`}></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-5 w-5 text-muted-foreground ${colorClass}`} />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <div className="text-3xl font-bold">{value}</div>}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const chartConfig = {
    users: { label: "Users", color: "hsl(var(--chart-1))" },
    admin: { label: "Admin", color: "hsl(var(--chart-1))" },
    subadmin: { label: "Sub-Admin", color: "hsl(var(--chart-2))" },
    user: { label: "User", color: "hsl(var(--chart-3))" },
} as ChartConfig;

export function AdminDashboardClient() {
    const firestore = useFirestore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [unbanRequests, setUnbanRequests] = useState(0);
    const [contactMessages, setContactMessages] = useState(0);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [otherStats, setOtherStats] = useState({ posts: 0, groups: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(firestore, 'users'), where('isDeleted', '==', false));
        const unbanQuery = query(collection(firestore, 'unbanRequests'), where('status', '==', 'pending'));
        const contactQuery = query(collection(firestore, 'contactSubmissions'), where('isRead', '==', false));
        const activityQuery = query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'));

        const unsubUsers = onSnapshot(usersQuery, 
            snap => setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))),
            error => {
                const permissionError = new FirestorePermissionError({ path: 'users', operation: 'list' }, error);
                errorEmitter.emit('permission-error', permissionError);
                setLoading(false);
            }
        );
        const unsubUnban = onSnapshot(unbanQuery, 
            snap => setUnbanRequests(snap.size),
            error => {
                 const permissionError = new FirestorePermissionError({ path: 'unbanRequests', operation: 'list' }, error);
                errorEmitter.emit('permission-error', permissionError);
            }
        );
        const unsubContact = onSnapshot(contactQuery, 
            snap => setContactMessages(snap.size),
            error => {
                const permissionError = new FirestorePermissionError({ path: 'contactSubmissions', operation: 'list' }, error);
                errorEmitter.emit('permission-error', permissionError);
            }
        );
        const unsubActivity = onSnapshot(activityQuery, 
            snap => setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog))),
            error => {
                const permissionError = new FirestorePermissionError({ path: 'activityLogs', operation: 'list' }, error);
                errorEmitter.emit('permission-error', permissionError);
            }
        );

        const fetchCounts = async () => {
            try {
                const [postsSnap, groupsSnap] = await Promise.all([
                    getCountFromServer(collection(firestore, 'posts')),
                    getCountFromServer(collection(firestore, 'groups')),
                ]);
                setOtherStats({
                    posts: postsSnap.data().count,
                    groups: groupsSnap.data().count,
                });
            } catch (e) {
                console.error("Could not fetch counts", e);
            }
        };

        fetchCounts();
        const timer = setTimeout(() => setLoading(false), 2000); // Failsafe loader

        return () => {
            unsubUsers();
            unsubUnban();
            unsubContact();
            unsubActivity();
            clearTimeout(timer);
        };
    }, [firestore]);

    const stats = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
        
        const signupsByDay = last7Days.map(day => {
            const dayStart = startOfDay(day);
            const count = users.filter(u => u.createdAt && (u.createdAt as Timestamp).toDate() >= dayStart && (u.createdAt as Timestamp).toDate() < startOfDay(subDays(day, -1))).length;
            return { date: format(day, 'MMM d'), users: count };
        });

        const roleCounts = users.reduce((acc, user) => {
            const role = user.role || 'user';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const roleData = Object.keys(roleCounts).map(role => ({
            role,
            count: roleCounts[role],
            fill: `var(--color-${role})`
        }));
        
        const premiumUsers = users.filter(u => u.isPremium).length;
        const recentUsers = [...users].sort((a, b) => ((b.createdAt as Timestamp)?.toDate()?.getTime() || 0) - ((a.createdAt as Timestamp)?.toDate()?.getTime() || 0)).slice(0, 5);


        return {
            totalUsers: users.length,
            premiumUsers,
            signupsByDay,
            roleData,
            recentUsers
        };
    }, [users]);
    
    const isLoadingStats = loading || users.length === 0;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} description="All non-deleted users" colorClass="text-primary" isLoading={isLoadingStats} />
                <StatCard title="Premium Users" value={stats.premiumUsers} icon={Gem} description={`${stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(0) : 0}% of users`} colorClass="text-green-500" isLoading={isLoadingStats} />
                <StatCard title="A-gram Posts" value={otherStats.posts.toLocaleString()} icon={Mail} description="Total posts created" colorClass="text-blue-500" isLoading={loading} />
                <StatCard title="Groups" value={otherStats.groups.toLocaleString()} icon={MessageSquare} description="Total groups formed" colorClass="text-indigo-500" isLoading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.6s_ease-out]">
                        <CardHeader>
                            <CardTitle>New Users (Last 7 Days)</CardTitle>
                            <CardDescription>Daily user signups.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-[250px] w-full" /> : (
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <LineChart data={stats.signupsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Line dataKey="users" type="monotone" stroke="var(--color-users)" strokeWidth={2} dot={{r: 4, fill: "var(--color-users)"}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                     <Card className="bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.7s_ease-out]">
                        <CardHeader>
                            <CardTitle>User Roles</CardTitle>
                            <CardDescription>Distribution of user roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-[250px] w-full" /> : (
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <RechartsPieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
                                        <Pie data={stats.roleData} dataKey="count" nameKey="role" innerRadius={60} strokeWidth={5}>
                                            {stats.roleData.map((entry) => (
                                            <Cell key={entry.role} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </RechartsPieChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.8s_ease-out] h-full flex flex-col">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><Activity /> Live Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                           <ActivityLogFeed logs={activityLogs} isLoading={loading} />
                        </CardContent>
                    </Card>
                </div>
            </div>

             <Card className="bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.8s_ease-out]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Signups</CardTitle>
                        <CardDescription>The latest users to join the platform.</CardDescription>
                    </div>
                     <Button asChild variant="ghost" size="sm">
                        <Link href="/admin/users">
                            View All <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-40 w-full" /> : (
                        <div className="space-y-4">
                            {stats.recentUsers.map(user => (
                                <div key={user.uid} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.photoURL ?? undefined} alt="Avatar" />
                                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm text-muted-foreground">
                                        {user.createdAt ? format((user.createdAt as any).toDate(), 'MMM d, yyyy') : 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}