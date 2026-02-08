
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile, type UserProfile } from '@/contexts/user-profile-context';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, writeBatch } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useSpectate } from '@/contexts/spectate-context';

interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    createdAt: { toDate: () => Date };
}

interface Conversation {
    id: string;
    memberIds: string[];
    membersInfo: {
        [uid: string]: {
            displayName: string;
            photoURL?: string;
        }
    };
}

export function DirectChatInterface({ conversationId }: { conversationId: string }) {
    const firestore = useFirestore();
    const { profile: currentUserProfile, loading: profileLoading } = useUserProfile();
    const { isSpectating } = useSpectate();
    const [messages, setMessages] = useState<PrivateMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [otherUser, setOtherUser] = useState<Conversation['membersInfo'][string] | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!conversationId) return;

        const convDocRef = doc(firestore, 'conversations', conversationId);
        const unsubscribeConv = onSnapshot(convDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const convData = { id: docSnap.id, ...docSnap.data() } as Conversation;
                setConversation(convData);

                if (currentUserProfile) {
                    const otherUserId = convData.memberIds.find(id => id !== currentUserProfile.uid);
                    if (otherUserId) {
                        setOtherUser(convData.membersInfo[otherUserId]);
                    }
                }
            } else {
                setConversation(null);
            }
        });

        return () => unsubscribeConv();
    }, [conversationId, firestore, currentUserProfile]);

    useEffect(() => {
        if (!conversationId) return;

        const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as PrivateMessage));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        return () => unsubscribeMessages();
    }, [conversationId, firestore]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserProfile || !conversation || isSpectating) return;

        setIsSending(true);
        const text = newMessage.trim();
        setNewMessage('');

        const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
        const convDocRef = doc(firestore, 'conversations', conversationId);
        
        const batch = writeBatch(firestore);

        const newMessageDoc = doc(messagesRef);
        batch.set(newMessageDoc, {
            text,
            senderId: currentUserProfile.uid,
            createdAt: serverTimestamp(),
        });
        
        batch.update(convDocRef, {
            lastMessage: text,
            lastMessageAt: serverTimestamp(),
            [`membersInfo.${currentUserProfile.uid}`]: {
                displayName: currentUserProfile.displayName,
                photoURL: currentUserProfile.photoURL,
            }
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: 'destructive', title: 'Error sending message' });
            setNewMessage(text);
        } finally {
            setIsSending(false);
        }
    };
    
    if (loading || profileLoading || !conversation || !otherUser) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card className="w-full h-full flex flex-col bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                <div className='flex items-center gap-2'>
                    <Button variant="ghost" size="icon" className="mr-2" asChild>
                        <Link href="/dashboard/messages">
                            <ArrowLeft />
                            <span className="sr-only">Back to Messages</span>
                        </Link>
                    </Button>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser.photoURL ?? undefined} />
                        <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-2">
                        <h2 className="font-semibold text-lg">{otherUser.displayName}</h2>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn('flex items-end gap-2', msg.senderId === currentUserProfile?.uid ? 'justify-end' : 'justify-start')}
                    >
                        {msg.senderId !== currentUserProfile?.uid && (
                            <Avatar className="h-8 w-8 self-end">
                                <AvatarImage src={otherUser.photoURL ?? undefined} />
                                <AvatarFallback>{otherUser.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 break-words',
                            msg.senderId === currentUserProfile?.uid
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted rounded-bl-none'
                        )}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="p-4 border-t bg-background/50">
                <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isSpectating ? "Messaging disabled while spectating" : "Type a message..."}
                        autoComplete="off"
                        disabled={isSending || isSpectating}
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending || isSpectating}>
                        {isSending ? <Loader2 className="animate-spin"/> : <Send />}
                        <span className="sr-only">Send message</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
