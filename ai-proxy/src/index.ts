/**
 * @module ai-proxy
 * @description Cloudflare Worker — proxy seguro para Groq, Mistral, OpenRouter e Nvidia.
 *
 * Endpoints:
 *   POST /transcribe  — Processa texto/imagem via IA genealogica
 *   GET  /health      — Verifica se o Worker esta ativo
 */

export interface Env {
  /** wrangler secret put GROQ_API_KEY */
  GROQ_API_KEY: string;
  /** wrangler secret put MISTRAL_API_KEY */
  MISTRAL_API_KEY: string;
  /** wrangler secret put OPENROUTER_API_KEY */
  OPENROUTER_API_KEY: string;
  /** wrangler secret put NVIDIA_API_KEY */
  NVIDIA_API_KEY: string;
  /** wrangler secret put PROXY_SECRET */
  PROXY_SECRET: string;
  /** Definido em wrangler.toml [vars] */
  ALLOWED_ORIGIN: string;
}

type Provider = 'groq' | 'mistral' | 'openrouter' | 'nvidia';

const PROVIDER_CONFIGS: Record<Provider, { url: string; defaultModel: string }> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-large-latest',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
  },
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.3-70b-instruct',
  },
};

function getApiKey(provider: Provider, env: Env): string {
  const keys: Record<Provider, string> = {
    groq: env.GROQ_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
    nvidia: env.NVIDIA_API_KEY,
  };
  return keys[provider] || '';
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function autenticado(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  return auth === `Bearer ${env.PROXY_SECRET}`;
}

async function chamarProvider(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  messages: any[]
): Promise<Response> {
  const config = PROVIDER_CONFIGS[provider];
  const modelUsado = model || config.defaultModel;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // OpenRouter exige headers adicionais
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://geniatree.pages.dev';
    headers['X-Title'] = 'Genealogia IA';
  }

  const body = JSON.stringify({
    model: modelUsado,
    messages,
    temperature: 0.2,
    max_tokens: 1024,
  });

  return fetch(config.url, { method: 'POST', headers, body });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = corsHeaders(origin);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    // GET /health
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          providers: {
            groq: !!env.GROQ_API_KEY,
            mistral: !!env.MISTRAL_API_KEY,
            openrouter: !!env.OPENROUTER_API_KEY,
            nvidia: !!env.NVIDIA_API_KEY,
          },
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // POST /transcribe
    if (request.method === 'POST' && url.pathname === '/transcribe') {
      // Autenticacao
      if (!autenticado(request, env)) {
        return new Response(JSON.stringify({ error: 'Nao autorizado' }), {
          status: 401,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Body JSON invalido' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const provider: Provider = body.provider || 'groq';
      const model: string | undefined = body.model;
      const content: string = body.content || '';
      const task: string = body.task || 'genealogy_extraction';

      if (!content) {
        return new Response(JSON.stringify({ error: 'Campo content e obrigatorio' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const apiKey = getApiKey(provider, env);
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: `Chave de API nao configurada para provider: ${provider}` }),
          { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt =
        task === 'genealogy_extraction'
          ? `Voce e um especialista em genealogia brasileira. Extraia do texto as seguintes informacoes em JSON: full_name, birth_date, father_name, mother_name, location, confidence (0-1). Responda APENAS com o JSON, sem explicacoes.`
          : `Analise o documento genealogico fornecido e responda em JSON.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ];

      try {
        const aiResponse = await chamarProvider(provider, apiKey, model, messages);

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          return new Response(
            JSON.stringify({ error: `Erro no provider ${provider}`, detail: errText }),
            { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }

        const aiData: any = await aiResponse.json();
        const rawText = aiData?.choices?.[0]?.message?.content || '';

        let extraction: any = {};
        try {
          // Remove markdown code blocks se existir
          const cleaned = rawText.replace(/```json|```/g, '').trim();
          extraction = JSON.parse(cleaned);
        } catch {
          extraction = { raw_reasoning: rawText, confidence: 0 };
        }

        return new Response(JSON.stringify(extraction), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: 'Erro interno no Worker', detail: err?.message }),
          { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 404 para qualquer outra rota
    return new Response(JSON.stringify({ error: 'Rota nao encontrada' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
