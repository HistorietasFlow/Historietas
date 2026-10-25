import type { CSSProperties } from "react";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  OPCOES_FORMATO_OBRA,
  OPCOES_GENERO_OBRA,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/editar-obra-form-config";
import {
  fieldGroupStyle,
  inputStyle,
  labelStyle,
} from "../styles/editar-obra-shared-styles";

type EditarObraFormatGenreFieldsProps = {
  isDesktop: boolean;
  formato: string;
  formatoPersonalizado: string;
  formatoEhPersonalizado: boolean;
  genero: string;
  generoPersonalizado: string;
  generoEhPersonalizado: boolean;
  onFormatoChange: (novoFormato: string) => void;
  onFormatoPersonalizadoChange: (novoFormatoPersonalizado: string) => void;
  onGeneroChange: (novoGenero: string) => void;
  onGeneroPersonalizadoChange: (novoGeneroPersonalizado: string) => void;
};

export function EditarObraFormatGenreFields({
  isDesktop,
  formato,
  formatoPersonalizado,
  formatoEhPersonalizado,
  genero,
  generoPersonalizado,
  generoEhPersonalizado,
  onFormatoChange,
  onFormatoPersonalizadoChange,
  onGeneroChange,
  onGeneroPersonalizadoChange,
}: EditarObraFormatGenreFieldsProps) {
  return (
    <div style={isDesktop ? desktopDoubleFieldStyle : doubleFieldStyle}>
      <div style={fieldGroupStyle}>
        <label htmlFor="editar-obra-formato" style={labelStyle}>
          Formato
        </label>

        <select
          id="editar-obra-formato"
          value={formato}
          onChange={(event) => onFormatoChange(event.target.value)}
          style={inputStyle}
        >
          <option value="">Escolha um formato</option>
          {OPCOES_FORMATO_OBRA.map((opcao) => (
            <option key={opcao}>{opcao}</option>
          ))}
          <option value={OUTRO_FORMATO_VALUE}>Outro formato</option>
        </select>

        {formatoEhPersonalizado && (
          <input
            aria-label="Outro formato"
            value={formatoPersonalizado}
            onChange={(event) => onFormatoPersonalizadoChange(event.target.value)}
            style={inputStyle}
            placeholder="Digite o formato"
            maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
            type="text"
          />
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label htmlFor="editar-obra-genero" style={labelStyle}>
          Gênero
        </label>

        <select
          id="editar-obra-genero"
          value={genero}
          onChange={(event) => onGeneroChange(event.target.value)}
          style={inputStyle}
        >
          <option value="">Escolha um gênero</option>
          {OPCOES_GENERO_OBRA.map((opcao) => (
            <option key={opcao}>{opcao}</option>
          ))}
          <option value={OUTRO_GENERO_VALUE}>Outro gênero</option>
        </select>

        {generoEhPersonalizado && (
          <input
            aria-label="Outro gênero"
            value={generoPersonalizado}
            onChange={(event) => onGeneroPersonalizadoChange(event.target.value)}
            style={inputStyle}
            placeholder="Digite o gênero"
            maxLength={LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO}
            type="text"
          />
        )}
      </div>
    </div>
  );
}

const doubleFieldStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
};

const desktopDoubleFieldStyle: CSSProperties = {
  ...doubleFieldStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};
