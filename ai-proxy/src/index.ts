/**
 * @module ai-proxy
 * @description Cloudflare Worker — proxy seguro para Groq, Mistral, OpenRouter e Nvidia.
 * URL producao: https://geniatree.faelscarpato.workers.dev
 *
 * Endpoints:
 *   POST /transcribe  — Processa texto via IA genealogica
 *   GET  /health      — Verifica provedores configurados
 */

export interface Env {
  GROQ_API_KEY: string;
  MISTRAL_API_KEY: string;
  OPENROUTER_API_KEY: string;
  NVIDIA_API_KEY: string;
  PROXY_SECRET: string;
  ALLOWED_ORIGIN: string;
}

type Provider = 'groq' | 'mistral' | 'openrouter' | 'nvidia';

// Configuracoes exatas de cada provider conforme documentacao oficial
const PROVIDER_CONFIGS: Record<Provider, {
  url: string;
  defaultModel: string;
  defaultTemp: number;
  maxTokens: number;
  topP: number;
}> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultTemp: 1,
    maxTokens: 1024,
    topP: 1,
  },
  mistral: {
    // Endpoint chat/completions (compativel OpenAI, sem stream, sem SDK)
    url: 'https://api.mistral.ai/v1/chat/completions',
    defaultModel: 'mistral-large-latest',
    defaultTemp: 0.7,
    maxTokens: 2048,
    topP: 1,
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    defaultTemp: 0.2,
    maxTokens: 1024,
    topP: 1,
  },
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    defaultTemp: 0.2,
    maxTokens: 1024,
    topP: 0.7,
  },
};

function getApiKey(provider: Provider, env: Env): string {
  const map: Record<Provider, string> = {
    groq: env.GROQ_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
    nvidia: env.NVIDIA_API_KEY,
  };
  return map[provider] || '';
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
  messages: { role: string; content: string }[],
  modelOverride?: string
): Promise<Response> {
  const cfg = PROVIDER_CONFIGS[provider];
  const model = modelOverride || cfg.defaultModel;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // OpenRouter exige headers extras para ranking
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://geniatree.pages.dev';
    headers['X-Title'] = 'Genealogia IA - Geniatree';
  }

  const bodyObj: Record<string, unknown> = {
    model,
    messages,
    temperature: cfg.defaultTemp,
    max_tokens: cfg.maxTokens,
    top_p: cfg.topP,
    stream: false,
  };

  // Groq usa max_completion_tokens (alias de max_tokens na v1)
  if (provider === 'groq') {
    delete bodyObj.max_tokens;
    bodyObj.max_completion_tokens = cfg.maxTokens;
    bodyObj.stop = null;
  }

  // Nvidia exige frequency_penalty e presence_penalty
  if (provider === 'nvidia') {
    bodyObj.frequency_penalty = 0;
    bodyObj.presence_penalty = 0;
  }

  return fetch(cfg.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj),
  });
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

    // GET /health — retorna status de cada provider
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          worker: 'geniatree-ai-proxy',
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

    // POST /transcribe — endpoint principal de extracao genealogica
    if (request.method === 'POST' && url.pathname === '/transcribe') {

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

      const provider: Provider = (['groq', 'mistral', 'openrouter', 'nvidia'].includes(body.provider))
        ? body.provider
        : 'groq'; // fallback padrao

      const content: string = body.content || '';
      const task: string = body.task || 'genealogy_extraction';
      const modelOverride: string | undefined = body.model;

      if (!content) {
        return new Response(JSON.stringify({ error: 'Campo content e obrigatorio' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const apiKey = getApiKey(provider, env);
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: `API key nao configurada para: ${provider}. Configure via wrangler secret put.` }),
          { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = task === 'genealogy_extraction'
        ? 'Voce e um especialista em genealogia brasileira. Extraia do texto as seguintes informacoes e responda APENAS com JSON valido, sem markdown, sem explicacoes: { "full_name": string, "birth_date": string|null, "father_name": string|null, "mother_name": string|null, "location": string|null, "confidence": number }'
        : 'Analise o documento genealogico fornecido e responda em JSON.';

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ];

      try {
        const aiResponse = await chamarProvider(provider, apiKey, messages, modelOverride);

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          return new Response(
            JSON.stringify({ error: `Erro no provider ${provider}`, status: aiResponse.status, detail: errText }),
            { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }

        const aiData: any = await aiResponse.json();
        const rawText: string = aiData?.choices?.[0]?.message?.content || '';

        // Tenta parsear JSON limpo (remove markdown se vier)
        let extraction: any;
        try {
          const cleaned = rawText.replace(/```json\s?|```/g, '').trim();
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

    return new Response(JSON.stringify({ error: 'Rota nao encontrada' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
