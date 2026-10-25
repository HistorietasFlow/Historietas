import {
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  OPCOES_TAGS_OBRA,
  OUTRA_TAG_VALUE,
} from "../lib/editar-obra-form-config";
import {
  fieldGroupStyle,
  inputStyle,
  labelStyle,
} from "../styles/editar-obra-shared-styles";

type EditarObraTagFieldProps = {
  usarTagPersonalizada: boolean;
  tagsTratadas: readonly string[];
  tagPersonalizada: string;
  onTagChange: (tag: string) => void;
  onTagPersonalizadaChange: (valor: string) => void;
};

export function EditarObraTagField({
  usarTagPersonalizada,
  tagsTratadas,
  tagPersonalizada,
  onTagChange,
  onTagPersonalizadaChange,
}: EditarObraTagFieldProps) {
  return (
    <div style={fieldGroupStyle}>
      <label htmlFor="editar-obra-tag" style={labelStyle}>
        Tag
      </label>

      <select
        id="editar-obra-tag"
        value={usarTagPersonalizada ? OUTRA_TAG_VALUE : tagsTratadas[0] || ""}
        onChange={(event) => onTagChange(event.target.value)}
        style={inputStyle}
      >
        <option value="">Escolha uma tag</option>

        {OPCOES_TAGS_OBRA.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}

        <option value={OUTRA_TAG_VALUE}>Outra tag</option>
      </select>

      {usarTagPersonalizada && (
        <input
          aria-label="Outra tag"
          value={tagPersonalizada}
          onChange={(event) => onTagPersonalizadaChange(event.target.value)}
          style={inputStyle}
          placeholder="Digite a tag"
          maxLength={LIMITE_CARACTERES_TAG_PERSONALIZADA}
          type="text"
        />
      )}
    </div>
  );
}
