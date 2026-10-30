import type {
  FormEventHandler,
} from "react";

import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  CATEGORIAS_PROBLEMA_TECNICO,
  type CategoriaProblemaTecnico,
} from "../lib/ajuda-technical-support";
import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  supportCounterStyle,
  supportEnvironmentNoteStyle,
  supportFieldStyle,
  supportFormActionsStyle,
  supportFormGridStyle,
  supportFormStyle,
  supportInputStyle,
  supportLabelStyle,
  supportTextareaStyle,
} from "../lib/ajuda-support-styles";

type AjudaTechnicalSupportFormProps = {
  categoria: CategoriaProblemaTecnico;
  pagina: string;
  titulo: string;
  descricao: string;
  enviando: boolean;
  usuarioAutenticado: boolean | null;
  language: HistorietasLanguage;
  onCategoriaChange: (valor: string) => void;
  onPaginaChange: (valor: string) => void;
  onTituloChange: (valor: string) => void;
  onDescricaoChange: (valor: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function AjudaTechnicalSupportForm({
  categoria,
  pagina,
  titulo,
  descricao,
  enviando,
  usuarioAutenticado,
  language,
  onCategoriaChange,
  onPaginaChange,
  onTituloChange,
  onDescricaoChange,
  onSubmit,
}: AjudaTechnicalSupportFormProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <form onSubmit={onSubmit} style={supportFormStyle}>
      <div style={supportFormGridStyle}>
        <label style={supportFieldStyle}>
          <span style={supportLabelStyle}>
            {t({ pt: "Categoria", en: "Category", es: "Categoría" })}
          </span>
          <select
            className="ajuda-support-control"
            value={categoria}
            onChange={(event) =>
              onCategoriaChange(
                event.target.value,
              )
            }
            disabled={enviando}
            style={supportInputStyle}
          >
            {CATEGORIAS_PROBLEMA_TECNICO.map((categoria) => (
              <option key={categoria.valor} value={categoria.valor}>
                {t(categoria.rotulo)}
              </option>
            ))}
          </select>
        </label>

        <label style={supportFieldStyle}>
          <span style={supportLabelStyle}>
            {t({
              pt: "Página onde aconteceu",
              en: "Page where it happened",
              es: "Página donde ocurrió",
            })}
          </span>
          <input
            className="ajuda-support-control"
            type="url"
            value={pagina}
            onChange={(event) =>
              onPaginaChange(
                event.target.value,
              )
            }
            maxLength={700}
            disabled={enviando}
            placeholder="https://historietas.com.br/..."
            style={supportInputStyle}
          />
        </label>
      </div>

      <label style={supportFieldStyle}>
        <span style={supportLabelStyle}>
          {t({
            pt: "Título do problema",
            en: "Issue title",
            es: "Título del problema",
          })}
        </span>
        <input
          className="ajuda-support-control"
          type="text"
          value={titulo}
          onChange={(event) =>
            onTituloChange(
              event.target.value,
            )
          }
          maxLength={120}
          disabled={enviando}
          placeholder={t({
            pt: "Ex.: o capítulo não abre",
            en: "E.g.: the chapter will not open",
            es: "Ej.: el capítulo no se abre",
          })}
          style={supportInputStyle}
        />
        <span style={supportCounterStyle}>
          {titulo.length}/120
        </span>
      </label>

      <label style={supportFieldStyle}>
        <span style={supportLabelStyle}>
          {t({
            pt: "O que aconteceu?",
            en: "What happened?",
            es: "¿Qué ocurrió?",
          })}
        </span>
        <textarea
          className="ajuda-support-control"
          value={descricao}
          onChange={(event) =>
            onDescricaoChange(
              event.target.value,
            )
          }
          maxLength={3000}
          rows={6}
          disabled={enviando}
          placeholder={t({
            pt: "Explique o que tentou fazer, o que apareceu na tela e se o problema continua acontecendo.",
            en: "Explain what you tried to do, what appeared on screen, and whether the problem is still happening.",
            es: "Explica qué intentaste hacer, qué apareció en pantalla y si el problema continúa.",
          })}
          style={supportTextareaStyle}
        />
        <span style={supportCounterStyle}>
          {descricao.length}/3000
        </span>
      </label>

      <div style={supportFormActionsStyle}>
        <span style={supportEnvironmentNoteStyle}>
          {t({
            pt: "O navegador e o tamanho da tela serão enviados automaticamente para ajudar no diagnóstico.",
            en: "Your browser and screen size will be sent automatically to help diagnose the issue.",
            es: "El navegador y el tamaño de pantalla se enviarán automáticamente para ayudar en el diagnóstico.",
          })}
        </span>
        <button
          type="submit"
          className="ajuda-submit-ticket-button"
          disabled={enviando || usuarioAutenticado === false}
        >
          {enviando
            ? t({ pt: "Enviando...", en: "Submitting...", es: "Enviando..." })
            : t({
                pt: "Enviar problema técnico",
                en: "Submit technical issue",
                es: "Enviar problema técnico",
              })}
        </button>
      </div>
    </form>
  );
}
