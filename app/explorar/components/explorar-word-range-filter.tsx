import { useState } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { validarIntervaloPalavras, type IntervaloPalavrasTexto } from "../../../lib/catalogo-palavras";
import { textosFiltroPalavras } from "../lib/explorar-word-filter-text";
import { explorarModalClearButtonStyle, explorarModalSectionLabelStyle } from "../lib/explorar-layout-styles";

export function ExplorarWordRangeFilter({ intervalo, language, onAplicar }: {
  intervalo: IntervaloPalavrasTexto;
  language: HistorietasLanguage;
  onAplicar: (intervalo: IntervaloPalavrasTexto) => void;
}) {
  const [edicao, setEdicao] = useState({ aplicado: intervalo, texto: intervalo });
  const { texto } = edicao;
  // Reconcile history/clear without an effect or remount that would lose focus.
  if (edicao.aplicado.minimo !== intervalo.minimo || edicao.aplicado.maximo !== intervalo.maximo) {
    setEdicao({ aplicado: intervalo, texto: intervalo });
  }
  const validacao = validarIntervaloPalavras(texto);
  const t = textosFiltroPalavras(language);
  return (
    <fieldset style={{ border: 0, margin: "16px 0", padding: 0, minWidth: 0 }}>
      <legend style={explorarModalSectionLabelStyle}>{t.titulo}</legend>
      <p id="explorar-palavras-ajuda">{t.ajuda}</p>
      {(["minimo", "maximo"] as const).map(nome => (
        <label key={nome} style={{ ...explorarModalSectionLabelStyle, display: "block" }}>
          {t[nome]}
          <input type="text" inputMode="numeric" value={texto[nome]}
            onChange={event => setEdicao(atual => ({ ...atual, texto: { ...atual.texto, [nome]: event.target.value } }))}
            aria-invalid={!validacao.valido}
            aria-describedby={`explorar-palavras-ajuda${validacao.valido ? "" : " explorar-palavras-erro"}`}
            style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10, fontSize: 16 }} />
        </label>
      ))}
      {!validacao.valido && <p id="explorar-palavras-erro" role="alert">{t.erro}</p>}
      <button type="button" style={explorarModalClearButtonStyle} disabled={!validacao.valido}
        onClick={() => {
          if (!validacao.valido) return;
          onAplicar({ minimo: validacao.palavrasMinimas === null ? "" : String(validacao.palavrasMinimas),
            maximo: validacao.palavrasMaximas === null ? "" : String(validacao.palavrasMaximas) });
        }}>{t.aplicar}</button>
    </fieldset>
  );
}
