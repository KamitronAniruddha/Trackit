
'use client';
import { useUserProfile } from "@/contexts/user-profile-context";
import { useFirestore } from "@/firebase/provider";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "@/lib/types";


export function DirectMessageList() {
    const firestore = useFirestore();
    const { profile: currentUserProfile } = useUserProfile();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserProfile) {
            if (currentUserProfile === null) setLoading(false);
            return;
        }

        const convosRef = collection(firestore, 'conversations');
        const q = query(
            convosRef,
            where('memberIds', 'array-contains', currentUserProfile.uid),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convoList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
            setConversations(convoList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching conversations: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserProfile, firestore]);

    return (
        <Card>
            <CardContent className="p-2 md:p-4">
                {loading && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                
                {!loading && conversations.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                         <MessageCircle className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No direct messages</h3>
                        <p className="text-sm mt-2">Start a conversation from a user's post in A-gram.</p>
                    </div>
                )}

                {!loading && conversations.length > 0 && (
                    <div className="space-y-2">
                        {conversations.map(convo => {
                            const otherUserId = convo.memberIds.find(id => id !== currentUserProfile?.uid);
                            if (!otherUserId) return null;
                            const otherUserInfo = convo.membersInfo[otherUserId];
                            if (!otherUserInfo) return null;

                            const lastMessagePrefix = convo.lastMessageSenderId === currentUserProfile?.uid
                                ? 'You: '
                                : '';
                            const lastMessageText = convo.lastMessage
                                ? `${lastMessagePrefix}${convo.lastMessage}`
                                : 'No messages yet';

                            return (
                                <Link href={`/dashboard/messages/direct/${convo.id}`} key={convo.id} className="block">
                                    <div className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={otherUserInfo.photoURL ?? undefined} />
                                            <AvatarFallback>{otherUserInfo.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 truncate">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold">{otherUserInfo.displayName}</h3>
                                                {convo.lastMessageAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(convo.lastMessageAt.toDate(), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    