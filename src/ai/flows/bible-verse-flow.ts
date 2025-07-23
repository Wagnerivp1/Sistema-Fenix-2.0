
'use server';
/**
 * @fileOverview An AI flow to fetch a random, inspirational bible verse.
 *
 * - getBibleVerse - A function that returns a single bible verse.
 * - BibleVerseOutput - The return type for the getBibleVerse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BibleVerseOutputSchema = z.object({
  verseText: z.string().describe('The full text of the biblical verse.'),
  verseReference: z.string().describe('The reference for the verse (e.g., John 3:16).'),
});
export type BibleVerseOutput = z.infer<typeof BibleVerseOutputSchema>;

export async function getBibleVerse(): Promise<BibleVerseOutput> {
  return getBibleVerseFlow();
}

const prompt = ai.definePrompt({
  name: 'bibleVersePrompt',
  output: { schema: BibleVerseOutputSchema },
  prompt: `Please provide a single, inspirational biblical verse. Choose a verse that is uplifting and encouraging. Return it in the specified JSON format.`,
});

const getBibleVerseFlow = ai.defineFlow(
  {
    name: 'getBibleVerseFlow',
    outputSchema: BibleVerseOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    if (!output) {
        throw new Error("Failed to get a response from the AI model.");
    }
    return output;
  }
);
