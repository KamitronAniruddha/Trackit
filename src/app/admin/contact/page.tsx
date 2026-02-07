
'use client';
import { ContactSubmissionsList } from '@/components/admin/contact-submissions-list';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';

export default function AdminContactPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Contact Form Messages</CardTitle>
                <CardDescription>
                    Review messages submitted through the developer contact form.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ContactSubmissionsList />
            </CardContent>
        </Card>
    );
}
