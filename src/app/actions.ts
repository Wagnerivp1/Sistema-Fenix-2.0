'use server';

import { suggestResolution, type SuggestResolutionOutput } from '@/ai/flows/suggest-resolution';

export async function getAiSuggestions(
  deviceType: string,
  reportedProblem: string
): Promise<{ success: true; data: SuggestResolutionOutput } | { success: false; error: string }> {
  if (!deviceType || !reportedProblem) {
    return { success: false, error: 'Por favor, preencha o tipo de equipamento e o defeito relatado.' };
  }

  try {
    const result = await suggestResolution({
      deviceType,
      reportedProblem,
      // Em uma aplicação real, você buscaria registros de serviços anteriores relevantes do seu banco de dados.
      pastServiceRecords:
        'Tela quebrada em modelo similar foi resolvida trocando o display. Outro caso de não ligar foi a bateria. Problemas de software geralmente resolvidos com reset de fábrica.',
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return { success: false, error: 'Falha ao obter sugestões da IA.' };
  }
}
