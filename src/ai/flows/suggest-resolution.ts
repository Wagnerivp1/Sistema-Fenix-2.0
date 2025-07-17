// use server'
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting resolutions to technical issues.
 *
 * - suggestResolution - A function that takes device information, the reported problem, and past service records to suggest possible solutions or troubleshooting steps.
 * - SuggestResolutionInput - The input type for the suggestResolution function.
 * - SuggestResolutionOutput - The return type for the suggestResolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResolutionInputSchema = z.object({
  deviceType: z.string().describe('The type of device (e.g., laptop, printer, smartphone).'),
  reportedProblem: z.string().describe('The problem reported by the user or technician.'),
  pastServiceRecords: z.string().describe('A summary of past service records for similar issues.'),
});
export type SuggestResolutionInput = z.infer<typeof SuggestResolutionInputSchema>;

const SuggestResolutionOutputSchema = z.object({
  suggestedSolutions: z.array(
    z.string().describe('A list of suggested solutions or troubleshooting steps.')
  ).describe('Suggested solutions or troubleshooting steps for the reported problem.'),
  confidenceLevel: z.number().describe('A confidence level (0-1) indicating the reliability of the suggested solutions.'),
});
export type SuggestResolutionOutput = z.infer<typeof SuggestResolutionOutputSchema>;

export async function suggestResolution(input: SuggestResolutionInput): Promise<SuggestResolutionOutput> {
  return suggestResolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResolutionPrompt',
  input: {schema: SuggestResolutionInputSchema},
  output: {schema: SuggestResolutionOutputSchema},
  prompt: `You are an expert technical support agent. Based on the device type, reported problem, and past service records, suggest possible solutions or troubleshooting steps.

Device Type: {{{deviceType}}}
Reported Problem: {{{reportedProblem}}}
Past Service Records: {{{pastServiceRecords}}}

Provide a list of suggested solutions and a confidence level (0-1) for the suggestions.
Ensure the suggested solutions are actionable and relevant to the provided information.`,
});

const suggestResolutionFlow = ai.defineFlow(
  {
    name: 'suggestResolutionFlow',
    inputSchema: SuggestResolutionInputSchema,
    outputSchema: SuggestResolutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
