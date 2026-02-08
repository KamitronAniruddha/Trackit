
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile, type UserProfile } from '@/contexts/user-profile-context';
import { collection, query, where, getDocs, onSnapshot, documentId } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FollowButton } from '@/components/follow-button';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  initialTab: 'followers' | 'following';
}

const UserList = ({ uids }: { uids: string[] }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (uids.length === 0) {
            setLoading(false);
            setUsers([]);
            return;
        }
        setLoading(true);

        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where(documentId(), 'in', uids.slice(0, 10))); // Firestore 'in' query limit is 10

        getDocs(q).then((snapshot) => {
            const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(userList);
            setLoading(false);
        });
    }, [uids, firestore]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div>
                <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-40" /></div>
                <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-24" /></div>
            </div>
        );
    }
    
    if (users.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">No users to display.</p>;
    }

    return (
        <div className="space-y-4">
            {users.map(user => (
                <div key={user.uid} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL ?? undefined} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <FollowButton targetUserId={user.uid} />
                </div>
            ))}
        </div>
    );
};


export function FollowListDialog({ isOpen, onOpenChange, user, initialTab }: FollowListDialogProps) {
  const firestore = useFirestore();
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const followsRef = collection(firestore, 'follows');
    
    const followersQuery = query(followsRef, where('followedId', '==', user.uid));
    const followingQuery = query(followsRef, where('followerId', '==', user.uid));

    const unsubFollowers = onSnapshot(followersQuery, snap => setFollowers(snap.docs.map(doc => doc.data().followerId)));
    const unsubFollowing = onSnapshot(followingQuery, snap => setFollowing(snap.docs.map(doc => doc.data().followedId)));

    return () => {
        unsubFollowers();
        unsubFollowing();
    };

  }, [user, firestore, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Social Connections</DialogTitle>
            <DialogDescription>
                Explore {user.displayName}'s network.
            </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="followers">Followers</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            <TabsContent value="followers">
                <ScrollArea className="h-80 mt-4 pr-4">
                    <UserList uids={followers} />
                </ScrollArea>
            </TabsContent>
            <TabsContent value="following">
                <ScrollArea className="h-80 mt-4 pr-4">
                    <UserList uids={following} />
                </ScrollArea>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
