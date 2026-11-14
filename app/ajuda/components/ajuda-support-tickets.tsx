import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import type {
  ProblemaTecnicoResumo,
} from "../lib/ajuda-technical-support";
import {
  formatarDataChamado,
  rotuloStatusProblema,
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  supportAdminNoteStyle,
  supportTicketDateStyle,
  supportTicketDescriptionStyle,
  supportTicketHeaderStyle,
  supportTicketStatusStyle,
  supportTicketStyle,
  supportTicketTitleStyle,
  supportTicketsHeadingStyle,
  supportTicketsListStyle,
  supportTicketsSectionStyle,
} from "../lib/ajuda-support-styles";

type AjudaSupportTicketsProps = {
  carregando: boolean;
  erro: string;
  carregados: boolean;
  onRecarregar: () => void;
  chamados: ProblemaTecnicoResumo[];
  language: HistorietasLanguage;
};

export function AjudaSupportTickets({
  carregando,
  erro,
  carregados,
  onRecarregar,
  chamados,
  language,
}: AjudaSupportTicketsProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <section style={supportTicketsSectionStyle} aria-label={t({ pt: "Meus chamados recentes", en: "My recent tickets", es: "Mis casos recientes" })} aria-busy={carregando}>
      <div style={{ ...supportTicketsHeadingStyle, flexWrap: "wrap" }}>
        <strong>
          {t({
            pt: "Meus chamados recentes",
            en: "My recent tickets",
            es: "Mis casos recientes",
          })}
        </strong>
        {carregando ? (
          <span>
            {t({ pt: "Carregando...", en: "Loading...", es: "Cargando..." })}
          </span>
        ) : null}
        <button type="button" className="ajuda-refresh-tickets-button" disabled={carregando} onClick={onRecarregar}>
          {t({ pt: "Atualizar chamados", en: "Refresh tickets", es: "Actualizar casos" })}
        </button>
      </div>

      {erro ? <p role="alert">{erro}</p> : null}
      {chamados.length > 0 && (carregando || erro) ? (
        <p role="status">{t({
          pt: "Exibindo os chamados da última consulta confirmada; a atualização atual ainda não foi confirmada.",
          en: "Showing tickets from the last confirmed query; the current refresh has not been confirmed yet.",
          es: "Se muestran los casos de la última consulta confirmada; la actualización actual aún no está confirmada.",
        })}</p>
      ) : null}
      {carregados && !carregando && !erro && chamados.length === 0 ? (
        <p role="status">{t({ pt: "Nenhum chamado recente.", en: "No recent tickets.", es: "No hay casos recientes." })}</p>
      ) : null}
      {chamados.length > 0 ? (
        <div style={supportTicketsListStyle}>
          {chamados.map((chamado) => (
            <article key={chamado.id} style={supportTicketStyle}>
              <div style={supportTicketHeaderStyle}>
                <strong style={supportTicketTitleStyle}>
                  {chamado.titulo}
                </strong>
                <span style={supportTicketStatusStyle}>
                  {rotuloStatusProblema(chamado.status, language)}
                </span>
              </div>
              <p style={supportTicketDescriptionStyle}>
                {chamado.descricao}
              </p>
              {chamado.observacaoAdmin ? (
                <div style={supportAdminNoteStyle}>
                  <strong>
                    {t({
                      pt: "Resposta da equipe",
                      en: "Team response",
                      es: "Respuesta del equipo",
                    })}
                  </strong>
                  <span>{chamado.observacaoAdmin}</span>
                </div>
              ) : null}
              <span style={supportTicketDateStyle}>
                {formatarDataChamado(chamado.criadoEm, language)}
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
