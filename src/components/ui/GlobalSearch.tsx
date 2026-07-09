import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import type { Person, GenealogyEvent, GenealogyDocument, Source } from '../../types';

// ─── Ícones por tipo de resultado ────────────────────────────────────
const ICONE_POR_TIPO: Record<string, string> = {
  pessoa:    'person',
  evento:    'event',
  documento: 'description',
  fonte:     'library_books',
};

/**
 * Componente de busca global com dropdown de resultados.
 *
 * - Busca em pessoas, eventos, documentos e fontes do IndexedDB
 * - Resultados agrupados por categoria com ícones distintos
 * - Navegação por teclado (↑ ↓ Enter Esc)
 * - Dark mode completo
 *
 * @example
 * <GlobalSearch />
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading, clearSearch } = useSearch(300);

  const [aberto, setAberto] = useState(false);
  const [indiceFoco, setIndiceFoco] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Monta lista plana de itens para navegação por teclado ──────────
  type ItemBusca = {
    tipo: 'pessoa' | 'evento' | 'documento' | 'fonte';
    id: string;
    titulo: string;
    subtitulo?: string;
    rota: string;
  };

  const itensPlanificados: ItemBusca[] = [];

  if (results) {
    results.persons.forEach((p: Person) => {
      itensPlanificados.push({
        tipo: 'pessoa',
        id: p.id,
        titulo: `${p.firstName} ${p.lastName ?? ''}`.trim(),
        subtitulo: p.birthDate ? `Nasc. ${p.birthDate}` : undefined,
        rota: `/person/${p.id}`,
      });
    });

    results.events.forEach((e: GenealogyEvent) => {
      itensPlanificados.push({
        tipo: 'evento',
        id: e.id,
        titulo: e.description ?? `Evento — ${e.type}`,
        subtitulo: e.place,
        rota: `/family/${e.familyId}?event=${e.id}`,
      });
    });

    results.documents.forEach((d: GenealogyDocument) => {
      itensPlanificados.push({
        tipo: 'documento',
        id: d.id,
        titulo: d.title,
        subtitulo: d.fileName,
        rota: `/documents/${d.id}`,
      });
    });

    results.sources.forEach((s: Source) => {
      itensPlanificados.push({
        tipo: 'fonte',
        id: s.id,
        titulo: s.title,
        subtitulo: s.author,
        rota: `/family/${s.familyId}?source=${s.id}`,
      });
    });
  }

  // ─── Fecha o dropdown ao clicar fora ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Navegar com teclado ─────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!aberto) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndiceFoco((prev) => Math.min(prev + 1, itensPlanificados.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndiceFoco((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && indiceFoco >= 0) {
        e.preventDefault();
        const item = itensPlanificados[indiceFoco];
        if (item) {
          navigate(item.rota);
          clearSearch();
          setAberto(false);
          inputRef.current?.blur();
        }
      } else if (e.key === 'Escape') {
        setAberto(false);
        clearSearch();
      }
    },
    [aberto, indiceFoco, itensPlanificados, navigate, clearSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setAberto(true);
    setIndiceFoco(-1);
  };

  const handleItemClick = (item: ItemBusca) => {
    navigate(item.rota);
    clearSearch();
    setAberto(false);
  };

  const temResultados = itensPlanificados.length > 0;
  const mostrarDropdown = aberto && query.length >= 2;

  // ─── Grupos para exibição agrupada ──────────────────────────────────
  const grupos = [
    { tipo: 'pessoa',    rotulo: 'Pessoas',    itens: itensPlanificados.filter((i) => i.tipo === 'pessoa') },
    { tipo: 'evento',    rotulo: 'Eventos',    itens: itensPlanificados.filter((i) => i.tipo === 'evento') },
    { tipo: 'documento', rotulo: 'Documentos', itens: itensPlanificados.filter((i) => i.tipo === 'documento') },
    { tipo: 'fonte',     rotulo: 'Fontes',     itens: itensPlanificados.filter((i) => i.tipo === 'fonte') },
  ].filter((g) => g.itens.length > 0);

  let indicadorGlobal = 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      {/* Input de busca */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-secondary transition-colors">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setAberto(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar pessoas, eventos, documentos..."
          aria-label="Busca global"
          aria-expanded={mostrarDropdown}
          aria-haspopup="listbox"
          className="
            w-full pl-10 pr-9 py-2 rounded-xl
            bg-surface-container-low dark:bg-surface/20
            border border-transparent dark:border-outline-variant/30
            focus:ring-2 focus:ring-secondary/30 focus:border-secondary
            text-body-md font-body-md text-on-surface dark:text-on-surface
            placeholder:text-outline-variant
            transition-all outline-none
          "
        />

        {/* Botão de limpar */}
        {query.length > 0 && (
          <button
            onClick={() => { clearSearch(); setAberto(false); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Limpar busca"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {mostrarDropdown && (
        <div
          role="listbox"
          className="
            absolute top-full mt-2 left-0 right-0 z-50
            bg-surface dark:bg-surface-container
            border border-outline-variant dark:border-outline-variant/40
            rounded-xl shadow-xl overflow-hidden
            max-h-[70vh] overflow-y-auto
          "
        >
          {/* Estado de loading */}
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-on-surface-variant">
              <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="text-body-md">Buscando…</span>
            </div>
          )}

          {/* Sem resultados */}
          {!isLoading && !temResultados && (
            <div className="px-4 py-6 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl block mb-2">search_off</span>
              <p className="text-body-md">Nenhum resultado para "{query}"</p>
            </div>
          )}

          {/* Grupos de resultados */}
          {!isLoading && grupos.map((grupo) => (
            <div key={grupo.tipo}>
              {/* Cabeçalho do grupo */}
              <div className="px-4 py-1.5 bg-surface-container-low dark:bg-surface/30 border-b border-outline-variant/30">
                <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-widest">
                  {grupo.rotulo}
                </span>
              </div>

              {/* Itens do grupo */}
              {grupo.itens.map((item) => {
                const indexAtual = indicadorGlobal++;
                const emFoco = indiceFoco === indexAtual;

                return (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={emFoco}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setIndiceFoco(indexAtual)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-colors duration-100
                      ${emFoco
                        ? 'bg-secondary-container/50 dark:bg-secondary/20'
                        : 'hover:bg-surface-container-low dark:hover:bg-surface/20'
                      }
                    `}
                  >
                    <span className={`
                      material-symbols-outlined text-[20px] flex-shrink-0
                      ${emFoco ? 'text-secondary' : 'text-on-surface-variant'}
                    `}>
                      {ICONE_POR_TIPO[item.tipo]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-body-md font-medium text-on-surface truncate">
                        {item.titulo}
                      </p>
                      {item.subtitulo && (
                        <p className="text-label-md text-on-surface-variant truncate">
                          {item.subtitulo}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-outline-variant ml-auto flex-shrink-0">
                      arrow_forward
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Total de resultados */}
          {!isLoading && temResultados && results && (
            <div className="px-4 py-2 border-t border-outline-variant/30 text-center">
              <span className="text-label-md text-on-surface-variant">
                {results.total} {results.total === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
