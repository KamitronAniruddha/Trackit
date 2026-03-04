
'use client';

import {
    Ban, ShieldCheck, Trash2, Award, User, ShieldAlert, Mail, Activity, Users, FileWarning, Gem
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityAction } from '@/lib/activity-logger';

export interface ActivityLog {
    id: string;
    timestamp: { toDate: () => Date };
    actorId: string;
    actorName: string;
    action: ActivityAction;
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
}

const iconMap: Record<ActivityAction, React.ElementType> = {
    USER_BANNED: Ban,
    USER_UNBANNED: ShieldCheck,
    USER_DELETED: Trash2,
    PREMIUM_GRANTED: Award,
    PREMIUM_REVOKED: Award,
    ROLE_CHANGED: User,
    UNBAN_REQUEST_APPROVED: ShieldCheck,
    UNBAN_REQUEST_REJECTED: ShieldAlert,
    CONTACT_MESSAGE_DELETED: Mail,
    PREMIUM_ACTIVATED_WITH_CODE: Gem
};

const colorMap: Record<ActivityAction, string> = {
    USER_BANNED: 'bg-destructive/10 text-destructive',
    USER_UNBANNED: 'bg-green-500/10 text-green-500',
    USER_DELETED: 'bg-destructive/10 text-destructive',
    PREMIUM_GRANTED: 'bg-blue-500/10 text-blue-500',
    PREMIUM_REVOKED: 'bg-yellow-500/10 text-yellow-500',
    ROLE_CHANGED: 'bg-purple-500/10 text-purple-500',
    UNBAN_REQUEST_APPROVED: 'bg-green-500/10 text-green-500',
    UNBAN_REQUEST_REJECTED: 'bg-yellow-500/10 text-yellow-500',
    CONTACT_MESSAGE_DELETED: 'bg-muted-foreground/10 text-muted-foreground',
    PREMIUM_ACTIVATED_WITH_CODE: 'bg-blue-500/10 text-blue-500',
};


const renderLogMessage = (log: ActivityLog) => {
    switch (log.action) {
        case 'USER_BANNED':
            return <p><span className='font-bold'>{log.actorName}</span> banned <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'USER_UNBANNED':
            return <p><span className='font-bold'>{log.actorName}</span> unbanned <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'USER_DELETED':
             return <p><span className='font-bold'>{log.actorName}</span> deleted user <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'PREMIUM_GRANTED':
            return <p><span className='font-bold'>{log.actorName}</span> granted premium to <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'PREMIUM_REVOKED':
            return <p><span className='font-bold'>{log.actorName}</span> revoked premium from <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'ROLE_CHANGED':
            return <p><span className='font-bold'>{log.actorName}</span> changed <span className='font-bold'>{log.targetName}</span>'s role to <span className='font-bold'>{log.details?.newRole}</span>.</p>;
        case 'UNBAN_REQUEST_APPROVED':
            return <p><span className='font-bold'>{log.actorName}</span> approved unban request for <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'UNBAN_REQUEST_REJECTED':
             return <p><span className='font-bold'>{log.actorName}</span> rejected unban request for <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'CONTACT_MESSAGE_DELETED':
             return <p><span className='font-bold'>{log.actorName}</span> deleted a contact message from <span className='font-bold'>{log.targetName}</span>.</p>;
        case 'PREMIUM_ACTIVATED_WITH_CODE':
             return <p><span className='font-bold'>{log.actorName}</span> activated premium for <span className='font-bold'>{log.targetName}</span> with a code.</p>;
        default:
            return <p><span className='font-bold'>{log.actorName}</span> performed an action.</p>;
    }
};


export function ActivityLogFeed({ logs, isLoading }: { logs: ActivityLog[], isLoading: boolean }) {
    if (isLoading) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 bg-muted/30 rounded-lg">
                <Activity className="h-10 w-10 mb-2" />
                <p className="font-medium">No recent activity</p>
                <p className="text-xs">Admin actions will appear here in real-time.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-6 pr-4">
                {logs.map((log) => {
                    const Icon = iconMap[log.action] || Activity;
                    const color = colorMap[log.action] || 'bg-muted';
                    return (
                        <div key={log.id} className="flex gap-3">
                            <Avatar className={`h-8 w-8 ${color}`}>
                                <AvatarFallback className="bg-transparent">
                                    <Icon className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 text-sm">
                                {renderLogMessage(log)}
                                <p className="text-xs text-muted-foreground">
                                    {log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true }) : 'just now'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
