import type GenealogyDB from './GenealogyDB';
import type { Person } from '../types';
import type { PersonCreateInput, PersonInput } from '../utils/validation';
import { utils } from '../utils/utils';

/**
 * Serviço responsável por operações CRUD com pessoas na árvore genealógica.
 * Utiliza a camada `GenealogyDB` para persistência offline no IndexedDB.
 */
export class PersonService {
  constructor(private db: InstanceType<typeof GenealogyDB>) {}

  /**
   * Cria uma nova pessoa na família.
   * @param data - Dados validados da pessoa
   * @param familyId - Identificador da família
   * @returns A pessoa recém-criada
   */
  async create(data: PersonCreateInput): Promise<Person> {
    const now = new Date().toISOString();
    const person: Person = {
      id: utils.generateId(),
      familyId: data.familyId,
      firstName: data.firstName,
      lastName: data.lastName ?? '',
      gender: (data.gender as Person['gender']) ?? 'unknown',
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      deathDate: data.deathDate,
      deathPlace: data.deathPlace,
      occupation: data.occupation,
      notes: data.notes,
      photoUrl: (data as any).photoUrl,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.add('persons', person);
    return person;
  }

  /**
   * Atualiza os dados de uma pessoa existente.
   * @param id - Identificador da pessoa
   * @param data - Campos a atualizar
   * @returns A pessoa atualizada
   * @throws Error se a pessoa não for encontrada
   */
  async update(id: string, data: Partial<PersonInput & { photoUrl?: string }>): Promise<Person> {
    const existing = await this.db.get('persons', id) as Person | undefined;
    if (!existing) throw new Error('Pessoa não encontrada.');

    const updated: Person = {
      ...existing,
      ...data,
      id,
      gender: (data.gender as Person['gender']) ?? existing.gender,
      updatedAt: new Date().toISOString(),
    };

    await this.db.put('persons', updated);
    return updated;
  }

  /**
   * Remove uma pessoa e seus relacionamentos associados.
   * @param id - Identificador da pessoa
   */
  async delete(id: string): Promise<void> {
    await this.db.delete('persons', id);

    // Remove relacionamentos onde a pessoa está envolvida
    const fromRels = await this.db.getByIndex('relationships', 'fromPersonId', id) as any[];
    const toRels   = await this.db.getByIndex('relationships', 'toPersonId',   id) as any[];
    const allRels  = [...fromRels, ...toRels];

    for (const rel of allRels) {
      await this.db.delete('relationships', rel.id);
    }
  }

  /**
   * Busca uma pessoa pelo seu identificador.
   * @param id - Identificador da pessoa
   * @returns A pessoa ou null se não encontrada
   */
  async getById(id: string): Promise<Person | null> {
    const person = await this.db.get('persons', id) as Person | undefined;
    return person ?? null;
  }

  /**
   * Lista todas as pessoas de uma família.
   * @param familyId - Identificador da família
   * @returns Array de pessoas ordenadas por nome
   */
  async getAll(familyId: string): Promise<Person[]> {
    const persons = await this.db.getByIndex('persons', 'familyId', familyId) as Person[];
    return persons.sort((a, b) => a.firstName.localeCompare(b.firstName, 'pt-BR'));
  }

  /**
   * Busca uma pessoa junto com todos os seus relacionamentos.
   * @param personId - Identificador da pessoa
   */
  async getWithRelationships(personId: string): Promise<{
    person: Person;
    relationships: any[];
  }> {
    const person = await this.getById(personId);
    if (!person) throw new Error('Pessoa não encontrada.');

    const fromRels = await this.db.getByIndex('relationships', 'fromPersonId', personId) as any[];
    const toRels   = await this.db.getByIndex('relationships', 'toPersonId',   personId) as any[];

    return { person, relationships: [...fromRels, ...toRels] };
  }
}

export default PersonService;
