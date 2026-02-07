'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRevisionTimetableInputSchema = z.object({
  subject: z.string().describe('The subject for which to generate a revision timetable.'),
  exam: z.string().describe('The competitive exam the user is preparing for (e.g., NEET, JEE).'),
});
type GenerateRevisionTimetableInput = z.infer<typeof GenerateRevisionTimetableInputSchema>;

const GenerateRevisionTimetableOutputSchema = z.object({
  timetableHtml: z.string().describe('A 7-day revision timetable formatted as a clean HTML string. It should include headings for each day and a list of topics/tasks.'),
});
type GenerateRevisionTimetableOutput = z.infer<typeof GenerateRevisionTimetableOutputSchema>;

export async function generateRevisionTimetable(input: GenerateRevisionTimetableInput): Promise<GenerateRevisionTimetableOutput> {
  return generateRevisionTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRevisionTimetablePrompt',
  input: {schema: GenerateRevisionTimetableInputSchema},
  output: {schema: GenerateRevisionTimetableOutputSchema},
  prompt: `You are an expert exam preparation coach for students in India.

A student is preparing for the {{exam}} exam and needs a revision plan for the '{{subject}}' subject.

Create a concise and effective 7-day revision timetable. The plan should break down the subject into manageable daily tasks, covering key concepts and suggesting practice problems.

Your response MUST be a JSON object with a single key "timetableHtml".
The value for "timetableHtml" must be a string containing the timetable formatted as clean HTML. Use tags like <h2> for the main title, <h3> for each day, and <ul>/<li> for the daily tasks.
`,
});

const generateRevisionTimetableFlow = ai.defineFlow(
  {
    name: 'generateRevisionTimetableFlow',
    inputSchema: GenerateRevisionTimetableInputSchema,
    outputSchema: GenerateRevisionTimetableOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
