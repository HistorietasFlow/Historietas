"use client";

import type { Dispatch, SetStateAction } from "react";
import ListasRatingDetail from "../components/listas-rating-detail";
import { ListasProfileWorkRenderer } from "../components/listas-profile-work-renderer";
import {
  criarInteracaoAnotacaoListasVazia,
} from "../lib/listas-diary-comment-utils";
import { obterPermissoesAnotacaoListas } from "../lib/listas-diary-annotation-permissions-utils";
import { type InteracoesAnotacoesListasEstado } from "../lib/listas-diary-interactions-loader";
import { formatarLeituraMesAno } from "../lib/listas-format-utils";
import { textoSecundarioItem } from "../lib/listas-profile-text-utils";
import { criarCapaStyle } from "../lib/listas-row-media-utils";
import type {
  CategoriaPerfil,
  ItemObraLista,
  ObraLista,
  PerfilLista,
} from "../types";

type UseListasProfileItemRendererProps = {
  abrirComentariosDiario: (item: ItemObraLista) => void;
  abrirMenuObra: (
    obra: ObraLista,
    item?: ItemObraLista | null,
    categoriaAtual?: CategoriaPerfil,
  ) => Promise<void>;
  alternarCurtidaAnotacaoListas: (item: ItemObraLista) => Promise<void>;
  anotacoesAbertas: Record<string, boolean>;
  anotacoesSpoilerReveladas: Record<string, boolean>;
  interacoesAnotacoes: InteracoesAnotacoesListasEstado;
  obraDestacadaId: string;
  perfil: PerfilLista | null;
  perfilEhProprio: boolean;
  preferenciasPerfil: { quemPodeComentarDiario: string };
  relacionamentoPerfil: string;
  setAnotacoesAbertas: Dispatch<SetStateAction<Record<string, boolean>>>;
  setAnotacoesSpoilerReveladas: Dispatch<
    SetStateAction<Record<string, boolean>>
  >;
};

export function useListasProfileItemRenderer({
  abrirComentariosDiario,
  abrirMenuObra,
  alternarCurtidaAnotacaoListas,
  anotacoesAbertas,
  anotacoesSpoilerReveladas,
  interacoesAnotacoes,
  obraDestacadaId,
  perfil,
  perfilEhProprio,
  preferenciasPerfil,
  relacionamentoPerfil,
  setAnotacoesAbertas,
  setAnotacoesSpoilerReveladas,
}: UseListasProfileItemRendererProps) {
  function renderizarItemPerfil(
    item: ItemObraLista,
    categoriaAtual: CategoriaPerfil,
  ) {
    const obra = item.obra;
    const detalheVisivel =
      categoriaAtual === "avaliacoes"
        ? <ListasRatingDetail nota={item.nota} data={item.data} />
        : categoriaAtual === "tudo"
          ? formatarLeituraMesAno(item.ultimaLeituraEm || "")
          : textoSecundarioItem(item, categoriaAtual);
    const anotacaoId = item.anotacaoId?.trim() || "";
    const chaveAnotacao = anotacaoId || obra.id;
    const anotacaoAberta = Boolean(anotacoesAbertas[chaveAnotacao]);
    const spoilerRevelado = Boolean(
      anotacoesSpoilerReveladas[chaveAnotacao],
    );

    function alternarExibicaoAnotacao() {
      const proximoEstado = !anotacaoAberta;

      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacao]: proximoEstado,
      }));

      if (!proximoEstado) {
        setAnotacoesSpoilerReveladas((atuais) => ({
          ...atuais,
          [chaveAnotacao]: false,
        }));
      }
    }
    const interacao = anotacaoId
      ? interacoesAnotacoes[anotacaoId] ||
        criarInteracaoAnotacaoListasVazia()
      : criarInteracaoAnotacaoListasVazia();
    const permissoesAnotacao = obterPermissoesAnotacaoListas({
      item,
      perfilEhProprio,
      relacionamentoPerfil,
      quemPodeComentarDiario: preferenciasPerfil.quemPodeComentarDiario,
    });
    return (
      <ListasProfileWorkRenderer
        key={item.chave}
        annotation={item.anotacao || ""}
        annotationId={anotacaoId}
        annotationOpen={anotacaoAberta}
        annotationSpoiler={Boolean(item.anotacaoSpoiler)}
        authorName={perfil?.nome || "usuário"}
        autor={obra.autor}
        canLikeAnnotation={permissoesAnotacao.podeCurtirAnotacao}
        canSeeComments={permissoesAnotacao.podeVerComentarios}
        className={`historietas-list-row${
          obraDestacadaId === obra.id
            ? " historietas-list-row-highlight"
            : ""
        }`}
        commentCount={interacao.comentarios.length}
        coverStyle={criarCapaStyle(obra.capa)}
        detalhe={detalheVisivel}
        genero={obra.genero}
        hasAnnotation={Boolean(item.anotacao)}
        href={obra.link}
        isAnnotationLiked={interacao.curtiu}
        isSavingAnnotationLike={interacao.salvandoCurtida}
        nota={item.nota}
        onLikeAnnotation={() => void alternarCurtidaAnotacaoListas(item)}
        onOpenComments={() => abrirComentariosDiario(item)}
        onOpenOptions={() => void abrirMenuObra(obra, item, categoriaAtual)}
        onSetSpoilerRevealed={(revelado) =>
          setAnotacoesSpoilerReveladas((atuais) => ({
            ...atuais,
            [chaveAnotacao]: revelado,
          }))
        }
        onToggleAnnotation={alternarExibicaoAnotacao}
        showRating={item.nota > 0 && categoriaAtual !== "avaliacoes"}
        spoilerRevealed={spoilerRevelado}
        titulo={obra.titulo}
        totalCurtidasAnnotation={interacao.totalCurtidas}
        workId={obra.id}
      />
    );
  }

  return { renderizarItemPerfil };
}
