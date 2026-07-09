import React, { useState } from 'react';
import { TranscriptionService } from '../../services/TranscriptionService';
import type { TranscriptionResult } from '../../types';
import useApp from '../../hooks/useApp';

interface TranscriptionPanelProps {
  /** Dados base64 da imagem */
  imageData: string;
  /** MIME type da imagem */
  imageType: string;
  /** Nome do documento para notificações */
  documentName?: string;
  /** Callback chamado ao confirmar a transcrição */
  onConfirm?: (result: TranscriptionResult) => Promise<void>;
}

const transcriptionService = new TranscriptionService();

/**
 * Painel de transcrição via IA para documentos de imagem.
 *
 * - Verifica se o serviço está configurado (REACT_APP_AI_API_ENDPOINT)
 * - Mostra mensagem explicativa quando não configurado
 * - Exibe progresso durante transcrição
 * - Resultado em textarea editável
 * - Botão para confirmar e salvar como fonte
 * - Funciona somente com conexão à internet
 * - Dark mode completo
 */
export function TranscriptionPanel({ imageData, imageType, documentName, onConfirm }: TranscriptionPanelProps) {
  const { user } = useApp();

  const [estado, setEstado] = useState<'idle' | 'transcrevendo' | 'pronto' | 'erro'>('idle');
  const [resultado, setResultado] = useState<TranscriptionResult | null>(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const configurado = transcriptionService.isConfigured();

  const handleTranscrever = async () => {
    setEstado('transcrevendo');
    setErro(null);

    try {
      // Extrai apenas o base64 sem o prefixo data:...;base64,
      const base64Puro = imageData.split(',')[1] ?? imageData;
      const res = await transcriptionService.transcribe(base64Puro, imageType);
      setResultado(res);
      setTextoEditado(res.textoCompleto);
      setEstado('pronto');
    } catch (err: any) {
      setErro(err?.message ?? 'Erro ao transcrever o documento.');
      setEstado('erro');
    }
  };

  const handleConfirmar = async () => {
    if (!resultado || !onConfirm) return;
    setSalvando(true);
    try {
      await onConfirm({ ...resultado, textoCompleto: textoEditado });
    } catch (err: any) {
      setErro(err?.message ?? 'Erro ao salvar a transcrição.');
    } finally {
      setSalvando(false);
    }
  };

  if (!configurado) {
    return (
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            info
          </span>
          <div>
            <p className="font-title-lg text-title-lg text-amber-800 dark:text-amber-300">
              Transcrição por IA não configurada
            </p>
            <p className="text-body-md text-amber-700 dark:text-amber-400 mt-1">
              Para habilitar a transcrição automática de documentos históricos, configure a variável de ambiente
              <code className="mx-1 px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-xs font-mono">
                REACT_APP_AI_API_ENDPOINT
              </code>
              no arquivo <code className="mx-1 px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-xs font-mono">.env</code>.
            </p>
            <p className="text-label-md text-amber-600 dark:text-amber-500 mt-2">
              Consulte o <strong>README.md</strong> para instruções detalhadas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant dark:border-outline-variant/40 bg-surface dark:bg-surface-container p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
          Transcrição via IA
        </h4>
        {estado === 'idle' && (
          <span className="text-label-md text-on-surface-variant">Requer internet</span>
        )}
      </div>

      {/* Botão de transcrever */}
      {estado === 'idle' && (
        <button
          onClick={handleTranscrever}
          className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-on-secondary rounded-lg font-title-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">document_scanner</span>
          Transcrever com IA
        </button>
      )}

      {/* Progresso */}
      {estado === 'transcrevendo' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant">Analisando documento histórico…</p>
          <p className="text-label-md text-on-surface-variant/60">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Erro */}
      {estado === 'erro' && (
        <div className="space-y-3">
          <div className="px-4 py-3 bg-error-container rounded-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <p className="text-body-md text-error">{erro}</p>
          </div>
          <button onClick={() => setEstado('idle')}
            className="text-label-md text-secondary hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Resultado */}
      {estado === 'pronto' && resultado && (
        <div className="space-y-4">
          {/* Metadados extraídos */}
          {(resultado.nomeIdentificado || resultado.tipoDocumento) && (
            <div className="p-3 bg-surface-container-low dark:bg-surface/20 rounded-lg space-y-1">
              {resultado.tipoDocumento && (
                <p className="text-label-md text-on-surface-variant">
                  <span className="font-semibold">Tipo:</span> {resultado.tipoDocumento}
                </p>
              )}
              {resultado.nomeIdentificado && (
                <p className="text-label-md text-on-surface-variant">
                  <span className="font-semibold">Nome:</span> {resultado.nomeIdentificado}
                </p>
              )}
              {resultado.datasIdentificadas?.length && (
                <p className="text-label-md text-on-surface-variant">
                  <span className="font-semibold">Datas:</span> {resultado.datasIdentificadas.join(', ')}
                </p>
              )}
              {resultado.locaisIdentificados?.length && (
                <p className="text-label-md text-on-surface-variant">
                  <span className="font-semibold">Locais:</span> {resultado.locaisIdentificados.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Texto completo editável */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
              Texto transcrito (editável)
            </label>
            <textarea
              value={textoEditado}
              onChange={(e) => setTextoEditado(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none font-mono text-sm"
            />
          </div>

          {/* Ações */}
          {onConfirm && (
            <div className="flex gap-3">
              <button onClick={() => { setEstado('idle'); setResultado(null); }}
                className="px-4 py-2 text-label-md border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-low dark:hover:bg-surface/20 transition-colors">
                Nova transcrição
              </button>
              <button onClick={handleConfirmar} disabled={salvando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 disabled:opacity-50 transition-all">
                {salvando && <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />}
                <span className="material-symbols-outlined text-[18px]">save</span>
                Confirmar e Salvar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TranscriptionPanel;
