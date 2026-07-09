/**
 * @module dataExport
 * @description Utilitários para exportar e importar um snapshot JSON completo
 * de todos os dados do IndexedDB da aplicação Genealogia IA.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenealogyDB = any;

/** Estrutura do snapshot exportado */
export interface GenealogySnapshot {
  /** Versão do formato de exportação */
  version: '1.0';
  /** Data/hora da exportação em ISO 8601 */
  exportedAt: string;
  /** Nome da aplicação */
  app: 'genealogia-ia';
  /** Dados exportados por store */
  data: {
    persons: any[];
    families: any[];
    events: any[];
    documents: any[];
    notifications: any[];
    users: any[];
  };
}

/**
 * Exporta todos os dados do IndexedDB como um snapshot JSON e dispara o download.
 *
 * @param db - Instância do GenealogyDB
 * @param nomeArquivo - Nome do arquivo baixado (sem extensão)
 */
export async function exportarSnapshot(
  db: GenealogyDB,
  nomeArquivo = 'genealogia-ia-backup'
): Promise<void> {
  const [persons, families, events, documents, notifications, users] = await Promise.all([
    db.getAll('persons').catch(() => []),
    db.getAll('families').catch(() => []),
    db.getAll('events').catch(() => []),
    db.getAll('documents').catch(() => []),
    db.getAll('notifications').catch(() => []),
    db.getAll('users').catch(() => []),
  ]);

  const snapshot: GenealogySnapshot = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    app: 'genealogia-ia',
    data: { persons, families, events, documents, notifications, users },
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importa um snapshot JSON previamente exportado, sobrescrevendo os dados locais.
 * Realiza validação básica antes de importar.
 *
 * @param db - Instância do GenealogyDB
 * @param arquivo - Arquivo JSON selecionado pelo usuário
 * @returns Estatísticas dos registros importados
 */
export async function importarSnapshot(
  db: GenealogyDB,
  arquivo: File
): Promise<{ importados: number; erros: string[] }> {
  const texto = await arquivo.text();
  let snapshot: GenealogySnapshot;

  try {
    snapshot = JSON.parse(texto);
  } catch {
    throw new Error('Arquivo JSON inválido ou corrompido.');
  }

  if (snapshot.app !== 'genealogia-ia' || snapshot.version !== '1.0') {
    throw new Error('Este arquivo não é um backup válido do Genealogia IA.');
  }

  const { data } = snapshot;
  const erros: string[] = [];
  let importados = 0;

  const stores: (keyof typeof data)[] = [
    'persons', 'families', 'events', 'documents', 'notifications', 'users',
  ];

  for (const store of stores) {
    const registros: any[] = data[store] ?? [];
    for (const registro of registros) {
      try {
        await db.put(store, registro);
        importados++;
      } catch (e) {
        erros.push(`Erro ao importar ${store}/${registro?.id}: ${(e as Error).message}`);
      }
    }
  }

  return { importados, erros };
}

/**
 * Lê um arquivo JSON e retorna o snapshot sem importar.
 * Útil para pré-visualização antes da importação.
 *
 * @param arquivo - Arquivo JSON selecionado pelo usuário
 */
export async function lerSnapshot(arquivo: File): Promise<GenealogySnapshot> {
  const texto = await arquivo.text();
  const snapshot = JSON.parse(texto) as GenealogySnapshot;

  if (snapshot.app !== 'genealogia-ia') {
    throw new Error('Arquivo não reconhecido como backup do Genealogia IA.');
  }

  return snapshot;
}
