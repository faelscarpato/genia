import type { TranscriptionResult } from '../types';

/** URL do proxy de IA, configurável via variável de ambiente */
const API_ENDPOINT = process.env.REACT_APP_AI_API_ENDPOINT ?? '';

/**
 * Serviço para transcrição de documentos históricos via IA (Claude/GPT-4o Vision).
 *
 * Requer a variável de ambiente `REACT_APP_AI_API_ENDPOINT` apontando para
 * o proxy Cloudflare Worker (ou similar) que guarda a API key com segurança.
 *
 * Ao chamar `transcribe()`, o documento é enviado ao proxy que retorna um
 * `TranscriptionResult` estruturado em português.
 *
 * Nota: esta funcionalidade requer conexão com a internet.
 */
export class TranscriptionService {
  /**
   * Verifica se o serviço de IA está configurado (variável de ambiente definida).
   */
  isConfigured(): boolean {
    return Boolean(API_ENDPOINT && API_ENDPOINT.trim().length > 0);
  }

  /**
   * Envia uma imagem base64 ao proxy de IA e retorna o resultado da transcrição.
   *
   * @param imageBase64 - Conteúdo da imagem em base64 (sem prefixo data:)
   * @param mimeType - Tipo MIME da imagem (image/jpeg, image/png, etc.)
   * @returns Resultado estruturado da transcrição
   * @throws Error se o serviço não estiver configurado ou a chamada falhar
   */
  async transcribe(imageBase64: string, mimeType: string): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'O serviço de IA não está configurado. ' +
        'Defina REACT_APP_AI_API_ENDPOINT no arquivo .env para habilitar a transcrição. ' +
        'Consulte o README.md para instruções detalhadas.'
      );
    }

    const resposta = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!resposta.ok) {
      const erro = await resposta.text().catch(() => 'Erro desconhecido');
      throw new Error(`Falha na transcrição (${resposta.status}): ${erro}`);
    }

    const dados = await resposta.json() as TranscriptionResult;
    return dados;
  }
}

export default TranscriptionService;
