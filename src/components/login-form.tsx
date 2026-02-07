'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NeetProgressLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirebaseApp } from '@/firebase/provider';
import { DeveloperCredit } from '@/components/developer-credit';
import { PatternLock } from './ui/pattern-lock';


const passwordFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const pinFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  pin: z.string().length(4, { message: 'PIN must be 4 digits.' }),
});

const patternFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  pattern: z.string().min(1, { message: 'Pattern is required.' }),
});


export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [patternError, setPatternError] = useState(false);
  
  const app = useFirebaseApp();
  const auth = getAuth(app);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const pinForm = useForm<z.infer<typeof pinFormSchema>>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: { email: '', pin: '' },
  });
  
  const patternForm = useForm<z.infer<typeof patternFormSchema>>({
    resolver: zodResolver(patternFormSchema),
    defaultValues: { email: '', pattern: '' },
  });

  async function performLogin(email: string, secret: string) {
    setIsLoading(true);
    setPatternError(false);
    try {
      await signInWithEmailAndPassword(auth, email, secret);
      toast({
        title: 'Login Successful!',
        description: 'Redirecting to your dashboard...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      setPatternError(true);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    performLogin(values.email, values.password);
  }

  function onPinSubmit(values: z.infer<typeof pinFormSchema>) {
    toast({
        title: 'How PIN Sign-In Works',
        description: "PIN sign-in is a quick-unlock feature for returning users. To enable it, sign in with your password and set a PIN in your profile. On your next visit from this device, you'll be prompted to unlock the app with just your PIN.",
        duration: 15000,
    });
  }

  function onPatternSubmit(values: z.infer<typeof patternFormSchema>) {
    performLogin(values.email, values.pattern);
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
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="pattern">Pattern</TabsTrigger>
                    <TabsTrigger value="pin">PIN</TabsTrigger>
                </TabsList>
                <TabsContent value="password" className="pt-6">
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
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
                          control={passwordForm.control}
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
                          Sign In
                        </Button>
                      </form>
                    </Form>
                </TabsContent>
                <TabsContent value="pattern" className="pt-6">
                    <Form {...patternForm}>
                        <form onSubmit={patternForm.handleSubmit(onPatternSubmit)} className="space-y-6">
                            <FormField
                                control={patternForm.control}
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
                                control={patternForm.control}
                                name="pattern"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Login Pattern</FormLabel>
                                        <FormControl>
                                             <PatternLock 
                                                onChange={(pattern) => {
                                                    field.onChange(pattern.join('-'));
                                                    setPatternError(false);
                                                }}
                                                error={patternError}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full text-lg" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In with Pattern
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="pin" className="pt-6">
                    <Form {...pinForm}>
                        <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-6">
                            <FormField
                                control={pinForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={pinForm.control}
                                name="pin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>4-Digit PIN</FormLabel>
                                        <FormControl>
                                            <Input type="password" maxLength={4} placeholder="••••" {...field} className="font-mono tracking-[0.5em] text-center"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full text-lg">
                                Sign In with PIN
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
      <DeveloperCredit />
    </main>
  );
}
