import { AIOrchestrateur } from '../orchestrator';
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
  const orchestrator = new AIOrchestrateur(context.apiKey, context.provider);

  // Execução do processamento de IA
  const result = await orchestrator.processDocument(
    content,
    context.organizationId,
    context.rules
  );

  return result;
}
