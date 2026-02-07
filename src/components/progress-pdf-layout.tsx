
'use client';

import { NeetProgressLogo } from './icons';
import type { UserProfile } from '@/contexts/user-profile-context';
import type { ProgressState } from '@/hooks/use-progress';
import type { ALL_SUBJECTS } from '@/lib/neet-syllabus';


interface ProgressPdfLayoutProps {
    profile: UserProfile;
    progress: ProgressState;
    allSyllabus: typeof ALL_SUBJECTS[keyof typeof ALL_SUBJECTS];
    chartData: {
        totalChapters: number;
        completedChapters: number;
        overallCompletionPercentage: number;
        averageConfidence: number;
    }
}

export function ProgressPdfLayout({ profile, progress, allSyllabus, chartData }: ProgressPdfLayoutProps) {
    const subjects = Object.keys(allSyllabus);

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: 'white', color: '#111827', padding: '32px', width: '210mm', minHeight: '297mm' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <NeetProgressLogo style={{ height: '48px', width: '48px', color: '#374151' }} />
                    <div>
                        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Progress Report</h1>
                        <p style={{ fontSize: '18px', color: '#4b5563', margin: 0 }}>{profile.displayName}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                    <p style={{ margin: 0 }}>{profile.exam} Examination</p>
                    <p style={{ margin: 0 }}>Target Year: {profile.targetYear}</p>
                    <p style={{ margin: 0 }}>Generated on: {new Date().toLocaleDateString()}</p>
                </div>
            </header>

            <section style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Overall Completion</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '4px 0 0 0' }}>{chartData.overallCompletionPercentage.toFixed(1)}%</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>({chartData.completedChapters} / {chartData.totalChapters} chapters)</p>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Average Confidence</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '4px 0 0 0' }}>{chartData.averageConfidence.toFixed(1)}%</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Across all attempted chapters</p>
                    </div>
                </div>
            </section>

            <main style={{ marginTop: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>Detailed Progress</h2>
                {subjects.map(subjectKey => {
                    const chapters = allSyllabus[subjectKey as keyof typeof allSyllabus] || [];
                    const subjectProgress = progress[subjectKey as keyof typeof progress];
                    if (!subjectProgress) return null;

                    const subjectTitle = subjectKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    return (
                        <section key={subjectKey} style={{ marginBottom: '32px', breakInside: 'avoid' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>{subjectTitle}</h3>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>
                                        <th style={{ padding: '8px', width: '50%' }}>Chapter</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Completed</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Confidence</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>MCQs</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Revisions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chapters.map((chapterName, index) => {
                                        const chapterData = subjectProgress[chapterName];
                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '8px' }}>{chapterName.replace(/^\d+\.\s*/, '')}</td>
                                                <td style={{ padding: '8px', textAlign: 'center', color: chapterData?.completed ? '#10b981' : '#ef4444' }}>
                                                    {chapterData?.completed ? 'Yes' : 'No'}
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>{chapterData?.confidence ?? 'N/A'}%</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>{chapterData?.questions ?? '0'}</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>{chapterData?.revisions?.length ?? '0'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
