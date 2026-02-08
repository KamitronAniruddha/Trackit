'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Updated schema to use a URL string instead of a file
const postFormSchema = z.object({
    caption: z.string().max(2200, "Caption is too long.").optional(),
    imageUrl: z.string().url({ message: "Please enter a valid image URL." }).min(1, "An image link is required."),
});

interface CreatePostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ isOpen, onOpenChange }: CreatePostDialogProps) {
    const { profile } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof postFormSchema>>({
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            caption: "",
            imageUrl: "",
        },
    });

    const { isSubmitting } = form.formState;

    const handleClose = () => {
        if (isSubmitting) return;
        form.reset();
        onOpenChange(false);
    }

    async function onSubmit(values: z.infer<typeof postFormSchema>) {
        if (!profile) {
            toast({ variant: "destructive", title: "You must be logged in to post." });
            return;
        }
        
        // No more uploading, just direct Firestore write
        try {
            await addDoc(collection(firestore, "posts"), {
                userId: profile.uid,
                userDisplayName: profile.displayName,
                userPhotoURL: profile.photoURL,
                imageUrl: values.imageUrl,
                caption: values.caption || "",
                likes: [],
                createdAt: serverTimestamp(),
            });
            
            toast({ title: "Post created!", description: "Your post is now live." });
            handleClose();
        } catch (firestoreError: any) {
            console.error("A-gram post creation error:", firestoreError);
            toast({
                variant: "destructive",
                title: "Failed to Save Post",
                description: firestoreError.message || "Could not save post data to the database.",
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create a new post</DialogTitle>
                    <DialogDescription>
                        Paste a direct image link from Google Drive and write a caption.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image Link</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="https://drive.google.com/uc?id=..." 
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Make sure your Google Drive link is a direct download link (usually starts with &quot;https://drive.google.com/uc?id=...&quot;).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="caption"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Caption</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Write a caption..." {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
