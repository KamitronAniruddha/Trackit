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
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useFirebaseApp } from '@/firebase/provider';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Copy } from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const addUserFormSchema = z.object({
  displayName: z.string().min(3, { message: 'Display name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ isOpen, onOpenChange }: AddUserDialogProps) {
  const { toast } = useToast();
  const mainApp = useFirebaseApp();
  const firestore = useFirestore();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const form = useForm<z.infer<typeof addUserFormSchema>>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setGeneratedPassword(null);
  };

  async function onSubmit(values: z.infer<typeof addUserFormSchema>) {
    const tempPassword = Math.random().toString(36).slice(-10);
    const tempAppName = `auth-worker-${Date.now()}`;
    const tempApp = initializeApp(mainApp.options, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, tempPassword);
      const { user } = userCredential;

      // Create user document in Firestore using the main app's instance
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: values.displayName,
        email: values.email,
        onboardingCompleted: false, // User needs to complete onboarding themselves
        role: 'user',
        isBanned: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });

      setGeneratedPassword(tempPassword);
      form.reset(); // Clear form for next entry
      toast({
        title: 'User Created Successfully!',
        description: `${values.displayName} has been added to the system.`,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to create user',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        // Clean up the temporary app
        await deleteApp(tempApp);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New User</DialogTitle>
          <DialogDescription>
            Create a new user account. A temporary password will be generated for them.
          </DialogDescription>
        </DialogHeader>

        {generatedPassword ? (
            <div className="space-y-4 py-4">
                <Alert>
                    <AlertTitle>User Created!</AlertTitle>
                    <AlertDescription>
                        Share this temporary password with the user. They should change it after their first login.
                    </AlertDescription>
                </Alert>
                <div className="relative">
                    <Input readOnly value={generatedPassword} className="pr-10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                        onClick={() => {
                            navigator.clipboard.writeText(generatedPassword);
                            toast({ title: 'Password copied!' });
                        }}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
        ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Doe" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create User
                    </Button>
                    </DialogFooter>
                </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
