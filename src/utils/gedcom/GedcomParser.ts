import type { ParsedGedcom } from '../../types';

/**
 * Parser de arquivos GEDCOM 5.5.1.
 *
 * Suporta as tags:
 * INDI, FAM, BIRT, DEAT, MARR, NAME, DATE, PLAC, SEX, NOTE, SOUR, GIVN, SURN, HUSB, WIFE, CHIL
 *
 * @example
 * const parser = new GedcomParser();
 * const result = parser.parse(conteudoArquivo);
 */
export class GedcomParser {
  /**
   * Faz o parse completo do conteúdo de um arquivo GEDCOM.
   * @param content - Conteúdo string do arquivo .ged
   * @returns Dados estruturados prontos para importar no IndexedDB
   */
  parse(content: string): ParsedGedcom {
    const linhas = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // ─── Tokenização ───────────────────────────────────────────────
    interface Token {
      level: number;
      xref?: string;
      tag: string;
      value: string;
    }

    const tokens: Token[] = linhas.map((linha) => {
      // Formato: LEVEL [XREF] TAG [VALUE]
      const match = linha.match(/^(\d+)\s+(@[^@]+@\s+)?(\w+)\s*(.*)$/);
      if (!match) return null;
      return {
        level: parseInt(match[1], 10),
        xref:  match[2]?.trim(),
        tag:   match[3].toUpperCase(),
        value: match[4]?.trim() ?? '',
      };
    }).filter(Boolean) as Token[];

    // ─── Agrupamento em blocos por record ─────────────────────────
    interface Bloco { xref: string; tag: string; filhos: Token[] }
    const blocos: Bloco[] = [];
    let blocoAtual: Bloco | null = null;

    for (const t of tokens) {
      if (t.level === 0 && t.xref) {
        if (blocoAtual) blocos.push(blocoAtual);
        blocoAtual = { xref: t.xref.replace(/@/g, '').trim(), tag: t.tag, filhos: [] };
      } else if (blocoAtual && t.level > 0) {
        blocoAtual.filhos.push(t);
      }
    }
    if (blocoAtual) blocos.push(blocoAtual);

    // ─── Helpers ─────────────────────────────────────────────────
    const filho = (filhos: Token[], tag: string) =>
      filhos.find((f) => f.tag === tag)?.value;

    const blocoNivel = (filhos: Token[], tag: string) => {
      const idx = filhos.findIndex((f) => f.tag === tag);
      if (idx === -1) return null;
      const nivel = filhos[idx].level;
      const sub: Token[] = [];
      for (let i = idx + 1; i < filhos.length; i++) {
        if (filhos[i].level <= nivel) break;
        sub.push(filhos[i]);
      }
      return sub;
    };

    const converterData = (gedcomDate?: string) => {
      if (!gedcomDate) return undefined;
      const meses: Record<string, string> = {
        JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
        JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12',
      };
      const match = gedcomDate.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/);
      if (match) {
        return `${match[3]}-${meses[match[2]] ?? '01'}-${match[1].padStart(2,'0')}`;
      }
      const soAno = gedcomDate.match(/^(\d{4})$/);
      if (soAno) return `${soAno[1]}-01-01`;
      return undefined;
    };

    // ─── Processar INDI ───────────────────────────────────────────
    const pessoas: ParsedGedcom['pessoas'] = [];
    const mapaXref: Record<string, string> = {}; // xref → id interno temp

    for (const bloco of blocos.filter((b) => b.tag === 'INDI')) {
      const nameTag  = filho(bloco.filhos, 'NAME') ?? '';
      const givn     = filho(bloco.filhos, 'GIVN') ?? nameTag.split('/')[0]?.trim() ?? '';
      const surn     = filho(bloco.filhos, 'SURN') ?? (nameTag.match(/\/([^/]+)\//)?.[1]?.trim() ?? '');
      const sexo     = filho(bloco.filhos, 'SEX') ?? 'U';
      const notes    = filho(bloco.filhos, 'NOTE') ?? '';

      const birtSub  = blocoNivel(bloco.filhos, 'BIRT');
      const deatSub  = blocoNivel(bloco.filhos, 'DEAT');

      const pessoa: ParsedGedcom['pessoas'][0] = {
        familyId: '',  // será preenchido durante importação
        firstName: givn,
        lastName:  surn,
        gender: sexo === 'M' ? 'male' : sexo === 'F' ? 'female' : 'unknown',
        birthDate:  converterData(birtSub ? filho(birtSub, 'DATE') : undefined),
        birthPlace: birtSub ? filho(birtSub, 'PLAC') : undefined,
        deathDate:  converterData(deatSub ? filho(deatSub, 'DATE') : undefined),
        deathPlace: deatSub ? filho(deatSub, 'PLAC') : undefined,
        notes: notes || undefined,
      };

      mapaXref[bloco.xref] = bloco.xref;
      pessoas.push(pessoa);
    }

    // ─── Processar FAM ────────────────────────────────────────────
    const relacionamentos: ParsedGedcom['relacionamentos'] = [];
    let totalFamilias = 0;

    for (const bloco of blocos.filter((b) => b.tag === 'FAM')) {
      totalFamilias++;
      const husb = filho(bloco.filhos, 'HUSB')?.replace(/@/g, '').trim();
      const wife = filho(bloco.filhos, 'WIFE')?.replace(/@/g, '').trim();

      if (husb && wife) {
        relacionamentos.push({ fromRef: husb, toRef: wife, type: 'spouse' });
      }

      // Filhos
      bloco.filhos.filter((f) => f.tag === 'CHIL').forEach((f) => {
        const childRef = f.value.replace(/@/g, '').trim();
        if (husb) relacionamentos.push({ fromRef: husb, toRef: childRef, type: 'father' });
        if (wife) relacionamentos.push({ fromRef: wife, toRef: childRef, type: 'mother' });
      });
    }

    // ─── Processar SOUR ───────────────────────────────────────────
    const fontes: ParsedGedcom['fontes'] = [];

    for (const bloco of blocos.filter((b) => b.tag === 'SOUR')) {
      const titulo = filho(bloco.filhos, 'TITL') ?? bloco.xref;
      fontes.push({
        familyId: '',
        title: titulo,
        author:    filho(bloco.filhos, 'AUTH'),
        citation:  filho(bloco.filhos, 'NOTE'),
      });
    }

    return {
      pessoas,
      relacionamentos,
      eventos: [],
      fontes,
      totalPessoas:   pessoas.length,
      totalFamilias,
      totalEventos:   0,
    };
  }
}

export default GedcomParser;
