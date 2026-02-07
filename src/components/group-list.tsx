
'use client';
import { useUserProfile } from "@/contexts/user-profile-context";
import { useFirestore } from "@/firebase/provider";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageSquarePlus, Users } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreateGroupDialog } from "@/components/create-group-dialog";

interface Group {
    id: string;
    name: string;
    photoURL?: string;
    lastMessage?: string;
    lastMessageAt?: { toDate: () => Date };
    memberIds: string[];
}

export function GroupList() {
    const firestore = useFirestore();
    const { profile: currentUserProfile } = useUserProfile();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        if (!currentUserProfile) {
            if (currentUserProfile === null) setLoading(false);
            return;
        }

        const groupsRef = collection(firestore, 'groups');
        const q = query(
            groupsRef,
            where('memberIds', 'array-contains', currentUserProfile.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const groupList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            
            groupList.sort((a, b) => {
                const dateA = a.lastMessageAt?.toDate()?.getTime() || 0;
                const dateB = b.lastMessageAt?.toDate()?.getTime() || 0;
                return dateB - dateA;
            });

            setGroups(groupList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching groups: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserProfile, firestore]);

    return (
        <>
            <div className="flex justify-end mb-4">
                 <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    New Group
                </Button>
            </div>
            <Card>
                <CardContent className="p-2 md:p-4">
                    {loading && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                    
                    {!loading && groups.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                             <Users className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">No groups yet</h3>
                            <p className="text-sm mt-2">Create a group to start collaborating with your peers.</p>
                        </div>
                    )}

                    {!loading && groups.length > 0 && (
                        <div className="space-y-2">
                            {groups.map(group => (
                                <Link href={`/dashboard/messages/${group.id}`} key={group.id} className="block">
                                    <div className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarFallback>
                                                <Users className="h-6 w-6 text-muted-foreground"/>
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 truncate">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold">{group.name}</h3>
                                                {group.lastMessageAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(group.lastMessageAt.toDate(), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{group.lastMessage}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <CreateGroupDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
        </>
    );
}
