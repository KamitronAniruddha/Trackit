
'use client';

import { NeetProgressLogo } from './icons';
import type { ALL_SUBJECTS } from '@/lib/neet-syllabus';

interface SyllabusPdfLayoutProps {
  exam: 'NEET' | 'JEE';
  allSyllabus: typeof ALL_SUBJECTS[keyof typeof ALL_SUBJECTS];
}

export function SyllabusPdfLayout({ exam, allSyllabus }: SyllabusPdfLayoutProps) {
    const subjects = Object.keys(allSyllabus);

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: 'white', color: '#111827', padding: '32px', width: '210mm', minHeight: '297mm' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <NeetProgressLogo style={{ height: '48px', width: '48px', color: '#374151' }} />
                    <div>
                        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Syllabus</h1>
                        <p style={{ fontSize: '18px', color: '#4b5563', margin: 0 }}>{exam} Examination</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                    <p style={{ margin: 0 }}>Generated on: {new Date().toLocaleDateString()}</p>
                    <p style={{ margin: 0 }}>From Exam Tracker</p>
                </div>
            </header>

            <main style={{ marginTop: '32px' }}>
                {subjects.map(subjectKey => {
                    const chapters = allSyllabus[subjectKey as keyof typeof allSyllabus] || [];
                    const subjectTitle = subjectKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    return (
                        <section key={subjectKey} style={{ marginBottom: '32px', breakInside: 'avoid' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>{subjectTitle}</h2>
                            <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                                {chapters.map((chapter, index) => (
                                    <li key={index} style={{ marginBottom: '8px' }}>{chapter.replace(/^\d+\.\s*/, '')}</li>
                                ))}
                            </ol>
                        </section>
                    );
                })}
            </main>

            <footer style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', paddingTop: '32px', marginTop: '32px', borderTop: '1px solid #f3f4f6' }}>
                <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Exam Tracker. All rights reserved.</p>
            </footer>
        </div>
    );
}
