'use client';
import { SyllabusEditor } from '@/components/syllabus-editor';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  
export default function AdminSyllabusPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Syllabus Management</CardTitle>
                    <CardDescription>
                        Here you can edit syllabus content in the database. In the next step, we will connect the rest of the app to use this live data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SyllabusEditor />
                </CardContent>
            </Card>
        </div>
    );
}
