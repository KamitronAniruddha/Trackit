'use client';
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUserProfile } from "@/contexts/user-profile-context";
import { useFirestore, useStorage } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, type UploadTaskSnapshot } from "firebase/storage";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

// Define max file size (e.g., 3MB)
const MAX_FILE_SIZE = 3 * 1024 * 1024; 
const MAX_DIMENSION = 1920; // Max width/height for resizing

const postFormSchema = z.object({
    caption: z.string().max(2200, "Caption is too long.").optional(),
    image: z.instanceof(File).refine(file => file.size > 0, "An image is required."),
});

interface CreatePostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to promisify canvas.toBlob
function getCanvasBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
    return new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
}


export function CreatePostDialog({ isOpen, onOpenChange }: CreatePostDialogProps) {
    const { profile } = useUserProfile();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof postFormSchema>>({
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            caption: "",
        },
    });

    const isProcessing = isUploading || form.formState.isSubmitting;

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image file.' });
            return;
        }

        const tempPreviewUrl = URL.createObjectURL(file);
        setImagePreview(tempPreviewUrl);

        try {
            const img = new window.Image();
            const imgLoadPromise = new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => {
                    reject(new Error("Could not load image from file."));
                };
                img.src = tempPreviewUrl;
            });
            await imgLoadPromise;

            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            ctx.drawImage(img, 0, 0, width, height);
            
            const blob = await getCanvasBlob(canvas, 'image/jpeg', 0.8);
            URL.revokeObjectURL(tempPreviewUrl); // Clean up temp URL

            if (blob && blob.size <= MAX_FILE_SIZE) {
                const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
                form.setValue("image", compressedFile, { shouldValidate: true });
                setImagePreview(URL.createObjectURL(compressedFile));
            } else if (file.size <= MAX_FILE_SIZE) {
                form.setValue("image", file, { shouldValidate: true });
                setImagePreview(URL.createObjectURL(file));
                toast({ variant: "default", title: "Original Image Used", description: "Could not compress the image, but it's within the size limit." });
            } else {
                 toast({ variant: 'destructive', title: 'Image too large', description: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB, even after compression attempt.` });
                 setImagePreview(null);
                 form.resetField("image");
            }
        } catch (error: any) {
            console.error("Image processing error:", error);
            toast({ variant: 'destructive', title: 'Image Processing Failed', description: error.message || 'Please try another image.' });
            setImagePreview(null);
            form.resetField("image");
        }
    };

    const handleClose = () => {
        if (isProcessing) return;
        form.reset();
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onOpenChange(false);
    }

    async function onSubmit(values: z.infer<typeof postFormSchema>) {
        if (!profile) {
            toast({ variant: "destructive", title: "You must be logged in to post." });
            return;
        }
        
        setIsUploading(true);
        setUploadProgress(0);

        const filePath = `posts/${profile.uid}/${Date.now()}-${values.image.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, values.image);
        
        uploadTask.on('state_changed', 
            (snapshot: UploadTaskSnapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("A-gram image upload error:", error.code, error.message);
                let description = "Could not upload image. Please check file size and your network connection.";
                 if (error.code) {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            description = "You don't have permission to upload files. Check Firebase Storage security rules.";
                            break;
                        case 'storage/canceled':
                            description = "Upload was canceled.";
                            break;
                        case 'storage/unknown':
                            description = "An unknown error occurred during upload. Please try again.";
                            break;
                    }
                }
                toast({ variant: "destructive", title: "Image Upload Failed", description });
                setIsUploading(false);
                setUploadProgress(0);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    await addDoc(collection(firestore, "posts"), {
                        userId: profile.uid,
                        userDisplayName: profile.displayName,
                        userPhotoURL: profile.photoURL,
                        imageUrl: downloadURL,
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
                } finally {
                    setIsUploading(false);
                }
            }
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create a new post</DialogTitle>
                    <DialogDescription>
                        Select an image and write a caption to share with others.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Image preview" width={450} height={450} className="object-cover" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <ImageIcon className="h-12 w-12 mx-auto" />
                                    <p className="mt-2 text-sm">Image preview will appear here</p>
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                    <p className="mt-4 text-lg font-semibold">Uploading...</p>
                                    <p className="font-mono text-xl">{uploadProgress.toFixed(0)}%</p>
                                </div>
                            )}
                        </div>

                        {isUploading && <Progress value={uploadProgress} className="h-2 w-full" />}

                        <FormField
                            control={form.control}
                            name="image"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Image</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="image/png, image/jpeg"
                                            onChange={handleImageChange}
                                            ref={fileInputRef}
                                            disabled={isProcessing}
                                        />
                                    </FormControl>
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
                                        <Textarea placeholder="Write a caption..." {...field} disabled={isProcessing} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>Cancel</Button>
                            <Button type="submit" disabled={isProcessing || !form.formState.isValid}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? 'Uploading...' : 'Post'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
