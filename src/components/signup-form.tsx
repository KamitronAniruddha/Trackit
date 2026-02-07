
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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { PatternLock } from './ui/pattern-lock';


const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  authMethod: z.enum(['password', 'pattern']),
  password: z.string(),
}).refine(data => {
    if (data.authMethod === 'password') {
        return data.password.length >= 8;
    }
    return true;
}, {
    message: 'Password must be at least 8 characters.',
    path: ['password'],
}).refine(data => {
    if (data.authMethod === 'pattern') {
        return data.password.split('-').length >= 4;
    }
    return true;
}, {
    message: 'Pattern must connect at least 4 dots.',
    path: ['password'],
});

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [patternError, setPatternError] = useState(false);
  
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      authMethod: 'password',
      password: '',
    },
  });
  
  const authMethod = form.watch('authMethod');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPatternError(false);
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
        authMethod: values.authMethod,
      };

      await setDoc(userDocRef, userData);

      toast({
        title: 'Account Created!',
        description: "Let's get your profile set up.",
      });
      router.push('/onboarding');

    } catch (error: any) {
      if (authMethod === 'pattern') {
          setPatternError(true);
      }
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
                    name="authMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Authentication Method</FormLabel>
                             <FormControl>
                                <RadioGroup
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue('password', '');
                                    form.clearErrors('password');
                                    setPatternError(false);
                                }}
                                defaultValue={field.value}
                                className="flex space-x-4 pt-2"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="password" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Password</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="pattern" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Pattern</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{authMethod === 'password' ? 'Password' : 'Draw Your Pattern'}</FormLabel>
                      <FormControl>
                        {authMethod === 'password' ? (
                            <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                        ) : (
                            <PatternLock 
                                onChange={(pattern) => {
                                    field.onChange(pattern.join('-'));
                                    setPatternError(false);
                                }}
                                onEnd={() => form.trigger('password')}
                                error={patternError || !!form.formState.errors.password}
                            />
                        )}
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
