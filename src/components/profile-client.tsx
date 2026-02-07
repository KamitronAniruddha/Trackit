
'use client';

import { KeySquare, Edit, Loader2, ShieldCheck, Camera, BookCopy, Palette, AlertTriangle, Gem } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useRef } from 'react';
import { updateProfile as updateAuthProfile, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useStorage } from '@/firebase/provider';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUserProfile } from '@/contexts/user-profile-context';
import type { Subject } from '@/lib/types';
import type { ProgressState } from '@/hooks/use-progress';
import { useSyllabus, type SyllabusData } from '@/contexts/syllabus-context';
import { Switch } from './ui/switch';
import { PremiumCodeActivator } from './premium-code-activator';


const profileFormSchema = z.object({
  displayName: z.string().min(1, { message: 'Name is required.' }),
  classLevel: z.string({required_error: "Class level is required."}),
  targetYear: z.coerce.number().min(new Date().getFullYear(), {message: "Target year cannot be in the past."}),
});

const passwordFormSchema = z.object({
    oldPassword: z.string().min(1, { message: 'Old password is required.' }),
    newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ['confirmPassword'],
});

const pinFormSchema = z.object({
    pin: z.string().length(4, { message: 'PIN must be exactly 4 digits.' }).regex(/^\d{4}$/, { message: 'PIN must only contain digits.' }),
});

const getInitialStateForExam = (exam: 'NEET' | 'JEE', syllabusData: SyllabusData | null): ProgressState => {
    const initialState = {} as ProgressState;
    if (!syllabusData) return initialState;
    const examSyllabus = syllabusData[exam];
    if (!examSyllabus) return initialState;

    for (const subjectKey of Object.keys(examSyllabus)) {
        const subject = subjectKey as Subject;
        const subjectData = examSyllabus[subject];
        if (subjectData) {
            initialState[subject] = {};
            for (const chapter of subjectData.chapters) {
                initialState[subject][chapter] = {
                    completed: false,
                    questions: 0,
                    confidence: 50,
                    revisions: [],
                };
            }
        }
    }
    return initialState;
};

export function ProfileClient() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { profile, loading: isProfileLoading, updateProfileSetting } = useUserProfile();
    const { syllabuses, loading: syllabusLoading } = useSyllabus();
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [isSwitchingExam, setIsSwitchingExam] = useState(false);
    const [isUpdatingAppearance, setIsUpdatingAppearance] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isSettingPin, setIsSettingPin] = useState(false);


    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
          displayName: '',
          classLevel: '12',
          targetYear: new Date().getFullYear() + 1,
        },
      });
    
    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const pinForm = useForm<z.infer<typeof pinFormSchema>>({
        resolver: zodResolver(pinFormSchema),
        defaultValues: {
            pin: profile?.loginCode || '',
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                displayName: profile.displayName,
                classLevel: profile.classLevel,
                targetYear: profile.targetYear,
            });
            pinForm.reset({
                pin: profile.loginCode || '',
            });
        }
    }, [profile, form, pinForm]);
  
    async function onSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!auth.currentUser) {
            toast({
                variant: "destructive",
                title: "Not Authenticated",
                description: "You must be logged in to update your profile.",
            });
            return;
        }

        const currentUser = auth.currentUser;
        setIsUpdating(true);
        try {
            // Update auth profile (for display name)
            if (currentUser.displayName !== values.displayName) {
                await updateAuthProfile(currentUser, {
                    displayName: values.displayName,
                });
            }
            
            // Update firestore document
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            await setDoc(userDocRef, { 
                displayName: values.displayName,
                classLevel: values.classLevel,
                targetYear: values.targetYear
             }, { merge: true });
            
            await currentUser.reload();
            
            router.refresh();

            toast({
                title: "Profile Updated",
                description: "Your details have been successfully updated.",
            });
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsUpdating(false);
        }
    }
        
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        if (!auth.currentUser) {
            toast({ variant: 'destructive', title: 'Not authenticated' });
            return;
        }
    
        const file = event.target.files[0];
        const currentUser = auth.currentUser;
        setIsUploading(true);
    
        try {
            const filePath = `profile-pictures/${currentUser.uid}/${file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(uploadResult.ref);
    
            await updateAuthProfile(currentUser, { photoURL });
    
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            await setDoc(userDocRef, { photoURL }, { merge: true });
    
            await currentUser.reload();
            
            router.refresh();
    
            toast({ title: 'Profile picture updated!' });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message || 'An error occurred during upload.',
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handlePasswordReset = async () => {
        if (!auth.currentUser || !auth.currentUser.email) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not find user email. Please try again.',
            });
            return;
        }
        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail(auth, auth.currentUser.email);
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
    };

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        if (!auth.currentUser || !auth.currentUser.email) {
            toast({
                variant: "destructive",
                title: "Not Authenticated",
                description: "You must be logged in to change your password.",
            });
            return;
        }

        setIsChangingPassword(true);
        try {
            const currentUser = auth.currentUser;
            const credential = EmailAuthProvider.credential(currentUser.email, values.oldPassword);
            await reauthenticateWithCredential(currentUser, credential);

            await updatePassword(currentUser, values.newPassword);

            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully.",
            });
            setIsPasswordDialogOpen(false);
            passwordForm.reset();

        } catch (error: any) {
            let description = "An unexpected error occurred.";
            if (error.code === 'auth/wrong-password') {
                description = "The old password you entered is incorrect. Please try again.";
            } else if (error.message) {
                description = error.message;
            }
            toast({
                variant: "destructive",
                title: "Password Change Failed",
                description,
            });
        } finally {
            setIsChangingPassword(false);
        }
    }
    
    async function onPinSubmit(values: z.infer<typeof pinFormSchema>) {
        setIsSettingPin(true);
        try {
            await updateProfileSetting('loginCode', values.pin);
            toast({ title: 'PIN Updated!', description: 'Your new PIN has been set.' });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'PIN Update Failed',
                description: 'Could not save your PIN.',
            });
        } finally {
            setIsSettingPin(false);
        }
    }

    const handleSwitchExam = async () => {
        if (!auth.currentUser || !profile || !syllabuses) {
            toast({
                variant: "destructive",
                title: "Not Authenticated",
                description: "You must be logged in to switch exams.",
            });
            return;
        }
        setIsSwitchingExam(true);
        const currentUser = auth.currentUser;
        const newExam = profile.exam === 'NEET' ? 'JEE' : 'NEET';
    
        try {
            const newProgress = getInitialStateForExam(newExam, syllabuses);
            const userDocRef = doc(firestore, 'users', currentUser.uid);
            const progressDocRef = doc(firestore, 'userProgress', currentUser.uid);
    
            await Promise.all([
                setDoc(userDocRef, { exam: newExam }, { merge: true }),
                setDoc(progressDocRef, { progress: newProgress })
            ]);
    
            toast({
                title: "Exam Switched!",
                description: `You are now on the ${newExam} track. Your progress has been reset.`,
            });
    
            router.refresh();
    
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Switch Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsSwitchingExam(false);
        }
    };
    
    async function handleSettingChange(key: 'theme' | 'font' | 'darkMode' | 'accountStatus', value: string | boolean) {
        if (!auth.currentUser) return;
        setIsUpdatingAppearance(true);
        try {
            await updateProfileSetting(key, value);
            toast({ title: `${key.charAt(0).toUpperCase() + key.slice(1)} updated!` });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: `Could not save your ${key} setting.`,
            });
        } finally {
            setIsUpdatingAppearance(false);
        }
    }
    
    const handleResetData = async () => {
        if (!auth.currentUser || !profile || !syllabuses) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not reset data. User profile or syllabus not loaded.",
            });
            return;
        }
        setIsResetting(true);
        const currentUser = auth.currentUser;
    
        try {
            const newProgress = getInitialStateForExam(profile.exam!, syllabuses);
            const progressDocRef = doc(firestore, 'userProgress', currentUser.uid);
            const userDocRef = doc(firestore, 'users', currentUser.uid);
    
            const batch = writeBatch(firestore);
    
            // Reset progress data
            batch.set(progressDocRef, { 
                progress: newProgress,
                revisions: {}
            });
            
            // Reset streak data on user profile
            batch.update(userDocRef, {
                currentStreak: 0,
                lastGoalCompletedDate: null
            });
    
            await batch.commit();
    
            toast({
                title: "Data Reset Successful",
                description: "All your progress data has been reset.",
            });
    
            router.refresh();
    
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Reset Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsResetting(false);
        }
    };

    const isLoading = isProfileLoading || syllabusLoading;
    
    return (
        <div className="space-y-8">
            {!isLoading && profile && !profile.isPremium && (
                 <Card className="bg-gradient-to-r from-primary/10 via-card to-accent/10 border-primary/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gem />
                            Upgrade to Premium
                        </CardTitle>
                        <CardDescription>
                            Unlock all features by activating your account with a code provided by an administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <PremiumCodeActivator />
                    </CardContent>
                </Card>
            )}
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>Your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                    {isLoading ? (
                            <div className="space-y-6 pt-2">
                                <div className="flex justify-center py-4">
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-6 w-3/4" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-6 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-6 w-1/2" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-6 w-1/3" />
                                </div>
                            </div>
                        ) : profile ? (
                            <>
                                <div className="flex justify-center py-4">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24 border-4 border-primary/20">
                                            <AvatarImage src={profile.photoURL ?? undefined} alt={profile.displayName} />
                                            <AvatarFallback className="text-3xl">
                                                {profile.displayName?.charAt(0).toUpperCase() ?? 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                            accept="image/png, image/jpeg"
                                            disabled={isUploading}
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="absolute bottom-0 right-0 rounded-full bg-background"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            aria-label="Upload profile picture"
                                        >
                                            {isUploading ? <Loader2 className="animate-spin" /> : <Camera className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                                    <p className="text-lg font-semibold">{profile.displayName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="text-lg font-semibold">{profile.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Exam</p>
                                    <p className="text-lg font-semibold">{profile.exam}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Class Level</p>
                                    <p className="text-lg font-semibold">{profile.classLevel}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Target Year</p>
                                    <p className="text-lg font-semibold">{profile.targetYear}</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                Could not load user profile. Please try logging in again.
                            </div>
                        )
                    }
                    </CardContent>
                    <CardContent className="flex justify-end">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline" disabled={!profile}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Edit profile</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your profile here. Click save when you're done.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="displayName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Your Name" {...field} disabled={isUpdating} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="classLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Class Level</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={isUpdating}>
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
                                                    <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} disabled={isUpdating}>
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
                                        <DialogFooter>
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save changes
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
                <div className="space-y-8">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeySquare />
                                Quick Access PIN
                            </CardTitle>
                            <CardDescription>
                                Set a 4-digit PIN to quickly unlock the app instead of using your password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...pinForm}>
                                <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="flex items-center gap-4">
                                    <FormField
                                        control={pinForm.control}
                                        name="pin"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input type="password" maxLength={4} placeholder="&#x2022;&#x2022;&#x2022;&#x2022;" {...field} disabled={isSettingPin} className="font-mono text-lg tracking-[0.5em]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSettingPin || !pinForm.formState.isDirty}>
                                        {isSettingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save PIN
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette />
                                Appearance
                            </CardTitle>
                            <CardDescription>
                            Customize the look and feel of the app.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Dark Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable dark mode.
                                    </p>
                                </div>
                                <Switch
                                    checked={profile?.darkMode ?? true}
                                    onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                                    disabled={isUpdatingAppearance || !profile}
                                    aria-label="Toggle dark mode"
                                />
                            </div>
                            <div>
                                <Label htmlFor="theme-select">Theme</Label>
                                <Select
                                    value={profile?.theme || 'default'}
                                    onValueChange={(value) => handleSettingChange('theme', value as any)}
                                    disabled={isUpdatingAppearance || !profile}
                                >
                                    <SelectTrigger id="theme-select" className="mt-2">
                                        <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default</SelectItem>
                                        <SelectItem value="rose">Rose</SelectItem>
                                        <SelectItem value="violet">Violet</SelectItem>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="orange">Orange</SelectItem>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="purple">Purple</SelectItem>
                                        <SelectItem value="teal">Teal</SelectItem>
                                        <SelectItem value="crimson">Crimson</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {isUpdatingAppearance && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Applying changes...</div>}
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookCopy />
                                Change Exam
                            </CardTitle>
                            <CardDescription>
                                Switching exams will reset your progress. This action is permanent.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full" variant="outline" disabled={!profile || isSwitchingExam}>
                                        {isSwitchingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Switch to {profile?.exam === 'NEET' ? 'JEE' : 'NEET'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is permanent and cannot be undone. Switching to the {profile?.exam === 'NEET' ? 'JEE' : 'NEET'} track will
                                            <strong className="font-bold text-destructive"> completely reset all your current syllabus progress.</strong>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isSwitchingExam}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSwitchExam} disabled={isSwitchingExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            {isSwitchingExam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Yes, reset my progress and switch
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck />
                                Account Security
                            </CardTitle>
                            <CardDescription>
                            Manage your account security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Dialog open={isPasswordDialogOpen} onOpenChange={(isOpen) => {
                                setIsPasswordDialogOpen(isOpen);
                                if (!isOpen) {
                                    passwordForm.reset();
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button type="button" className="w-full">
                                        <KeySquare className="mr-2 h-4 w-4" />
                                        Change Password
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Change Password</DialogTitle>
                                        <DialogDescription>
                                            Enter your old and new password below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...passwordForm}>
                                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 pt-4">
                                            <FormField
                                                control={passwordForm.control}
                                                name="oldPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Old Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="••••••••" {...field} disabled={isChangingPassword} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={passwordForm.control}
                                                name="newPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>New Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="••••••••" {...field} disabled={isChangingPassword} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={passwordForm.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirm New Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="••••••••" {...field} disabled={isChangingPassword} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <DialogFooter>
                                                <Button type="submit" disabled={isChangingPassword}>
                                                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Confirm Change
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                            <Button type="button" className="w-full" variant="outline" onClick={handlePasswordReset} disabled={isSendingReset}>
                                {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Password Reset Email
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="bg-destructive/10 border-destructive/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle />
                                Danger Zone
                            </CardTitle>
                            <CardDescription className="text-destructive/80">
                            These actions are permanent and cannot be undone.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full" disabled={isResetting}>
                                        Reset All Progress Data
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete all of your syllabus progress, including completion status, confidence ratings, MCQs practiced, and revision history. Your account and personal details will not be affected.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleResetData} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
                                            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Yes, reset my progress
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
