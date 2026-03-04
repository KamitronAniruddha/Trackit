'use client';
import { SyllabusEditor } from '@/components/syllabus-editor';
  
export default function AdminSyllabusPage() {
    return (
        <div className="space-y-6">
             <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Syllabus Management</h1>
                <p className="text-muted-foreground">
                    Visually edit, reorder, and manage syllabus content for both NEET and JEE exams.
                </p>
            </div>
            <SyllabusEditor />
        </div>
    );
}
