
'use client';

import { DirectChatInterface } from '@/components/direct-chat-interface';
import { useParams } from 'next/navigation';

export default function DirectChatPage() {
    const params = useParams();
    const conversationId = params.conversationId as string;

    if (!conversationId) {
        return <div className="flex justify-center items-center h-full">Invalid Conversation ID</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <DirectChatInterface conversationId={conversationId} />
        </div>
    );
}
