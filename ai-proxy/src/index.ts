/**
 * @module ai-proxy
 * @description Cloudflare Worker que atua como proxy seguro entre o frontend
 * Genealogia IA e os provedores de IA (Anthropic / OpenAI) para transcrição
 * e análise de documentos genealógicos.
 *
 * Endpoints:
 *   POST /transcribe  — Transcreve uma imagem via Claude Vision ou GPT-4o
 *   GET  /health      — Verifica se o Worker está ativo
 */

export interface Env {
  /** Chave da API Anthropic (Claude) — configurada via wrangler secret */
  ANTHROPIC_API_KEY: string;
  /** Chave da API OpenAI (GPT-4o) — configurada via wrangler secret */
  OPENAI_API_KEY: string;
  /** Chave de autenticação enviada pelo frontend no header Authorization */
  PROXY_SECRET: string;
  /** Origem permitida para CORS */
  ALLOWED_ORIGIN: string;
}

/** Headers CORS reutilizáveis */
function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/** Verifica o header Authorization contra o secret configurado */
function autenticado(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  return auth === `Bearer ${env.PROXY_SECRET}`;
}

/** Transcreve uma imagem usando Claude Vision (Anthropic) */
async function transcreverComClaude(
  imagemBase64: string,
  mimeType: string,
  instrucao: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imagemBase64.replace(/^data:[^;]+;base64,/, ''),
              },
            },
            {
              type: 'text',
              text: instrucao,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${erro}`);
  }

  const json: any = await response.json();
  return json.content?.[0]?.text ?? '';
}

/** Transcreve uma imagem usando GPT-4o Vision (OpenAI) */
async function transcreverComOpenAI(
  imagemBase64: string,
  instrucao: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imagemBase64, detail: 'high' },
            },
            { type: 'text', text: instrucao },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${erro}`);
  }

  const json: any = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN || '*';
    const headers = corsHeaders(origin);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json(
        { status: 'ok', timestamp: new Date().toISOString() },
        { headers }
      );
    }

    // Endpoint de transcrição
    if (url.pathname === '/transcribe' && request.method === 'POST') {
      // Autenticação
      if (!autenticado(request, env)) {
        return Response.json(
          { error: 'Não autorizado' },
          { status: 401, headers }
        );
      }

      let body: {
        imageData: string;
        mimeType?: string;
        instruction?: string;
        provider?: 'anthropic' | 'openai';
      };

      try {
        body = await request.json();
      } catch {
        return Response.json(
          { error: 'Body JSON inválido' },
          { status: 400, headers }
        );
      }

      const {
        imageData,
        mimeType = 'image/jpeg',
        instruction = 'Transcreva todo o texto visível neste documento genealógico. Preserve formatação, datas, nomes e locais exatamente como aparecem. Responda apenas com o texto transcrito.',
        provider = env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai',
      } = body;

      if (!imageData) {
        return Response.json(
          { error: 'imageData é obrigatório' },
          { status: 400, headers }
        );
      }

      try {
        let transcricao: string;

        if (provider === 'anthropic' && env.ANTHROPIC_API_KEY) {
          transcricao = await transcreverComClaude(imageData, mimeType, instruction, env.ANTHROPIC_API_KEY);
        } else if (env.OPENAI_API_KEY) {
          transcricao = await transcreverComOpenAI(imageData, instruction, env.OPENAI_API_KEY);
        } else {
          return Response.json(
            { error: 'Nenhuma chave de API configurada no Worker.' },
            { status: 503, headers }
          );
        }

        return Response.json({ transcricao }, { headers });
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'Erro desconhecido';
        return Response.json(
          { error: `Falha na transcrição: ${mensagem}` },
          { status: 502, headers }
        );
      }
    }

    return Response.json(
      { error: 'Rota não encontrada' },
      { status: 404, headers }
    );
  },
};
