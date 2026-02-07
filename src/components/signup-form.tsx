
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NeetProgressLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirebaseApp, useFirestore } from '@/firebase/provider';
import { DeveloperCredit } from './developer-credit';


const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      // Update Auth profile
      await updateProfile(userCredential.user, {
        displayName: values.name,
      });

      // Create user document in Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const accessCode = Math.random().toString().slice(2, 8); // 6-digit random code

      const userData = {
        displayName: values.name,
        email: values.email,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        isBanned: false,
        isDeleted: false,
        role: 'user', // Always assign 'user' role on client-side signup
        isPremium: false,
        accountStatus: 'demo',
        accessCode: accessCode,
      };

      await setDoc(userDocRef, userData);

      toast({
        title: 'Account Created!',
        description: "Let's get your profile set up.",
      });
      router.push('/onboarding');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4">
      <Card className="relative w-full max-w-md overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-card to-secondary/10" />
        <div className="relative">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <NeetProgressLogo className="h-16 w-16" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
            <CardDescription>Start your journey to success today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} disabled={isLoading} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Log in
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
      <DeveloperCredit />
    </main>
  );
}
