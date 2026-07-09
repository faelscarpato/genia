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
