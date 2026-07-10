import { openDB, IDBPDatabase, DBSchema } from 'idb';

// ============================================================
// SCHEMA DO BANCO
// ============================================================

interface GeniaSchema extends DBSchema {
  users: {
    key: string;
    value: any;
    indexes: { 'by-email': string };
  };
  families: {
    key: string;
    value: any;
    indexes: { 'by-owner': string };
  };
  persons: {
    key: string;
    value: any;
    indexes: { 'by-family': string; 'by-name': string };
  };
  events: {
    key: string;
    value: any;
    indexes: { 'by-family': string; 'by-person': string };
  };
  documents: {
    key: string;
    value: any;
    indexes: { 'by-family': string; 'by-person': string };
  };
  sources: {
    key: string;
    value: any;
    indexes: { 'by-family': string; 'by-person': string };
  };
  relationships: {
    key: string;
    value: any;
    indexes: { 'by-family': string; 'by-from': string; 'by-to': string };
  };
  notifications: {
    key: string;
    value: any;
    indexes: { 'by-user': string; 'by-read': string };
  };
}

const DB_NAME = 'genealogia-ia';
const DB_VERSION = 3;

export type StoreNames = keyof GeniaSchema;

// ============================================================
// GENEALOGY DB
// ============================================================

export class GenealogyDB {
  private _db: IDBPDatabase<GeniaSchema> | null = null;

  async init(): Promise<void> {
    this._db = await openDB<GeniaSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // --- users ---
        if (!db.objectStoreNames.contains('users')) {
          const us = db.createObjectStore('users', { keyPath: 'id' });
          us.createIndex('by-email', 'email', { unique: true });
        }

        // --- families ---
        if (!db.objectStoreNames.contains('families')) {
          const fs = db.createObjectStore('families', { keyPath: 'id' });
          fs.createIndex('by-owner', 'ownerId');
        }

        // --- persons ---
        if (!db.objectStoreNames.contains('persons')) {
          const ps = db.createObjectStore('persons', { keyPath: 'id' });
          ps.createIndex('by-family', 'familyId');
          ps.createIndex('by-name', 'firstName');
        }

        // --- events ---
        if (!db.objectStoreNames.contains('events')) {
          const ev = db.createObjectStore('events', { keyPath: 'id' });
          ev.createIndex('by-family', 'familyId');
          ev.createIndex('by-person', 'personId');
        }

        // --- documents ---
        if (!db.objectStoreNames.contains('documents')) {
          const dc = db.createObjectStore('documents', { keyPath: 'id' });
          dc.createIndex('by-family', 'familyId');
          dc.createIndex('by-person', 'personId');
        }

        // --- sources ---
        if (!db.objectStoreNames.contains('sources')) {
          const sr = db.createObjectStore('sources', { keyPath: 'id' });
          sr.createIndex('by-family', 'familyId');
          sr.createIndex('by-person', 'personId');
        }

        // --- relationships ---
        if (!db.objectStoreNames.contains('relationships')) {
          const rl = db.createObjectStore('relationships', { keyPath: 'id' });
          rl.createIndex('by-family', 'familyId');
          rl.createIndex('by-from', 'fromPersonId');
          rl.createIndex('by-to', 'toPersonId');
        }

        // --- notifications (v3) ---
        if (oldVersion < 3 && !db.objectStoreNames.contains('notifications')) {
          const nt = db.createObjectStore('notifications', { keyPath: 'id' });
          nt.createIndex('by-user', 'userId');
          nt.createIndex('by-read', 'lida');
        }
      },
    });
  }

  private get db(): IDBPDatabase<GeniaSchema> {
    if (!this._db) throw new Error('GenealogyDB nao inicializado. Chame init() primeiro.');
    return this._db;
  }

  // --------------------------------------------------------
  // CRUD GENERICO
  // --------------------------------------------------------

  async add<S extends StoreNames>(store: S, value: any): Promise<any> {
    return this.db.add(store, value);
  }

  async get<S extends StoreNames>(store: S, key: string): Promise<any> {
    return this.db.get(store, key);
  }

  async put<S extends StoreNames>(store: S, value: any): Promise<any> {
    return this.db.put(store, value);
  }

  async delete<S extends StoreNames>(store: S, key: string): Promise<void> {
    return this.db.delete(store, key);
  }

  async getAll<S extends StoreNames>(store: S): Promise<any[]> {
    return this.db.getAll(store);
  }

  // --------------------------------------------------------
  // BUSCA POR INDICE
  // --------------------------------------------------------

  async getByIndex<S extends StoreNames>(
    store: S,
    indexName: string,
    value: any
  ): Promise<any[]> {
    const tx = this.db.transaction(store, 'readonly');
    const idx = tx.store.index(indexName as any);
    return idx.getAll(value);
  }

  async getOneByIndex<S extends StoreNames>(
    store: S,
    indexName: string,
    value: any
  ): Promise<any | undefined> {
    const tx = this.db.transaction(store, 'readonly');
    const idx = tx.store.index(indexName as any);
    return idx.get(value);
  }

  // --------------------------------------------------------
  // BUSCA FULL-TEXT (substring, case-insensitive)
  // --------------------------------------------------------

  async search(familyId: string, query: string): Promise<{
    persons: any[];
    events: any[];
    documents: any[];
    sources: any[];
  }> {
    const q = query.toLowerCase();

    const [persons, events, documents, sources] = await Promise.all([
      this.getByIndex('persons', 'by-family', familyId),
      this.getByIndex('events', 'by-family', familyId),
      this.getByIndex('documents', 'by-family', familyId),
      this.getByIndex('sources', 'by-family', familyId),
    ]);

    return {
      persons: persons.filter((p: any) =>
        [p.firstName, p.lastName, p.birthPlace, p.occupation, p.notes]
          .filter(Boolean)
          .some((f: string) => f.toLowerCase().includes(q))
      ),
      events: events.filter((e: any) =>
        [e.type, e.place, e.description]
          .filter(Boolean)
          .some((f: string) => f.toLowerCase().includes(q))
      ),
      documents: documents.filter((d: any) =>
        [d.title, d.description]
          .filter(Boolean)
          .some((f: string) => f.toLowerCase().includes(q))
      ),
      sources: sources.filter((s: any) =>
        [s.title, s.author, s.citation]
          .filter(Boolean)
          .some((f: string) => f.toLowerCase().includes(q))
      ),
    };
  }

  // --------------------------------------------------------
  // ESTATISTICAS DA FAMILIA
  // --------------------------------------------------------

  async getFamilyStats(familyId: string): Promise<{
    totalPersons: number;
    totalEvents: number;
    totalDocuments: number;
    totalSources: number;
    totalRelationships: number;
    personsWithPhoto: number;
    personsWithBirthDate: number;
    personsWithDeathDate: number;
    oldestBirth: string | null;
    newestBirth: string | null;
  }> {
    const [persons, events, documents, sources, relationships] = await Promise.all([
      this.getByIndex('persons', 'by-family', familyId),
      this.getByIndex('events', 'by-family', familyId),
      this.getByIndex('documents', 'by-family', familyId),
      this.getByIndex('sources', 'by-family', familyId),
      this.getByIndex('relationships', 'by-family', familyId),
    ]);

    const birthDates = persons
      .filter((p: any) => p.birthDate)
      .map((p: any) => p.birthDate)
      .sort();

    return {
      totalPersons: persons.length,
      totalEvents: events.length,
      totalDocuments: documents.length,
      totalSources: sources.length,
      totalRelationships: relationships.length,
      personsWithPhoto: persons.filter((p: any) => p.photoUrl).length,
      personsWithBirthDate: persons.filter((p: any) => p.birthDate).length,
      personsWithDeathDate: persons.filter((p: any) => p.deathDate).length,
      oldestBirth: birthDates[0] ?? null,
      newestBirth: birthDates[birthDates.length - 1] ?? null,
    };
  }

  // --------------------------------------------------------
  // HELPERS DE FAMILIA
  // --------------------------------------------------------

  async getFamiliesForUser(userId: string): Promise<any[]> {
    return this.getByIndex('families', 'by-owner', userId);
  }

  async getPersonsForFamily(familyId: string): Promise<any[]> {
    return this.getByIndex('persons', 'by-family', familyId);
  }

  async getRelationshipsForFamily(familyId: string): Promise<any[]> {
    return this.getByIndex('relationships', 'by-family', familyId);
  }

  async getRelationshipsForPerson(personId: string): Promise<any[]> {
    const [from, to] = await Promise.all([
      this.getByIndex('relationships', 'by-from', personId),
      this.getByIndex('relationships', 'by-to', personId),
    ]);
    const seen = new Set<string>();
    return [...from, ...to].filter((r: any) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  // --------------------------------------------------------
  // NOTIFICACOES
  // --------------------------------------------------------

  async getUnreadNotifications(userId: string): Promise<any[]> {
    const all = await this.getByIndex('notifications', 'by-user', userId);
    return all.filter((n: any) => !n.lida);
  }

  async markNotificationRead(id: string): Promise<void> {
    const n = await this.get('notifications', id);
    if (n) await this.put('notifications', { ...n, lida: true });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const unread = await this.getUnreadNotifications(userId);
    const tx = this.db.transaction('notifications', 'readwrite');
    await Promise.all(unread.map((n: any) =>
      tx.store.put({ ...n, lida: true })
    ));
    await tx.done;
  }
}

export default GenealogyDB;
