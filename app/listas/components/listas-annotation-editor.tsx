import type { CSSProperties, Dispatch, SetStateAction } from "react";

type EditorAnotacao = {
  aberto: boolean;
  anotacaoId: string;
  contemSpoiler: boolean;
  erro: string;
  salvando: boolean;
  texto: string;
};

export type ListasAnnotationEditorStyles = {
  cancel: CSSProperties;
  counter: CSSProperties;
  editor: CSSProperties;
  editorMeta: CSSProperties;
  error: CSSProperties;
  metaActions: CSSProperties;
  remove: CSSProperties;
  save: CSSProperties;
  spoilerCheckbox: CSSProperties;
  spoilerLabel: CSSProperties;
  textarea: CSSProperties;
  textareaWrap: CSSProperties;
};

type ListasAnnotationEditorProps<T extends EditorAnotacao> = {
  editor: T;
  maxLength: number;
  onCancel: () => void;
  onRemove: () => void;
  onSave: () => void;
  setEditor: Dispatch<SetStateAction<T>>;
  showRemove: boolean;
  styles: ListasAnnotationEditorStyles;
};

export function ListasAnnotationEditor<T extends EditorAnotacao>({
  editor,
  maxLength,
  onCancel,
  onRemove,
  onSave,
  setEditor,
  showRemove,
  styles,
}: ListasAnnotationEditorProps<T>) {
  if (!editor.aberto) return null;

  return (
    <div style={styles.editor}>
      <div style={styles.textareaWrap}>
        <textarea
          aria-label="Anotação da leitura"
          value={editor.texto}
          onChange={(event) =>
            setEditor((estadoAtual) => ({
              ...estadoAtual,
              texto: event.target.value.slice(0, maxLength),
              erro: "",
            }))
          }
          placeholder="Escreva o que achou desta leitura..."
          maxLength={maxLength}
          rows={4}
          style={styles.textarea}
          disabled={editor.salvando}
        />
        <span style={styles.counter}>
          {editor.texto.length}/{maxLength}
        </span>
      </div>
      <div style={styles.editorMeta}>
        <label style={styles.spoilerLabel}>
          <span>Contém spoiler</span>
          <input
            type="checkbox"
            checked={editor.contemSpoiler}
            onChange={(event) =>
              setEditor((estadoAtual) => ({
                ...estadoAtual,
                contemSpoiler: event.target.checked,
                erro: "",
              }))
            }
            style={styles.spoilerCheckbox}
            disabled={editor.salvando}
          />
        </label>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={editor.salvando}
            style={styles.remove}
          >
            Remover
          </button>
        )}
        <div style={styles.metaActions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={editor.salvando}
            style={styles.cancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={editor.salvando}
            style={styles.save}
          >
            {editor.salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
      {editor.erro && <span style={styles.error}>{editor.erro}</span>}
    </div>
  );
}
