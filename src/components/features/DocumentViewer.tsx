import React, { useState } from 'react';

interface DocumentViewerProps {
  fileData: string;
  fileType: string;
  fileName?: string;
  onClose: () => void;
}

/**
 * Visualizador de documentos (imagens e PDFs).
 *
 * - Imagens: visualização inline com zoom via CSS transform
 * - PDFs: iframe com fallback para link de download
 * - Controles: zoom in/out/reset, download, fechar
 * - Dark mode completo
 */
export function DocumentViewer({ fileData, fileType, fileName, onClose }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);

  const isImagem = fileType.startsWith('image/');
  const isPDF    = fileType === 'application/pdf';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName ?? 'documento';
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <p className="text-white font-label-md truncate">{fileName ?? 'Documento'}</p>

        <div className="flex items-center gap-2">
          {isImagem && (
            <>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Ampliar"
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <span className="text-white/60 text-label-md min-w-[40px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Reduzir"
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Tamanho original"
              >
                <span className="material-symbols-outlined">crop_free</span>
              </button>
              <div className="w-px h-6 bg-white/20 mx-1" />
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Baixar"
          >
            <span className="material-symbols-outlined">download</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isImagem && (
          <img
            src={fileData}
            alt={fileName ?? 'Documento'}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
            className="max-w-full select-none"
            draggable={false}
          />
        )}

        {isPDF && (
          <iframe
            src={fileData}
            title={fileName ?? 'PDF'}
            className="w-full h-full rounded"
            style={{ minHeight: '80vh' }}
          />
        )}

        {!isImagem && !isPDF && (
          <div className="text-center text-white/80">
            <span className="material-symbols-outlined text-6xl mb-4 block">description</span>
            <p className="font-title-lg mb-4">Pré-visualização não disponível</p>
            <button onClick={handleDownload}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-secondary text-on-secondary rounded-lg hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined">download</span>
              Baixar Arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentViewer;
