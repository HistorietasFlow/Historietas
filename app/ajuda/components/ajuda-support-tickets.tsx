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
  chamados: ProblemaTecnicoResumo[];
  language: HistorietasLanguage;
};

export function AjudaSupportTickets({
  carregando,
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
    <div style={supportTicketsSectionStyle}>
      <div style={supportTicketsHeadingStyle}>
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
      </div>

      {!carregando ? (
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
    </div>
  );
}
