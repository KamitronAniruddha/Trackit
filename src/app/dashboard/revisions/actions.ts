'use server';
import { generateRevisionTimetable } from '@/ai/flows/generate-revision-timetable-flow';

export async function generateTimetableAction(
  subject: string,
  exam: string
): Promise<{ timetableHtml?: string; error?: string }> {
  try {
    const result = await generateRevisionTimetable({ subject, exam });
    return { timetableHtml: result.timetableHtml };
  } catch (error) {
    console.error('Error generating timetable:', error);
    return { error: 'Failed to generate a timetable. Please try again.' };
  }
}
