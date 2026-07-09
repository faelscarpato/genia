# 🧬 Genealogia IA

**Aplicação de pesquisa genealógica com IA — offline-first, 100% no navegador.**

> Preserve a história da sua família com inteligência artificial: árvore interativa, OCR de documentos históricos, linha do tempo de eventos e exportação GEDCOM.

---

## ✨ Funcionalidades

| # | Funcionalidade | Status |
|---|---|---|
| 1 | **Dashboard** com contagens reais do IndexedDB | ✅ |
| 2 | **Árvore Genealógica** interativa (zoom/pan, BFS) | ✅ |
| 3 | **CRUD de Pessoas** com formulário validado (Zod) | ✅ |
| 4 | **Busca Global** cross-store com debounce | ✅ |
| 5 | **Linha do Tempo** de eventos cronológica | ✅ |
| 6 | **Documentos** — upload drag-and-drop, visualizador | ✅ |
| 7 | **OCR / Transcrição** por IA (Claude/GPT-4o) | ✅ |
| 8 | **Importação GEDCOM** 5.5.1 com preview | ✅ |
| 9 | **Exportação GEDCOM** com download automático | ✅ |
| 10 | **Dark Mode** completo (system/light/dark) | ✅ |
| 11 | **Backup JSON** — export/import snapshot completo | ✅ |
| 12 | **Notificações** em tempo real (polling 30s) | ✅ |

---

## 🏗 Arquitetura

```
src/
├── components/
│   ├── features/          # Páginas e componentes de domínio
│   │   ├── Dashboard.js        ← contagens reais, pessoas recentes
│   │   ├── FamilyTree.js       ← layout BFS, zoom/pan, drawer
│   │   ├── Profile.js          ← abas: Informações / Eventos / Documentos
│   │   ├── Settings.js         ← dark mode, GEDCOM, backup JSON
│   │   ├── DocumentsPage.tsx   ← lista, upload, visualização
│   │   ├── PersonModal.tsx     ← CRUD pessoa (Zod)
│   │   ├── EventTimeline.tsx   ← linha do tempo com filtros
│   │   ├── AddEventModal.tsx   ← adicionar evento (Zod)
│   │   ├── DocumentUploader.tsx← drag-and-drop, preview
│   │   ├── DocumentViewer.tsx  ← imagens c/ zoom, PDF iframe
│   │   ├── DocumentList.tsx    ← grid com miniaturas
│   │   ├── TranscriptionPanel.tsx ← OCR via proxy IA
│   │   ├── GedcomImporter.tsx  ← preview, barra de progresso
│   │   └── AuthPage.js         ← login/registro real
│   ├── layout/
│   │   ├── Sidebar.tsx         ← colapsável, dark mode
│   │   └── AppLayout.tsx       ← wrapper com padding dinâmico
│   └── ui/
│       ├── GlobalSearch.tsx    ← busca cross-store, dropdown
│       ├── NotificationPanel.tsx ← badge, dropdown, marcar lidas
│       ├── SkeletonLoader.tsx  ← SkeletonCard, SkeletonList, etc.
│       ├── EmptyState.tsx      ← estados vazios reutilizáveis
│       ├── Toast.js            ← notificações flutuantes
│       └── ErrorBoundary.js    ← captura de erros React
│
├── hooks/
│   ├── useApp.ts           ← estado global (user, family, db)
│   ├── useTheme.ts         ← dark/light/system com localStorage
│   ├── useSearch.ts        ← busca com debounce
│   ├── usePersons.ts       ← CRUD pessoas reativo
│   ├── useDocuments.ts     ← CRUD documentos reativo
│   ├── useEvents.ts        ← CRUD eventos reativo
│   └── useNotifications.ts ← polling 30s
│
├── services/
│   ├── GenealogyDB.js      ← wrapper IndexedDB, versão 3
│   ├── PersonService.ts    ← CRUD pessoas
│   ├── EventService.ts     ← CRUD eventos
│   ├── DocumentService.ts  ← CRUD documentos c/ base64
│   ├── NotificationService.ts ← CRUD + helpers automáticos
│   ├── TranscriptionService.ts ← proxy IA (Claude/GPT-4o)
│   ├── AuthService.js      ← autenticação local
│   └── FamilyService.js    ← CRUD famílias
│
├── store/
│   ├── AppContext.js        ← Provider sem window globals
│   └── appReducer.js       ← todas as actions (LOGOUT, etc.)
│
├── contexts/
│   └── SidebarContext.tsx  ← estado colapsável persistido
│
├── utils/
│   ├── validation.ts       ← schemas Zod em pt-BR
│   ├── dataExport.ts       ← snapshot JSON export/import
│   └── gedcom/
│       ├── GedcomParser.ts ← parser GEDCOM 5.5.1
│       └── GedcomExporter.ts ← gerador .ged
│
├── repositories/
│   └── index.ts            ← IRepository + factory
│
└── types/
    ├── index.ts            ← todos os tipos TypeScript
    └── context.ts          ← AppContextValue interface

ai-proxy/                   ← Cloudflare Worker (proxy IA)
├── wrangler.toml
└── src/index.ts
```

### Fluxo de dados

```
Usuário → React Component
         → Custom Hook (usePersons, useEvents, etc.)
           → Service (PersonService, EventService, etc.)
             → GenealogyDB (IndexedDB via idb-keyval pattern)
               → IndexedDB (offline-first, no browser)
```

---

## 🚀 Instalação e execução

### Pré-requisitos
- Node.js ≥ 18
- npm ≥ 9

### Configuração

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/genealogia-ia.git
cd genealogia-ia

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves de API

# 4. Inicie o servidor de desenvolvimento
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

---

## 🤖 Proxy de IA (OCR/Transcrição)

A transcrição de documentos requer um Cloudflare Worker como proxy seguro para não expor chaves de API no frontend.

### Deploy local (desenvolvimento)

```bash
# Instale o Wrangler CLI
npm install -g wrangler

# Configure os secrets
cd ai-proxy
wrangler secret put ANTHROPIC_API_KEY   # Chave Claude
wrangler secret put OPENAI_API_KEY      # Alternativa: GPT-4o
wrangler secret put PROXY_SECRET        # Chave compartilhada com o frontend

# Inicie localmente
wrangler dev
```

### Deploy em produção (Cloudflare Workers)

```bash
cd ai-proxy
wrangler deploy --env production
```

Após o deploy, configure em `.env.local`:
```
REACT_APP_AI_PROXY_URL=https://genealogia-ia-proxy.seu-usuario.workers.dev
REACT_APP_AI_PROXY_SECRET=sua-chave-secreta
```

---

## 📦 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `REACT_APP_AI_PROXY_URL` | URL do Cloudflare Worker | Apenas para OCR |
| `REACT_APP_AI_PROXY_SECRET` | Chave de auth do Worker | Apenas para OCR |
| `REACT_APP_NAME` | Nome da aplicação | Não (padrão: "Genealogia IA") |
| `REACT_APP_DEBUG` | Logs de debug | Não (padrão: `false`) |

---

## 📥 Importação/Exportação GEDCOM

O GEDCOM (Genealogical Data Communication) é o formato padrão para transferência de árvores genealógicas.

- **Importar**: `Configurações → Dados → Importar GEDCOM (.ged)`
- **Exportar**: `Configurações → Dados → Exportar GEDCOM`

### Suporte ao formato GEDCOM 5.5.1

| Tag | Descrição |
|---|---|
| `INDI` | Indivíduo |
| `FAM` | Família |
| `NAME` | Nome completo |
| `BIRT` | Nascimento |
| `DEAT` | Falecimento |
| `OCCU` | Ocupação |
| `NOTE` | Notas |
| `HUSB` / `WIFE` | Cônjuges |
| `CHIL` | Filhos |

---

## 💾 Backup e Restauração

Exporte todos os dados em JSON para migrar entre dispositivos:

- **Exportar**: `Configurações → Dados → Exportar Backup JSON`
- **Restaurar**: `Configurações → Dados → Restaurar Backup JSON`

O arquivo exportado inclui: pessoas, famílias, eventos, documentos e notificações.

---

## 🗺 Roadmap

### Próximas funcionalidades
- [ ] **Sincronização Supabase** — múltiplos dispositivos
- [ ] **Colaboração em tempo real** — edição simultânea
- [ ] **Busca em registros externos** (IBGE, Ancestry, FamilySearch)
- [ ] **Sugestões por IA** — parentesco por similitude de dados
- [ ] **Modo offline completo** — Service Worker + Cache API
- [ ] **PWA** — instalável como aplicativo

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript |
| Estilização | Tailwind CSS, Material Symbols |
| Roteamento | React Router DOM v7 |
| Storage | IndexedDB (GenealogyDB wrapper) |
| Validação | Zod |
| IA / OCR | Cloudflare Workers → Anthropic Claude / OpenAI GPT-4o |
| Deploy proxy | Cloudflare Workers |

---

## 📄 Licença

MIT — veja [`LICENSE`](LICENSE) para detalhes.
