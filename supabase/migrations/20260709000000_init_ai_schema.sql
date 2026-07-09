-- Extensões para IA e Segurança
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- Tabela de Documentos AI (OCR e Processamento)
-- Usa a tabela public.documents já existente via schema.sql.
-- Esta migration adiciona tabelas auxiliares do pipeline de IA.
-- =============================================================

-- Logs de Execução do Pipeline IA (Observabilidade)
CREATE TABLE IF NOT EXISTS public.pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  etapa TEXT,        -- ocr, limpeza, estruturacao, matching
  provider TEXT,     -- groq, mistral, openrouter
  modelo TEXT,
  tokens_input INT,
  tokens_output INT,
  latencia_ms INT,
  sucesso BOOLEAN,
  erro_msg TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Sugestões de Parentesco (Matching Engine)
-- Referencia public.persons (tabela correta definida em schema.sql)
CREATE TABLE IF NOT EXISTS public.matches_sugeridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_a_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  pessoa_b_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  score_confianca FLOAT CHECK (score_confianca >= 0.0 AND score_confianca <= 1.0),
  motivo_ia TEXT,
  status_revisao TEXT DEFAULT 'pendente' CHECK (status_revisao IN ('pendente', 'aprovado', 'rejeitado')),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_documento_id ON public.pipeline_logs(documento_id);
CREATE INDEX IF NOT EXISTS idx_matches_sugeridos_pessoa_a ON public.matches_sugeridos(pessoa_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_sugeridos_pessoa_b ON public.matches_sugeridos(pessoa_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_sugeridos_status ON public.matches_sugeridos(status_revisao);

-- RLS (Row Level Security)
ALTER TABLE public.pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches_sugeridos ENABLE ROW LEVEL SECURITY;

-- Policies: usuários autenticados podem ver seus próprios dados
CREATE POLICY "pipeline_logs_select" ON public.pipeline_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "matches_sugeridos_select" ON public.matches_sugeridos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "matches_sugeridos_insert" ON public.matches_sugeridos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "matches_sugeridos_update" ON public.matches_sugeridos
  FOR UPDATE USING (auth.role() = 'authenticated');
