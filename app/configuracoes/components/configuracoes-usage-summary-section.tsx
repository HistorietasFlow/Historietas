import {
  SettingsRow,
  SettingsSection,
  ValorLinha,
} from "./configuracoes-settings-primitives";
import type { ResumoLocal } from "../lib/configuracoes-account-models";
import type {
  DeveMostrarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesUsageSummarySectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  resumo: ResumoLocal;
  totalBiblioteca: number;
  notificacoesNaoLidas: number;
};

export function ConfiguracoesUsageSummarySection({
  deveMostrar,
  traduzirTexto: t,
  resumo,
  totalBiblioteca,
  notificacoesNaoLidas,
}: ConfiguracoesUsageSummarySectionProps) {
  if (
    !deveMostrar(
      "historietas",
      "obras",
      "biblioteca",
      "notificações",
      "comunidade",
      "top 5",
      "diário",
    )
  ) {
    return null;
  }

  return (
    <SettingsSection
      title={t(
        "Como você usa o Historietas",
        "How you use Historietas",
        "Cómo usas Historietas",
      )}
    >
      {deveMostrar("obras", "criadas") ? (
        <SettingsRow
          icon="book"
          title={t(
            "Obras criadas",
            "Created works",
            "Obras creadas",
          )}
          subtitle={t(
            "Total de obras criadas na sua conta",
            "Total works created on your account",
            "Total de obras creadas en tu cuenta",
          )}
          right={<ValorLinha>{resumo.obras}</ValorLinha>}
          href="/perfil-autor?aba=obras"
        />
      ) : null}

      {deveMostrar(
        "biblioteca",
        "lista",
        "favoritas",
        "concluidas",
      ) ? (
        <SettingsRow
          icon="bookmark"
          title={t("Biblioteca", "Library", "Biblioteca")}
          subtitle={t(
            "Favoritas, concluídas e obras seguidas",
            "Favorites, completed and followed works",
            "Favoritas, completadas y obras seguidas",
          )}
          right={<ValorLinha>{totalBiblioteca}</ValorLinha>}
          href="/perfil-autor?aba=biblioteca"
        />
      ) : null}

      {deveMostrar("notificações", "avisos") ? (
        <SettingsRow
          icon="bell"
          title={t(
            "Notificações",
            "Notifications",
            "Notificaciones",
          )}
          subtitle={t(
            "Mensagens, avisos e atividade recente",
            "Messages, alerts and recent activity",
            "Mensajes, avisos y actividad reciente",
          )}
          right={<ValorLinha>{notificacoesNaoLidas}</ValorLinha>}
          href="/notificacoes"
        />
      ) : null}

      {deveMostrar("comunidade", "autor") ? (
        <SettingsRow
          icon="comment"
          title={t(
            "Comunidade do autor",
            "Author community",
            "Comunidad del autor",
          )}
          subtitle={t(
            "Interações e publicações da comunidade",
            "Community interactions and posts",
            "Interacciones y publicaciones de la comunidad",
          )}
          href="/perfil-autor?aba=comunidade"
        />
      ) : null}

      {deveMostrar("top 5", "favoritas") ? (
        <SettingsRow
          icon="trophy"
          title="TOP 5"
          subtitle={t(
            "Escolha suas cinco obras favoritas",
            "Choose your five favorite works",
            "Elige tus cinco obras favoritas",
          )}
          href="/perfil-autor/top-5"
        />
      ) : null}

      {deveMostrar("histórico", "leitura", "diário") ? (
        <SettingsRow
          icon="clock"
          title={t(
            "Histórico de leitura",
            "Reading history",
            "Historial de lectura",
          )}
          subtitle={t(
            "Diário, leituras recentes e avaliações",
            "Journal, recent reads and ratings",
            "Diario, lecturas recientes y valoraciones",
          )}
          href="/perfil-autor?aba=diario"
        />
      ) : null}
    </SettingsSection>
  );
}
