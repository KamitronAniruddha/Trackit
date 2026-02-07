'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendContactEmail } from '@/app/actions/send-contact-email';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';

const contactFormSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Invalid email address.'),
    message: z.string().min(10, 'Message must be at least 10 characters.'),
});

function ContactForm() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof contactFormSchema>>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: { name: '', email: '', message: '' },
    });

    const { isSubmitting } = form.formState;

    async function onSubmit(values: z.infer<typeof contactFormSchema>) {
        const result = await sendContactEmail(values);
        if (result.success) {
            toast({ title: 'Message Sent!', description: result.message });
            form.reset();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Email</FormLabel>
                            <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl><Textarea placeholder="Your message..." {...field} rows={5} disabled={isSubmitting} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Message
                </Button>
            </form>
        </Form>
    );
}

function AboutSection() {
    return (
        <div className="space-y-6 text-center">
             <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
                <AvatarFallback className="text-3xl">A</AvatarFallback>
            </Avatar>
            <div>
                <h3 className="text-2xl font-semibold">Aniruddha</h3>
                <p className="text-muted-foreground">Full Stack Developer</p>
            </div>
            <p className="text-sm">
                {/* Replace this with your actual bio */}
                Hello! I'm Aniruddha, the developer behind this application. I specialize in building modern, responsive web applications with a focus on user experience and cutting-edge technology. I hope this tool helps you on your exam preparation journey!
            </p>
            {/* Add links to social media if you want */}
        </div>
    );
}

export function DeveloperCredit() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <footer className="py-8 text-center text-sm text-muted-foreground mt-auto">
                Made by{' '}
                <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-primary underline-offset-4 hover:underline"
                    onClick={() => setIsOpen(true)}
                >
                    Aniruddha
                </Button>
            </footer>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>About the Developer</DialogTitle>
                        <DialogDescription>
                            Get to know the creator or send a message.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="about">About Me</TabsTrigger>
                            <TabsTrigger value="contact">Contact</TabsTrigger>
                        </TabsList>
                        <TabsContent value="about" className="pt-6">
                           <AboutSection />
                        </TabsContent>
                        <TabsContent value="contact" className="pt-6">
                            <ContactForm />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
}
