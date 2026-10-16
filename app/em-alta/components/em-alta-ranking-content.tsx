"use client";

import type { AutorRanking, ObraRanking } from "../lib/em-alta-models";
import { AutoresEmAltaSection } from "./em-alta-authors-ranking-section";
import { RankingSection } from "./em-alta-ranking-section";

export function EmAltaRankingContent({
  ranking,
  rankingTemAtividadeReal,
  rankingAutores,
  rankingGeral,
  rankingMaisLidas,
  rankingMaisCurtidas,
  rankingMaisComentadas,
  rankingMaisSalvas,
  rankingMaisRecentes,
  rankingMaisCapitulos,
  rankingParaCatalogoInicial,
  obrasFavoritas,
  obrasConcluidas,
  onAlternarFavorito,
  onAlternarConcluido,
  isDesktop,
}: {
  ranking: ObraRanking[];
  rankingTemAtividadeReal: boolean;
  rankingAutores: AutorRanking[];
  rankingGeral: ObraRanking[];
  rankingMaisLidas: ObraRanking[];
  rankingMaisCurtidas: ObraRanking[];
  rankingMaisComentadas: ObraRanking[];
  rankingMaisSalvas: ObraRanking[];
  rankingMaisRecentes: ObraRanking[];
  rankingMaisCapitulos: ObraRanking[];
  rankingParaCatalogoInicial: ObraRanking[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
  isDesktop: boolean;
}) {
  if (ranking.length > 0 && rankingTemAtividadeReal) {
    return (
      <>
        <AutoresEmAltaSection autores={rankingAutores} isDesktop={isDesktop} />

        <RankingSection
          titulo="Ranking Mestre"
          descricao=""
          obras={rankingGeral}
          tipo="geral"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Alcance Dominante"
          descricao="As histórias que mais chamaram atenção dos leitores."
          obras={rankingMaisLidas}
          tipo="lidas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Preferidas do Público"
          descricao="As obras que mais receberam curtidas e reações positivas."
          obras={rankingMaisCurtidas}
          tipo="curtidas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Mais Comentadas"
          descricao="As histórias que mais puxaram conversa entre os leitores."
          obras={rankingMaisComentadas}
          tipo="comentadas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Mais Seguidas"
          descricao="Obras que mais leitores decidiram acompanhar."
          obras={rankingMaisSalvas}
          tipo="salvas"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Novas Promessas"
          descricao="Publicações recentes começando a aparecer no radar."
          obras={rankingMaisRecentes}
          tipo="recentes"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />

        <RankingSection
          titulo="Grandes Jornadas"
          descricao="Histórias com mais capítulos e conteúdo publicado."
          obras={rankingMaisCapitulos}
          tipo="capitulos"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />
      </>
    );
  }

  if (ranking.length > 0) {
    return (
      <>
        <p
          style={{
            margin: "10px 0 18px",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Catálogo em formação
        </p>

        <RankingSection
          titulo="Obras publicadas"
          descricao="Catálogo inicial com obras publicadas no HISTORIETAS."
          obras={rankingParaCatalogoInicial}
          tipo="recentes"
          obrasFavoritas={obrasFavoritas}
          obrasConcluidas={obrasConcluidas}
          onAlternarFavorito={onAlternarFavorito}
          onAlternarConcluido={onAlternarConcluido}
          isDesktop={isDesktop}
        />
      </>
    );
  }

  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      Ainda não há obras publicadas
    </p>
  );
}
