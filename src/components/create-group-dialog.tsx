
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const groupFormSchema = z.object({
  name: z.string().min(3, { message: 'Group name must be at least 3 characters.' }).max(50),
  description: z.string().max(150).optional(),
});

interface CreateGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ isOpen, onOpenChange }: CreateGroupDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useUserProfile();
  const router = useRouter();

  const form = useForm<z.infer<typeof groupFormSchema>>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof groupFormSchema>) {
    if (!profile) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    try {
      const newGroupRef = await addDoc(collection(firestore, 'groups'), {
        name: values.name,
        description: values.description || '',
        adminId: profile.uid,
        memberIds: [profile.uid],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      toast({ title: 'Group created!', description: `"${values.name}" is ready.` });
      onOpenChange(false);
      form.reset();
      router.push(`/dashboard/messages/${newGroupRef.id}`);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create group',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new group</DialogTitle>
          <DialogDescription>
            Start a new conversation with your study partners.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Physics Doubts" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What's the purpose of this group?" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
