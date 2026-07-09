import React, { useState } from 'react';
import type { GenealogyEvent, Person } from '../../types';
import { utils } from '../../utils/utils';
import AddEventModal from './AddEventModal';

const ICONE_EVENTO: Record<string, string> = {
  birth:       'child_care',
  death:       'close',
  marriage:    'favorite',
  divorce:     'heart_broken',
  adoption:    'family_restroom',
  immigration: 'flight',
  other:       'event',
};

const COR_EVENTO: Record<string, string> = {
  birth:       'text-green-600 bg-green-50 dark:bg-green-950/30',
  death:       'text-slate-600 bg-slate-100 dark:bg-slate-800/30',
  marriage:    'text-pink-600 bg-pink-50 dark:bg-pink-950/30',
  divorce:     'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  adoption:    'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  immigration: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
  other:       'text-on-surface-variant bg-surface-container',
};

const ROTULO_TIPO: Record<string, string> = {
  birth:       'Nascimento',
  death:       'Falecimento',
  marriage:    'Casamento',
  divorce:     'Divórcio',
  adoption:    'Adoção',
  immigration: 'Migração',
  other:       'Evento',
};

interface EventTimelineProps {
  familyId: string;
  persons: Person[];
  events: GenealogyEvent[];
  isLoading?: boolean;
  onCreateEvent?: (data: any) => Promise<void>;
  onUpdateEvent?: (id: string, data: any) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
  /** Se fornecido, filtra apenas eventos dessa pessoa */
  filterPersonId?: string;
}

/**
 * Componente de linha do tempo cronológica de eventos genealógicos.
 *
 * - Ícones distintos por tipo de evento
 * - Filtro por pessoa e período
 * - Data formatada em pt-BR
 * - Empty state quando não há eventos
 * - Skeleton loader durante carregamento
 * - Dark mode completo
 */
export function EventTimeline({
  familyId,
  persons,
  events,
  isLoading,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  filterPersonId,
}: EventTimelineProps) {
  const [filtroPersonId, setFiltroPersonId] = useState(filterPersonId ?? '');
  const [filtroInicio, setFiltroInicio]     = useState('');
  const [filtroFim, setFiltroFim]           = useState('');
  const [eventoExpandido, setEventoExpandido] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<GenealogyEvent | null>(null);

  // ─── Filtros ──────────────────────────────────────────────────────
  const eventosFiltrados = events.filter((e) => {
    if (filtroPersonId && e.personId !== filtroPersonId) return false;
    if (filtroInicio && e.date && e.date < filtroInicio) return false;
    if (filtroFim    && e.date && e.date > filtroFim)    return false;
    return true;
  });

  const handleSave = async (data: any) => {
    if (eventoEditando) {
      await onUpdateEvent?.(eventoEditando.id, data);
    } else {
      await onCreateEvent?.(data);
    }
    setModalAberto(false);
    setEventoEditando(null);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        {!filterPersonId && (
          <div className="flex-1 min-w-[160px]">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Pessoa</label>
            <select
              value={filtroPersonId} onChange={(e) => setFiltroPersonId(e.target.value)}
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              <option value="">Todos</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1">De</label>
          <input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)}
            className="px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Até</label>
          <input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)}
            className="px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
        {onCreateEvent && (
          <button
            onClick={() => { setEventoEditando(null); setModalAberto(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar Evento
          </button>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest dark:bg-surface/30 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-container-highest dark:bg-surface/30 rounded w-1/3" />
                <div className="h-3 bg-surface-container-highest dark:bg-surface/30 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && eventosFiltrados.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">event_busy</span>
          <p className="font-title-lg text-title-lg mb-1">Nenhum evento registrado</p>
          <p className="text-body-md">
            {onCreateEvent ? 'Clique em "Adicionar Evento" para registrar o primeiro evento.' : 'Não há eventos para exibir.'}
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && eventosFiltrados.length > 0 && (
        <div className="relative">
          {/* Linha vertical central */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-outline-variant/40 dark:bg-outline-variant/20" />

          <div className="space-y-6">
            {eventosFiltrados.map((evento) => {
              const corClasses = COR_EVENTO[evento.type] ?? COR_EVENTO.other;
              const icone = ICONE_EVENTO[evento.type] ?? 'event';
              const expandido = eventoExpandido === evento.id;
              const pessoa = persons.find((p) => p.id === evento.personId);

              return (
                <div key={evento.id} className="relative flex gap-4">
                  {/* Ícone */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${corClasses}`}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {icone}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 pb-2">
                    <button
                      onClick={() => setEventoExpandido(expandido ? null : evento.id)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                            {ROTULO_TIPO[evento.type] ?? 'Evento'}
                          </span>
                          {pessoa && (
                            <span className="ml-2 text-label-md text-secondary">
                              — {pessoa.firstName} {pessoa.lastName ?? ''}
                            </span>
                          )}
                        </div>
                        {evento.date && (
                          <span className="text-label-md text-on-surface-variant flex-shrink-0">
                            {utils.formatDate(evento.date)}
                          </span>
                        )}
                      </div>

                      {evento.description && (
                        <p className="text-body-md text-on-surface mt-0.5 group-hover:text-secondary transition-colors">
                          {evento.description}
                        </p>
                      )}

                      {evento.place && (
                        <p className="flex items-center gap-1 text-label-md text-on-surface-variant mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {evento.place}
                        </p>
                      )}
                    </button>

                    {/* Ações (expandido) */}
                    {expandido && (
                      <div className="flex gap-2 mt-2">
                        {onUpdateEvent && (
                          <button
                            onClick={() => { setEventoEditando(evento); setModalAberto(true); }}
                            className="flex items-center gap-1 px-3 py-1 text-label-md text-secondary border border-secondary rounded-lg hover:bg-secondary-fixed/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>Editar
                          </button>
                        )}
                        {onDeleteEvent && (
                          <button
                            onClick={() => { if (window.confirm('Excluir este evento?')) onDeleteEvent(evento.id); }}
                            className="flex items-center gap-1 px-3 py-1 text-label-md text-error border border-error rounded-lg hover:bg-error-container/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>Excluir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <AddEventModal
          familyId={familyId}
          persons={persons}
          prePersonId={filterPersonId}
          event={eventoEditando}
          onSave={handleSave}
          onClose={() => { setModalAberto(false); setEventoEditando(null); }}
        />
      )}
    </div>
  );
}

export default EventTimeline;
