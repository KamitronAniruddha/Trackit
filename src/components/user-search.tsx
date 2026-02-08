
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile, type UserProfile } from '@/contexts/user-profile-context';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { FollowButton } from './follow-button';
import { Card } from './ui/card';

export function UserSearch() {
    const firestore = useFirestore();
    const { profile: currentUser } = useUserProfile();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        const usersRef = collection(firestore, 'users');
        // Order by name for a predictable initial list
        const q = query(usersRef, orderBy('displayName'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = snapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
                .filter(user => user.uid !== currentUser.uid && user.isDeleted !== true); // Exclude self and deleted users
            setUsers(userList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, firestore]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Input
                placeholder="Search for users by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-lg"
            />
            {filteredUsers.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredUsers.map(user => (
                        <Card key={user.uid} className="p-4 flex flex-col items-center text-center gap-3">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.photoURL ?? undefined} />
                                <AvatarFallback className="text-2xl">{user.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="font-semibold">{user.displayName}</p>
                                <p className="text-xs text-muted-foreground">{user.exam}</p>
                            </div>
                            <FollowButton targetUserId={user.uid} />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg border border-dashed">
                    <h3 className="text-lg font-semibold">No users found</h3>
                    <p className="text-sm mt-2">
                        {searchTerm ? 'Try a different search term.' : 'There are no other users on the platform yet.'}
                    </p>
                </div>
            )}
        </div>
    );
}
