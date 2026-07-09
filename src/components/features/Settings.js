import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import GedcomImporter from './GedcomImporter';
import useApp from '../../hooks/useApp';
import useTheme from '../../hooks/useTheme';
import { exportarSnapshot, importarSnapshot, lerSnapshot } from '../../utils/dataExport';
import { GedcomExporter } from '../../utils/gedcom/GedcomExporter';

const ABAS = [
  { id: 'geral',        label: 'Geral',       icon: 'tune' },
  { id: 'aparencia',    label: 'Aparência',   icon: 'palette' },
  { id: 'dados',        label: 'Dados',        icon: 'storage' },
  { id: 'privacidade',  label: 'Privacidade', icon: 'lock' },
  { id: 'seguranca',    label: 'Segurança',    icon: 'security' },
];

/**
 * Página de Configurações com dark mode toggle, importação/exportação GEDCOM
 * e backup/restauração de snapshot JSON.
 */
const Settings = () => {
  const { db, family } = useApp();
  const { theme, setTheme } = useTheme();

  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [privacidade, setPrivacidade] = useState({
    ocultarVivos: true,
    arvorePrivada: false,
    indexacaoIA: true,
  });

  // Estados de operações assíncronas
  const [exportandoGedcom, setExportandoGedcom] = useState(false);
  const [exportandoSnapshot, setExportandoSnapshot] = useState(false);
  const [importandoSnapshot, setImportandoSnapshot] = useState(false);
  const [mostrarGedcomImporter, setMostrarGedcomImporter] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackTipo, setFeedbackTipo] = useState('');

  const inputSnapshotRef = useRef(null);

  const mostrarFeedback = useCallback((msg, tipo = 'sucesso') => {
    setFeedbackMsg(msg);
    setFeedbackTipo(tipo);
    setTimeout(() => { setFeedbackMsg(''); setFeedbackTipo(''); }, 4000);
  }, []);

  /** Exporta a árvore como arquivo GEDCOM */
  const handleExportarGedcom = useCallback(async () => {
    if (!db || !family?.id) {
      mostrarFeedback('Selecione uma família antes de exportar.', 'erro');
      return;
    }
    setExportandoGedcom(true);
    try {
      const pessoas = await db.getAll('persons');
      const eventos = await db.getAll('events');
      const pessoasDaFamilia = pessoas.filter(p => p.familyId === family.id);

      const exporter = new GedcomExporter();
      exporter.exportar(pessoasDaFamilia, eventos, family.name ?? 'Familia');

      mostrarFeedback(`GEDCOM exportado: ${pessoasDaFamilia.length} pessoas.`);
    } catch (e) {
      mostrarFeedback(`Erro ao exportar GEDCOM: ${e.message}`, 'erro');
    } finally {
      setExportandoGedcom(false);
    }
  }, [db, family, mostrarFeedback]);

  /** Exporta snapshot JSON completo */
  const handleExportarSnapshot = useCallback(async () => {
    if (!db) { mostrarFeedback('Banco de dados não disponível.', 'erro'); return; }
    setExportandoSnapshot(true);
    try {
      await exportarSnapshot(db);
      mostrarFeedback('Backup JSON exportado com sucesso!');
    } catch (e) {
      mostrarFeedback(`Erro ao exportar backup: ${e.message}`, 'erro');
    } finally {
      setExportandoSnapshot(false);
    }
  }, [db, mostrarFeedback]);

  /** Importa snapshot JSON */
  const handleImportarSnapshot = useCallback(async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !db) return;
    setImportandoSnapshot(true);
    try {
      const preview = await lerSnapshot(arquivo);
      const total = Object.values(preview.data).reduce((acc, arr) => acc + arr.length, 0);
      if (!window.confirm(`Importar ${total} registros do backup? Os dados existentes serão mantidos (merge).`)) return;

      const { importados, erros } = await importarSnapshot(db, arquivo);
      if (erros.length > 0) {
        mostrarFeedback(`${importados} registros importados (${erros.length} erros). Recarregue a página.`, 'aviso');
      } else {
        mostrarFeedback(`${importados} registros importados com sucesso! Recarregue a página.`);
      }
    } catch (e) {
      mostrarFeedback(`Erro ao importar backup: ${e.message}`, 'erro');
    } finally {
      setImportandoSnapshot(false);
      if (inputSnapshotRef.current) inputSnapshotRef.current.value = '';
    }
  }, [db, mostrarFeedback]);

  const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input checked={checked} onChange={onChange} className="sr-only peer" type="checkbox" readOnly />
      <div className="w-11 h-6 bg-surface-container-highest dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
    </label>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-background dark:bg-zinc-950">
        {/* Cabeçalho */}
        <header className="sticky top-0 z-30 bg-surface dark:bg-zinc-900 border-b border-outline-variant dark:border-zinc-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface dark:text-zinc-100">Configurações</h1>
              <p className="text-sm text-on-surface-variant dark:text-zinc-400 mt-0.5">
                Personalize sua experiência no Genealogia IA
              </p>
            </div>
          </div>
        </header>

        {/* Feedback global */}
        {feedbackMsg && (
          <div className={`mx-auto max-w-5xl mt-4 mx-6 px-4 py-3 rounded-lg flex items-center gap-2 text-sm ${
            feedbackTipo === 'erro'
              ? 'bg-error/10 border border-error/30 text-error'
              : feedbackTipo === 'aviso'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {feedbackTipo === 'erro' ? 'error_outline' : feedbackTipo === 'aviso' ? 'warning' : 'check_circle'}
            </span>
            {feedbackMsg}
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Navegação lateral */}
            <nav className="lg:col-span-1">
              <div className="flex flex-col space-y-1 bg-surface-container-low dark:bg-zinc-900 border border-outline-variant dark:border-zinc-800 p-2 rounded-xl">
                {ABAS.map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      abaAtiva === aba.id
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container dark:hover:bg-zinc-800 hover:text-on-surface dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{aba.icon}</span>
                    {aba.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Conteúdo */}
            <div className="lg:col-span-3 space-y-6">

              {/* === ABA GERAL === */}
              {abaAtiva === 'geral' && (
                <div className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6 space-y-5">
                  <h2 className="font-title-lg text-on-surface dark:text-zinc-100">Configurações Gerais</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1.5">Idioma</label>
                      <select className="w-full px-3 py-2 bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 rounded-lg text-sm text-on-surface dark:text-zinc-200 focus:ring-2 focus:ring-primary/40 focus:outline-none">
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1.5">Fuso Horário</label>
                      <select className="w-full px-3 py-2 bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 rounded-lg text-sm text-on-surface dark:text-zinc-200 focus:ring-2 focus:ring-primary/40 focus:outline-none">
                        <option value="GMT-3">Horário de Brasília (GMT-3)</option>
                        <option value="GMT">GMT</option>
                        <option value="GMT-5">GMT-5 (Nova York)</option>
                      </select>
                    </div>
                    <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}

              {/* === ABA APARÊNCIA === */}
              {abaAtiva === 'aparencia' && (
                <div className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6 space-y-6">
                  <h2 className="font-title-lg text-on-surface dark:text-zinc-100">Aparência</h2>

                  <div>
                    <p className="text-xs text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-3">Tema</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Claro', icon: 'light_mode' },
                        { id: 'dark',  label: 'Escuro', icon: 'dark_mode' },
                        { id: 'system', label: 'Sistema', icon: 'devices' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                            theme === t.id
                              ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                              : 'border-outline-variant dark:border-zinc-700 text-on-surface-variant dark:text-zinc-400 hover:border-primary/50 hover:bg-surface-container dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[28px]">{t.icon}</span>
                          {t.label}
                          {theme === t.id && (
                            <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-zinc-500 mt-3">
                      {theme === 'system' ? 'Usando a preferência do seu sistema operacional.' :
                       theme === 'dark' ? 'Tema escuro ativo.' : 'Tema claro ativo.'}
                    </p>
                  </div>
                </div>
              )}

              {/* === ABA DADOS (GEDCOM + Backup) === */}
              {abaAtiva === 'dados' && (
                <div className="space-y-5">
                  {/* GEDCOM */}
                  <div className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6">
                    <h2 className="font-title-lg text-on-surface dark:text-zinc-100 mb-1">Importar / Exportar GEDCOM</h2>
                    <p className="text-sm text-on-surface-variant dark:text-zinc-400 mb-5">
                      Formato padrão para transferência de árvores genealógicas entre sistemas.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setMostrarGedcomImporter(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 text-on-surface dark:text-zinc-200 rounded-lg text-sm font-medium hover:border-primary/50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">upload</span>
                        Importar GEDCOM (.ged)
                      </button>
                      <button
                        onClick={handleExportarGedcom}
                        disabled={exportandoGedcom || !family?.id}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {exportandoGedcom ? (
                          <span className="w-4 h-4 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        )}
                        {exportandoGedcom ? 'Exportando…' : 'Exportar GEDCOM'}
                      </button>
                    </div>
                    {!family?.id && (
                      <p className="text-xs text-on-surface-variant dark:text-zinc-500 mt-2">
                        Crie uma família primeiro para habilitar a exportação.
                      </p>
                    )}
                  </div>

                  {/* Backup / Restauração */}
                  <div className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6">
                    <h2 className="font-title-lg text-on-surface dark:text-zinc-100 mb-1">Backup e Restauração</h2>
                    <p className="text-sm text-on-surface-variant dark:text-zinc-400 mb-5">
                      Exporte ou importe todos os dados em formato JSON. Ideal para migração entre dispositivos.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleExportarSnapshot}
                        disabled={exportandoSnapshot}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {exportandoSnapshot ? (
                          <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">backup</span>
                        )}
                        {exportandoSnapshot ? 'Exportando…' : 'Exportar Backup JSON'}
                      </button>

                      <label className={`flex items-center gap-2 px-4 py-2.5 bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 text-on-surface dark:text-zinc-200 rounded-lg text-sm font-medium hover:border-primary/50 transition-colors cursor-pointer ${importandoSnapshot ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {importandoSnapshot ? (
                          <span className="w-4 h-4 border-2 border-on-surface/30 border-t-on-surface rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px] text-secondary">restore</span>
                        )}
                        {importandoSnapshot ? 'Importando…' : 'Restaurar Backup JSON'}
                        <input
                          ref={inputSnapshotRef}
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportarSnapshot}
                          disabled={importandoSnapshot}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-zinc-500 mt-3">
                      A restauração faz um merge dos dados — registros existentes são mantidos.
                    </p>
                  </div>
                </div>
              )}

              {/* === ABA PRIVACIDADE === */}
              {abaAtiva === 'privacidade' && (
                <div className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6">
                  <h2 className="font-title-lg text-on-surface dark:text-zinc-100 mb-4">Privacidade de Dados</h2>
                  <div className="space-y-5">
                    {[
                      {
                        key: 'ocultarVivos',
                        label: 'Ocultar pessoas vivas',
                        desc: 'Oculta automaticamente detalhes de membros vivos da árvore para outros usuários.',
                      },
                      {
                        key: 'arvorePrivada',
                        label: 'Tornar árvore privada',
                        desc: 'Sua árvore genealógica não aparecerá em buscas globais de outros pesquisadores.',
                      },
                      {
                        key: 'indexacaoIA',
                        label: 'Permitir indexação por IA',
                        desc: 'Permite que o motor de IA analise seus registros para sugerir conexões automáticas.',
                        badge: 'Premium',
                      },
                    ].map(({ key, label, desc, badge }) => (
                      <div key={key} className="flex items-center justify-between py-4 border-b border-outline-variant dark:border-zinc-800 last:border-0">
                        <div className="pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-on-surface dark:text-zinc-200">{label}</span>
                            {badge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase">{badge}</span>
                            )}
                          </div>
                          <span className="text-xs text-on-surface-variant dark:text-zinc-400">{desc}</span>
                        </div>
                        <Toggle
                          checked={privacidade[key]}
                          onChange={(e) => setPrivacidade({ ...privacidade, [key]: e.target.checked })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === ABA SEGURANÇA === */}
              {abaAtiva === 'seguranca' && (
                <div className="bg-surface dark:bg-zinc-900 rounded-xl border border-outline-variant dark:border-zinc-800 p-6">
                  <h2 className="font-title-lg text-on-surface dark:text-zinc-100 mb-4">Segurança da Conta</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-outline-variant dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-medium text-on-surface dark:text-zinc-200">Autenticação de Dois Fatores</p>
                        <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">Adicione uma camada extra de segurança à sua conta.</p>
                      </div>
                      <button className="px-3 py-1.5 border border-primary text-primary text-xs font-medium rounded-lg hover:bg-primary/5 transition-colors">
                        Ativar
                      </button>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-on-surface dark:text-zinc-200 mb-3">Alterar Senha</h3>
                      <div className="space-y-3">
                        {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map((placeholder) => (
                          <input
                            key={placeholder}
                            type="password"
                            placeholder={placeholder}
                            className="w-full px-3 py-2 bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 rounded-lg text-sm text-on-surface dark:text-zinc-200 focus:ring-2 focus:ring-primary/40 focus:outline-none placeholder:text-on-surface-variant dark:placeholder:text-zinc-500"
                          />
                        ))}
                        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                          Atualizar Senha
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Importador GEDCOM */}
        {mostrarGedcomImporter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-surface dark:bg-zinc-900 rounded-2xl shadow-2xl border border-outline-variant dark:border-zinc-700 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant dark:border-zinc-700">
                <h2 className="font-title-lg text-on-surface dark:text-zinc-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">upload</span>
                  Importar GEDCOM
                </h2>
                <button
                  onClick={() => setMostrarGedcomImporter(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container dark:hover:bg-zinc-800 text-on-surface-variant"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                <GedcomImporter onClose={() => setMostrarGedcomImporter(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Settings;
