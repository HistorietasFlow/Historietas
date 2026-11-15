import type { CSSProperties } from "react";
import type { HistorietasLanguage } from "../lib/i18n";
import { STATUS_EDITORIAIS, filtroStatusEditorial, textosStatusEditorial } from "../lib/statusEditorial";

type Props = {
  id: string;
  idioma: HistorietasLanguage;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  filtro?: boolean;
  style?: CSSProperties;
};

export function StoryStatusField({ id, idioma, value, onChange, disabled, filtro, style }: Props) {
  const t = textosStatusEditorial(idioma);
  return (
    <div data-historietas-i18n-ignore="true" style={{ display: "grid", gap: 8, minWidth: 0 }}>
      <label htmlFor={id}>{t.label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(filtroStatusEditorial(event.target.value))}
        style={{ width: "100%", minWidth: 0, padding: 12, borderRadius: 10, color: "inherit", background: "var(--historietas-input-bg, #171923)", border: "1px solid #676b79", ...style }}>
        <option value="">{filtro ? t.todos : t.indefinido}</option>
        {STATUS_EDITORIAIS.map((status) => <option key={status} value={status}>{t[status]}</option>)}
      </select>
    </div>
  );
}
