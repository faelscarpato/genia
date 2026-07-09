import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import EventTimeline from './EventTimeline';
import DocumentList from './DocumentList';
import { SkeletonCard, SkeletonText, SkeletonList } from '../ui/SkeletonLoader';
import useApp from '../../hooks/useApp';
import usePersons from '../../hooks/usePersons';
import useEvents from '../../hooks/useEvents';
import useDocuments from '../../hooks/useDocuments';

/** Calcula idade a partir de data de nascimento e opcionalmente data de morte */
function calcularIdade(nascimento, morte) {
  if (!nascimento) return null;
  const nasc = new Date(nascimento);
  const fim = morte ? new Date(morte) : new Date();
  const anos = fim.getFullYear() - nasc.getFullYear();
  const ajuste =
    fim.getMonth() < nasc.getMonth() ||
    (fim.getMonth() === nasc.getMonth() && fim.getDate() < nasc.getDate())
      ? 1
      : 0;
  return String(anos - ajuste);
}

/** Formata uma data ISO para português */
function formatarData(data) {
  if (!data) return '—';
  try {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return data;
  }
}

/**
 * Página de perfil de uma pessoa na árvore genealógica.
 * Exibe dados reais do IndexedDB com abas de Informações, Eventos e Documentos.
 */
const Profile = () => {
  const { personId } = useParams();
  const { family } = useApp();
  const { persons, isLoading: loadingPersons } = usePersons(family?.id ?? null);
  const { events: allEvents } = useEvents(family?.id ?? null);
  const { documents, isLoading: loadingDocs } = useDocuments(family?.id ?? null);

  const [aba, setAba] = useState('informacoes');

  const pessoa = persons.find((p) => p.id === personId);
  const events = allEvents.filter((e) => e.personId === personId);
  const docsDaPessoa = documents.filter((d) => d.personId === personId);

  const loading = loadingPersons;

  if (!personId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen text-on-surface-variant">
          ID de pessoa não informado.
        </div>
      </AppLayout>
    );
  }

  if (!loading && !pessoa) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl">person_off</span>
          <p className="text-lg">Pessoa não encontrada.</p>
          <Link to="/dashboard" className="text-primary underline text-sm">
            Voltar ao Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const abas = [
    { id: 'informacoes', label: 'Informações',  icon: 'person' },
    { id: 'eventos',     label: 'Linha do Tempo', icon: 'timeline', count: events.length || undefined },
    { id: 'documentos',  label: 'Documentos',  icon: 'folder_open', count: docsDaPessoa.length || undefined },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background dark:bg-zinc-950">
        {/* Cabeçalho / Hero */}
        <div className="bg-surface dark:bg-zinc-900 border-b border-outline-variant dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-6 pt-8 pb-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-xs text-on-surface-variant dark:text-zinc-500 mb-4">
              <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <Link to={`/family/${family?.id ?? '1'}`} className="hover:text-primary transition-colors">
                Árvore
              </Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-on-surface dark:text-zinc-200 font-medium">Perfil</span>
            </nav>

            {loading ? (
              <div className="flex gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-surface-variant dark:bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-2">
                  <SkeletonText lines={2} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-5 mb-6 items-start">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-variant dark:bg-zinc-700 border-2 border-outline-variant dark:border-zinc-600 flex-shrink-0 flex items-center justify-center">
                  {pessoa?.photo ? (
                    <img src={pessoa.photo} alt={pessoa.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant dark:text-zinc-400">
                      {pessoa?.gender === 'female' ? 'woman' : 'person'}
                    </span>
                  )}
                </div>

                {/* Dados principais */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">
                      {pessoa?.firstName} {pessoa?.lastName}
                    </h1>
                    {pessoa?.deathDate && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-variant dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-400 border border-outline-variant dark:border-zinc-700">
                        Falecido(a)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant dark:text-zinc-400 mb-3">
                    {pessoa?.birthDate && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">cake</span>
                        {formatarData(pessoa.birthDate)}
                        {calcularIdade(pessoa.birthDate, pessoa.deathDate) && (
                          <span className="text-xs text-on-surface-variant/70">
                            ({calcularIdade(pessoa.birthDate, pessoa.deathDate)} anos)
                          </span>
                        )}
                      </span>
                    )}
                    {pessoa?.birthPlace && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {pessoa.birthPlace}
                      </span>
                    )}
                    {pessoa?.occupation && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">work</span>
                        {pessoa.occupation}
                      </span>
                    )}
                  </div>
                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/family/${family?.id ?? '1'}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-outline-variant dark:border-zinc-700 text-on-surface dark:text-zinc-300 rounded-lg hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">account_tree</span>
                      Ver na Árvore
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Abas */}
            <div className="flex gap-1 overflow-x-auto">
              {abas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    aba === a.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
                  {a.label}
                  {a.count != null && a.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      aba === a.id
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-variant dark:bg-zinc-700 text-on-surface-variant dark:text-zinc-400'
                    }`}>
                      {a.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* ABA: INFORMAÇÕES */}
          {aba === 'informacoes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dados pessoais */}
              <div className="md:col-span-2 space-y-6">
                {loading ? (
                  <SkeletonCard />
                ) : (
                  <section className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6">
                    <h2 className="font-title-lg text-on-surface dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">badge</span>
                      Dados Pessoais
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Nome Completo', value: `${pessoa?.firstName ?? ''} ${pessoa?.lastName ?? ''}`.trim() },
                        { label: 'Gênero', value: pessoa?.gender === 'male' ? 'Masculino' : pessoa?.gender === 'female' ? 'Feminino' : pessoa?.gender ?? null },
                        { label: 'Data de Nascimento', value: formatarData(pessoa?.birthDate) },
                        { label: 'Local de Nascimento', value: pessoa?.birthPlace ?? null },
                        { label: 'Data de Falecimento', value: pessoa?.deathDate ? formatarData(pessoa.deathDate) : null },
                        { label: 'Local de Falecimento', value: pessoa?.deathPlace ?? null },
                        { label: 'Ocupação', value: pessoa?.occupation ?? null },
                      ].map(({ label, value }) =>
                        value ? (
                          <div key={label}>
                            <dt className="text-xs text-on-surface-variant dark:text-zinc-500 uppercase tracking-wider mb-0.5">{label}</dt>
                            <dd className="text-sm text-on-surface dark:text-zinc-200 font-medium">{value}</dd>
                          </div>
                        ) : null
                      )}
                    </dl>
                  </section>
                )}

                {/* Notas */}
                {!loading && pessoa?.notes && (
                  <section className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6">
                    <h2 className="font-title-lg text-on-surface dark:text-zinc-100 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">notes</span>
                      Notas
                    </h2>
                    <p className="text-sm text-on-surface-variant dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {pessoa.notes}
                    </p>
                  </section>
                )}
              </div>

              {/* Painel lateral */}
              <div className="space-y-4">
                {/* Estatísticas rápidas */}
                {!loading && (
                  <section className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 p-5">
                    <p className="text-xs text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-3">
                      Resumo
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-2xl font-bold text-primary">{events.length}</span>
                        <p className="text-xs text-on-surface-variant dark:text-zinc-400">Eventos</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-primary">{docsDaPessoa.length}</span>
                        <p className="text-xs text-on-surface-variant dark:text-zinc-400">Documentos</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Ações rápidas */}
                <section className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-on-surface dark:text-zinc-200 mb-2">Ações Rápidas</h3>
                  <button
                    onClick={() => setAba('eventos')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">add_circle</span>
                    Adicionar Evento
                  </button>
                  <button
                    onClick={() => setAba('documentos')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">upload_file</span>
                    Enviar Documento
                  </button>
                  <Link
                    to={`/family/${family?.id ?? '1'}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">account_tree</span>
                    Ver na Árvore
                  </Link>
                </section>
              </div>
            </div>
          )}

          {/* ABA: EVENTOS */}
          {aba === 'eventos' && (
            <EventTimeline personId={personId} />
          )}

          {/* ABA: DOCUMENTOS */}
          {aba === 'documentos' && (
            <>
              {loadingDocs ? (
                <SkeletonList count={4} />
              ) : docsDaPessoa.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant dark:text-zinc-500">
                  <span className="material-symbols-outlined text-5xl">folder_open</span>
                  <p className="text-sm">Nenhum documento vinculado a esta pessoa ainda.</p>
                  <Link
                    to="/documents"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Ir para Documentos
                  </Link>
                </div>
              ) : (
                <DocumentList
                  documents={docsDaPessoa}
                  persons={[]}
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
