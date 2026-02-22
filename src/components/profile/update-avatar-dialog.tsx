'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Link2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

interface UpdateAvatarDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlSubmit: (url: string) => Promise<void>;
  isUploading: boolean;
}

const urlFormSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }),
});

export function UpdateAvatarDialog({
  isOpen,
  onOpenChange,
  onFileUpload,
  onUrlSubmit,
  isUploading,
}: UpdateAvatarDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      imageUrl: '',
    },
  });
  
  const handleUrlSubmit = async (values: z.infer<typeof urlFormSchema>) => {
    await onUrlSubmit(values.imageUrl);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isUploading) {
            onOpenChange(open);
            form.reset();
        }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a method to update your avatar.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="link">From Link</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-12 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Click the button below to select an image from your device.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileUpload}
                className="hidden"
                accept="image/png, image/jpeg"
                disabled={isUploading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Select File
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="link" className="pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUrlSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="https://..." 
                                        {...field}
                                        disabled={isUploading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <Button type="submit" className="w-full" disabled={isUploading}>
                        {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Link2 className="mr-2 h-4 w-4" />
                        )}
                        Update from Link
                    </Button>
                </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
