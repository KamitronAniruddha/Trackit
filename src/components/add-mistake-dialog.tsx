'use client';

import { useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { Subject } from '@/lib/types';
import { useSyllabus } from '@/contexts/syllabus-context';
import { ScrollArea } from './ui/scroll-area';

const mistakeFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  chapter: z.string().min(1, 'Chapter is required.'),
  question: z.string().min(1, 'Topic/Question is required.').max(150, 'Topic is too long.'),
  myMistake: z.string().min(10, 'Please describe your mistake in at least 10 characters.'),
  correctConcept: z.string().min(10, 'Please describe the correct concept in at least 10 characters.'),
  tags: z.array(z.string()).optional(),
});

const presetTags = ["Conceptual Error", "Silly Mistake", "Calculation Error", "Misinterpretation", "Formula Error", "Time Pressure"];

interface AddMistakeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMistakeDialog({ isOpen, onOpenChange }: AddMistakeDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useUserProfile();
  const { syllabuses } = useSyllabus();
  
  const form = useForm<z.infer<typeof mistakeFormSchema>>({
    resolver: zodResolver(mistakeFormSchema),
    defaultValues: {
      subject: '',
      chapter: '',
      question: '',
      myMistake: '',
      correctConcept: '',
      tags: [],
    },
  });

  const { isSubmitting } = form.formState;
  const selectedSubject = form.watch('subject');

  const subjects = useMemo(() => {
    if (!syllabuses || !profile?.exam) return [];
    return Object.keys(syllabuses[profile.exam]!);
  }, [syllabuses, profile]);

  const chapters = useMemo(() => {
    if (!syllabuses || !profile?.exam || !selectedSubject) return [];
    return syllabuses[profile.exam]![selectedSubject as Subject]?.chapters || [];
  }, [syllabuses, profile, selectedSubject]);

  async function onSubmit(values: z.infer<typeof mistakeFormSchema>) {
    if (!profile) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    try {
      const mistakesRef = collection(firestore, 'users', profile.uid, 'mistakes');

      await addDoc(mistakesRef, {
        userId: profile.uid,
        ...values,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Mistake logged!', description: 'Your mistake has been added to your notebook.' });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to log mistake',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90dvh]">
        <DialogHeader>
          <DialogTitle>Log a New Mistake</DialogTitle>
          <DialogDescription>
            Analyze your errors to turn them into learning opportunities.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mx-6 px-6">
            <Form {...form}>
            <form id="add-mistake-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="chapter"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Chapter</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || !selectedSubject}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a chapter" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {chapters.map(chap => <SelectItem key={chap} value={chap}>{chap}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Question or Topic</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Projectile motion on an inclined plane" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="myMistake"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>What was your mistake?</FormLabel>
                    <FormControl>
                        <Textarea placeholder="I used sin(theta) instead of cos(theta) for the vertical component..." {...field} disabled={isSubmitting} rows={4} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="correctConcept"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>What is the correct concept/solution?</FormLabel>
                    <FormControl>
                        <Textarea placeholder="The vertical component of gravity on an incline is mg*cos(theta)..." {...field} disabled={isSubmitting} rows={4} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex flex-wrap gap-2">
                            {presetTags.map((tag) => (
                                <Button
                                key={tag}
                                type="button"
                                variant={field.value?.includes(tag) ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    const currentTags = field.value || [];
                                    const newTags = currentTags.includes(tag)
                                    ? currentTags.filter((t) => t !== tag)
                                    : [...currentTags, tag];
                                    field.onChange(newTags);
                                }}
                                >
                                {tag}
                                </Button>
                            ))}
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </form>
            </Form>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button type="submit" form="add-mistake-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Mistake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
