import React, { useState } from 'react';
import type { GenealogyDocument, Person } from '../../types';
import { utils } from '../../utils/utils';
import DocumentViewer from './DocumentViewer';
import { SkeletonCard } from '../ui/SkeletonLoader';

const TIPO_ROTULO: Record<string, string> = {
  birth_certificate:   'Certidão de Nascimento',
  death_certificate:   'Certidão de Óbito',
  marriage_certificate:'Certidão de Casamento',
  photo:               'Foto',
  letter:              'Carta',
  other:               'Outro',
};

interface DocumentListProps {
  documents: GenealogyDocument[];
  persons: Person[];
  isLoading?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

/**
 * Lista de documentos genealógicos com miniaturas, metadados e ações.
 * Dark mode completo.
 */
export function DocumentList({ documents, persons, isLoading, onDelete }: DocumentListProps) {
  const [docVisualizado, setDocVisualizado] = useState<GenealogyDocument | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const getPessoa = (personId?: string) =>
    personId ? persons.find((p) => p.id === personId) : undefined;

  const handleDelete = async (doc: GenealogyDocument) => {
    if (!window.confirm(`Excluir "${doc.title}"? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(doc.id);
    try {
      await onDelete?.(doc.id);
    } finally {
      setExcluindo(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">folder_open</span>
        <p className="font-title-lg text-title-lg mb-1">Nenhum documento encontrado</p>
        <p className="text-body-md">Clique em "Adicionar Documento" para enviar o primeiro.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const pessoa = getPessoa(doc.personId);
          const isImagem = doc.fileType?.startsWith('image/');
          const isPDF    = doc.fileType === 'application/pdf';

          return (
            <div
              key={doc.id}
              className="group bg-surface dark:bg-surface-container rounded-xl border border-outline-variant dark:border-outline-variant/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Miniatura */}
              <div className="relative aspect-video bg-surface-container-low dark:bg-surface/30 flex items-center justify-center overflow-hidden">
                {isImagem && doc.fileData ? (
                  <img
                    src={doc.fileData}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                    {isPDF ? 'picture_as_pdf' : 'description'}
                  </span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                  <button
                    onClick={() => setDocVisualizado(doc)}
                    className="p-2 bg-white rounded-full shadow text-on-surface hover:scale-110 transition-transform"
                    title="Visualizar"
                  >
                    <span className="material-symbols-outlined">zoom_in</span>
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={excluindo === doc.id}
                      className="p-2 bg-white rounded-full shadow text-error hover:scale-110 transition-transform disabled:opacity-50"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined">
                        {excluindo === doc.id ? 'hourglass_empty' : 'delete'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metadados */}
              <div className="p-3">
                <p className="font-label-md font-semibold text-on-surface truncate">{doc.title}</p>
                <p className="text-label-md text-on-surface-variant mt-0.5">
                  {TIPO_ROTULO[doc.type] ?? 'Documento'}
                </p>
                {pessoa && (
                  <p className="flex items-center gap-1 text-label-md text-secondary mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    {pessoa.firstName} {pessoa.lastName ?? ''}
                  </p>
                )}
                <p className="text-label-md text-on-surface-variant/60 mt-1">
                  {utils.formatDate(doc.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizador */}
      {docVisualizado && docVisualizado.fileData && (
        <DocumentViewer
          fileData={docVisualizado.fileData}
          fileType={docVisualizado.fileType ?? 'application/octet-stream'}
          fileName={docVisualizado.fileName ?? docVisualizado.title}
          onClose={() => setDocVisualizado(null)}
        />
      )}
    </>
  );
}

export default DocumentList;
