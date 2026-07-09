import type GenealogyDB from './GenealogyDB';
import type { GenealogyDocument } from '../types';
import type { DocumentInput } from '../utils/validation';
import { utils } from '../utils/utils';

/** Tamanho máximo de arquivo em bytes (padrão: 10 MB) */
const TAMANHO_MAXIMO_PADRAO = 10 * 1024 * 1024;

/** Input para criação de documento, inclui familyId e dados do arquivo */
export interface DocumentCreateInput extends DocumentInput {
  familyId: string;
  personId?: string;
  /** Conteúdo do arquivo em base64 */
  fileData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

/**
 * Serviço responsável por operações CRUD com documentos genealógicos.
 * Armazena os arquivos como base64 no IndexedDB.
 *
 * ATENÇÃO: O IndexedDB tem limite de espaço (aproximadamente 50% do disco
 * disponível por origem). Arquivos grandes podem causar falhas de armazenamento.
 */
export class DocumentService {
  constructor(
    private db: InstanceType<typeof GenealogyDB>,
    private tamanhoMaximo = TAMANHO_MAXIMO_PADRAO
  ) {}

  /**
   * Cria um novo documento.
   * @param data - Dados do documento incluindo arquivo em base64
   * @returns O documento criado
   * @throws Error se o arquivo exceder o tamanho máximo
   */
  async create(data: DocumentCreateInput): Promise<GenealogyDocument> {
    if (data.fileSize && data.fileSize > this.tamanhoMaximo) {
      const limiteMB = (this.tamanhoMaximo / (1024 * 1024)).toFixed(0);
      throw new Error(`O arquivo excede o tamanho máximo permitido de ${limiteMB} MB.`);
    }

    const now = new Date().toISOString();
    const document: GenealogyDocument = {
      id: utils.generateId(),
      familyId: data.familyId,
      personId: data.personId,
      type: (data.type as GenealogyDocument['type']) ?? 'other',
      title: data.title,
      description: data.description,
      fileData: data.fileData,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.add('documents', document);
    return document;
  }

  /**
   * Atualiza os metadados de um documento.
   * @param id - Identificador do documento
   * @param data - Campos a atualizar (não substitui o arquivo)
   * @returns O documento atualizado
   */
  async update(id: string, data: Partial<GenealogyDocument>): Promise<GenealogyDocument> {
    const existing = await this.db.get('documents', id) as GenealogyDocument | undefined;
    if (!existing) throw new Error('Documento não encontrado.');

    const updated: GenealogyDocument = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    await this.db.put('documents', updated);
    return updated;
  }

  /**
   * Remove um documento e seus anexos.
   * @param id - Identificador do documento
   */
  async delete(id: string): Promise<void> {
    await this.db.delete('documents', id);
    // Remove anexos associados
    const attachments = await this.db.getByIndex('attachments', 'documentId', id) as any[];
    for (const att of attachments) {
      await this.db.delete('attachments', att.id);
    }
  }

  /**
   * Busca um documento pelo identificador.
   * @param id - Identificador do documento
   */
  async getById(id: string): Promise<GenealogyDocument | null> {
    const doc = await this.db.get('documents', id) as GenealogyDocument | undefined;
    return doc ?? null;
  }

  /**
   * Lista todos os documentos de uma família.
   * @param familyId - Identificador da família
   */
  async getAll(familyId: string): Promise<GenealogyDocument[]> {
    const docs = await this.db.getByIndex('documents', 'familyId', familyId) as GenealogyDocument[];
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Lista todos os documentos vinculados a uma pessoa.
   * @param personId - Identificador da pessoa
   */
  async getByPerson(personId: string): Promise<GenealogyDocument[]> {
    const docs = await this.db.getByIndex('documents', 'personId', personId) as GenealogyDocument[];
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export default DocumentService;
