'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

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
import { Loader2, ShieldAlert } from 'lucide-react';
import { useFirebaseApp } from '@/firebase/provider';
import { DeveloperCredit } from '@/components/developer-credit';

const passwordFormSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const app = useFirebaseApp();
  const auth = getAuth(app);

  const [isVerifyingCode, setIsVerifyingCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const oobCode = searchParams.get('oobCode');

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    async function verifyCode() {
      if (!oobCode) {
        setError('Invalid or missing password reset link. Please request a new one.');
        setIsVerifyingCode(false);
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsVerifyingCode(false);
      } catch (error: any) {
        let errorMessage = 'Invalid or expired password reset link. Please request a new one.';
        if (error.code === 'auth/invalid-action-code') {
            // This is the expected error for invalid/expired codes.
        } else {
            console.error(error);
        }
        setError(errorMessage);
        setIsVerifyingCode(false);
      }
    }
    verifyCode();
  }, [auth, oobCode]);

  async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!oobCode) {
      setError('Invalid action code.');
      return;
    }
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      toast({
        title: 'Password Reset Successful!',
        description: 'You can now log in with your new password.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifyingCode) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying link...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="p-3 bg-destructive/10 rounded-full">
                <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={() => router.push('/login')}>Back to Login</Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>
      </form>
    </Form>
  );
}


export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4">
            <Card className="relative w-full max-w-md overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
                <div className="absolute inset-0 bg-gradient-to-br from-card to-secondary/10" />
                <div className="relative">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-20 w-20">
                            <NeetProgressLogo className="h-full w-full" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Reset Your Password</CardTitle>
                        <CardDescription>Enter a new password for your account below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}>
                            <ResetPasswordForm />
                        </Suspense>
                    </CardContent>
                </div>
            </Card>
            <DeveloperCredit />
        </main>
    );
}