'use client';

import type { SuggestResolutionOutput } from '@/ai/flows/suggest-resolution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

interface AiSuggestionsProps {
  suggestions: SuggestResolutionOutput | null;
  isLoading: boolean;
}

export function AiSuggestions({ suggestions, isLoading }: AiSuggestionsProps) {
  if (isLoading) {
    return (
      <Card className="col-span-4 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugestões da IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) {
    return null;
  }

  const confidence = (suggestions.confidenceLevel * 100).toFixed(0);

  return (
    <Card className="col-span-4 bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            <span>Sugestões da IA</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Confiança: {confidence}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {suggestions.suggestedSolutions.map((solution, index) => (
            <li key={index}>{solution}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
