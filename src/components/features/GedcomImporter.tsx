import React, { useState, useRef } from 'react';
import { GedcomParser } from '../../utils/gedcom/GedcomParser';
import type { ParsedGedcom } from '../../types';

interface GedcomImporterProps {
  familyId: string;
  onImport: (dados: ParsedGedcom) => Promise<void>;
  onClose: () => void;
}

const parser = new GedcomParser();

/**
 * Componente de importação de arquivo GEDCOM.
 *
 * 1. Upload do arquivo .ged
 * 2. Parse e preview ("X pessoas, Y famílias...")
 * 3. Confirmação → importação com barra de progresso
 * 4. Toast de sucesso com contagem
 * Dark mode completo.
 */
export function GedcomImporter({ familyId, onImport, onClose }: GedcomImporterProps) {
  const [fase, setFase] = useState<'upload' | 'preview' | 'importando' | 'concluido'>('upload');
  const [dados, setDados] = useState<ParsedGedcom | null>(null);
  const [erroParseamento, setErroParseamento] = useState<string | null>(null);
  const [progresso, setProgresso] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleArquivo = (file: File) => {
    if (!file.name.endsWith('.ged') && !file.name.endsWith('.gedcom')) {
      setErroParseamento('Selecione um arquivo .ged ou .gedcom válido.');
      return;
    }

    setErroParseamento(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const conteudo = e.target?.result as string;
        if (!conteudo) throw new Error('Arquivo vazio.');
        const resultado = parser.parse(conteudo);
        setDados(resultado);
        setFase('preview');
      } catch (err: any) {
        setErroParseamento(`Erro ao analisar o arquivo: ${err?.message ?? 'Formato inválido.'}`);
      }
    };
    reader.onerror = () => setErroParseamento('Falha ao ler o arquivo.');
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmar = async () => {
    if (!dados) return;
    setFase('importando');

    // Simula progresso enquanto importa
    let progAtual = 0;
    const intervalo = setInterval(() => {
      progAtual = Math.min(progAtual + 10, 90);
      setProgresso(progAtual);
    }, 150);

    try {
      await onImport({ ...dados, pessoas: dados.pessoas.map((p) => ({ ...p, familyId })) });
      clearInterval(intervalo);
      setProgresso(100);
      setFase('concluido');
    } catch (err: any) {
      clearInterval(intervalo);
      setErroParseamento(err?.message ?? 'Erro durante a importação.');
      setFase('preview');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true"
    >
      <div className="bg-surface dark:bg-surface-container w-full max-w-lg rounded-2xl shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant dark:border-outline-variant/40">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Importar GEDCOM</h2>
          <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface/30 transition-colors" aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Fase: Upload */}
          {fase === 'upload' && (
            <>
              <div
                className="border-2 border-dashed border-outline-variant dark:border-outline-variant/40 rounded-xl p-10 text-center cursor-pointer hover:border-secondary hover:bg-surface-container-low dark:hover:bg-surface/20 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleArquivo(f); }}
                onDragOver={(e) => e.preventDefault()}
              >
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3 block">upload_file</span>
                <p className="font-title-lg text-title-lg text-on-surface">Arraste ou clique para selecionar</p>
                <p className="text-label-md text-on-surface-variant mt-1">Arquivos .ged ou .gedcom</p>
                <input
                  ref={fileInputRef} type="file" accept=".ged,.gedcom" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleArquivo(f); }}
                />
              </div>

              {erroParseamento && (
                <div className="px-4 py-3 bg-error-container rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-error">error</span>
                  <p className="text-body-md text-error">{erroParseamento}</p>
                </div>
              )}
            </>
          )}

          {/* Fase: Preview */}
          {fase === 'preview' && dados && (
            <>
              <div className="p-4 bg-surface-container-low dark:bg-surface/20 rounded-xl space-y-2">
                <p className="font-title-lg text-title-lg text-on-surface">Análise do arquivo</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { rotulo: 'Pessoas',  valor: dados.totalPessoas,  icone: 'person' },
                    { rotulo: 'Famílias', valor: dados.totalFamilias, icone: 'family_restroom' },
                    { rotulo: 'Eventos',  valor: dados.totalEventos,  icone: 'event' },
                  ].map((item) => (
                    <div key={item.rotulo} className="text-center p-3 bg-surface dark:bg-surface-container rounded-lg">
                      <span className="material-symbols-outlined text-secondary block mb-1">{item.icone}</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">{item.valor}</p>
                      <p className="text-label-md text-on-surface-variant">{item.rotulo}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview das primeiras pessoas */}
              {dados.pessoas.length > 0 && (
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-2">
                    Primeiras pessoas encontradas:
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {dados.pessoas.slice(0, 10).map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low dark:bg-surface/20">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                        <span className="text-body-md text-on-surface">
                          {p.firstName} {p.lastName ?? ''}
                          {p.birthDate && <span className="text-on-surface-variant ml-2 text-label-md">({p.birthDate.substring(0,4)})</span>}
                        </span>
                      </div>
                    ))}
                    {dados.pessoas.length > 10 && (
                      <p className="text-label-md text-on-surface-variant text-center">
                        + {dados.pessoas.length - 10} pessoas…
                      </p>
                    )}
                  </div>
                </div>
              )}

              {erroParseamento && (
                <div className="px-4 py-3 bg-error-container rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-error">error</span>
                  <p className="text-body-md text-error">{erroParseamento}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setFase('upload')} className="px-5 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-low transition-colors">
                  Escolher outro arquivo
                </button>
                <button onClick={handleConfirmar}
                  className="flex items-center gap-2 px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Confirmar Importação
                </button>
              </div>
            </>
          )}

          {/* Fase: Importando */}
          {fase === 'importando' && (
            <div className="py-8 space-y-4">
              <p className="text-center font-title-lg text-title-lg text-on-surface">Importando dados…</p>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-center text-label-md text-on-surface-variant">{progresso}%</p>
            </div>
          )}

          {/* Fase: Concluído */}
          {fase === 'concluido' && dados && (
            <div className="py-8 text-center space-y-3">
              <span className="material-symbols-outlined text-6xl text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="font-headline-sm text-headline-sm text-on-surface">Importação concluída!</p>
              <p className="text-body-md text-on-surface-variant">
                {dados.totalPessoas} {dados.totalPessoas === 1 ? 'pessoa importada' : 'pessoas importadas'} com sucesso.
              </p>
              <button onClick={onClose}
                className="mt-4 px-8 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 transition-opacity">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GedcomImporter;
