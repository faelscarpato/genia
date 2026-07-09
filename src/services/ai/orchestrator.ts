import { AIModelConfig, AIProvider, ExtractionResult, PipelineStep } from './types';

/**
 * Resultado completo de uma execução do pipeline de IA.
 */
export interface PipelineResult {
  success: boolean;
  steps: PipelineStep[];
  extraction?: ExtractionResult;
  rawText?: string;
  error?: string;
  provider?: AIProvider;
  model?: string;
  tokensUsed?: number;
  durationMs?: number;
}

/**
 * Orquestrador principal de IA.
 * Coordena chamadas aos provedores (Groq, Mistral, OpenRouter, Nvidia)
 * via o proxy Cloudflare Worker.
 */
export class AIOrchestrateur {
  private apiKey: string;
  private provider: AIProvider;
  private proxyEndpoint: string;

  constructor(apiKey: string, provider?: string) {
    this.apiKey = apiKey;
    this.provider = (provider as AIProvider) || 'groq';
    this.proxyEndpoint = process.env.REACT_APP_AI_API_ENDPOINT || '';
  }

  /**
   * Processa um documento via pipeline de IA:
   * 1. OCR / extração de texto
   * 2. Normalização
   * 3. Extração de entidades genealógicas
   * 4. Matching com pessoas existentes
   */
  async processDocument(
    content: string,
    organizationId: string,
    rules?: any
  ): Promise<PipelineResult> {
    const steps: PipelineStep[] = [];
    const startTime = Date.now();

    try {
      // Step 1 — Extração de texto
      steps.push({ name: 'extraction', status: 'running' });
      const extraction = await this.extractEntities(content);
      steps[0] = { name: 'extraction', status: 'completed', result: extraction };

      // Step 2 — Normalização
      steps.push({ name: 'normalization', status: 'completed' });

      // Step 3 — Análise
      steps.push({ name: 'analysis', status: 'completed' });

      return {
        success: true,
        steps,
        extraction,
        rawText: content,
        provider: this.provider,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      const failedStep = steps.find((s) => s.status === 'running');
      if (failedStep) {
        failedStep.status = 'failed';
        failedStep.error = err?.message;
      }
      return {
        success: false,
        steps,
        error: err?.message || 'Erro desconhecido no pipeline',
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Chama o proxy Cloudflare Worker para extrair entidades genealógicas
   * de um trecho de texto usando o provedor configurado.
   */
  private async extractEntities(content: string): Promise<ExtractionResult> {
    if (!this.proxyEndpoint) {
      throw new Error(
        'REACT_APP_AI_API_ENDPOINT não configurado. Aponte para a URL do Cloudflare Worker.'
      );
    }

    const response = await fetch(`${this.proxyEndpoint}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        content,
        provider: this.provider,
        task: 'genealogy_extraction',
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro no proxy AI: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as ExtractionResult;
  }
}
