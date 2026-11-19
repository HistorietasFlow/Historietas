import { useEffect, useRef, useState } from "react";
import { normalizarGeneroExcluido } from "../../../lib/catalogo-genero";
import { normalizarTagCatalogo } from "../../../lib/catalogo-tag";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { categorias } from "../lib/explorar-categories";
import { explorarModalClearButtonStyle } from "../lib/explorar-layout-styles";
import {
  criarStorageKeyUsuarioExplorar,
  lerStorageUsuarioExplorar,
} from "../lib/explorar-local-storage";
import { traduzirGeneroExplorar, traduzirTextoExplorar } from "../lib/explorar-translations";

const STORAGE_KEY = "historietas-explorar-exclusoes-salvas";
const buttonStyle = { ...explorarModalClearButtonStyle, width: "100%", marginTop: 0 };

type Exclusoes = { genero: string; tag: string };

function lerExclusoesSalvas(usuarioId: string): Exclusoes | null {
  const texto = lerStorageUsuarioExplorar(STORAGE_KEY, usuarioId);
  if (!texto) return null;

  try {
    const valor: Partial<Record<keyof Exclusoes, unknown>> | null = JSON.parse(texto);
    const genero = normalizarGeneroExcluido(typeof valor?.genero === "string" ? valor.genero : "");
    const tag = normalizarTagCatalogo(typeof valor?.tag === "string" ? valor.tag : "");
    return genero || tag ? { genero, tag } : null;
  } catch {
    return null;
  }
}

type Props = {
  usuarioId: string;
  language: HistorietasLanguage;
  generoExcluido: string;
  tagExcluida: string;
  onReaplicar: (genero: string, tag: string) => void;
};

export function ExplorarSavedExclusions({
  usuarioId, language, generoExcluido, tagExcluida, onReaplicar,
}: Props) {
  const chave = criarStorageKeyUsuarioExplorar(STORAGE_KEY, usuarioId);
  const [salvas, setSalvas] = useState(() => lerExclusoesSalvas(usuarioId));
  const [erro, setErro] = useState(false);
  const grupoRef = useRef<HTMLElement>(null);
  const atuais = {
    genero: normalizarGeneroExcluido(generoExcluido),
    tag: normalizarTagCatalogo(tagExcluida),
  };
  const generoSalvo = salvas?.genero
    ? categorias.find(genero => normalizarGeneroExcluido(genero) === salvas.genero)
    : undefined;

  useEffect(() => {
    function sincronizar(event: StorageEvent) {
      if (event.key === chave || event.key === null) {
        setSalvas(lerExclusoesSalvas(usuarioId));
      }
    }

    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, [chave, usuarioId]);

  function persistir(exclusoes: Exclusoes | null) {
    try {
      if (exclusoes) {
        localStorage.setItem(chave, JSON.stringify(exclusoes));
      } else {
        localStorage.removeItem(chave);
        grupoRef.current?.focus({ preventScroll: true });
      }
      setSalvas(exclusoes);
      setErro(false);
    } catch {
      setErro(true);
    }
  }

  function reaplicar() {
    const exclusoes = lerExclusoesSalvas(usuarioId);
    setSalvas(exclusoes);
    if (exclusoes) onReaplicar(exclusoes.genero, exclusoes.tag);
  }

  return (
    <section
      ref={grupoRef}
      tabIndex={-1}
      aria-labelledby="explorar-exclusoes-salvas-titulo"
      style={{ display: "grid", gap: 8, margin: "12px 30px", overflowWrap: "anywhere" }}
    >
      <h3 id="explorar-exclusoes-salvas-titulo" style={{ margin: 0, fontSize: 15 }}>
        {traduzirTextoExplorar("Exclusões salvas", language)}
      </h3>
      <div role="status" style={{ fontSize: 14 }}>
        {salvas ? (
          <>
            {generoSalvo && <div>{traduzirTextoExplorar("Excluir gênero", language)}: {traduzirGeneroExplorar(generoSalvo, language)}</div>}
            {salvas.tag && <div>{traduzirTextoExplorar("Excluir tag", language)}: {salvas.tag}</div>}
          </>
        ) : traduzirTextoExplorar("Nenhuma exclusão salva neste navegador.", language)}
      </div>
      <button type="button" style={buttonStyle} disabled={!atuais.genero && !atuais.tag} onClick={() => persistir(atuais)}>
        {traduzirTextoExplorar("Salvar exclusões", language)}
      </button>
      {salvas && (
        <>
          <button type="button" style={buttonStyle} onClick={reaplicar}>
            {traduzirTextoExplorar("Reaplicar exclusões", language)}
          </button>
          <button type="button" style={buttonStyle} onClick={() => persistir(null)}>
            {traduzirTextoExplorar("Apagar exclusões salvas", language)}
          </button>
        </>
      )}
      {erro && <p role="alert">{traduzirTextoExplorar("Não foi possível atualizar as exclusões neste navegador.", language)}</p>}
    </section>
  );
}
