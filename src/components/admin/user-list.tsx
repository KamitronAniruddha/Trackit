'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy, doc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { useUserProfile, type UserProfile } from '@/contexts/user-profile-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger, 
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type UserWithId = UserProfile & { id: string };

export function UserList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { profile } = useUserProfile();
    const [users, setUsers] = useState<UserWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [banUser, setBanUser] = useState<UserWithId | null>(null);
    const [banDuration, setBanDuration] = useState(24); // default hours
    const [isBanning, setIsBanning] = useState(false);

    const [userToDelete, setUserToDelete] = useState<UserWithId | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setLoading(true);
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, orderBy('displayName'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userList = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as UserWithId))
                .filter(user => user.isDeleted !== true); // Filter out deleted users
            
            setUsers(userList);
            setLoading(false);
            setError(null);
        }, (err: any) => {
            console.error("Error fetching users:", err);
            setError("You don't have permission to view users. Check Firestore security rules.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);
    
    const handleBanUser = async () => {
        if (!banUser) return;
        setIsBanning(true);
    
        const expires = new Date();
        expires.setHours(expires.getHours() + banDuration);
        const banExpiresAt = Timestamp.fromDate(expires);
    
        const userRef = doc(firestore, 'users', banUser.id);
        try {
            await updateDoc(userRef, {
                isBanned: true,
                banExpiresAt: banExpiresAt,
            });
            toast({ title: 'User Banned', description: `${banUser.displayName} has been banned for ${banDuration} hours.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to ban user: ${e.message}` });
        } finally {
            setIsBanning(false);
            setBanUser(null);
        }
    };

    const handleUnbanUser = async (userToUnban: UserWithId) => {
        const userRef = doc(firestore, 'users', userToUnban.id);
        try {
            await updateDoc(userRef, {
                isBanned: false,
                banExpiresAt: null,
            });
            toast({ title: 'User Unbanned', description: `${userToUnban.displayName} has been unbanned.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to unban user: ${e.message}` });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
    
        const userRef = doc(firestore, 'users', userToDelete.id);
        try {
          await updateDoc(userRef, {
            isDeleted: true,
          });
          toast({ title: 'User Deleted', description: `${userToDelete.displayName} has been soft-deleted and will be hidden from users.` });
        } catch (e: any) {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to delete user: ${e.message}` });
        } finally {
          setIsDeleting(false);
          setUserToDelete(null);
        }
    };

    const handleRoleChange = async (userToUpdate: UserWithId, newRole: string) => {
        if (newRole === userToUpdate.role) return;
    
        const userRef = doc(firestore, 'users', userToUpdate.id);
        try {
            await updateDoc(userRef, { role: newRole });
            toast({ title: 'Role Updated', description: `${userToUpdate.displayName}'s role has been changed to ${newRole}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to update role: ${e.message}` });
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if(users.length === 0) {
        return <p className="text-muted-foreground text-center">No users found.</p>
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Exam</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.photoURL ?? undefined} />
                                            <AvatarFallback>
                                                {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{user.exam || 'N/A'}</Badge>
                                </TableCell>
                                <TableCell>
                                    {user.isBanned ? (
                                        <Badge variant="destructive">Banned</Badge>
                                    ) : (
                                        <Badge variant={user.onboardingCompleted ? 'secondary' : 'outline'}>
                                            {user.onboardingCompleted ? 'Active' : 'Onboarding'}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.role === 'admin' ? (
                                        <Badge>Admin</Badge>
                                    ) : user.role === 'subadmin' ? (
                                        <Badge variant="secondary">Sub-Admin</Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">User</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {profile && user.id !== profile.uid && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {profile.role === 'admin' && (
                                                    <>
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                                                            <DropdownMenuPortal>
                                                                <DropdownMenuSubContent>
                                                                    <DropdownMenuRadioGroup value={user.role || 'user'} onValueChange={(role) => handleRoleChange(user, role)}>
                                                                        <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                                                        <DropdownMenuRadioItem value="subadmin">Sub-Admin</DropdownMenuRadioItem>
                                                                        <DropdownMenuRadioItem value="user">User</DropdownMenuRadioItem>
                                                                    </DropdownMenuRadioGroup>
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuPortal>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}

                                                {(profile.role === 'admin' || (profile.role === 'subadmin' && user.role === 'user')) && (
                                                    user.isBanned 
                                                        ? <DropdownMenuItem onClick={() => handleUnbanUser(user)}>Unban User</DropdownMenuItem>
                                                        : <DropdownMenuItem onSelect={() => setBanUser(user)}>Ban User</DropdownMenuItem>
                                                )}

                                                {profile.role === 'admin' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => setUserToDelete(user)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4"/>
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <Dialog open={!!banUser} onOpenChange={(open) => !open && setBanUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban {banUser?.displayName}</DialogTitle>
                        <DialogDescription>Set a duration for the ban in hours. The user will be logged out and unable to access the app.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">
                                Duration (hours)
                            </Label>
                            <Input
                                id="duration"
                                type="number"
                                value={banDuration}
                                onChange={(e) => setBanDuration(Number(e.target.value))}
                                className="col-span-3"
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanUser(null)}>Cancel</Button>
                        <Button onClick={handleBanUser} disabled={isBanning}>
                            {isBanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Ban
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete {userToDelete?.displayName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft-delete the user. They will not be able to log in, and their profile will be hidden from all users. This action can only be undone manually in Firestore.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                             {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
