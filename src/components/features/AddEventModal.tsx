import React, { useState } from 'react';
import { validateForm, eventSchema } from '../../utils/validation';
import type { GenealogyEvent, Person } from '../../types';

interface AddEventModalProps {
  familyId: string;
  persons: Person[];
  /** Se fornecido, pré-seleciona a pessoa */
  prePersonId?: string;
  /** Se fornecido, abre em modo de edição */
  event?: GenealogyEvent | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const TIPOS_EVENTO = [
  { value: 'birth',       label: 'Nascimento' },
  { value: 'death',       label: 'Falecimento' },
  { value: 'marriage',    label: 'Casamento' },
  { value: 'divorce',     label: 'Divórcio' },
  { value: 'adoption',    label: 'Adoção' },
  { value: 'immigration', label: 'Migração / Imigração' },
  { value: 'other',       label: 'Outro' },
];

/**
 * Modal para adicionar ou editar um evento genealógico.
 * Valida campos com `eventSchema` Zod e exibe mensagens em pt-BR.
 */
export function AddEventModal({ familyId, persons, prePersonId, event, onSave, onClose }: AddEventModalProps) {
  const editando = Boolean(event);

  const [form, setForm] = useState({
    type:        event?.type        ?? 'other',
    date:        event?.date        ?? '',
    place:       event?.place       ?? '',
    description: event?.description ?? '',
    personId:    event?.personId    ?? prePersonId ?? '',
    familyId,
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) setErros((prev) => { const cp = { ...prev }; delete cp[name]; return cp; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    const resultado = validateForm(eventSchema, form);
    if (!resultado.success) {
      setErros(resultado.errors ?? {});
      return;
    }

    setSalvando(true);
    try {
      await onSave(form);
    } catch (err: any) {
      setErroGeral(err?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true"
    >
      <div className="bg-surface dark:bg-surface-container w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant dark:border-outline-variant/40">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {editando ? 'Editar Evento' : 'Adicionar Evento'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface/30 transition-colors" aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="type">
              Tipo de Evento
            </label>
            <select
              id="type" name="type" value={form.type} onChange={handleChange}
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              {TIPOS_EVENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Pessoa vinculada */}
          {persons.length > 0 && (
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="personId">
                Pessoa Vinculada
              </label>
              <select
                id="personId" name="personId" value={form.personId} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="">— Nenhuma (evento da família) —</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName ?? ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data e local */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="date">Data</label>
              <input
                id="date" name="date" type="date" value={form.date} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="place">Local</label>
              <input
                id="place" name="place" value={form.place} onChange={handleChange}
                placeholder="Cidade, País"
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="description">Descrição</label>
            <textarea
              id="description" name="description" rows={3} value={form.description} onChange={handleChange}
              placeholder="Detalhes do evento..."
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
            <button type="submit" disabled={salvando}
              className="flex items-center gap-2 px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 disabled:opacity-50 transition-all">
              {salvando && <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />}
              {editando ? 'Salvar Alterações' : 'Adicionar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEventModal;
