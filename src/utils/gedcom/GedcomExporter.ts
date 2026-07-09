import type GenealogyDB from '../../services/GenealogyDB';
import type { Person, GenealogyEvent, Source, Relationship, Family } from '../../types';
import { utils } from '../utils';

/**
 * Exporta a árvore genealógica no formato GEDCOM 5.5.1.
 *
 * Gera registros INDI (indivíduo), FAM (família), SOUR (fonte) e
 * inicia o download automático do arquivo .ged.
 */
export class GedcomExporter {
  constructor(private db: InstanceType<typeof GenealogyDB>) {}

  /**
   * Gera a string GEDCOM completa para uma família.
   * @param familyId - Identificador da família a exportar
   */
  async generate(familyId: string): Promise<string> {
    const [persons, events, sources, relationships] = await Promise.all([
      this.db.getByIndex('persons', 'familyId', familyId) as Promise<Person[]>,
      this.db.getByIndex('events',  'familyId', familyId) as Promise<GenealogyEvent[]>,
      this.db.getByIndex('sources', 'familyId', familyId) as Promise<Source[]>,
      this.db.getByIndex('relationships', 'familyId', familyId) as Promise<Relationship[]>,
    ]);

    const linhas: string[] = [];
    const hoje = new Date();
    const dataGed = `${hoje.getDate().toString().padStart(2,'0')} ${
      ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][hoje.getMonth()]
    } ${hoje.getFullYear()}`;

    // ─── HEAD ─────────────────────────────────────────────────────────
    linhas.push('0 HEAD');
    linhas.push('1 SOUR GenealogiAI');
    linhas.push('2 VERS 1.0');
    linhas.push('2 NAME Genealogia IA');
    linhas.push('1 DEST ANSTFILE');
    linhas.push(`1 DATE ${dataGed}`);
    linhas.push('1 GEDC');
    linhas.push('2 VERS 5.5.1');
    linhas.push('2 FORM LINEAGE-LINKED');
    linhas.push('1 CHAR UTF-8');
    linhas.push('1 LANG Portuguese');

    // ─── INDI (indivíduos) ────────────────────────────────────────────
    for (const p of persons) {
      linhas.push(`0 @I${p.id.substring(0,8)}@ INDI`);
      linhas.push(`1 NAME ${p.firstName ?? ''} /${p.lastName ?? ''}/`);
      if (p.firstName) linhas.push(`2 GIVN ${p.firstName}`);
      if (p.lastName)  linhas.push(`2 SURN ${p.lastName}`);

      // Sexo
      const sexoMap: Record<string, string> = { male: 'M', female: 'F', other: 'U', unknown: 'U' };
      linhas.push(`1 SEX ${sexoMap[p.gender ?? 'unknown'] ?? 'U'}`);

      // Nascimento
      const nascimento = events.find((e) => e.personId === p.id && e.type === 'birth');
      if (p.birthDate || p.birthPlace || nascimento) {
        linhas.push('1 BIRT');
        const data = nascimento?.date ?? p.birthDate;
        if (data) linhas.push(`2 DATE ${this.formatarDataGedcom(data)}`);
        const local = nascimento?.place ?? p.birthPlace;
        if (local) linhas.push(`2 PLAC ${local}`);
      }

      // Óbito
      const obito = events.find((e) => e.personId === p.id && e.type === 'death');
      if (p.deathDate || p.deathPlace || obito) {
        linhas.push('1 DEAT');
        const data = obito?.date ?? p.deathDate;
        if (data) linhas.push(`2 DATE ${this.formatarDataGedcom(data)}`);
        const local = obito?.place ?? p.deathPlace;
        if (local) linhas.push(`2 PLAC ${local}`);
      }

      if (p.occupation) linhas.push(`1 OCCU ${p.occupation}`);
      if (p.notes)      linhas.push(`1 NOTE ${p.notes.replace(/\n/g, '\n2 CONT ')}`);
    }

    // ─── FAM (famílias — pares cônjuges) ────────────────────────────
    const casamentos = relationships.filter((r) => r.type === 'spouse');
    const paresFAM = new Set<string>();

    for (const rel of casamentos) {
      const chave = [rel.fromPersonId, rel.toPersonId].sort().join('|');
      if (paresFAM.has(chave)) continue;
      paresFAM.add(chave);

      const idFAM = `F${chave.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`;
      linhas.push(`0 @${idFAM}@ FAM`);
      linhas.push(`1 HUSB @I${rel.fromPersonId.substring(0,8)}@`);
      linhas.push(`1 WIFE @I${rel.toPersonId.substring(0,8)}@`);

      // Filhos (de qualquer dos dois)
      const filhosFrom = relationships
        .filter((r) => (r.fromPersonId === rel.fromPersonId || r.fromPersonId === rel.toPersonId) && r.type === 'son' || r.type === 'daughter');
      for (const f of filhosFrom) {
        linhas.push(`1 CHIL @I${f.toPersonId.substring(0,8)}@`);
      }
    }

    // ─── SOUR (fontes) ───────────────────────────────────────────────
    for (const s of sources) {
      linhas.push(`0 @S${s.id.substring(0,8)}@ SOUR`);
      linhas.push(`1 TITL ${s.title}`);
      if (s.author)      linhas.push(`1 AUTH ${s.author}`);
      if (s.publication) linhas.push(`1 PUBL ${s.publication}`);
      if (s.citation)    linhas.push(`1 NOTE ${s.citation}`);
    }

    linhas.push('0 TRLR');

    return linhas.join('\n');
  }

  /**
   * Gera o arquivo GEDCOM e inicia o download automático.
   * @param familyId - Identificador da família a exportar
   */
  async export(familyId: string): Promise<void> {
    const conteudo = await this.generate(familyId);
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arvore-genealogica-${familyId.substring(0, 8)}.ged`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Converte data ISO para formato GEDCOM (DD MON YYYY) */
  private formatarDataGedcom(dataISO: string): string {
    try {
      const d = new Date(dataISO);
      const meses = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dataISO;
    }
  }
}

export default GedcomExporter;
