# ANÁLISE COMPLETA — GENEALOGIA IA

## 1. RESUMO EXECUTIVO

O projeto **Genealogia IA** já apresenta uma base funcional relevante: dashboard, árvore genealógica interativa, CRUD de pessoas, documentos, OCR/transcrição, importação e exportação GEDCOM, dark mode e backup JSON offline-first no navegador . A arquitetura atual é centrada em React 18, IndexedDB via `GenealogyDB`, serviços por domínio e um proxy em Cloudflare Worker para OCR/IA, o que cria uma boa fundação para um produto de genealogia assistida por IA, mas ainda sem capacidade real de sincronização multi-dispositivo, colaboração, observabilidade e governança de pipeline de documentos .

A nova direção estratégica proposta transforma o projeto de um app com OCR e transcrição em um **sistema de inteligência documental genealógica**, no qual o documento passa por uma esteira multiagente: OCR leve, limpeza textual, estruturação em JSON, correção contextual, análise genealógica, matching com pessoas já cadastradas e abertura de fluxo assistido para criação ou atualização de perfis [1][2]. Essa abordagem reduz custo, melhora auditabilidade e distribui microtarefas entre modelos e provedores gratuitos ou de baixo custo, evitando dependência de um único endpoint e reduzindo o consumo total por execução [1][3][2][4].

A recomendação principal é reestruturar o produto em torno de cinco pilares: **Supabase como camada persistente e de sincronização**, **orquestrador multi-LLM**, **pipeline documental assíncrono**, **engine híbrida de matching IA + heurística** e **fila de revisão humana** [5][6][7]. Com isso, o Genealogia IA passa a competir menos como “app de árvore genealógica” e mais como plataforma de ingestão, análise e conexão de evidências familiares.

## 2. ENTENDIMENTO DO PROJETO

O README define o sistema como uma aplicação de pesquisa genealógica com IA, offline-first, 100% no navegador, com árvore interativa, OCR de documentos históricos, linha do tempo, GEDCOM e backup JSON . A estrutura atual do código confirma uma separação razoável entre componentes de interface, hooks, serviços, store/context e utilitários, além de um `ai-proxy` em Cloudflare Worker para proteger chaves de IA no frontend .

### Tabela de entendimento atual

| Área | O que existe hoje | Problemas percebidos | Impacto |
| ---- | ----------------- | -------------------- | ------- |
| Produto | App de genealogia com OCR e GEDCOM  | OCR ainda é função isolada, sem pipeline documental | Alto |
| Frontend | React 18 com Tailwind, rotas e UI modular  | Mistura JS/TS, arquivos grandes, ausência de testes | Alto |
| Dados | IndexedDB wrapper `GenealogyDB`  | Dados presos ao navegador, sem sync nem multi-device | Crítico |
| IA | Proxy para Claude/GPT-4o no Worker  | Dependência de modelo central e pouca governança | Alto |
| Documentos | Upload, visualização, OCR e lista de documentos  | Falta estruturação automatizada e vínculo assistido | Alto |
| Segurança | Proxy evita expor chave diretamente  | Auth local e ausência de RLS, trilha de auditoria e limites | Crítico |
| Infra | Cloudflare Worker identificado  | Sem CI/CD, sem staging, sem deploy padronizado | Alto |
| Roadmap | Supabase sync, colaboração e PWA planejados  | Funcionalidades estratégicas ainda não implementadas | Alto |

### Objetivo de produto inferido

O produto não deve mais ser tratado apenas como um gerenciador de árvore genealógica com OCR. A leitura do repositório e da nova diretriz funcional aponta para um produto cujo valor principal está em **transformar documentos históricos ou uploads do usuário em conhecimento genealógico acionável**, com assistência ativa para classificação, sugestão de vínculo, deduplicação e criação de novos perfis .

### INFORMAÇÕES NECESSÁRIAS AINDA NÃO FORNECIDAS

```text
- Conteúdo completo de ai-proxy/src/index.ts para validar políticas atuais do Worker
- Estratégia atual de hash/salvamento de credenciais no AuthService.js
- Ambiente de produção existente, se houver
- Volume esperado de usuários, documentos e famílias por conta
- Política de privacidade e retenção de dados para documentos históricos
```

## 3. ARQUITETURA ATUAL

A arquitetura atual segue o fluxo `Component → Hook → Service → GenealogyDB → IndexedDB`, com o OCR/transcrição sendo a única parte que sai do navegador e usa o `ai-proxy` em Cloudflare Worker . O frontend mistura `.js` e `.tsx`, o que é um sinal de transição inacabada para TypeScript e uma fonte relevante de dívida técnica .

### Mapa da arquitetura atual

```text
Usuário
  ↓
React Components
  ↓
Custom Hooks
  ↓
Services
  ↓
GenealogyDB (IndexedDB)
  ↓
Dados locais no navegador

OCR / IA
  ↓
TranscriptionService
  ↓
ai-proxy (Cloudflare Worker)
  ↓
Claude / GPT-4o
```

### Stack identificada

| Camada | Tecnologia atual |
| ------ | ---------------- |
| Frontend | React 18  |
| Build | react-scripts 5 / CRA  |
| Tipagem | TypeScript parcial + JS misto  |
| UI | Tailwind CSS  |
| Roteamento | React Router DOM v7  |
| Validação | Zod  |
| Persistência local | IndexedDB via wrapper próprio  |
| IA | Cloudflare Worker + Claude / GPT-4o  |

### Avaliação arquitetural

A arquitetura atual é adequada para um MVP local e demonstra boa intenção de separação por domínio. O problema estrutural não é ausência de componentes, mas a falta de uma **camada de backend real para sincronização, versionamento, trilha de execução, fila assíncrona e governança de IA**, algo indispensável para o novo posicionamento do produto [6].

## 4. DIAGNÓSTICO TÉCNICO

### Backend / serviços

A camada de serviços já existe e pode ser evoluída sem reescrever o sistema do zero, o que é um ponto forte do projeto . Entretanto, `AuthService.js`, `FamilyService.js` e `GenealogyDB.js` ainda estão em JavaScript, enquanto boa parte dos fluxos novos exigirá contratos estáveis, tipagem forte, versionamento de payload e validação rigorosa, especialmente para IA, documentos e matching .

A dependência exclusiva de IndexedDB para entidades centrais cria limitações críticas: não há sincronização multi-device, não há colaboração, não há RLS, não há event sourcing, e não há mecanismo robusto para replay ou auditoria do pipeline documental. O uso atual do Worker é positivo como proxy seguro, mas insuficiente como camada de orquestração, fallback e observabilidade [7][8].

### Frontend

O frontend já cobre bem os fluxos principais do produto: dashboard, árvore, perfil, documentos, eventos, configurações, GEDCOM e autenticação . Porém, o modelo de experiência atual foi desenhado para CRUD manual, não para ingestão documental assistida por pipeline; por isso faltam interfaces como fila de revisão, painel de sugestões, score de confiança, diff entre extração bruta e dados estruturados, histórico por documento e modo de aprovação por etapa.

### Infraestrutura

O repositório não evidencia CI/CD, staging, dockerização ou configuração de deploy de frontend . Isso é um problema operacional importante porque a nova arquitetura proposta envolve Supabase, Worker, múltiplos provedores, segredos, políticas, logs e limitações por rota/usuário. Cloudflare oferece mecanismos específicos para rate limiting no Worker e no AI Gateway, o que é útil para proteger custos e abuso; esses recursos devem ser incorporados desde o início do pipeline [9][7][8].

### Produto

O maior gargalo atual não é interface, mas **valor incompleto do fluxo documental**. O sistema já recebe documento, visualiza e transcreve, mas ainda não fecha o ciclo de transformar documento em entidade genealógica útil, ligada à árvore, com criação assistida e revisão humana. Essa lacuna é exatamente a maior oportunidade estratégica do projeto .

## 5. PROBLEMAS CRÍTICOS

| Problema | Severidade | Impacto | Esforço para corrigir | Prioridade |
| -------- | ---------- | ------- | --------------------- | ---------- |
| Dados persistem apenas localmente em IndexedDB | Crítica | Impede multi-device, colaboração e retenção | Alto | P0 |
| Auth local sem base robusta em backend | Crítica | Inviabiliza segurança real em produção | Médio | P0 |
| OCR/transcrição é recurso isolado, não pipeline | Crítica | Perde o maior valor potencial do produto | Alto | P0 |
| Ausência de orquestrador multi-LLM | Alta | Alto custo operacional e dependência de um provedor | Médio | P1 |
| Mix JS/TS na base | Alta | Aumenta bugs, regressão e custo de manutenção | Alto | P1 |
| Documentos em base64/local-only | Alta | Limita escala, storage e sync | Médio | P1 |
| Sem fila de revisão humana | Alta | Alto risco de vínculo incorreto por IA | Médio | P1 |
| Sem observabilidade e trilha de execução por documento | Alta | Dificulta suporte, auditoria e melhoria contínua | Médio | P1 |
| Sem CI/CD e sem testes automatizados | Média | Risco operacional crescente | Médio | P2 |
| Build em CRA | Média | Base desatualizada para o roadmap futuro | Médio | P2 |

## 6. OPORTUNIDADES DE MELHORIA

A principal oportunidade é substituir a lógica “OCR + texto” por um **pipeline de inteligência documental com governança**, no qual cada etapa produz artefatos próprios: texto cru, texto limpo, entidades estruturadas, hipóteses de vínculo, scores e tarefas de revisão. Esse desenho torna o produto mais confiável, barato de operar e mais fácil de evoluir [1][2][5].

A segunda oportunidade é adotar **Supabase** como camada operacional de produção: autenticação, banco relacional, storage, RLS, realtime e extensões como pgvector, que permitem armazenar embeddings e futuramente implementar busca semântica e recuperação de contexto por documento ou pessoa [5][6]. Isso resolve uma parcela grande das lacunas de segurança, colaboração e sincronização do sistema atual.

A terceira oportunidade é transformar a IA em **rede de tarefas especializadas**. Em vez de um LLM único, o pipeline passa a escolher o modelo por função: um modelo barato para limpeza, outro melhor para JSON estruturado, outro para análise genealógica e outro para classificação/guardrails. Essa estratégia se encaixa bem com Groq OpenAI-compatible, provedores gratuitos agregados e endpoints alternativos de baixa fricção [1][3][2][4].

## 7. NOVAS FUNCIONALIDADES

### FUNCIONALIDADE: Pipeline de Inteligência Documental

**Objetivo:**

Converter documentos enviados pelo usuário em evidência genealógica estruturada e acionável.

**Problema que resolve:**

Hoje o sistema extrai texto, mas não fecha o ciclo até a decisão assistida de vínculo, indexação ou criação de pessoa.

**Como deve funcionar:**

O documento é enviado, processado por OCR simples, limpo, estruturado em JSON, analisado contra a árvore e encaminhado para sugestão de match, indexação ou criação de novo cadastro.

**Fluxo do usuário:**

Upload do documento → extração → organização → análise → tela de revisão → confirmação → persistência na árvore.

**Requisitos técnicos:**

Fila assíncrona, schemas Zod, adapters multi-provider, score de confiança, versionamento de prompt e rastreabilidade por etapa.

**Banco de dados:**

Novas tabelas para documentos, execuções do pipeline, entidades extraídas, matches sugeridos, filas de revisão e auditoria.

**APIs necessárias:**

Groq, OpenRouter, NVIDIA Build, Mistral ou equivalentes compatíveis conforme política de fallback [1][2][4].

**Mudanças no frontend:**

Tela de acompanhamento do pipeline, cards de sugestão, painel de confiança, formulário pré-preenchido e modo revisão.

**Mudanças no backend:**

Orquestrador de pipeline, persistência relacional, storage e jobs assíncronos.

**Riscos:**

Falsos positivos, inconsistência entre provedores e custos imprevisíveis se não houver política de roteamento.

**Complexidade:** alta

**Impacto esperado:** muito alto

**Prioridade:** crítica

### FUNCIONALIDADE: Roteador Multi-LLM por Tarefa

**Objetivo:**

Escolher automaticamente o modelo/provedor mais adequado para cada microetapa do pipeline.

**Problema que resolve:**

Evita usar um modelo caro ou limitado para tarefas simples e reduz dependência operacional.

**Como deve funcionar:**

Cada etapa consulta uma política de roteamento baseada em tipo de tarefa, orçamento, contexto, latência, validade histórica do provedor e disponibilidade atual.

**Fluxo do usuário:**

Processamento transparente; o usuário só vê status e resultado.

**Requisitos técnicos:**

Adapter pattern, tabela de políticas, fallback chain, health checks, métricas por modelo, retry com schema validation.

**Banco de dados:**

Tabelas `llm_providers`, `llm_models`, `prompt_templates`, `document_pipeline_steps`, `llm_usage_logs`.

**APIs necessárias:**

Groq OpenAI compatibility, OpenRouter e demais provedores compatíveis [1][2].

**Mudanças no frontend:**

Painel técnico opcional de processamento e confiança.

**Mudanças no backend:**

Camada `ProviderAdapter`, política de fallback, auditoria e cache.

**Riscos:**

Complexidade operacional maior.

**Complexidade:** média

**Impacto esperado:** alto

**Prioridade:** crítica

### FUNCIONALIDADE: Criação Assistida de Pessoa a partir de Documento

**Objetivo:**

Criar um rascunho de pessoa com dados já preenchidos a partir da extração estruturada.

**Problema que resolve:**

Elimina retrabalho manual quando a IA identifica novo indivíduo.

**Como deve funcionar:**

Quando não houver match confiável, o sistema abre um formulário com nome, datas, locais e relações sugeridas para revisão humana antes da criação da pessoa.

**Fluxo do usuário:**

Documento analisado → proposta de novo perfil → revisão → salvar → inserir na árvore.

**Requisitos técnicos:**

Mapeamento `extraction -> draft person`, origem dos campos, score por campo, evidência textual.

**Banco de dados:**

Campo de origem/evidência para atributos de pessoas e eventos.

**APIs necessárias:**

Somente as do pipeline.

**Mudanças no frontend:**

Novo modal/página de confirmação com destaque por confiança.

**Mudanças no backend:**

Serviço de geração de draft e persistência de origem documental.

**Riscos:**

Usuário aceitar dados incorretos por excesso de confiança.

**Complexidade:** média

**Impacto esperado:** alto

**Prioridade:** alta

## 8. ROADMAP

### Curto prazo (0–30 dias)

| Etapa | Ação | Objetivo | Responsável | Esforço | Dependências |
| ----- | ---- | -------- | ----------- | ------- | ------------ |
| 1 | Migrar de CRA para Vite | Modernizar build e preparar PWA | Frontend | Médio | Nenhuma |
| 2 | Converter arquivos JS críticos para TS | Reduzir dívida técnica | Frontend | Alto | Etapa 1 |
| 3 | Criar schema Supabase inicial | Preparar persistência produtiva | Full-stack | Médio | Nenhuma |
| 4 | Implementar Auth com Supabase | Substituir auth local inseguro | Full-stack | Médio | Etapa 3 |
| 5 | Criar storage para documentos | Remover limitação local/base64 | Full-stack | Médio | Etapa 3 |
| 6 | Criar AI Orchestrator base | Padronizar providers e prompts | Backend | Médio | Etapa 3 |
| 7 | Configurar CI/CD e secrets | Estabilidade operacional | DevOps | Baixo | Nenhuma |

### Médio prazo (30–90 dias)

| Etapa | Ação | Objetivo | Responsável | Esforço | Dependências |
| ----- | ---- | -------- | ----------- | ------- | ------------ |
| 8 | Pipeline OCR → limpeza → JSON | Primeira esteira documental completa | Full-stack | Alto | Etapas 4, 5, 6 |
| 9 | Engine de matching híbrido | Sugestão de vínculos com score | Backend | Alto | Etapa 8 |
| 10 | Tela de revisão humana | Aprovação e correção assistida | Frontend | Médio | Etapas 8 e 9 |
| 11 | Sync IndexedDB ↔ Supabase | Offline + multi-device | Full-stack | Alto | Etapas 3 e 4 |
| 12 | Observabilidade e analytics do pipeline | Auditoria e otimização | DevOps/Backend | Médio | Etapa 8 |

### Longo prazo (90–180 dias)

| Etapa | Ação | Objetivo | Responsável | Esforço | Dependências |
| ----- | ---- | -------- | ----------- | ------- | ------------ |
| 13 | Colaboração em tempo real | Uso familiar colaborativo | Full-stack | Alto | Etapa 11 |
| 14 | Indexação vetorial com pgvector | Busca semântica e RAG documental | Backend | Médio | Etapa 3 |
| 15 | Busca em fontes externas | Expandir pesquisa genealógica | Full-stack | Alto | Etapas 8 e 14 |
| 16 | Múltiplos layouts de árvore | Melhor competitividade visual | Frontend | Médio | Etapa 11 |
| 17 | Copiloto genealógico conversacional | Consulta contextual sobre a árvore | Full-stack | Alto | Etapas 14 e 15 |

## 9. PLANO DE IMPLEMENTAÇÃO

### Arquitetura-alvo proposta

```text
Frontend React/TypeScript
  ├─ Upload e revisão documental
  ├─ Árvore genealógica
  ├─ Fila de sugestões
  └─ Painel de processamento

Supabase
  ├─ Auth
  ├─ Postgres
  ├─ Storage
  ├─ Realtime
  └─ pgvector

Cloudflare Worker / API Layer
  ├─ AuthZ técnica
  ├─ Rate limiting
  ├─ AI Orchestrator
  ├─ Prompt runner
  ├─ Fallback multi-provider
  └─ Auditoria / logs

Provedores LLM/OCR
  ├─ Groq
  ├─ OpenRouter
  ├─ NVIDIA Build
  ├─ Mistral
  └─ Outros compatíveis
```

### Pipeline técnico detalhado

#### Etapa A — Ingestão

1. Usuário envia imagem, PDF ou documento.
2. Frontend grava metadados e envia binário para Supabase Storage.
3. Sistema cria registro `documents` e job `document_pipeline_runs` com status `queued`.

#### Etapa B — OCR e parsing primário

1. Sistema tenta extração textual nativa de PDF.
2. Se falhar, usa OCR leve local ou remoto.
3. Texto bruto é salvo em `document_text_versions` com tipo `ocr_raw`.

#### Etapa C — Limpeza e normalização

1. Um modelo barato organiza quebras de linha, normaliza datas e corrige ruído.
2. Saída é validada por schema e armazenada como `normalized_text`.
3. Campos suspeitos ficam marcados com baixa confiança.

#### Etapa D — Estruturação em entidades

1. Um modelo com boa aderência a JSON recebe o texto normalizado.
2. O retorno deve conter pessoas, eventos, relações, localidades e tipo de documento.
3. O schema é validado no backend antes de persistir.

#### Etapa E — Análise genealógica

1. A engine carrega candidatos da árvore já existente.
2. Aplica matching heurístico por nome, data, local e grafo familiar.
3. Um modelo analítico recebe apenas shortlist reduzida para classificar: match existente, novo cadastro ou indexação documental.

#### Etapa F — Revisão humana

1. Se confiança alta, o sistema sugere ação pronta.
2. Se confiança média, cria tarefa na fila de revisão.
3. Se não houver match, abre fluxo de criação assistida com dados pré-preenchidos.

#### Etapa G — Persistência final

1. Salva vínculo do documento à pessoa e/ou evento.
2. Atualiza entidades aprovadas.
3. Registra auditoria completa da execução, prompt, modelo, custo e tempo.

### Implementação por item crítico

#### IMPLEMENTAÇÃO: AI Orchestrator

1. **O que deve ser feito**: criar camada abstrata de providers OpenAI-compatible e não compatíveis.
2. **Arquivos/módulos impactados**: novo módulo `src/services/ai/` ou backend Worker dedicado.
3. **Ordem correta**: adapters → policies → runner → validação Zod → logs.
4. **Possíveis riscos**: inconsistência de formato entre providers.
5. **Como testar**: mocks por provider, schema validation, retry policy.
6. **Critérios de aceite**: a mesma tarefa roda com pelo menos 3 provedores sem alterar o chamador.
7. **Métricas de sucesso**: taxa de schema válido > 95%; fallback automático funcionando.

#### IMPLEMENTAÇÃO: Matching híbrido

1. **O que deve ser feito**: criar score composto por heurística e LLM.
2. **Arquivos/módulos impactados**: novo `MatchingService`, queries Supabase, tela de revisão.
3. **Ordem correta**: heurística local → shortlist → chamada analítica do modelo.
4. **Possíveis riscos**: falso positivo em nomes parecidos.
5. **Como testar**: dataset sintético com cenários de homônimos.
6. **Critérios de aceite**: match nunca é aplicado automaticamente sem regra explícita de confiança.
7. **Métricas de sucesso**: redução do trabalho manual sem aumentar erros de vínculo.

#### IMPLEMENTAÇÃO: Fila de revisão humana

1. **O que deve ser feito**: criar tela e backend para aprovar, rejeitar, editar ou adiar sugestões.
2. **Arquivos/módulos impactados**: frontend documental, tabelas de review, realtime para atualização.
3. **Ordem correta**: persistência de sugestões → UI de revisão → ações de aceite.
4. **Possíveis riscos**: UX confusa em documentos com múltiplas pessoas.
5. **Como testar**: fluxo completo com certidão de nascimento, casamento e óbito.
6. **Critérios de aceite**: usuário entende facilmente o que foi inferido e por quê.
7. **Métricas de sucesso**: tempo médio de revisão por documento e taxa de aprovação.

## 10. RISCOS E DEPENDÊNCIAS

| Risco | Probabilidade | Impacto | Mitigação |
| ---- | ------------- | ------- | --------- |
| Lock-in acidental em um provedor de IA | Média | Alto | Adapter pattern e fallback multi-provider |
| Variação de disponibilidade em tiers gratuitos | Alta | Alto | Política de prioridade, health checks e cache |
| Falsos positivos no matching genealógico | Alta | Crítico | Engine híbrida + revisão humana obrigatória |
| Custos por explosão de chamadas | Média | Alto | Rate limiting no Worker/Gateway e roteamento por tarefa [9][7][8] |
| Crescimento de storage documental | Alta | Médio | Supabase Storage com lifecycle, compressão e limites |
| Vazamento de contexto sensível | Média | Alto | Redação mínima nos prompts, logs sanitizados e RLS |
| Falha de schema em saídas de LLM | Alta | Médio | Zod, retries e fallback por provedor |

## 11. MÉTRICAS DE SUCESSO

| Métrica | Meta inicial | Meta madura |
| ------- | ------------ | ----------- |
| Documentos processados com JSON válido | > 85% | > 95% |
| Sugestões aprovadas sem retrabalho maior | > 60% | > 80% |
| Tempo médio de revisão por documento | < 5 min | < 2 min |
| Criação assistida vs manual | 30% | 70% |
| Disponibilidade do pipeline | 95% | 99% |
| Queda por limite de provedor | < 10% | < 2% |
| Match incorreto confirmado | < 3% | < 1% |

## 12. PRÓXIMOS PASSOS

1. Aprovar a nova arquitetura centrada em inteligência documental.
2. Criar projeto Supabase e aplicar o schema SQL abaixo.
3. Migrar autenticação e storage para Supabase.
4. Criar AI Orchestrator e tabela de providers/modelos.
5. Implementar pipeline mínimo: upload → OCR → limpeza → JSON → revisão.
6. Construir engine de matching híbrido.
7. Integrar criação assistida de pessoas e indexação documental na árvore.

## ARQUITETURA TÉCNICA DO PIPELINE DE IA

### Princípios de arquitetura

- Cada etapa deve ser pequena, auditável e reexecutável.
- Nenhuma decisão crítica deve depender de um único modelo.
- Toda saída de IA precisa ser validada por schema.
- Toda sugestão de vínculo deve ter evidência textual, score e trilha de execução.
- A revisão humana é obrigatória para ações de alto impacto.

### Estratégia de modelos por etapa

| Etapa | Objetivo | Perfil de modelo recomendado |
| ----- | -------- | ---------------------------- |
| OCR / parsing | Obter texto bruto | OCR local ou serviço barato |
| Limpeza | Corrigir ruído e padronizar texto | Modelo pequeno e rápido |
| Estruturação | Gerar JSON estrito | Modelo com boa aderência a output estruturado |
| Análise genealógica | Comparar com a árvore | Modelo mais forte, porém com shortlist reduzida |
| Classificação final | Sugerir ação | Modelo leve + regras locais |
| Guardrails | Validar segurança/forma | Regra local + classificador simples |

### Provedores recomendados

| Provedor | Papel sugerido | Observação |
| -------- | -------------- | ---------- |
| Groq | Principal para tarefas compatíveis com OpenAI SDK | A documentação indica compatibilidade com bibliotecas OpenAI [1] |
| OpenRouter | Fallback e diversificação de modelos free | Útil como multiplexador de modelos gratuitos [2][10] |
| NVIDIA Build | Provedor complementar para inferência gratuita | Boa opção para expansão de fallback [4] |
| Mistral | Avaliação e tarefas específicas | Tier gratuito/experimental é útil, mas não deve ser base única [3] |
| Cloudflare Worker/AI Gateway | Camada de proteção, logs e rate limits | Permite limitar uso e observar 429/throughput [9][7][8] |

### Contratos de saída recomendados

#### Saída de limpeza textual

```json
{
  "language": "pt-BR",
  "document_type_guess": "birth_certificate",
  "raw_text": "...",
  "normalized_text": "...",
  "uncertain_spans": [
    { "text": "J0ao", "reason": "ocr_noise" }
  ]
}
```

#### Saída de estruturação genealógica

```json
{
  "document_type": "birth_certificate",
  "confidence": 0.88,
  "people": [
    {
      "role": "child",
      "full_name": "Maria de Souza",
      "birth_date": "1912-06-12",
      "birth_place": "Campinas, SP, Brasil",
      "evidence": ["...trecho..."]
    }
  ],
  "events": [],
  "relationships": [],
  "uncertain_fields": []
}
```

#### Saída de decisão de vínculo

```json
{
  "decision": "create_new_person",
  "confidence": 0.81,
  "matches": [
    {
      "person_id": "uuid",
      "score": 0.67,
      "reason": "nome parecido e mesma localidade"
    }
  ],
  "recommended_action": "open_prefilled_form",
  "evidence": ["...trecho..."]
}
```

## SQL PARA SUPABASE

```sql
create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.app_role as enum ('owner', 'editor', 'viewer');
create type public.document_status as enum ('uploaded', 'queued', 'processing', 'review', 'completed', 'failed');
create type public.pipeline_step_type as enum ('ocr', 'normalize', 'structure', 'analyze', 'match', 'classify', 'review');
create type public.pipeline_step_status as enum ('queued', 'running', 'succeeded', 'failed', 'skipped');
create type public.match_decision as enum ('match_existing', 'create_new_person', 'attach_to_existing', 'manual_review', 'reject');
create type public.review_status as enum ('pending', 'approved', 'rejected', 'edited', 'deferred');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_trees (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_tree_members (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (family_tree_id, user_id)
);

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees(id) on delete cascade,
  external_legacy_id text,
  full_name text not null,
  normalized_full_name text,
  gender text,
  birth_date date,
  death_date date,
  birth_place text,
  death_place text,
  notes text,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index persons_family_tree_idx on public.persons(family_tree_id);
create index persons_normalized_name_idx on public.persons(normalized_full_name);

create table public.person_relationships (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  related_person_id uuid not null references public.persons(id) on delete cascade,
  relationship_type text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees(id) on delete cascade,
  person_id uuid references public.persons(id) on delete cascade,
  event_type text not null,
  event_date date,
  location text,
  description text,
  source_document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  file_size_bytes bigint,
  sha256 text,
  source_url text,
  title text,
  document_date date,
  detected_document_type text,
  status public.document_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index documents_sha256_family_idx on public.documents(family_tree_id, sha256) where sha256 is not null;

create table public.document_text_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_type text not null,
  language text,
  text_content text not null,
  created_at timestamptz not null default now()
);

create table public.document_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  triggered_by uuid references public.profiles(id) on delete set null,
  status public.document_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.document_pipeline_steps (
  id uuid primary key default gen_random_uuid(),
  pipeline_run_id uuid not null references public.document_pipeline_runs(id) on delete cascade,
  step_type public.pipeline_step_type not null,
  status public.pipeline_step_status not null default 'queued',
  provider_name text,
  model_name text,
  prompt_template_id uuid,
  input_payload jsonb,
  output_payload jsonb,
  confidence numeric(5,4),
  token_input integer,
  token_output integer,
  latency_ms integer,
  cost_usd numeric(12,6),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index document_pipeline_steps_run_idx on public.document_pipeline_steps(pipeline_run_id);
create index document_pipeline_steps_type_idx on public.document_pipeline_steps(step_type);

create table public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  pipeline_run_id uuid not null references public.document_pipeline_runs(id) on delete cascade,
  entity_type text not null,
  role_label text,
  canonical_name text,
  normalized_name text,
  payload jsonb not null,
  confidence numeric(5,4),
  created_at timestamptz not null default now()
);

create index extracted_entities_document_idx on public.extracted_entities(document_id);
create index extracted_entities_name_idx on public.extracted_entities(normalized_name);

create table public.document_match_suggestions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  extracted_entity_id uuid references public.extracted_entities(id) on delete cascade,
  matched_person_id uuid references public.persons(id) on delete cascade,
  decision public.match_decision not null,
  score numeric(5,4) not null,
  reason text,
  evidence jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index document_match_suggestions_document_idx on public.document_match_suggestions(document_id);
create index document_match_suggestions_person_idx on public.document_match_suggestions(matched_person_id);

create table public.review_tasks (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  suggestion_id uuid references public.document_match_suggestions(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  status public.review_status not null default 'pending',
  title text not null,
  description text,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  step_type public.pipeline_step_type not null,
  version text not null,
  provider_hint text,
  model_hint text,
  system_prompt text not null,
  user_prompt_template text not null,
  output_schema jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(name, version)
);

create table public.llm_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text,
  is_active boolean not null default true,
  supports_openai_compat boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.llm_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.llm_providers(id) on delete cascade,
  name text not null,
  task_profile text,
  input_price_per_million numeric(12,6),
  output_price_per_million numeric(12,6),
  is_free_tier boolean not null default false,
  is_active boolean not null default true,
  context_window integer,
  created_at timestamptz not null default now(),
  unique(provider_id, name)
);

create table public.llm_usage_logs (
  id uuid primary key default gen_random_uuid(),
  pipeline_step_id uuid references public.document_pipeline_steps(id) on delete cascade,
  provider_id uuid references public.llm_providers(id) on delete set null,
  model_id uuid references public.llm_models(id) on delete set null,
  request_hash text,
  response_status integer,
  token_input integer,
  token_output integer,
  latency_ms integer,
  cost_usd numeric(12,6),
  created_at timestamptz not null default now()
);

create table public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index document_embeddings_document_idx on public.document_embeddings(document_id);

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  filter_document_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index integer,
  chunk_text text,
  similarity float
)
language sql
as $$
  select
    de.id,
    de.document_id,
    de.chunk_index,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) as similarity
  from public.document_embeddings de
  where filter_document_id is null or de.document_id = filter_document_id
  order by de.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.profiles enable row level security;
alter table public.family_trees enable row level security;
alter table public.family_tree_members enable row level security;
alter table public.persons enable row level security;
alter table public.person_relationships enable row level security;
alter table public.events enable row level security;
alter table public.documents enable row level security;
alter table public.document_text_versions enable row level security;
alter table public.document_pipeline_runs enable row level security;
alter table public.document_pipeline_steps enable row level security;
alter table public.extracted_entities enable row level security;
alter table public.document_match_suggestions enable row level security;
alter table public.review_tasks enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.llm_providers enable row level security;
alter table public.llm_models enable row level security;
alter table public.llm_usage_logs enable row level security;
alter table public.document_embeddings enable row level security;

create or replace function public.is_family_member(tree_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.family_tree_members ftm
    where ftm.family_tree_id = tree_id
      and ftm.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.family_trees ft
    where ft.id = tree_id
      and ft.owner_user_id = auth.uid()
  );
$$;

create policy "profiles_self_select" on public.profiles
for select using (id = auth.uid());

create policy "profiles_self_update" on public.profiles
for update using (id = auth.uid());

create policy "family_trees_member_select" on public.family_trees
for select using (public.is_family_member(id));

create policy "family_trees_owner_insert" on public.family_trees
for insert with check (owner_user_id = auth.uid());

create policy "family_trees_owner_update" on public.family_trees
for update using (owner_user_id = auth.uid());

create policy "family_tree_members_member_select" on public.family_tree_members
for select using (public.is_family_member(family_tree_id));

create policy "family_tree_members_owner_manage" on public.family_tree_members
for all using (
  exists (
    select 1 from public.family_trees ft
    where ft.id = family_tree_id and ft.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.family_trees ft
    where ft.id = family_tree_id and ft.owner_user_id = auth.uid()
  )
);

create policy "persons_member_all" on public.persons
for all using (public.is_family_member(family_tree_id))
with check (public.is_family_member(family_tree_id));

create policy "relationships_member_all" on public.person_relationships
for all using (public.is_family_member(family_tree_id))
with check (public.is_family_member(family_tree_id));

create policy "events_member_all" on public.events
for all using (public.is_family_member(family_tree_id))
with check (public.is_family_member(family_tree_id));

create policy "documents_member_all" on public.documents
for all using (public.is_family_member(family_tree_id))
with check (public.is_family_member(family_tree_id));

create policy "review_tasks_member_all" on public.review_tasks
for all using (public.is_family_member(family_tree_id))
with check (public.is_family_member(family_tree_id));

create policy "document_text_versions_via_document" on public.document_text_versions
for select using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_family_member(d.family_tree_id)
  )
);

create policy "document_pipeline_runs_via_document" on public.document_pipeline_runs
for select using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_family_member(d.family_tree_id)
  )
);

create policy "document_pipeline_steps_via_run" on public.document_pipeline_steps
for select using (
  exists (
    select 1
    from public.document_pipeline_runs r
    join public.documents d on d.id = r.document_id
    where r.id = pipeline_run_id and public.is_family_member(d.family_tree_id)
  )
);

create policy "extracted_entities_via_document" on public.extracted_entities
for select using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_family_member(d.family_tree_id)
  )
);

create policy "document_match_suggestions_via_document" on public.document_match_suggestions
for select using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_family_member(d.family_tree_id)
  )
);

create policy "document_embeddings_via_document" on public.document_embeddings
for select using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_family_member(d.family_tree_id)
  )
);

create policy "prompt_templates_service_only" on public.prompt_templates
for select using (auth.role() = 'service_role');

create policy "llm_providers_service_only" on public.llm_providers
for select using (auth.role() = 'service_role');

create policy "llm_models_service_only" on public.llm_models
for select using (auth.role() = 'service_role');

create policy "llm_usage_logs_service_only" on public.llm_usage_logs
for select using (auth.role() = 'service_role');
```

## RECOMENDAÇÕES FINAIS DE STACK E GOVERNANÇA

- Migrar frontend para Vite e TypeScript integral.
- Mover autenticação, storage e persistência principal para Supabase [6].
- Manter IndexedDB apenas como cache/offline local temporário.
- Adotar pgvector desde o início para preparar busca semântica e copiloto futuro [5].
- Colocar o AI Orchestrator atrás de Cloudflare Worker com rate limiting e logs [9][7][8].
- Tratar cada etapa do pipeline como job rastreável, com schema e custo registrado.
- Nunca aplicar vínculo automático sem score, evidência e política explícita.
