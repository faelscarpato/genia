-- Extensões para IA e Segurança
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Documentos (OCR e Processamento)
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT,
  arquivo_url TEXT,
  conteudo_raw TEXT, -- Texto bruto do OCR
  conteudo_estruturado JSONB, -- JSON processado pela IA
  status TEXT DEFAULT 'pendente', -- pendente, processando, concluido, erro
  embedding vector(1536), -- Para busca semântica
  metadata JSONB,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Logs de Execução do Pipeline IA (Observabilidade)
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID REFERENCES documentos(id),
  etapa TEXT, -- ocr, limpeza, estruturacao, matching
  provider TEXT, -- groq, mistral, openrouter
  modelo TEXT,
  tokens_input INT,
  tokens_output INT,
  latencia_ms INT,
  sucesso BOOLEAN,
  erro_msg TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Sugestões de Parentesco (Matching Engine)
CREATE TABLE IF NOT EXISTS matches_sugeridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_a_id UUID REFERENCES pessoas(id),
  pessoa_b_id UUID REFERENCES pessoas(id),
  score_confianca FLOAT, -- 0.0 a 1.0
  motivo_ia TEXT,
  status_revisao TEXT DEFAULT 'pendente', -- pendente, aprovado, rejeitado
  criado_em TIMESTAMPTZ DEFAULT now()
);
