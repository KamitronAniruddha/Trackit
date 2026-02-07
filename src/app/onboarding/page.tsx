
'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NeetProgressLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase/provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useUserProfile } from '@/contexts/user-profile-context';
import { DeveloperCredit } from '@/components/developer-credit';

const onboardingFormSchema = z.object({
  exam: z.enum(['NEET', 'JEE'], { required_error: 'Please select an exam.' }),
  classLevel: z.string({ required_error: "Class level is required." }),
  targetYear: z.coerce.number().min(new Date().getFullYear(), { message: "Target year cannot be in the past." }),
});

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile, loading: profileLoading } = useUserProfile();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const form = useForm<z.infer<typeof onboardingFormSchema>>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      classLevel: '12',
      targetYear: new Date().getFullYear() + 1,
    },
  });

  useEffect(() => {
    if (!profileLoading && profile?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [profile, profileLoading, router]);

  async function onSubmit(values: z.infer<typeof onboardingFormSchema>) {
    if (!profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to complete onboarding.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(firestore, 'users', profile.uid);
      await setDoc(userDocRef, {
        ...values,
        onboardingCompleted: true,
      }, { merge: true });

      toast({ title: 'Welcome!', description: 'Your profile has been set up.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (profileLoading || (!profileLoading && profile?.onboardingCompleted)) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4">
      <Card className="relative w-full max-w-lg overflow-hidden border-primary/20 shadow-2xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-card to-secondary/10" />
        <div className="relative">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <NeetProgressLogo className="h-16 w-16" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome! Let's get you started.</CardTitle>
            <CardDescription>Tell us a bit about your goals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="exam"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">Which exam are you preparing for?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="NEET" />
                            </FormControl>
                            <FormLabel className="font-normal text-base">
                              NEET (Medical)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="JEE" />
                            </FormControl>
                            <FormLabel className="font-normal text-base">
                              JEE (Engineering)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="classLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class Level</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="11">11th Grade</SelectItem>
                                        <SelectItem value="12">12th Grade</SelectItem>
                                        <SelectItem value="Dropper">Dropper</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="targetYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target Year</FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} disabled={isSubmitting}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a year" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={String(year)}>
                                        {year}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <Button type="submit" className="w-full text-lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue to Dashboard
                </Button>
              </form>
            </Form>
          </CardContent>
        </div>
      </Card>
      <DeveloperCredit />
    </main>
  );
}
