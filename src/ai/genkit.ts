/**
 * @fileoverview This file initializes the Genkit AI framework with the Google AI plugin.
 * It exports a configured `ai` object that can be used throughout the application
 * to define and run AI flows.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize the Google AI plugin.
// You must have a `GEMINI_API_KEY` environment variable set.
const googleAIPlugin = googleAI();

// Configure Genkit with the Google AI plugin.
export const ai = genkit({
  plugins: [googleAIPlugin],
});
