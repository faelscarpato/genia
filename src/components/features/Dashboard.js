import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { GlobalSearch } from '../ui/GlobalSearch';
import { NotificationPanel } from '../ui/NotificationPanel';
import { SkeletonText } from '../ui/SkeletonLoader';
import useApp from '../../hooks/useApp';
import useTheme from '../../hooks/useTheme';

/**
 * Dashboard principal com dados reais do IndexedDB.
 * Substitui completamente os números hardcoded da versão anterior.
 */
const Dashboard = () => {
  const { user, family, db } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [contagens, setContagens] = useState({ pessoas: 0, documentos: 0, eventos: 0 });
  const [carregando, setCarregando] = useState(true);
  const [pessoasRecentes, setPessoasRecentes] = useState([]);

  useEffect(() => {
    if (!db) return;

    const carregar = async () => {
      setCarregando(true);
      try {
        const [pessoas, documentos, eventos, todasPessoas] = await Promise.all([
          db.count('persons').catch(() => 0),
          db.count('documents').catch(() => 0),
          db.count('events').catch(() => 0),
          db.getAll('persons').catch(() => []),
        ]);

        setContagens({ pessoas, documentos, eventos });

        // Últimas 3 pessoas adicionadas
        const recentes = [...todasPessoas]
          .sort((a, b) => b.createdAt?.localeCompare(a.createdAt ?? '') ?? 0)
          .slice(0, 3);
        setPessoasRecentes(recentes);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [db, family?.id]);

  const familyPath = family ? `/family/${family.id}` : '#';

  return (
    <AppLayout>
      <div className="min-h-screen bg-background dark:bg-on-background/5">
        {/* TopAppBar */}
        <header className="sticky top-0 z-40 h-16 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border-b border-outline-variant dark:border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center w-full px-6 h-16 gap-4">
            <GlobalSearch />
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 text-on-surface-variant hover:text-secondary dark:hover:text-secondary transition-colors rounded-full hover:bg-surface-container-low dark:hover:bg-surface/20"
                aria-label={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <NotificationPanel />
              <Link
                to="/documents"
                className="hidden sm:flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Documento</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="pt-6 pb-16 px-6 space-y-6 max-w-7xl mx-auto">
          {/* Boas-vindas */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary dark:text-on-surface mb-1">
                Olá, {user?.name?.split(' ')[0] ?? 'Pesquisador'}.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                {family ? `Família "${family.name}"` : 'Bem-vindo ao seu arquivo genealógico.'}
              </p>
            </div>
            <Link
              to={familyPath}
              className="inline-flex items-center gap-2 bg-surface dark:bg-surface-container border-2 border-secondary text-secondary px-6 py-3 rounded-xl font-title-lg hover:bg-secondary hover:text-on-secondary transition-all"
            >
              <span className="material-symbols-outlined">hub</span>
              Ver Árvore
            </Link>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pessoas */}
            <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl border border-outline-variant dark:border-outline-variant/40 shadow-sm card-hover">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-secondary bg-secondary-fixed dark:bg-secondary/20 p-2 rounded-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <div className="mt-4">
                <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-widest">Total de Pessoas</p>
                {carregando ? (
                  <SkeletonText className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{contagens.pessoas.toLocaleString('pt-BR')}</h3>
                )}
              </div>
            </div>

            {/* Documentos */}
            <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl border border-outline-variant dark:border-outline-variant/40 shadow-sm card-hover">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-primary bg-primary-fixed dark:bg-primary/20 p-2 rounded-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <div className="mt-4">
                <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-widest">Documentos</p>
                {carregando ? (
                  <SkeletonText className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{contagens.documentos.toLocaleString('pt-BR')}</h3>
                )}
              </div>
            </div>

            {/* Eventos */}
            <div className="bg-secondary-container dark:bg-secondary/10 p-6 rounded-xl border border-secondary/30 shadow-sm card-hover">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-on-secondary-container bg-surface/30 p-2 rounded-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                {contagens.eventos > 0 && (
                  <div className="w-2 h-2 rounded-full bg-on-secondary-container animate-pulse" />
                )}
              </div>
              <div className="mt-4">
                <p className="text-on-secondary-container opacity-80 font-label-md text-label-md uppercase tracking-widest">Eventos</p>
                {carregando ? (
                  <SkeletonText className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="font-headline-sm text-headline-sm text-on-secondary-container">
                    {contagens.eventos.toLocaleString('pt-BR')}
                  </h3>
                )}
              </div>
            </div>
          </section>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna principal */}
            <div className="lg:col-span-8 space-y-6">
              {/* Pessoas recentemente adicionadas */}
              <div className="bg-surface dark:bg-surface-container p-6 rounded-xl border border-outline-variant dark:border-outline-variant/40 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Pessoas Recentes</h4>
                  <Link to={familyPath} className="text-label-md text-secondary hover:underline">Ver árvore</Link>
                </div>

                {carregando ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-highest dark:bg-surface/30" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-4 bg-surface-container-highest dark:bg-surface/30 rounded w-1/3" />
                          <div className="h-3 bg-surface-container-highest dark:bg-surface/30 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pessoasRecentes.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">person_off</span>
                    <p className="text-body-md">Nenhuma pessoa adicionada ainda.</p>
                    <Link to={familyPath} className="inline-flex items-center gap-1 mt-3 text-label-md text-secondary hover:underline">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Adicionar primeira pessoa
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pessoasRecentes.map((p) => (
                      <div key={p.id} className="flex gap-3 items-center p-3 rounded-lg hover:bg-surface-container-low dark:hover:bg-surface/20 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">person</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-md font-medium text-on-surface truncate">
                            {p.firstName} {p.lastName ?? ''}
                          </p>
                          {p.birthDate && (
                            <p className="text-label-md text-on-surface-variant">
                              Nasc. {p.birthDate.substring(0, 4)}
                              {p.deathDate && ` — Fal. ${p.deathDate.substring(0, 4)}`}
                            </p>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-green-600 text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna lateral */}
            <div className="lg:col-span-4 space-y-6">
              {/* Atalhos */}
              <div className="bg-surface-container-low dark:bg-surface/10 p-5 rounded-xl border border-outline-variant dark:border-outline-variant/40">
                <h4 className="font-title-lg text-title-lg text-on-surface mb-3">Ações Rápidas</h4>
                <div className="space-y-2">
                  <Link to={familyPath} className="flex items-center gap-3 p-3 bg-surface dark:bg-surface-container rounded-lg border border-outline-variant dark:border-outline-variant/40 hover:border-secondary transition-colors">
                    <span className="material-symbols-outlined text-secondary">account_tree</span>
                    <span className="font-body-md text-on-surface">Ver Árvore Genealógica</span>
                  </Link>
                  <Link to="/documents" className="flex items-center gap-3 p-3 bg-surface dark:bg-surface-container rounded-lg border border-outline-variant dark:border-outline-variant/40 hover:border-secondary transition-colors">
                    <span className="material-symbols-outlined text-secondary">upload_file</span>
                    <span className="font-body-md text-on-surface">Adicionar Documento</span>
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 p-3 bg-surface dark:bg-surface-container rounded-lg border border-outline-variant dark:border-outline-variant/40 hover:border-secondary transition-colors">
                    <span className="material-symbols-outlined text-secondary">settings</span>
                    <span className="font-body-md text-on-surface">Configurações</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* BottomNavBar Mobile */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 md:hidden bg-surface-container dark:bg-surface-container shadow-lg border-t border-outline-variant dark:border-outline-variant/40">
          <Link className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-95 transition-all" to="/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Início</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant" to={familyPath}>
            <span className="material-symbols-outlined">account_tree</span>
            <span className="font-label-md text-label-md">Árvore</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant" to="/documents">
            <span className="material-symbols-outlined">description</span>
            <span className="font-label-md text-label-md">Docs</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant" to="/settings">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Config.</span>
          </Link>
        </nav>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
