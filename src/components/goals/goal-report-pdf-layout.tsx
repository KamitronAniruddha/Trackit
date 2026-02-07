'use client';

import { NeetProgressLogo } from '../icons';
import type { UserProfile } from '@/contexts/user-profile-context';
import type { DailyGoal } from './goal-dashboard';

interface GoalReportPdfLayoutProps {
    profile: UserProfile;
    goal: DailyGoal;
}

export function GoalReportPdfLayout({ profile, goal }: GoalReportPdfLayoutProps) {
    
    const goalDate = new Date(goal.date.replace(/-/g, '/'));

    return (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: 'white', color: '#111827', padding: '32px', width: '210mm', minHeight: '297mm', position: 'relative' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <NeetProgressLogo style={{ height: '48px', width: '48px', color: '#374151' }} />
                    <div>
                        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Daily Goal Report</h1>
                        <p style={{ fontSize: '18px', color: '#4b5563', margin: 0 }}>{profile.displayName}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                    <p style={{ margin: 0 }}>Date: {goalDate.toLocaleDateString()}</p>
                    <p style={{ margin: 0 }}>Exam: {profile.exam}</p>
                </div>
            </header>

            <main style={{ marginTop: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>Goals for {goalDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}>
                            <th style={{ padding: '12px', width: '15%' }}>Type</th>
                            <th style={{ padding: '12px', width: '65%' }}>Details</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '20%' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {goal.goals.map((subGoal, index) => {
                            let detail;
                            if (subGoal.type === 'chapter') {
                                detail = `${subGoal.chapter} (${subGoal.subject?.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')})`;
                            } else if (subGoal.type === 'revision') {
                                detail = `Revise ${subGoal.subject?.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')}`;
                            } else {
                                detail = subGoal.text;
                            }
                            
                            if (subGoal.type === 'revision' && typeof subGoal.questionsSolved === 'number' && subGoal.questionsSolved > 0) {
                                detail += ` (${subGoal.questionsSolved} MCQs)`;
                            }

                            const type = subGoal.type.charAt(0).toUpperCase() + subGoal.type.slice(1);
                            
                            return (
                                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px', fontWeight: 500 }}>{type}</td>
                                    <td style={{ padding: '12px' }}>{detail}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: subGoal.completed ? '#10b981' : '#ef4444' }}>
                                       {subGoal.completed ? 'Completed' : 'Pending'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 <div style={{marginTop: '32px', padding: '16px', backgroundColor: goal.completed ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${goal.completed ? '#bbf7d0' : '#fecaca'}`}}>
                    <p style={{margin: 0, fontSize: '16px', fontWeight: 600, color: goal.completed ? '#166534' : '#991b1b' }}>
                        Overall Status: {goal.completed ? 'All goals completed!' : 'Goals pending.'}
                    </p>
                </div>
            </main>

            <footer style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', paddingTop: '32px', borderTop: '1px solid #f3f4f6' }}>
                <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Exam Tracker. All rights reserved.</p>
            </footer>
        </div>
    );
}
