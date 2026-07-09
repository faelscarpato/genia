import React, { useState, useRef } from 'react';
import { validateForm } from '../../utils/validation';
import { personCreateSchema } from '../../utils/validation';
import type { Person } from '../../types';

interface PersonModalProps {
  /** Se fornecido, abre em modo de edição */
  person?: Person | null;
  /** familyId obrigatório para criação */
  familyId: string;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const ROTULO_GENERO: Record<string, string> = {
  male:    'Masculino',
  female:  'Feminino',
  other:   'Outro',
  unknown: 'Não informado',
};

/**
 * Modal para adicionar ou editar uma pessoa na árvore genealógica.
 *
 * Valida todos os campos com o `personCreateSchema` Zod existente.
 * Suporta upload de foto via File API (preview em base64).
 * Dark mode completo.
 *
 * @example
 * <PersonModal familyId={family.id} onSave={handleSave} onClose={() => setOpen(false)} />
 */
export function PersonModal({ person, familyId, onSave, onClose }: PersonModalProps) {
  const editando = Boolean(person);

  const [form, setForm] = useState({
    firstName: person?.firstName ?? '',
    lastName:  person?.lastName  ?? '',
    gender:    person?.gender    ?? 'unknown',
    birthDate: person?.birthDate ?? '',
    birthPlace:person?.birthPlace ?? '',
    deathDate: person?.deathDate ?? '',
    deathPlace:person?.deathPlace ?? '',
    occupation:person?.occupation ?? '',
    notes:     person?.notes     ?? '',
    familyId,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(person?.photoUrl ?? null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpa erro do campo ao editar
    if (erros[name]) {
      setErros((prev) => { const cp = { ...prev }; delete cp[name]; return cp; });
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(arquivo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    // Valida com Zod
    const resultado = validateForm(personCreateSchema, form);
    if (!resultado.success) {
      setErros(resultado.errors ?? {});
      return;
    }

    setSalvando(true);
    try {
      await onSave({ ...form, photoUrl: photoPreview ?? person?.photoUrl });
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
      role="dialog"
      aria-modal="true"
      aria-label={editando ? 'Editar pessoa' : 'Adicionar pessoa'}
    >
      <div className="bg-surface dark:bg-surface-container w-full max-w-xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant dark:border-outline-variant/40">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {editando ? 'Editar Pessoa' : 'Adicionar Pessoa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface/30 transition-colors"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full border-2 border-outline-variant bg-surface-container-low flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Prévia" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-secondary transition-colors">
                  add_a_photo
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-label-md text-secondary hover:underline"
            >
              {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
            </button>
          </div>

          {/* Nome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="firstName">
                Nome <span className="text-error">*</span>
              </label>
              <input
                id="firstName" name="firstName"
                value={form.firstName} onChange={handleChange}
                placeholder="Nome"
                className={`w-full px-3 py-2 bg-surface dark:bg-surface-container border rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all ${
                  erros.firstName ? 'border-error' : 'border-outline-variant dark:border-outline-variant/40'
                }`}
              />
              {erros.firstName && <p className="mt-1 text-label-md text-error">{erros.firstName}</p>}
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="lastName">
                Sobrenome
              </label>
              <input
                id="lastName" name="lastName"
                value={form.lastName} onChange={handleChange}
                placeholder="Sobrenome"
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
          </div>

          {/* Sexo */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="gender">
              Sexo
            </label>
            <select
              id="gender" name="gender"
              value={form.gender} onChange={handleChange}
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
            >
              {Object.entries(ROTULO_GENERO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
          </div>

          {/* Nascimento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="birthDate">
                Data de Nascimento
              </label>
              <input
                id="birthDate" name="birthDate" type="date"
                value={form.birthDate} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="birthPlace">
                Local de Nascimento
              </label>
              <input
                id="birthPlace" name="birthPlace"
                value={form.birthPlace} onChange={handleChange}
                placeholder="Cidade, País"
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
          </div>

          {/* Falecimento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="deathDate">
                Data de Falecimento
              </label>
              <input
                id="deathDate" name="deathDate" type="date"
                value={form.deathDate} onChange={handleChange}
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="deathPlace">
                Local de Falecimento
              </label>
              <input
                id="deathPlace" name="deathPlace"
                value={form.deathPlace} onChange={handleChange}
                placeholder="Cidade, País"
                className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
              />
            </div>
          </div>

          {/* Profissão */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="occupation">
              Profissão
            </label>
            <input
              id="occupation" name="occupation"
              value={form.occupation} onChange={handleChange}
              placeholder="Ex: Agricultor, Comerciante..."
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="notes">
              Notas
            </label>
            <textarea
              id="notes" name="notes"
              value={form.notes} onChange={handleChange}
              rows={3}
              placeholder="Informações adicionais sobre esta pessoa..."
              className="w-full px-3 py-2 bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all resize-none"
            />
          </div>

          {/* Erro geral */}
          {erroGeral && (
            <div className="px-4 py-3 bg-error-container rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
              <p className="text-body-md text-error">{erroGeral}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-5 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-low dark:hover:bg-surface/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {salvando && <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />}
              {editando ? 'Salvar Alterações' : 'Adicionar Pessoa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PersonModal;
