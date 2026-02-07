
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Subject } from '@/lib/types';
import { useSyllabus } from '@/contexts/syllabus-context';
import { useProgress } from '@/hooks/use-progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { SubGoal } from './goal-dashboard';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

const goalFormSchema = z.object({
  type: z.enum(['chapter', 'custom'], { required_error: 'Please select a goal type.' }),
  subject: z.string().optional(),
  chapter: z.string().optional(),
  text: z.string().max(100, "Custom goal must be 100 characters or less.").optional(),
}).refine((data) => {
    if (data.type === 'chapter') return !!data.subject && !!data.chapter;
    if (data.type === 'custom') return !!data.text && data.text.trim().length > 0;
    return false;
}, {
    message: 'Please fill in the required fields for the selected goal type.',
    path: ['type'],
});


interface SetGoalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingGoals: SubGoal[];
  date: Date | undefined;
}

export function SetGoalDialog({ isOpen, onOpenChange, existingGoals, date }: SetGoalDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile } = useUserProfile();
  const { syllabuses } = useSyllabus();
  const { progress } = useProgress();

  const [goals, setGoals] = useState<SubGoal[]>([]);

  const form = useForm<z.infer<typeof goalFormSchema>>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { type: 'chapter' }
  });
  
  useEffect(() => {
    if (isOpen) {
        setGoals(existingGoals);
    }
  }, [isOpen, existingGoals]);


  const { isSubmitting } = form.formState;
  const goalType = form.watch('type');
  const selectedSubject = form.watch('subject');


  const uncompletedChaptersBySubject = useMemo(() => {
    if (!syllabuses || !profile?.exam || !progress) return {};

    const examSyllabus = syllabuses[profile.exam];
    if (!examSyllabus) return {};

    const result: Record<string, string[]> = {};

    for (const subjectKey of Object.keys(examSyllabus) as Subject[]) {
      const subjectProgress = progress[subjectKey];
      const chapters = examSyllabus[subjectKey]?.chapters || [];
      
      if (!subjectProgress) {
        result[subjectKey] = chapters;
        continue;
      }

      result[subjectKey] = chapters.filter(chapter => !subjectProgress[chapter]?.completed);
    }
    return result;
  }, [syllabuses, progress, profile]);

  function handleAddGoal(values: z.infer<typeof goalFormSchema>) {
    const newGoal: SubGoal = {
        type: values.type,
        completed: false,
    };
    if (values.type === 'chapter') {
        newGoal.subject = values.subject as Subject;
        newGoal.chapter = values.chapter;
    } else if (values.type === 'custom') {
        newGoal.text = values.text;
    }
    setGoals(prev => [...prev, newGoal]);
    form.reset({ type: 'chapter', subject: '', chapter: '', text: '' });
  }

  function handleRemoveGoal(indexToRemove: number) {
    setGoals(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  async function handleSetDailyGoals() {
    if (!profile || !date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const goalRef = doc(firestore, 'users', profile.uid, 'dailyGoals', dateString);

    try {
      await setDoc(goalRef, {
        userId: profile.uid,
        date: dateString,
        goals: goals,
        completed: goals.length > 0 && goals.every(g => g.completed),
      });

      toast({ title: `Goals for ${dateString} have been set!`, description: 'Now go and crush them!' });
      onOpenChange(false);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to set goals',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

  const subjects = Object.keys(uncompletedChaptersBySubject || {}).filter(
    (subject) => uncompletedChaptersBySubject[subject]?.length > 0
  );
  const chaptersForSelectedSubject = selectedSubject ? uncompletedChaptersBySubject[selectedSubject] : [];


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Your Daily Goals for {date ? format(date, 'MMMM do') : ''}</DialogTitle>
          <DialogDescription>
            Add one or more goals you want to focus on.
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-b py-4 my-4">
            <h4 className="font-medium mb-2 text-center">Your Goals List</h4>
            {goals.length > 0 ? (
                <ScrollArea className="h-32 pr-4">
                    <div className="space-y-2">
                        {goals.map((goal, index) => (
                            <div key={index} className={cn("flex items-center justify-between p-2 rounded-md", goal.completed ? 'bg-green-500/10' : 'bg-muted/50')}>
                                <div>
                                    <p className={cn("font-medium text-sm", goal.completed && "line-through text-muted-foreground")}>
                                        {goal.chapter || goal.text}
                                    </p>
                                    {goal.subject && <p className="text-xs text-muted-foreground">{goal.subject.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}</p>}
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveGoal(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Add goals using the form below.</p>
            )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddGoal)} className="space-y-4">
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Goal Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('subject', '');
                          form.setValue('chapter', '');
                          form.setValue('text', '');
                      }}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="chapter" />
                        </FormControl>
                        <FormLabel className="font-normal">Complete a Chapter</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="custom" />
                        </FormControl>
                        <FormLabel className="font-normal">Custom Goal</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {goalType === 'custom' ? (
                <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Goal Description</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Review last week's notes" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {subjects.map(subject => (
                                <SelectItem key={subject} value={subject}>
                                {subject.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}
                                </SelectItem>
                            ))}
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubject}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={!selectedSubject ? "First select a subject" : "Select a chapter"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {chaptersForSelectedSubject.map(chapter => (
                                <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            )}

            <Button type="submit" variant="secondary" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Goal to List
            </Button>
          </form>
        </Form>
        <DialogFooter className="pt-4">
            <Button onClick={handleSetDailyGoals} disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Goals
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
