import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { utils } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';

const ICONE_POR_TIPO: Record<string, string> = {
  sucesso: 'check_circle',
  info:    'info',
  aviso:   'warning',
  erro:    'error',
};

const COR_POR_TIPO: Record<string, string> = {
  sucesso: 'text-green-600',
  info:    'text-secondary',
  aviso:   'text-amber-600',
  erro:    'text-error',
};

/**
 * Painel de notificações do usuário no header.
 *
 * - Badge com contagem de não lidas
 * - Dropdown com lista de notificações recentes
 * - Marcar individual ou todas como lidas
 * - Navegação por linkDestino
 * - Dark mode completo
 */
export function NotificationPanel() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const [aberto, setAberto] = useState(false);

  const handleNotificacaoClick = async (id: string, linkDestino?: string) => {
    await markAsRead(id);
    if (linkDestino) {
      navigate(linkDestino);
    }
    setAberto(false);
  };

  const recentes = notifications.slice(0, 20);

  return (
    <div className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setAberto((prev) => !prev)}
        className="relative p-2 text-on-surface-variant hover:text-secondary dark:hover:text-secondary transition-colors rounded-full hover:bg-surface-container-low dark:hover:bg-surface/20"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <>
          {/* Overlay para fechar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />

          <div className="
            absolute top-full right-0 mt-2 z-50
            w-80 sm:w-96
            bg-surface dark:bg-surface-container
            border border-outline-variant dark:border-outline-variant/40
            rounded-xl shadow-xl overflow-hidden
            max-h-[80vh] flex flex-col
          ">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant dark:border-outline-variant/30">
              <h3 className="font-title-lg text-title-lg text-on-surface">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-label-md text-secondary hover:underline font-label-md"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {isLoading && (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest dark:bg-surface/40 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-surface-container-highest dark:bg-surface/40 rounded w-3/4" />
                        <div className="h-3 bg-surface-container-highest dark:bg-surface/40 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && recentes.length === 0 && (
                <div className="px-4 py-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">notifications_off</span>
                  <p className="text-body-md">Nenhuma notificação</p>
                </div>
              )}

              {!isLoading && recentes.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificacaoClick(notif.id, notif.linkDestino)}
                  className={`
                    w-full flex items-start gap-3 px-4 py-3 text-left
                    border-b border-outline-variant/20 last:border-0
                    transition-colors hover:bg-surface-container-low dark:hover:bg-surface/20
                    ${!notif.lida ? 'bg-secondary-fixed/10 dark:bg-secondary/5' : ''}
                  `}
                >
                  {/* Ícone */}
                  <span className={`material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5 ${COR_POR_TIPO[notif.tipo] ?? 'text-on-surface-variant'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {ICONE_POR_TIPO[notif.tipo] ?? 'circle_notifications'}
                  </span>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-body-md font-medium text-on-surface truncate ${!notif.lida ? 'font-semibold' : ''}`}>
                      {notif.titulo}
                    </p>
                    <p className="text-label-md text-on-surface-variant line-clamp-2">
                      {notif.mensagem}
                    </p>
                    <p className="text-label-md text-on-surface-variant/60 mt-0.5">
                      {utils.timeAgo(notif.criadaEm)}
                    </p>
                  </div>

                  {/* Indicador de não lida */}
                  {!notif.lida && (
                    <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationPanel;
