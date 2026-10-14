import Link from "next/link";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import {
  ListasAnnotationEditor,
  type ListasAnnotationEditorStyles,
} from "./listas-annotation-editor";

type Obra = {
  autor: string;
  genero: string;
  titulo: string;
};

type Item = {
  anotacao?: string;
  anotacaoId?: string;
  progresso: number;
};

type Editor = {
  aberto: boolean;
  anotacaoId: string;
  contemSpoiler: boolean;
  erro: string;
  salvando: boolean;
  texto: string;
};

type ListasWorkActionSheetProps<T extends Editor> = {
  detalhe: string;
  editor: T;
  editorStyles: ListasAnnotationEditorStyles;
  hrefPrincipal: string;
  item: Item | null;
  maxAnnotationLength: number;
  onCancelAnnotation: () => void;
  onClose: () => void;
  onEditAnnotation: () => void;
  onRemoveAnnotation: () => void;
  onReportAnnotation: () => void;
  onSaveAnnotation: () => void;
  onShare: () => void;
  onToggleWantToRead: () => void;
  obra: Obra;
  perfilEhProprio: boolean;
  podeContinuar: boolean;
  salvandoQueroLer: boolean;
  setEditor: Dispatch<SetStateAction<T>>;
  styles: {
    actions: CSSProperties;
    button: CSSProperties;
    buttonDisabled: CSSProperties;
    buttonIcon: CSSProperties;
    detail: CSSProperties;
    handle: CSSProperties;
    header: CSSProperties;
    meta: CSSProperties;
    overlay: CSSProperties;
    panel: CSSProperties;
    report: CSSProperties;
    selection: CSSProperties;
    selectionActive: CSSProperties;
    title: CSSProperties;
  };
  queroLer: boolean;
};

export function ListasWorkActionSheet<T extends Editor>({
  detalhe,
  editor,
  editorStyles,
  hrefPrincipal,
  item,
  maxAnnotationLength,
  onCancelAnnotation,
  onClose,
  onEditAnnotation,
  onRemoveAnnotation,
  onReportAnnotation,
  onSaveAnnotation,
  onShare,
  onToggleWantToRead,
  obra,
  perfilEhProprio,
  podeContinuar,
  salvandoQueroLer,
  setEditor,
  styles,
  queroLer,
}: ListasWorkActionSheetProps<T>) {
  return (
    <div
      style={styles.overlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Opções de ${obra.titulo}`}
        style={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <span style={styles.handle} aria-hidden="true" />
        <div style={styles.header}>
          <strong data-historietas-user-content="true" style={styles.title}>
            {obra.titulo}
          </strong>
          <span data-historietas-user-content="true" style={styles.meta}>
            {obra.autor} • {obra.genero}
          </span>
          {detalhe && <span style={styles.detail}>{detalhe}</span>}
        </div>
        <div style={styles.actions}>
          <Link href={hrefPrincipal} onClick={onClose} style={styles.button}>
            <span>{podeContinuar ? "Continuar leitura" : "Ver obra"}</span>
          </Link>
          <button
            type="button"
            onClick={onToggleWantToRead}
            disabled={salvandoQueroLer}
            style={{
              ...styles.button,
              ...(salvandoQueroLer ? styles.buttonDisabled : {}),
            }}
          >
            <span>
              {queroLer ? "Remover do Quero ler" : "Quero ler mais tarde"}
            </span>
            <span
              aria-hidden="true"
              style={queroLer ? styles.selectionActive : styles.selection}
            >
              {queroLer ? "✓" : ""}
            </span>
          </button>
          <button type="button" onClick={onShare} style={styles.button}>
            <span>Compartilhar</span>
          </button>
          {item?.anotacaoId && !perfilEhProprio && (
            <button
              type="button"
              onClick={onReportAnnotation}
              style={styles.report}
            >
              <span>Denunciar anotação</span>
            </button>
          )}
          {item && perfilEhProprio && (
            <button
              type="button"
              onClick={onEditAnnotation}
              style={styles.button}
            >
              <span>
                {item.anotacao ? "Editar anotação" : "Criar anotação"}
              </span>
              <span aria-hidden="true" style={styles.buttonIcon}>
                ✎
              </span>
            </button>
          )}
        </div>
        <ListasAnnotationEditor
          editor={editor}
          maxLength={maxAnnotationLength}
          onCancel={onCancelAnnotation}
          onRemove={onRemoveAnnotation}
          onSave={onSaveAnnotation}
          setEditor={setEditor}
          showRemove={Boolean(item?.anotacao)}
          styles={editorStyles}
        />
      </section>
    </div>
  );
}
