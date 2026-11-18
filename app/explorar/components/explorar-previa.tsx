"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { traduzirTextoExplorar } from "../lib/explorar-translations";
import styles from "./explorar-previa.module.css";

const Habilitada = createContext(false);
export const LeitorDaPrevia = createContext("");

export function HabilitarPreviaLocal({ children }: { children: ReactNode }) {
  return <Habilitada.Provider value={true}>{children}</Habilitada.Provider>;
}

export function AcoesComPrevia({ slug, children }: { slug?: string; children: ReactNode }) {
  const habilitada = useContext(Habilitada);
  const leitor = useContext(LeitorDaPrevia);
  if (!habilitada || !slug) return children;
  return <Previa key={JSON.stringify([slug, leitor])} slug={slug}>{children}</Previa>;
}

type Estado = { tipo: "fechada" | "carregando" | "ausente" | "sessao" | "erro" }
  | { tipo: "aberta"; trecho: string };

function Previa({ slug, children }: { slug: string; children: ReactNode }) {
  const { language } = useHistorietasLanguage();
  const traduzir = (texto: string) => traduzirTextoExplorar(texto, language);
  const id = useId();
  const pedido = useRef<AbortController | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "fechada" });
  const expandida = estado.tipo !== "fechada";

  useEffect(() => () => pedido.current?.abort(), []);

  async function alternar() {
    pedido.current?.abort();
    if (expandida) {
      setEstado({ tipo: "fechada" });
      return;
    }
    const controle = new AbortController();
    pedido.current = controle;
    setEstado({ tipo: "carregando" });
    try {
      const resposta = await fetch(`/api/obras/${encodeURIComponent(slug)}/previa`, {
        credentials: "same-origin", cache: "no-store", signal: controle.signal,
      });
      if (controle.signal.aborted) return;
      if (!resposta.ok) {
        const tipo = resposta.status === 404 ? "ausente" : resposta.status === 401 ? "sessao" : "erro";
        setEstado({ tipo });
        return;
      }
      const dados = await resposta.json();
      if (controle.signal.aborted) return;
      if (typeof dados?.trecho !== "string" || !dados.trecho || Array.from(dados.trecho).length > 600) {
        setEstado({ tipo: "erro" });
        return;
      }
      setEstado({ tipo: "aberta", trecho: dados.trecho });
    } catch {
      if (!controle.signal.aborted) setEstado({ tipo: "erro" });
    }
  }

  return <>
    <div className={styles.acoes}>
      {children}
      <button type="button" className={styles.botao} onClick={alternar}
        aria-expanded={expandida} aria-controls={id}>
        {traduzir(expandida ? "Fechar prévia" : "Ler o começo")}
      </button>
    </div>
    <div id={id} hidden={!expandida} className={styles.painel} role="status" aria-live="polite">
      {estado.tipo === "aberta" && estado.trecho}
      {estado.tipo === "carregando" && traduzir("Carregando trecho…")}
      {estado.tipo === "ausente" && traduzir("Prévia indisponível.")}
      {estado.tipo === "sessao" && traduzir("Entre novamente para ler a prévia.")}
      {estado.tipo === "erro" && traduzir("Não foi possível carregar a prévia. Tente novamente.")}
    </div>
  </>;
}
