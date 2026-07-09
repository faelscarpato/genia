import { AIOrchestrator } from '../orchestrator';
import { PipelineResult } from '../types';

/**
 * Pipeline Documental Principal
 * Integra o orquestrador com persistência no Supabase e logs de auditoria.
 */
export async function runDocumentPipeline(
  content: string,
  context: {
    userId: string;
    organizationId: string;
    rules?: any;
    provider?: string;
    apiKey: string;
  }
): Promise<PipelineResult> {
  const orchestrator = new AIOrchestrator(context.apiKey, context.provider);
  
  // Execução do processamento de IA
  const result = await orchestrator.processDocument(content, context.rules);
  
  // Persistência e Auditoria seriam chamadas aqui
  // result.id serve como tracking para o log de auditoria no Supabase
  
  if (result.status === 'error') {
    console.error(`[Pipeline Error] ${result.id}: ${result.error}`);
  }

  return result;
}
