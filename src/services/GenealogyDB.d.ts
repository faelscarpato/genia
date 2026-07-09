/**
 * Declaração de tipos para GenealogyDB.js
 * Expõe a interface pública do wrapper IndexedDB.
 */
import type { SearchResults } from '../types';

declare class GenealogyDB {
  dbName: string;
  dbVersion: number;
  db: IDBDatabase | null;

  init(): Promise<void>;

  add(storeName: string, item: any): Promise<string>;
  put(storeName: string, item: any): Promise<string>;
  get(storeName: string, id: string): Promise<any | undefined>;
  getAll(storeName: string): Promise<any[]>;
  getByIndex(storeName: string, indexName: string, value: any): Promise<any[]>;
  getOneByIndex(storeName: string, indexName: string, value: any): Promise<any | undefined>;
  delete(storeName: string, id: string): Promise<void>;
  count(storeName: string): Promise<number>;
  clear(storeName: string): Promise<void>;
  search(query: string, limit?: number): Promise<SearchResults>;
}

export default GenealogyDB;
