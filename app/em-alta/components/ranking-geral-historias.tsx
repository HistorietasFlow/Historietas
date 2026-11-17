"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { paginaRankingValida, type RankingCursor, type RankingPage } from "../../../lib/ranking-geral-contract";
import { sectionStyle, desktopSectionStyle, sectionHeaderStyle, sectionTitleStyle } from "../lib/em-alta-ranking-visual-style-utils";

export function RankingGeralHistorias({ isDesktop }: { isDesktop: boolean }) {
  const [pedido, setPedido] = useState<{ cursor: RankingCursor | null; versao: number }>({ cursor: null, versao: 0 });
  const [pagina, setPagina] = useState<RankingPage | null>(null);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const query = pedido.cursor ? `?${new URLSearchParams(pedido.cursor)}` : "";
    void fetch(`/api/ranking-geral${query}`, {
      cache: "no-store", credentials: "omit", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error("indisponivel");
      const result: unknown = await response.json();
      if (!paginaRankingValida(result)) throw new Error("resposta_invalida");
      if (controller.signal.aborted) return;
      setPagina(result); setEstado("pronto");
      if (pedido.versao > 0) titulo.current?.focus();
    }).catch(() => {
      if (!controller.signal.aborted) { setPagina(null); setEstado("erro"); }
    });
    return () => controller.abort();
  }, [pedido]);

  function carregar(cursor: RankingCursor | null) {
    setPagina(null); setEstado("carregando");
    setPedido(current => ({ cursor, versao: current.versao + 1 }));
  }
  return <section aria-labelledby="ranking-geral-titulo" style={isDesktop ? desktopSectionStyle : sectionStyle}>
    <div style={sectionHeaderStyle}>
      <h2 id="ranking-geral-titulo" ref={titulo} tabIndex={-1} style={sectionTitleStyle}>Ranking Geral de Histórias</h2>
      <p>Classificação por avaliações públicas. A nota média não é a pontuação de ordenação.</p>
    </div>
    <div aria-busy={estado === "carregando"}>
      {estado === "carregando" && <p role="status">Carregando Ranking Geral…</p>}
      {estado === "erro" && <div role="alert"><p>Não foi possível carregar o Ranking Geral.</p>
        <button type="button" onClick={() => carregar(pedido.cursor)}>Tentar novamente</button></div>}
      {pagina?.estado === "cursor_desatualizado" && <div role="status">
        <p>O ranking mudou. Reinicie para consultar a classificação atual.</p>
        <button type="button" onClick={() => carregar(null)}>Reiniciar ranking</button>
      </div>}
      {pagina?.estado === "ok" && <>
        {pagina.itens.length === 0 ? <p role="status">Nenhuma história com avaliações públicas disponível.</p>
          : <ol start={pagina.itens[0].posicao} style={{ paddingLeft: "2.5rem" }}>
            {pagina.itens.map(item => <li key={item.id} value={item.posicao} style={{ marginBottom: 16, padding: 12, borderRadius: 16,
              background: "var(--historietas-surface, rgba(139,92,246,0.08))", overflowWrap: "anywhere" }}>
              <Link prefetch={false} href={`/obra/${encodeURIComponent(item.slug)}`} style={{ color: "inherit", fontWeight: 800 }}>{item.titulo}</Link>
              <p>Nota média pública: {item.nota.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} / 5 · {item.avaliacoes.toLocaleString("pt-BR")} {item.avaliacoes === 1 ? "avaliação" : "avaliações"}</p>
              {item.avaliacoes <= 4 && <span>Poucas avaliações</span>}
            </li>)}
          </ol>}
        <nav aria-label="Paginação do Ranking Geral" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {pedido.cursor && <button type="button" onClick={() => carregar(null)}>Voltar ao início</button>}
          {pagina.proximo && <button type="button" onClick={() => carregar(pagina.proximo)}>Próxima página</button>}
        </nav>
      </>}
    </div>
  </section>;
}
