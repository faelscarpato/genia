import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { GlobalSearch } from '../ui/GlobalSearch';
import { NotificationPanel } from '../ui/NotificationPanel';
import useApp from '../../hooks/useApp';
import usePersons from '../../hooks/usePersons';
import { PersonModal } from './PersonModal';

// ─── Algoritmo de layout simples para a árvore ────────────────────────────

/**
 * Algoritmo de layout simples baseado em geração.
 * Distribui as pessoas em linhas horizontais por geração.
 */
function calcularLayout(persons, relationships) {
  if (persons.length === 0) return [];

  const LARGURA_NO = 256;
  const ALTURA_GERACAO = 200;
  const PADDING_H = 40;

  // Calcular gerações via BFS
  const geracoes = new Map();
  const visitados = new Set();

  // Pessoas sem pais = geração 0
  const idsComPai = new Set(
    relationships.filter((r) => r.type === 'son' || r.type === 'daughter').map((r) => r.toPersonId)
  );

  const raizes = persons.filter((p) => !idsComPai.has(p.id));
  if (raizes.length === 0) persons.slice(0, 1).forEach((p) => geracoes.set(p.id, 0));
  else raizes.forEach((p) => geracoes.set(p.id, 0));

  // BFS para propagar gerações
  const fila = [...(raizes.length > 0 ? raizes : persons.slice(0, 1))];
  while (fila.length > 0) {
    const atual = fila.shift();
    if (visitados.has(atual.id)) continue;
    visitados.add(atual.id);

    const geracaoAtual = geracoes.get(atual.id) ?? 0;

    // Filhos recebem geração + 1
    relationships
      .filter((r) => r.fromPersonId === atual.id && (r.type === 'father' || r.type === 'mother'))
      .forEach((r) => {
        const filho = persons.find((p) => p.id === r.toPersonId);
        if (filho && !geracoes.has(filho.id)) {
          geracoes.set(filho.id, geracaoAtual + 1);
          fila.push(filho);
        }
      });
  }

  // Pessoas sem geração calculada = geração 0
  persons.forEach((p) => { if (!geracoes.has(p.id)) geracoes.set(p.id, 0); });

  // Agrupar por geração
  const porGeracao = new Map();
  for (const p of persons) {
    const g = geracoes.get(p.id) ?? 0;
    const lista = porGeracao.get(g) ?? [];
    lista.push(p);
    porGeracao.set(g, lista);
  }

  // Calcular posições
  const posicoes = [];
  for (const [geracao, lista] of porGeracao.entries()) {
    const totalLargura = lista.length * LARGURA_NO + (lista.length - 1) * PADDING_H;
    const offsetX = -(totalLargura / 2);

    lista.forEach((p, idx) => {
      posicoes.push({
        person: p,
        x: offsetX + idx * (LARGURA_NO + PADDING_H),
        y: geracao * ALTURA_GERACAO,
      });
    });
  }

  return posicoes;
}

/**
 * Componente da árvore genealógica dinâmica.
 *
 * - Carrega pessoas e relacionamentos do IndexedDB
 * - Layout automático por geração
 * - Zoom e pan com mouse
 * - Drawer de detalhes ao clicar num nó
 * - Botão flutuante "+" para adicionar pessoa
 * - Dark mode completo
 */
const FamilyTree = () => {
  const { familyId } = useParams();
  const { db, family } = useApp();

  const famId = familyId ?? family?.id ?? '';
  const { persons, isLoading, createPerson, updatePerson, deletePerson } = usePersons(famId);

  const [relacionamentos, setRelacionamentos] = useState([]);
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [pessoaEditando, setPessoaEditando] = useState(null);

  // Estado do canvas
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasRef = useRef(null);

  // Carrega relacionamentos
  React.useEffect(() => {
    if (!db || !famId) return;
    db.getByIndex('relationships', 'familyId', famId)
      .then((rels) => setRelacionamentos(rels ?? []))
      .catch(() => {});
  }, [db, famId, persons]);

  const posicoes = calcularLayout(persons, relacionamentos);

  // ─── Pan com mouse ─────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.target !== canvasRef.current && e.target.closest?.('.person-card')) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  // ─── Handlers CRUD ────────────────────────────────────────────────────
  const handleSalvarPessoa = async (data) => {
    if (pessoaEditando) {
      await updatePerson(pessoaEditando.id, data);
    } else {
      await createPerson({ ...data, familyId: famId });
    }
    setModalAberto(false);
    setPessoaEditando(null);
  };

  const handleDeletar = async (id) => {
    if (!window.confirm('Excluir esta pessoa e todos os seus relacionamentos?')) return;
    await deletePerson(id);
    if (pessoaSelecionada?.id === id) setPessoaSelecionada(null);
  };

  // ─── Calcular linhas de relacionamento ────────────────────────────────
  const linhas = relacionamentos.flatMap((rel) => {
    const de  = posicoes.find((p) => p.person.id === rel.fromPersonId);
    const ate = posicoes.find((p) => p.person.id === rel.toPersonId);
    if (!de || !ate) return [];
    return [{
      x1: de.x  + 128, y1: de.y  + 70,
      x2: ate.x + 128, y2: ate.y + 20,
      tipo: rel.type,
    }];
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-background dark:bg-on-background/5 flex flex-col">
        {/* TopBar */}
        <header className="sticky top-0 z-40 h-16 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border-b border-outline-variant dark:border-outline-variant/30 shadow-sm flex items-center justify-between px-6 gap-4">
          <GlobalSearch />
          <div className="flex items-center gap-2">
            <NotificationPanel />
          </div>
        </header>

        {/* Canvas principal */}
        <main className="flex-1 relative overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
          {/* Toolbar de zoom */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
            <div className="bg-surface dark:bg-surface-container border border-outline-variant dark:border-outline-variant/40 shadow-sm flex flex-col rounded-lg p-1">
              <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
                className="p-2 hover:bg-surface-container-highest dark:hover:bg-surface/30 rounded-lg transition-colors" title="Ampliar">
                <span className="material-symbols-outlined text-on-surface-variant">add</span>
              </button>
              <div className="h-px bg-outline-variant mx-1" />
              <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}
                className="p-2 hover:bg-surface-container-highest dark:hover:bg-surface/30 rounded-lg transition-colors" title="Reduzir">
                <span className="material-symbols-outlined text-on-surface-variant">remove</span>
              </button>
              <div className="h-px bg-outline-variant mx-1" />
              <button onClick={() => { setZoom(0.8); setPan({ x: 0, y: 0 }); }}
                className="p-2 hover:bg-surface-container-highest dark:hover:bg-surface/30 rounded-lg transition-colors" title="Centralizar">
                <span className="material-symbols-outlined text-on-surface-variant">center_focus_strong</span>
              </button>
            </div>
            <div className="text-center text-label-md text-on-surface-variant bg-surface dark:bg-surface-container rounded px-2 py-1 border border-outline-variant dark:border-outline-variant/40">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className={`absolute inset-0 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              style={{
                transform: `translate(calc(50% + ${pan.x}px), calc(200px + ${pan.y}px)) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {/* SVG de conexões */}
              {posicoes.length > 0 && (
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    left: `${Math.min(...posicoes.map((p) => p.x)) - 100}px`,
                    top: `${Math.min(...posicoes.map((p) => p.y)) - 100}px`,
                    width: `${Math.max(...posicoes.map((p) => p.x)) - Math.min(...posicoes.map((p) => p.x)) + 512}px`,
                    height: `${Math.max(...posicoes.map((p) => p.y)) - Math.min(...posicoes.map((p) => p.y)) + 300}px`,
                    overflow: 'visible',
                  }}
                >
                  {linhas.map((l, i) => (
                    <path
                      key={i}
                      d={`M ${l.x1} ${l.y1} C ${l.x1} ${(l.y1 + l.y2) / 2}, ${l.x2} ${(l.y1 + l.y2) / 2}, ${l.x2} ${l.y2}`}
                      fill="none"
                      stroke={l.tipo === 'spouse' ? '#fd8a42' : '#c6c6cd'}
                      strokeWidth="1.5"
                      strokeDasharray={l.tipo === 'spouse' ? '4 3' : 'none'}
                    />
                  ))}
                </svg>
              )}

              {/* Nós */}
              {posicoes.map(({ person: p, x, y }) => {
                const selecionado = pessoaSelecionada?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`person-card absolute group bg-surface dark:bg-surface-container border rounded-xl shadow-sm p-3 w-60 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selecionado
                        ? 'border-2 border-secondary shadow-md'
                        : 'border-outline-variant dark:border-outline-variant/40'
                    }`}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    onClick={() => setPessoaSelecionada(selecionado ? null : p)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Foto ou avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container flex-shrink-0 flex items-center justify-center">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body-md font-semibold text-on-surface truncate">
                          {p.firstName} {p.lastName ?? ''}
                        </h3>
                        {(p.birthDate || p.deathDate) && (
                          <p className="text-label-md text-on-surface-variant">
                            {p.birthDate?.substring(0, 4) ?? '?'}
                            {p.deathDate ? ` — ${p.deathDate.substring(0, 4)}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-green-600 text-[16px] flex-shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                    {selecionado && (
                      <div className="mt-2 text-right">
                        <span className="text-[10px] bg-secondary-fixed text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                          SELECIONADO
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {!isLoading && persons.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 p-8 -translate-x-1/2">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">account_tree</span>
                  <p className="font-title-lg text-title-lg text-on-surface-variant">A árvore está vazia</p>
                  <p className="text-body-md text-on-surface-variant">Clique no botão "+" para adicionar a primeira pessoa.</p>
                </div>
              )}
            </div>
          </div>

          {/* Botão flutuante + */}
          <button
            onClick={() => { setPessoaEditando(null); setModalAberto(true); }}
            className="absolute bottom-6 right-6 z-30 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center"
            aria-label="Adicionar pessoa"
            title="Adicionar pessoa"
          >
            <span className="material-symbols-outlined text-[28px]">person_add</span>
          </button>
        </main>

        {/* Drawer de detalhes */}
        <aside
          className={`
            fixed right-0 top-0 h-screen w-full md:w-96 bg-surface dark:bg-surface-container z-50
            shadow-2xl border-l border-outline-variant dark:border-outline-variant/40 flex flex-col
            transition-transform duration-300
            ${pessoaSelecionada ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {pessoaSelecionada && (
            <>
              {/* Cabeçalho do drawer */}
              <div className="p-5 border-b border-outline-variant dark:border-outline-variant/40 flex justify-between items-center bg-surface-container-low dark:bg-surface/30">
                <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">
                  {pessoaSelecionada.firstName} {pessoaSelecionada.lastName ?? ''}
                </h2>
                <button onClick={() => setPessoaSelecionada(null)}
                  className="p-2 hover:bg-surface-container-highest dark:hover:bg-surface/30 rounded-full transition-colors" aria-label="Fechar">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Conteúdo do drawer */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Foto e info básica */}
                <div className="text-center">
                  <div className="w-28 h-28 rounded-full mx-auto mb-3 border-4 border-surface shadow-md overflow-hidden bg-surface-container">
                    {pessoaSelecionada.photoUrl ? (
                      <img src={pessoaSelecionada.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant h-full flex items-center justify-center text-5xl">person</span>
                    )}
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    {pessoaSelecionada.firstName} {pessoaSelecionada.lastName ?? ''}
                  </h3>
                  {(pessoaSelecionada.birthDate || pessoaSelecionada.deathDate) && (
                    <p className="text-on-surface-variant text-body-md">
                      {pessoaSelecionada.birthDate?.substring(0, 4) ?? '?'}
                      {pessoaSelecionada.deathDate ? ` — ${pessoaSelecionada.deathDate.substring(0, 4)}` : ''}
                    </p>
                  )}
                </div>

                {/* Detalhes */}
                <div className="space-y-2">
                  {pessoaSelecionada.birthPlace && (
                    <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      {pessoaSelecionada.birthPlace}
                    </div>
                  )}
                  {pessoaSelecionada.occupation && (
                    <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">work</span>
                      {pessoaSelecionada.occupation}
                    </div>
                  )}
                  {pessoaSelecionada.notes && (
                    <p className="text-body-md text-on-surface-variant italic border-l-2 border-secondary pl-3">
                      {pessoaSelecionada.notes}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPessoaEditando(pessoaSelecionada); setModalAberto(true); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 border border-secondary text-secondary rounded-lg text-label-md hover:bg-secondary-fixed/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletar(pessoaSelecionada.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 border border-error text-error rounded-lg text-label-md hover:bg-error-container/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Excluir
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Modal de pessoa */}
        {modalAberto && (
          <PersonModal
            person={pessoaEditando}
            familyId={famId}
            onSave={handleSalvarPessoa}
            onClose={() => { setModalAberto(false); setPessoaEditando(null); }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default FamilyTree;
