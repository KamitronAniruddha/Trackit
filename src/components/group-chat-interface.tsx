'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile, type UserProfile } from '@/contexts/user-profile-context';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, getDocs, where, writeBatch, documentId, updateDoc, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, ArrowLeft, Users, Settings, UserPlus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { AddGroupMemberDialog } from './add-group-member-dialog';
import { useRouter } from 'next/navigation';
import { useSpectate } from '@/contexts/spectate-context';

interface GroupMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderPhotoURL?: string | null;
    text: string;
    createdAt: { toDate: () => Date };
}

interface Group {
    id: string;
    name: string;
    description: string;
    photoURL?: string;
    adminId: string;
    memberIds: string[];
}

export function GroupChatInterface({ groupId }: { groupId: string }) {
    const firestore = useFirestore();
    const { profile: currentUserProfile, loading: profileLoading } = useUserProfile();
    const { isSpectating } = useSpectate();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Map<string, UserProfile>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Fetch group details and members
    useEffect(() => {
        if (!groupId) return;

        const groupDocRef = doc(firestore, 'groups', groupId);
        const unsubscribeGroup = onSnapshot(groupDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const groupData = { id: docSnap.id, ...docSnap.data() } as Group;
                setGroup(groupData);

                // Fetch member profiles
                if (groupData.memberIds.length > 0) {
                    const usersRef = collection(firestore, 'users');
                    const newMemberIds = groupData.memberIds.filter(id => !members.has(id));

                    if (newMemberIds.length > 0) {
                        // Firestore 'in' query is limited to 30 items per query.
                        const promises = [];
                        for (let i = 0; i < newMemberIds.length; i += 30) {
                            const chunk = newMemberIds.slice(i, i + 30);
                            const q = query(usersRef, where(documentId(), 'in', chunk));
                            promises.push(getDocs(q));
                        }
                        
                        const memberSnapshots = await Promise.all(promises);
                        
                        setMembers(prevMembers => {
                            const updatedMembers = new Map(prevMembers);
                            memberSnapshots.forEach(snapshot => {
                                snapshot.forEach(doc => {
                                    updatedMembers.set(doc.id, { uid: doc.id, ...doc.data()} as UserProfile);
                                });
                            });
                            return updatedMembers;
                        });
                    }
                }
            } else {
                setGroup(null);
            }
        });

        return () => unsubscribeGroup();
    }, [groupId, firestore, members]);

    // Fetch messages
    useEffect(() => {
        if (!groupId) return;

        const messagesRef = collection(firestore, 'groups', groupId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as GroupMessage));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        return () => unsubscribeMessages();
    }, [groupId, firestore]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserProfile || !group || isSpectating) return;

        setIsSending(true);
        const text = newMessage.trim();
        setNewMessage('');

        const messagesRef = collection(firestore, 'groups', groupId, 'messages');
        const groupDocRef = doc(firestore, 'groups', groupId);
        
        const batch = writeBatch(firestore);

        // 1. Add new message
        const newMessageDoc = doc(messagesRef);
        batch.set(newMessageDoc, {
            text,
            senderId: currentUserProfile.uid,
            senderName: currentUserProfile.displayName,
            senderPhotoURL: currentUserProfile.photoURL,
            createdAt: serverTimestamp(),
        });
        
        // 2. Update group's last message
        batch.update(groupDocRef, {
            lastMessage: text,
            lastMessageAt: serverTimestamp(),
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
    
    const handleRemoveMember = async (memberId: string) => {
        if (!group || !currentUserProfile || currentUserProfile.uid !== group.adminId) return;

        const updatedMemberIds = group.memberIds.filter(id => id !== memberId);
        
        try {
            await updateDoc(doc(firestore, 'groups', groupId), {
                memberIds: updatedMemberIds
            });
            toast({title: 'Member removed'});
        } catch (error) {
            toast({variant: 'destructive', title: 'Error removing member'});
        }
    }

    const handleDeleteGroup = async () => {
        const isAdmin = currentUserProfile?.uid === group?.adminId;
        if (!group || !isAdmin) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, 'groups', groupId));
            toast({ title: 'Group Deleted', description: `The group "${group.name}" has been permanently deleted.` });
            router.push('/dashboard/messages');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete the group.',
            });
            setIsDeleting(false);
        }
    };

    if (loading || profileLoading || !group) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const isAdmin = currentUserProfile?.uid === group.adminId;

    return (
        <>
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
                            <AvatarFallback><Users/></AvatarFallback>
                        </Avatar>
                        <div className="ml-2">
                            <h2 className="font-semibold text-lg">{group.name}</h2>
                            <p className="text-sm text-muted-foreground">{group.memberIds.length} members</p>
                        </div>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Settings />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Group Settings</SheetTitle>
                                <SheetDescription>{group.name}</SheetDescription>
                            </SheetHeader>
                            <div className="py-4 font-semibold">Members</div>
                            <ScrollArea className="h-[calc(100%-12rem)] mt-4">
                                <div className="space-y-4 pr-6">
                                {group.memberIds.map(id => {
                                    const member = members.get(id);
                                    if (!member) return null;
                                    return (
                                        <div key={id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={member.photoURL ?? undefined}/>
                                                    <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{member.displayName}</p>
                                                    {member.uid === group.adminId && <p className='text-xs text-primary'>Admin</p>}
                                                </div>
                                            </div>
                                            {isAdmin && member.uid !== currentUserProfile?.uid && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will remove {member.displayName} from the group.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleRemoveMember(member.uid)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Remove
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    )
                                })}
                                </div>
                            </ScrollArea>
                            {isAdmin && <Button className="w-full mt-4" onClick={() => setIsAddMemberDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4"/> Add Members</Button>}
                            {isAdmin && (
                                <>
                                    <div className="border-t border-destructive/20 my-4" />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">
                                                <Trash2 className="mr-2 h-4 w-4"/> Delete Group
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the
                                                    <span className="font-semibold text-foreground"> {group.name} </span>
                                                    group and all of its messages.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteGroup} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Delete Group
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </SheetContent>
                    </Sheet>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn('flex items-end gap-2', msg.senderId === currentUserProfile?.uid ? 'justify-end' : 'justify-start')}
                        >
                            {msg.senderId !== currentUserProfile?.uid && (
                                <Avatar className="h-8 w-8 self-end">
                                    <AvatarImage src={msg.senderPhotoURL ?? undefined} />
                                    <AvatarFallback>{msg.senderName?.charAt(0) ?? 'U'}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2 break-words',
                                msg.senderId === currentUserProfile?.uid
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-muted rounded-bl-none'
                            )}>
                                {msg.senderId !== currentUserProfile?.uid && (
                                    <p className="text-xs font-semibold pb-1 opacity-70">{msg.senderName}</p>
                                )}
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
            {group && isAdmin && (
                <AddGroupMemberDialog
                    isOpen={isAddMemberDialogOpen}
                    onOpenChange={setIsAddMemberDialogOpen}
                    groupId={groupId}
                    currentMemberIds={group.memberIds}
                />
            )}
        </>
    );
}
