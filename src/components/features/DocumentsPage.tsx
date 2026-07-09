import React, { useState, useCallback } from 'react';
import AppLayout from '../layout/AppLayout';
import DocumentList from './DocumentList';
import DocumentUploader from './DocumentUploader';
import { SkeletonList } from '../ui/SkeletonLoader';
import { EmptyState } from '../ui/EmptyState';
import useDocuments from '../../hooks/useDocuments';
import useApp from '../../hooks/useApp';

type FilterType = 'todos' | 'certidao' | 'foto' | 'registro' | 'carta' | 'outro';

const FILTROS: { id: FilterType; label: string; icon: string }[] = [
  { id: 'todos',    label: 'Todos',      icon: 'folder_open' },
  { id: 'certidao', label: 'Certidões',  icon: 'description' },
  { id: 'foto',     label: 'Fotos',      icon: 'photo' },
  { id: 'registro', label: 'Registros',  icon: 'assignment' },
  { id: 'carta',    label: 'Cartas',     icon: 'mail' },
  { id: 'outro',    label: 'Outros',     icon: 'attach_file' },
];

/**
 * Página principal de documentos.
 * Lista, filtra, faz upload e visualiza documentos genealógicos.
 */
const DocumentsPage: React.FC = () => {
  const { family } = useApp();
  const { documents, isLoading: loading, error, uploadDocument: createDocument, deleteDocument } = useDocuments(
    family?.id ?? null
  );

  const [filtro, setFiltro] = useState<FilterType>('todos');
  const [busca, setBusca] = useState('');
  const [mostrarUploader, setMostrarUploader] = useState(false);

  /** Filtra e busca documentos */
  const docsFiltrados = React.useMemo(() => {
    return documents.filter((doc) => {
      const buscaOk =
        busca === '' ||
        doc.title.toLowerCase().includes(busca.toLowerCase()) ||
        (doc.description ?? '').toLowerCase().includes(busca.toLowerCase());

      const tipoOk =
        filtro === 'todos' ||
        (doc.type ?? '').toLowerCase().includes(filtro);

      return buscaOk && tipoOk;
    });
  }, [documents, filtro, busca]);

  const handleUploadConcluido = useCallback(
    async (data: any) => {
      await createDocument(data);
      setMostrarUploader(false);
    },
    [createDocument]
  );

  const handleExcluir = useCallback(
    async (id: string) => {
      if (window.confirm('Excluir este documento permanentemente?')) {
        await deleteDocument(id);
      }
    },
    [deleteDocument]
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-background dark:bg-zinc-950">
        {/* Cabeçalho da página */}
        <header className="sticky top-0 z-30 bg-surface dark:bg-zinc-900 border-b border-outline-variant dark:border-zinc-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">
                Documentos
              </h1>
              <p className="text-sm text-on-surface-variant dark:text-zinc-400 mt-0.5">
                {loading
                  ? 'Carregando…'
                  : `${documents.length} documento${documents.length !== 1 ? 's' : ''} na sua coleção`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Campo de busca */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-zinc-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar documentos…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 rounded-lg text-on-surface dark:text-zinc-100 placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
                />
              </div>

              {/* Botão Upload */}
              <button
                onClick={() => setMostrarUploader(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Enviar Documento
              </button>
            </div>
          </div>

          {/* Filtros por tipo */}
          <div className="max-w-7xl mx-auto mt-4 flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filtro === f.id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-400 border-outline-variant dark:border-zinc-700 hover:border-primary/50'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                {f.label}
                {f.id === 'todos' && documents.length > 0 && (
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    filtro === 'todos' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-variant dark:bg-zinc-700 text-on-surface-variant'
                  }`}>
                    {documents.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg text-sm text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error_outline</span>
              {error}
            </div>
          )}

          {loading ? (
            <SkeletonList count={6} />
          ) : docsFiltrados.length === 0 ? (
            busca || filtro !== 'todos' ? (
              <EmptyState
                icon="search_off"
                title="Nenhum resultado encontrado"
                description="Tente ajustar os filtros ou o termo de busca."
                action={
                  <button
                    onClick={() => { setBusca(''); setFiltro('todos'); }}
                    className="px-4 py-2 text-sm bg-surface-container dark:bg-zinc-800 text-on-surface dark:text-zinc-200 border border-outline-variant dark:border-zinc-700 rounded-lg hover:bg-surface-variant transition-colors"
                  >
                    Limpar filtros
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon="folder_open"
                title="Nenhum documento ainda"
                description="Envie certidões, fotos, cartas e outros documentos para preservar a história da sua família."
                action={
                  <button
                    onClick={() => setMostrarUploader(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    Enviar primeiro documento
                  </button>
                }
              />
            )
          ) : (
            <DocumentList
              documents={docsFiltrados}
              persons={[]}
              onDelete={handleExcluir}
            />
          )}
        </main>

        {/* Modal de Upload */}
        {mostrarUploader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-surface dark:bg-zinc-900 rounded-2xl shadow-2xl border border-outline-variant dark:border-zinc-700 overflow-hidden">
              {/* Cabeçalho do modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant dark:border-zinc-700">
                <h2 className="font-title-lg text-on-surface dark:text-zinc-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                  Enviar Documento
                </h2>
                <button
                  onClick={() => setMostrarUploader(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container dark:hover:bg-zinc-800 text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                <DocumentUploader
                  familyId={family?.id ?? ''}
                  persons={[]}
                  onUpload={handleUploadConcluido}
                  onClose={() => setMostrarUploader(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DocumentsPage;
