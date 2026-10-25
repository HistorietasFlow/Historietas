import {
  fieldGroupStyle,
  hintStyle,
  inputStyle,
  labelStyle,
} from "../styles/editar-obra-shared-styles";

type EditarObraIdentityFieldsProps = {
  titulo: string;
  autor: string;
  onTituloChange: (titulo: string) => void;
  onAutorChange: (autor: string) => void;
};

export function EditarObraIdentityFields({
  titulo,
  autor,
  onTituloChange,
  onAutorChange,
}: EditarObraIdentityFieldsProps) {
  return (
    <>
      <div style={fieldGroupStyle}>
        <label htmlFor="editar-obra-titulo" style={labelStyle}>Título da obra</label>

        <input
          id="editar-obra-titulo"
          value={titulo}
          onChange={(event) => onTituloChange(event.target.value)}
          placeholder="Digite o título"
          style={inputStyle}
          type="text"
        />

        <span style={hintStyle}>Mínimo: 3 letras ou números.</span>
      </div>

      <div style={fieldGroupStyle}>
        <label htmlFor="editar-obra-autor" style={labelStyle}>Autor</label>

        <input
          id="editar-obra-autor"
          value={autor}
          onChange={(event) => onAutorChange(event.target.value)}
          placeholder="Nome do autor"
          style={inputStyle}
          type="text"
        />

        <span style={hintStyle}>Mínimo: 2 letras ou números.</span>
      </div>
    </>
  );
}
