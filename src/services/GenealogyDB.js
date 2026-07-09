/**
 * GenealogyDB — Wrapper sobre IndexedDB para persistência offline.
 * Expõe CRUD genérico (add, put, get, getAll, getByIndex, delete, count)
 * e busca global cross-store.
 */
class GenealogyDB {
  constructor() {
    this.dbName = 'genealogia_ia_db';
    /** Incrementar quando houver mudanças no schema */
    this.dbVersion = 3;
    this.db = null;
  }

  /**
   * Inicializa o banco IndexedDB criando/atualizando os object stores.
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const requiredStores = [
        { name: 'users',         keyPath: 'id', indexes: [['email', 'email', { unique: true }]] },
        { name: 'families',      keyPath: 'id', indexes: [['ownerId', 'ownerId', {}], ['name', 'name', {}]] },
        { name: 'persons',       keyPath: 'id', indexes: [['familyId', 'familyId', {}]] },
        { name: 'relationships', keyPath: 'id', indexes: [['familyId', 'familyId', {}], ['fromPersonId', 'fromPersonId', {}], ['toPersonId', 'toPersonId', {}]] },
        { name: 'events',        keyPath: 'id', indexes: [['personId', 'personId', {}], ['familyId', 'familyId', {}]] },
        { name: 'documents',     keyPath: 'id', indexes: [['familyId', 'familyId', {}], ['personId', 'personId', {}], ['type', 'type', {}]] },
        { name: 'sources',       keyPath: 'id', indexes: [['familyId', 'familyId', {}], ['personId', 'personId', {}]] },
        { name: 'attachments',   keyPath: 'id', indexes: [['documentId', 'documentId', {}]] },
        { name: 'auditLogs',     keyPath: 'id', indexes: [['familyId', 'familyId', {}], ['userId', 'userId', {}], ['timestamp', 'timestamp', {}]] },
        { name: 'privacySettings', keyPath: 'id', indexes: [['userId', 'userId', { unique: true }]] },
        { name: 'searchQueries', keyPath: 'id', indexes: [['userId', 'userId', {}]] },
        {
          name: 'notifications',
          keyPath: 'id',
          indexes: [
            ['userId',    'userId',    {}],
            ['lida',      'lida',      {}],
            ['criadaEm',  'criadaEm',  {}],
          ],
        },
      ];

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onblocked = () => {
        console.warn('GenealogyDB bloqueado — feche outras abas e recarregue.');
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const existingStores = Array.from(db.objectStoreNames);

        requiredStores.forEach((storeDef) => {
          if (!existingStores.includes(storeDef.name)) {
            // Cria o object store
            const store = db.createObjectStore(storeDef.name, { keyPath: storeDef.keyPath });
            storeDef.indexes.forEach(([idxName, field, opts]) => {
              try { store.createIndex(idxName, field, opts); }
              catch (e) { console.warn(`Falha ao criar índice ${idxName}:`, e); }
            });
          } else {
            // Verifica se os índices necessários já existem
            const store = event.target.transaction.objectStore(storeDef.name);
            storeDef.indexes.forEach(([idxName, field, opts]) => {
              try {
                store.index(idxName);
              } catch {
                try { store.createIndex(idxName, field, opts); }
                catch (e) { console.warn(`Falha ao criar índice ${idxName}:`, e); }
              }
            });
          }
        });
      };
    });
  }

  // ─── Operações Básicas ────────────────────────────────────────────────

  /**
   * Adiciona um novo registro ao store.
   * @param {string} storeName
   * @param {object} data
   */
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.add(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Atualiza (upsert) um registro existente.
   * @param {string} storeName
   * @param {object} data
   */
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Obtém um registro pelo seu keyPath.
   * @param {string} storeName
   * @param {string} id
   * @returns {Promise<object|undefined>}
   */
  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Retorna todos os registros de um store.
   * @param {string} storeName
   * @returns {Promise<object[]>}
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Retorna todos os registros que possuem determinado valor num índice.
   * @param {string} storeName
   * @param {string} indexName
   * @param {*} value
   * @returns {Promise<object[]>}
   */
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Retorna o primeiro registro que corresponde ao valor do índice.
   * @param {string} storeName
   * @param {string} indexName
   * @param {*} value
   * @returns {Promise<object|undefined>}
   */
  async getOneByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.get(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Remove um registro pelo id.
   * @param {string} storeName
   * @param {string} id
   */
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror  = () => reject(req.error);
    });
  }

  /**
   * Conta o total de registros num store.
   * @param {string} storeName
   * @returns {Promise<number>}
   */
  async count(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  // ─── Busca Global ────────────────────────────────────────────────────

  /**
   * Executa busca por substring case-insensitive em múltiplos stores.
   *
   * Campos pesquisados:
   * - persons:   firstName, lastName, notes, occupation, birthPlace
   * - events:    description, place
   * - documents: title, description, fileName
   * - sources:   title, author, citation
   *
   * @param {string} query - Texto a buscar
   * @param {number} [limit=5] - Máximo de resultados por categoria
   * @returns {Promise<{persons, events, documents, sources, total}>}
   */
  async search(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return { persons: [], events: [], documents: [], sources: [], total: 0 };
    }

    const q = query.trim().toLowerCase();

    /**
     * Filtra array de objetos verificando se algum dos campos
     * contém a string de busca.
     */
    const filterByFields = (items, fields) =>
      items
        .filter((item) =>
          fields.some((field) => {
            const val = item[field];
            return val && String(val).toLowerCase().includes(q);
          })
        )
        .slice(0, limit);

    try {
      const [allPersons, allEvents, allDocuments, allSources] = await Promise.all([
        this.getAll('persons').catch(() => []),
        this.getAll('events').catch(() => []),
        this.getAll('documents').catch(() => []),
        this.getAll('sources').catch(() => []),
      ]);

      const persons   = filterByFields(allPersons,   ['firstName', 'lastName', 'notes', 'occupation', 'birthPlace']);
      const events    = filterByFields(allEvents,     ['description', 'place']);
      const documents = filterByFields(allDocuments,  ['title', 'description', 'fileName']);
      const sources   = filterByFields(allSources,    ['title', 'author', 'citation']);

      return {
        persons,
        events,
        documents,
        sources,
        total: persons.length + events.length + documents.length + sources.length,
      };
    } catch (err) {
      console.error('Erro na busca global:', err);
      return { persons: [], events: [], documents: [], sources: [], total: 0 };
    }
  }
}

export default GenealogyDB;
