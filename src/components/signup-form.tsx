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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NeetProgressLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useFirebaseApp, useFirestore } from '@/firebase/provider';
import { DeveloperCredit } from './developer-credit';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { PatternLock } from './ui/pattern-lock';
import { Label } from './ui/label';


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
  const [showPassword, setShowPassword] = useState(false);
  
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
      
      await updateProfile(userCredential.user, {
        displayName: values.name,
      });

      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const accessCode = Math.random().toString().slice(2, 8);

      const userData = {
        displayName: values.name,
        email: values.email,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        isBanned: false,
        isDeleted: false,
        role: 'user',
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
     <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] p-4 overflow-hidden">
        <div className="fixed inset-0 -z-10 h-full w-full bg-[#000000] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="fixed inset-0 -z-20 h-full w-full bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-background-pan" />
      
        <Card className="relative w-full max-w-md overflow-hidden bg-background/80 backdrop-blur-xl border-border/20 shadow-2xl shadow-primary/10 animate-[fade-in-up_1s_ease-out]">
        <div className="relative">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20">
              <NeetProgressLogo className="h-full w-full" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
            <CardDescription>Start your journey to success today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                            <Input placeholder=" " {...field} disabled={isLoading} className="peer block w-full appearance-none border-0 border-b-2 bg-transparent px-0 py-2.5 focus:border-primary focus:outline-none focus:ring-0" />
                        </FormControl>
                        <Label className="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-muted-foreground duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary">Full Name</Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                            <Input placeholder=" " {...field} disabled={isLoading} className="peer block w-full appearance-none border-0 border-b-2 bg-transparent px-0 py-2.5 focus:border-primary focus:outline-none focus:ring-0" />
                        </FormControl>
                        <Label className="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-muted-foreground duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary">Email Address</Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                    control={form.control}
                    name="authMethod"
                    render={({ field }) => (
                        <FormItem>
                            <Label>Authentication Method</Label>
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
                                    <Label className="font-normal">Password</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="pattern" />
                                    </FormControl>
                                    <Label className="font-normal">Pattern</Label>
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
                      <Label className="text-muted-foreground">{authMethod === 'password' ? 'Password' : 'Draw Your Pattern'}</Label>
                      <FormControl>
                        {authMethod === 'password' ? (
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder=" "
                                    {...field}
                                    disabled={isLoading}
                                    className="peer block w-full appearance-none border-0 border-b-2 bg-transparent px-0 py-2.5 pr-10 focus:border-primary focus:outline-none focus:ring-0"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    disabled={isLoading}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
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
