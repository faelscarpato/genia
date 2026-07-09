import React, { useState, useRef } from 'react';
import type { GenealogyDocument, Person } from '../../types';
import { utils } from '../../utils/utils';
import DocumentViewer from './DocumentViewer';
import TranscriptionPanel from './TranscriptionPanel';

const TAMANHO_MAXIMO_MB = 10;
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'application/pdf'];

const TIPO_ROTULO: Record<string, string> = {
  birth_certificate:   'Certidão de Nascimento',
  death_certificate:   'Certidão de Óbito',
  marriage_certificate:'Certidão de Casamento',
  photo:               'Foto',
  letter:              'Carta',
  other:               'Outro',
};

interface DocumentUploaderProps {
  familyId: string;
  persons: Person[];
  onUpload: (data: any) => Promise<void>;
  onClose: () => void;
}

/**
 * Componente de upload de documentos com drag-and-drop.
 *
 * - Aceita: image/jpeg, image/png, application/pdf
 * - Converte para base64 via FileReader API
 * - Vinculação a pessoa por select com busca
 * - Validação de tamanho máximo (10 MB)
 * - Preview de imagem antes de enviar
 * - Integração com TranscriptionPanel para imagens
 * - Dark mode completo
 */
export function DocumentUploader({ familyId, persons, onUpload, onClose }: DocumentUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [arquivo, setArquivo] = useState<{ name: string; type: string; size: number; data: string } | null>(null);
  const [form, setForm] = useState({ title: '', type: 'other', description: '', personId: '' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [previewAberto, setPreviewAberto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processarArquivo = (file: File) => {
    if (!TIPOS_ACEITOS.includes(file.type)) {
      setErroGeral('Tipo de arquivo não permitido. Use JPG, PNG ou PDF.');
      return;
    }

    const tamanhoMB = file.size / (1024 * 1024);
    if (tamanhoMB > TAMANHO_MAXIMO_MB) {
      setErroGeral(`O arquivo é maior que ${TAMANHO_MAXIMO_MB} MB. Comprima-o antes de enviar.`);
      return;
    }

    setErroGeral(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setArquivo({ name: file.name, type: file.type, size: file.size, data: reader.result as string });
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) setErros((prev) => { const cp = { ...prev }; delete cp[name]; return cp; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    if (!form.title.trim()) {
      setErros({ title: 'O título do documento é obrigatório.' });
      return;
    }

    if (!arquivo) {
      setErroGeral('Selecione um arquivo antes de enviar.');
      return;
    }

    setSalvando(true);
    try {
      await onUpload({
        familyId,
        personId: form.personId || undefined,
        type: form.type,
        title: form.title,
        description: form.description,
        fileData: arquivo.data,
        fileName: arquivo.name,
        fileType: arquivo.type,
        fileSize: arquivo.size,
      });
      onClose();
    } catch (err: any) {
      setErroGeral(err?.message ?? 'Erro ao salvar o documento.');
    } finally {
      setSalvando(false);
    }
  };

  const isImagem = arquivo?.type.startsWith('image/');

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true"
    >
      <div className="bg-surface dark:bg-surface-container w-full max-w-xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant dark:border-outline-variant/40">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Adicionar Documento</h2>
          <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface/30 transition-colors" aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Zona de drag-and-drop */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-secondary bg-secondary-fixed/20'
                : 'border-outline-variant dark:border-outline-variant/40 hover:border-secondary hover:bg-surface-container-low dark:hover:bg-surface/20'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            {arquivo ? (
              <div className="flex flex-col items-center gap-2">
                {isImagem ? (
                  <img
                    src={arquivo.data}
                    alt="Prévia"
                    className="max-h-32 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-secondary">picture_as_pdf</span>
                )}
                <p className="font-label-md text-label-md text-on-surface">{arquivo.name}</p>
                <p className="text-label-md text-on-surface-variant">
                  {(arquivo.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setArquivo(null); }}
                  className="text-label-md text-error hover:underline"
                >
                  Remover arquivo
                </button>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">upload_file</span>
                <p className="font-title-lg text-title-lg text-on-surface">Arraste ou clique para selecionar</p>
                <p className="text-label-md text-on-surface-variant mt-1">JPG, PNG ou PDF — máximo {TAMANHO_MAXIMO_MB} MB</p>
                <p className="text-label-md text-on-surface-variant/60 mt-1 text-xs">
                  Atenção: arquivos são armazenados localmente no seu navegador (IndexedDB).
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={TIPOS_ACEITOS.join(',')}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processarArquivo(f); }}
            />
          </div>

          {/* Visualizar imagem e transcrição */}
          {isImagem && arquivo && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setPreviewAberto(true)}
                className="flex items-center gap-1 px-3 py-1 text-label-md text-secondary border border-secondary rounded-lg hover:bg-secondary-fixed/20 transition-colors">
                <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                Visualizar
              </button>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="title">
              Título <span className="text-error">*</span>
            </label>
            <input id="title" name="title" value={form.title} onChange={handleChange}
              placeholder="Nome do documento"
              className={`w-full px-3 py-2 bg-surface dark:bg-surface-container border rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 ${erros.title ? 'border-error' : 'border-outline-variant dark:border-outline-variant/40'}`}
            />
            {erros.title && <p className="mt-1 text-label-md text-error">{erros.title}</p>}
          </div>

          {/* Tipo e Pessoa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="type">Tipo</label>
              <select id="type" name="type" value={form.type} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40">
                {Object.entries(TIPO_ROTULO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="personId">Vinculado a</label>
              <select id="personId" name="personId" value={form.personId} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40">
                <option value="">— Sem vínculo —</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="description">Descrição</label>
            <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange}
              placeholder="Anotações sobre este documento..."
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
            />
          </div>

          {erroGeral && (
            <div className="px-4 py-3 bg-error-container rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
              <p className="text-body-md text-error">{erroGeral}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={salvando}
              className="px-5 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-low dark:hover:bg-surface/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={salvando || !arquivo}
              className="flex items-center gap-2 px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 disabled:opacity-50 transition-all">
              {salvando && <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />}
              Enviar Documento
            </button>
          </div>
        </form>
      </div>

      {/* Preview */}
      {previewAberto && arquivo && isImagem && (
        <DocumentViewer
          fileData={arquivo.data}
          fileType={arquivo.type}
          fileName={arquivo.name}
          onClose={() => setPreviewAberto(false)}
        />
      )}
    </div>
  );
}

export default DocumentUploader;
