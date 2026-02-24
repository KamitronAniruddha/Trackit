'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

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
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [patternError, setPatternError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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

  async function handlePasswordReset() {
    const email = passwordForm.getValues('email');
    if (!email || !z.string().email().safeParse(email).success) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter a valid email address to reset your password.',
      });
      passwordForm.setFocus('email');
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Email',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <Card className="relative w-full max-w-md overflow-hidden bg-background/80 backdrop-blur-xl border-border/20 shadow-2xl shadow-primary/10 animate-[fade-in-up_1s_ease-out]">
            <div className="relative">
                <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-20 w-20">
                <NeetProgressLogo className="h-full w-full" />
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
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. jane.doe@example.com" {...field} disabled={isLoading} />
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
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Password</FormLabel>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                                            onClick={handlePasswordReset}
                                            disabled={isSendingReset || isLoading}
                                        >
                                            {isSendingReset ? (
                                                <>
                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : 'Forgot Password?'}
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <FormControl>
                                            <Input 
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Your password"
                                                {...field} 
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            disabled={isLoading}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. jane.doe@example.com" {...field} disabled={isLoading} />
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. jane.doe@example.com" {...field} disabled={isLoading} />
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
                                                <Input type="password" maxLength={4} placeholder="&#x2022;&#x2022;&#x2022;&#x2022;" {...field} className="font-mono tracking-[0.5em] text-center" />
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
