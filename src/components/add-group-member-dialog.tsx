'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { UserProfile } from '@/contexts/user-profile-context';

const searchFormSchema = z.object({
  searchTerm: z.string().min(1, 'Please enter a name to search.'),
});

interface AddGroupMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentMemberIds: string[];
}

type UserSearchResult = Pick<UserProfile, 'uid' | 'displayName' | 'email' | 'photoURL'>;

export function AddGroupMemberDialog({ isOpen, onOpenChange, groupId, currentMemberIds }: AddGroupMemberDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      searchTerm: '',
    },
  });

  async function onSearch(values: z.infer<typeof searchFormSchema>) {
    setIsSearching(true);
    setSearchResults([]);
    try {
        const usersRef = collection(firestore, 'users');
        
        // This is a simplified, case-sensitive prefix search.
        // For a more robust, case-insensitive, full-text search in production,
        // it's recommended to use a dedicated search service like Algolia or Typesense.
        const q = query(usersRef, where('displayName', '>=', values.searchTerm), where('displayName', '<=', values.searchTerm + '\uf8ff'));

        const querySnapshot = await getDocs(q);
        const users: UserSearchResult[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (!currentMemberIds.includes(doc.id)) {
                users.push({
                    uid: doc.id,
                    displayName: data.displayName,
                    email: data.email,
                    photoURL: data.photoURL,
                });
            }
        });
        setSearchResults(users);
        
        if (users.length === 0) {
            toast({ variant: 'default', title: 'No users found matching your search.'});
        }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message || 'Could not perform search.',
      });
    } finally {
        setIsSearching(false);
    }
  }

  const handleAddMember = async (user: UserSearchResult) => {
    try {
        const groupDocRef = doc(firestore, 'groups', groupId);
        await updateDoc(groupDocRef, {
            memberIds: arrayUnion(user.uid)
        });
        toast({ title: 'Member added!', description: `${user.displayName} has been added to the group.`});
        // Remove user from search results after adding
        setSearchResults(prev => prev.filter(u => u.uid !== user.uid));
        onOpenChange(false); // Close dialog on success
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to add member',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
            form.reset();
            setSearchResults([]);
        }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>
            Search for users by name to add them to this group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSearch)} className="flex items-center gap-2 pt-4">
            <FormField
              control={form.control}
              name="searchTerm"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Search by name..." {...field} disabled={isSearching} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSearching} size="icon">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </Form>
        <ScrollArea className="h-64 mt-4">
            {searchResults.length > 0 ? (
                <div className="space-y-2 pr-4">
                    {searchResults.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.photoURL ?? undefined}/>
                                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="truncate">
                                    <p className="font-semibold truncate">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => handleAddMember(user)}>
                                <UserPlus className="mr-2 h-4 w-4"/> Add
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                !isSearching && <p className="text-center text-sm text-muted-foreground py-10">Search for users to add them.</p>
            )}
            {isSearching && (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
