"use client";

import type {
  FiltroNotificacao,
  OrdenacaoNotificacao,
} from "../lib/notificacoes-filter-utils";
import {
  desktopNotificationSortingSheetStyle,
  notificationActionsDangerOptionDisabledStyle,
  notificationActionsDangerOptionStyle,
  notificationActionsOptionDisabledStyle,
  notificationActionsOptionStyle,
  notificationSortingBackdropStyle,
  notificationSortingHandleStyle,
  notificationSortingOptionActiveStyle,
  notificationSortingOptionRadioActiveStyle,
  notificationSortingOptionRadioStyle,
  notificationSortingOptionStyle,
  notificationSortingOptionsListStyle,
  notificationSortingSectionLabelStyle,
  notificationSortingSheetStyle,
  notificationSortingTitleStyle,
} from "../lib/notificacoes-shell-styles";
import NotificacoesOverlayPortal from "./notificacoes-overlay-portal";

type Opcao<T extends string> = {
  valor: T;
  rotulo: string;
};

type NotificacoesSortingSheetProps = {
  isDesktop: boolean;
  filtro: FiltroNotificacao;
  ordenacao: OrdenacaoNotificacao;
  opcoesFiltro: Opcao<FiltroNotificacao>[];
  opcoesOrdenacao: Opcao<OrdenacaoNotificacao>[];
  totalNotificacoes: number;
  totalNotificacoesFiltradas: number;
  totalLidas: number;
  onClose: () => void;
  onFiltroChange: (filtro: FiltroNotificacao) => void;
  onOrdenacaoChange: (ordenacao: OrdenacaoNotificacao) => void;
  onMarcarTodasComoLidas: () => void;
  onMarcarFiltradasComoLidas: () => void;
  onLimparLidas: () => void;
  onLimparTodas: () => void;
};

export default function NotificacoesSortingSheet({
  isDesktop,
  filtro,
  ordenacao,
  opcoesFiltro,
  opcoesOrdenacao,
  totalNotificacoes,
  totalNotificacoesFiltradas,
  totalLidas,
  onClose,
  onFiltroChange,
  onOrdenacaoChange,
  onMarcarTodasComoLidas,
  onMarcarFiltradasComoLidas,
  onLimparLidas,
  onLimparTodas,
}: NotificacoesSortingSheetProps) {
  return (
    <NotificacoesOverlayPortal>
      <div
        data-historietas-notificacoes-overlay="true"
        style={notificationSortingBackdropStyle}
        onClick={onClose}
      >
        <div
          style={
            isDesktop
              ? desktopNotificationSortingSheetStyle
              : notificationSortingSheetStyle
          }
          onClick={(event) => event.stopPropagation()}
        >
          <span style={notificationSortingHandleStyle} />

          <strong style={notificationSortingTitleStyle}>
            Opções de notificações
          </strong>

          <div style={notificationSortingOptionsListStyle}>
            <span style={notificationSortingSectionLabelStyle}>Mostrar</span>

            {opcoesFiltro.map((opcao) => {
              const ativo = filtro === opcao.valor;

              return (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => onFiltroChange(opcao.valor)}
                  style={
                    ativo
                      ? notificationSortingOptionActiveStyle
                      : notificationSortingOptionStyle
                  }
                >
                  <span>{opcao.rotulo}</span>

                  <span
                    style={
                      ativo
                        ? notificationSortingOptionRadioActiveStyle
                        : notificationSortingOptionRadioStyle
                    }
                  >
                    {ativo ? "✓" : ""}
                  </span>
                </button>
              );
            })}

            <span style={notificationSortingSectionLabelStyle}>
              Classificar por
            </span>

            {opcoesOrdenacao.map((opcao) => {
              const ativo = ordenacao === opcao.valor;

              return (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => onOrdenacaoChange(opcao.valor)}
                  style={
                    ativo
                      ? notificationSortingOptionActiveStyle
                      : notificationSortingOptionStyle
                  }
                >
                  <span>{opcao.rotulo}</span>

                  <span
                    style={
                      ativo
                        ? notificationSortingOptionRadioActiveStyle
                        : notificationSortingOptionRadioStyle
                    }
                  >
                    {ativo ? "✓" : ""}
                  </span>
                </button>
              );
            })}

            <span style={notificationSortingSectionLabelStyle}>Ações</span>

            <button
              type="button"
              onClick={onMarcarTodasComoLidas}
              style={
                totalNotificacoes === 0
                  ? notificationActionsOptionDisabledStyle
                  : notificationActionsOptionStyle
              }
              disabled={totalNotificacoes === 0}
            >
              Marcar todas como lidas
            </button>

            <button
              type="button"
              onClick={onMarcarFiltradasComoLidas}
              style={
                totalNotificacoesFiltradas === 0
                  ? notificationActionsOptionDisabledStyle
                  : notificationActionsOptionStyle
              }
              disabled={totalNotificacoesFiltradas === 0}
            >
              Marcar seleção
            </button>

            <button
              type="button"
              onClick={onLimparLidas}
              style={
                totalLidas === 0
                  ? notificationActionsOptionDisabledStyle
                  : notificationActionsOptionStyle
              }
              disabled={totalLidas === 0}
            >
              Apagar lidas
            </button>

            <button
              type="button"
              onClick={onLimparTodas}
              style={
                totalNotificacoes === 0
                  ? notificationActionsDangerOptionDisabledStyle
                  : notificationActionsDangerOptionStyle
              }
              disabled={totalNotificacoes === 0}
            >
              Limpar todos
            </button>
          </div>
        </div>
      </div>
    </NotificacoesOverlayPortal>
  );
}
