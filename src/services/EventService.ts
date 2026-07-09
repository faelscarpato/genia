import type GenealogyDB from './GenealogyDB';
import type { GenealogyEvent } from '../types';
import type { EventInput } from '../utils/validation';
import { utils } from '../utils/utils';

/** Input para criação de evento, inclui familyId obrigatório */
export interface EventCreateInput extends EventInput {
  familyId: string;
  personId?: string;
}

/**
 * Serviço responsável por operações CRUD com eventos genealógicos.
 * Utiliza `GenealogyDB` para persistência offline.
 *
 * Tipos de evento suportados: birth, death, marriage, divorce, adoption, immigration, other
 */
export class EventService {
  constructor(private db: InstanceType<typeof GenealogyDB>) {}

  /**
   * Cria um novo evento.
   * @param data - Dados do evento
   * @returns O evento criado
   */
  async create(data: EventCreateInput): Promise<GenealogyEvent> {
    const now = new Date().toISOString();
    const event: GenealogyEvent = {
      id: utils.generateId(),
      familyId: data.familyId,
      personId: data.personId,
      type: (data.type as GenealogyEvent['type']) ?? 'other',
      date: data.date,
      place: data.place,
      description: data.description,
      sources: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.db.add('events', event);
    return event;
  }

  /**
   * Atualiza um evento existente.
   * @param id - Identificador do evento
   * @param data - Campos a atualizar
   * @returns O evento atualizado
   */
  async update(id: string, data: Partial<EventCreateInput>): Promise<GenealogyEvent> {
    const existing = await this.db.get('events', id) as GenealogyEvent | undefined;
    if (!existing) throw new Error('Evento não encontrado.');

    const updated: GenealogyEvent = {
      ...existing,
      ...data,
      id,
      type: (data.type as GenealogyEvent['type']) ?? existing.type,
      updatedAt: new Date().toISOString(),
    };

    await this.db.put('events', updated);
    return updated;
  }

  /**
   * Remove um evento pelo identificador.
   * @param id - Identificador do evento
   */
  async delete(id: string): Promise<void> {
    await this.db.delete('events', id);
  }

  /**
   * Busca um evento pelo identificador.
   * @param id - Identificador do evento
   */
  async getById(id: string): Promise<GenealogyEvent | null> {
    const event = await this.db.get('events', id) as GenealogyEvent | undefined;
    return event ?? null;
  }

  /**
   * Lista todos os eventos de uma família.
   * @param familyId - Identificador da família
   * @returns Array de eventos ordenados por data (mais recentes primeiro)
   */
  async getAll(familyId: string): Promise<GenealogyEvent[]> {
    const events = await this.db.getByIndex('events', 'familyId', familyId) as GenealogyEvent[];
    return events.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }

  /**
   * Lista todos os eventos de uma pessoa específica.
   * @param personId - Identificador da pessoa
   * @returns Array de eventos ordenados por data
   */
  async getByPerson(personId: string): Promise<GenealogyEvent[]> {
    const events = await this.db.getByIndex('events', 'personId', personId) as GenealogyEvent[];
    return events.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }
}

export default EventService;
