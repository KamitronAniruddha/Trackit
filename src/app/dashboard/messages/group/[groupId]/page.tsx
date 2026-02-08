
'use client';

import { GroupChatInterface } from '@/components/group-chat-interface';
import { useParams } from 'next/navigation';

export default function GroupChatPage() {
    const params = useParams();
    const groupId = params.groupId as string;

    if (!groupId) {
        return <div className="flex justify-center items-center h-full">Invalid Group ID</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <GroupChatInterface groupId={groupId} />
        </div>
    );
}
