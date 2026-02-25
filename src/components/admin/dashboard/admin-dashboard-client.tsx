'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/contexts/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart as RechartsPieChart, Cell } from 'recharts';
import { Loader2, Users, ShieldQuestion, Gem, Mail, UserPlus, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// --- STAT CARD ---
const StatCard = ({ title, value, icon: Icon, description, colorClass, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, colorClass: string, isLoading: boolean }) => (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.5s_ease-out]">
        <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full ${colorClass} opacity-10 blur-xl`}></div>
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(firestore, 'users'), where('isDeleted', '!=', true));
        const unbanQuery = query(collection(firestore, 'unbanRequests'), where('status', '==', 'pending'));
        const contactQuery = query(collection(firestore, 'contactSubmissions'), where('isRead', '==', false));

        const unsubUsers = onSnapshot(usersQuery, snap => setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))), () => setLoading(false));
        const unsubUnban = onSnapshot(unbanQuery, snap => setUnbanRequests(snap.size));
        const unsubContact = onSnapshot(contactQuery, snap => setContactMessages(snap.size));

        const timer = setTimeout(() => setLoading(false), 2000); // Failsafe loader

        return () => {
            unsubUsers();
            unsubUnban();
            unsubContact();
            clearTimeout(timer);
        };
    }, [firestore]);

    const stats = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
        
        const signupsByDay = last7Days.map(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            const count = users.filter(u => u.createdAt && format((u.createdAt as any).toDate(), 'yyyy-MM-dd') === dayString).length;
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
        const recentUsers = [...users].sort((a, b) => ((b.createdAt as any)?.toDate() || 0) - ((a.createdAt as any)?.toDate() || 0)).slice(0, 5);


        return {
            totalUsers: users.length,
            premiumUsers,
            signupsByDay,
            roleData,
            recentUsers
        };
    }, [users]);

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} description="All registered users" colorClass="text-primary" isLoading={loading} />
                <StatCard title="Premium Users" value={stats.premiumUsers} icon={Gem} description={`${stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(0) : 0}% of users`} colorClass="text-green-500" isLoading={loading} />
                <StatCard title="Unban Requests" value={unbanRequests} icon={ShieldQuestion} description="Pending user unban requests" colorClass="text-yellow-500" isLoading={loading} />
                <StatCard title="Unread Messages" value={contactMessages} icon={Mail} description="Unread contact form submissions" colorClass="text-blue-500" isLoading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm animate-[fade-in-up_0.6s_ease-out]">
                    <CardHeader>
                        <CardTitle>New Users (Last 7 Days)</CardTitle>
                        <CardDescription>Daily user signups.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[250px] w-full" /> : (
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <BarChart data={stats.signupsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                                </BarChart>
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