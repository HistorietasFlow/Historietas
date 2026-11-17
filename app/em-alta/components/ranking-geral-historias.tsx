"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { paginaRankingValida, type RankingCursor, type RankingPage } from "../../../lib/ranking-geral-contract";
import { sectionStyle, desktopSectionStyle, sectionHeaderStyle, sectionTitleStyle } from "../lib/em-alta-ranking-visual-style-utils";
import { rankingGeralCss } from "../lib/ranking-geral-css";

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
  return <section className="ranking-geral-historias" aria-labelledby="ranking-geral-titulo" style={isDesktop ? desktopSectionStyle : sectionStyle}>
    <style>{rankingGeralCss}</style>
    <div style={sectionHeaderStyle}>
      <h2 id="ranking-geral-titulo" ref={titulo} tabIndex={-1} style={sectionTitleStyle}>Ranking Geral de Histórias</h2>
      <p className="ranking-geral-descricao">Classificação por avaliações públicas. A nota média não é a pontuação de ordenação.</p>
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
          : <ol className="ranking-geral-lista" role="list" start={pagina.itens[0].posicao}>
            {pagina.itens.map(item => <li className="ranking-geral-card" key={item.id} value={item.posicao}>
              <span className="ranking-geral-posicao" aria-label={`Posição ${item.posicao}`}>{item.posicao}</span>
              <div className="ranking-geral-info">
              <Link className="ranking-geral-obra" prefetch={false} href={`/obra/${encodeURIComponent(item.slug)}`}>{item.titulo}</Link>
              <p className="ranking-geral-metricas">Nota média pública: {item.nota.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} / 5 · {item.avaliacoes.toLocaleString("pt-BR")} {item.avaliacoes === 1 ? "avaliação" : "avaliações"}</p>
              {item.avaliacoes <= 4 && <span className="ranking-geral-aviso">Poucas avaliações</span>}
              </div>
            </li>)}
          </ol>}
        <nav className="ranking-geral-paginacao" aria-label="Paginação do Ranking Geral">
          {pedido.cursor && <button type="button" onClick={() => carregar(null)}>Voltar ao início</button>}
          {pagina.proximo && <button className="ranking-geral-proxima" type="button" onClick={() => carregar(pagina.proximo)}>Próxima página</button>}
        </nav>
      </>}
    </div>
  </section>;
}
