"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  criarInteracaoAnotacaoListasVazia,
  type InteracaoAnotacaoListas,
} from "../lib/listas-diary-comment-utils";
import {
  normalizarQuemPodeComentarAnotacaoListas,
  normalizarTipoDiarioListas,
  normalizarVisibilidadeAnotacaoListas,
  normalizarVisibilidadeComentariosAnotacaoListas,
  obterTipoDiarioDoItemListas,
} from "../lib/listas-diary-normalizer-utils";
import {
  atualizarRegistroAnotacaoListas,
  buscarRegistroAnotacaoExistenteListas,
  inserirRegistroAnotacaoListas,
  removerAnotacoesDuplicadasListas,
  removerRegistroAnotacaoListas,
  type RegistroAnotacaoListas,
} from "../lib/listas-diary-annotation-persistence";
import {
  removerAnotacaoLocalListas,
  salvarAnotacaoLocalListas,
} from "../lib/listas-diary-annotation-utils";
import { idUsuarioValido, pegarBooleanoListas, pegarTexto } from "../lib/listas-value-utils";

type EditorAnotacaoBase = {
  aberto: boolean;
  obraId: string;
  anotacaoId: string;
  tipo: string;
  texto: string;
  visibilidade: "publico" | "parcial" | "privado";
  quemPodeComentar: "herdar" | "todos" | "seguidores" | "ninguem";
  visibilidadeComentarios: "herdar" | "publico" | "seguidores" | "somente_eu";
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  salvando: boolean;
  erro: string;
};

type ItemAnotacaoBase = {
  obra: { id: string };
  categorias: string[];
  anotacao?: string;
  anotacaoId?: string;
  anotacaoTipo?: string;
  anotacaoVisibilidade?: string;
  anotacaoQuemPodeComentar?: string;
  anotacaoVisibilidadeComentarios?: string;
  anotacaoPermitirCurtidas?: boolean;
  anotacaoSpoiler?: boolean;
};

type PreferenciasAnotacaoListas = {
  anotacoesPrivadasPorPadrao: boolean;
  visibilidadeDiario: string;
};

type UseListasDiaryAnnotationActionsProps<
  TItem extends ItemAnotacaoBase,
  TListas extends Record<string, TItem[]>,
  TEditor extends EditorAnotacaoBase,
> = {
  categoriaMenuAberta: string;
  diarioAnotacaoMaxLength: number;
  editorAnotacao: TEditor;
  editorAnotacaoVazio: TEditor;
  interacoesAnotacoes: Record<string, InteracaoAnotacaoListas>;
  itemPerfilMenuAberto: TItem | null;
  obraMenuAberta: { id: string } | null;
  perfilEhProprio: boolean;
  preferenciasPerfil: PreferenciasAnotacaoListas;
  setAnotacoesAbertas: Dispatch<SetStateAction<Record<string, boolean>>>;
  setAnotacoesSpoilerReveladas: Dispatch<SetStateAction<Record<string, boolean>>>;
  setEditorAnotacao: Dispatch<SetStateAction<TEditor>>;
  setInteracoesAnotacoes: Dispatch<
    SetStateAction<Record<string, InteracaoAnotacaoListas>>
  >;
  setItemPerfilMenuAberto: Dispatch<SetStateAction<TItem | null>>;
  setListasPerfil: Dispatch<SetStateAction<TListas>>;
  setMensagemAcao: (mensagem: string) => void;
  usuarioAtualId: string;
};

export function useListasDiaryAnnotationActions<
  TItem extends ItemAnotacaoBase,
  TListas extends Record<string, TItem[]>,
  TEditor extends EditorAnotacaoBase,
>({
  categoriaMenuAberta,
  diarioAnotacaoMaxLength,
  editorAnotacao,
  editorAnotacaoVazio,
  interacoesAnotacoes,
  itemPerfilMenuAberto,
  obraMenuAberta,
  perfilEhProprio,
  preferenciasPerfil,
  setAnotacoesAbertas,
  setAnotacoesSpoilerReveladas,
  setEditorAnotacao,
  setInteracoesAnotacoes,
  setItemPerfilMenuAberto,
  setListasPerfil,
  setMensagemAcao,
  usuarioAtualId,
}: UseListasDiaryAnnotationActionsProps<TItem, TListas, TEditor>) {
  function atualizarAnotacaoNosItensListas(
    obraId: string,
    atualizacao: Partial<TItem>,
  ) {
    setListasPerfil((estadoAtual) => {
      const proximo: Record<string, TItem[]> = { ...estadoAtual };

      Object.keys(proximo).forEach((categoriaEstado) => {
        proximo[categoriaEstado] = proximo[categoriaEstado].map((item) =>
          item.obra.id === obraId ? ({ ...item, ...atualizacao } as TItem) : item,
        );
      });

      return proximo as TListas;
    });

    setItemPerfilMenuAberto((itemAtual) =>
      itemAtual?.obra.id === obraId
        ? ({ ...itemAtual, ...atualizacao } as TItem)
        : itemAtual,
    );
  }

  function abrirEditorAnotacaoListas() {
    const item = itemPerfilMenuAberto;
    const obra = obraMenuAberta;

    if (!item || !obra || !perfilEhProprio || !idUsuarioValido(obra.id)) {
      setMensagemAcao("Você só pode editar anotações da sua própria lista.");
      return;
    }

    setEditorAnotacao({
      aberto: true,
      obraId: obra.id,
      anotacaoId: item.anotacaoId?.trim() || "",
      tipo:
        item.anotacaoTipo ||
        obterTipoDiarioDoItemListas(categoriaMenuAberta, item),
      texto: item.anotacao || "",
      visibilidade:
        item.anotacaoVisibilidade ||
        (preferenciasPerfil.anotacoesPrivadasPorPadrao
          ? "privado"
          : preferenciasPerfil.visibilidadeDiario === "publico"
            ? "publico"
            : "parcial"),
      quemPodeComentar: item.anotacaoQuemPodeComentar || "herdar",
      visibilidadeComentarios:
        item.anotacaoVisibilidadeComentarios || "herdar",
      permitirCurtidas: item.anotacaoPermitirCurtidas !== false,
      contemSpoiler: Boolean(item.anotacaoSpoiler),
      salvando: false,
      erro: "",
    } as TEditor);
  }

  async function salvarAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();
    const textoAnotacao = editorAnotacao.texto.trim();

    if (!perfilEhProprio || !userId || !idUsuarioValido(userId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Entre na sua conta para salvar a anotação.",
      }));
      return;
    }

    if (!obraId || !idUsuarioValido(obraId)) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "A obra ainda não possui um ID válido no Supabase.",
      }));
      return;
    }

    if (!textoAnotacao) {
      setEditorAnotacao((atual) => ({
        ...atual,
        erro: "Escreva uma anotação antes de salvar.",
      }));
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      const atualizadoEm = new Date().toISOString();
      const visibilidadeHerdada = editorAnotacao.visibilidade;
      const payload = {
        user_id: userId,
        obra_id: obraId,
        tipo: editorAnotacao.tipo,
        texto: textoAnotacao.slice(0, diarioAnotacaoMaxLength),
        visibilidade: visibilidadeHerdada,
        quem_pode_comentar: editorAnotacao.quemPodeComentar,
        visibilidade_comentarios: editorAnotacao.visibilidadeComentarios,
        permitir_curtidas: editorAnotacao.permitirCurtidas,
        contem_spoiler: editorAnotacao.contemSpoiler,
        atualizado_em: atualizadoEm,
      };

      let registroSalvo: RegistroAnotacaoListas | null = null;

      if (editorAnotacao.anotacaoId) {
        registroSalvo = await atualizarRegistroAnotacaoListas(
          editorAnotacao.anotacaoId,
          userId,
          payload,
        );
      }

      if (!registroSalvo) {
        const anotacaoExistente = await buscarRegistroAnotacaoExistenteListas(
          userId,
          obraId,
        );
        const idExistente = pegarTexto(anotacaoExistente?.id);

        registroSalvo = idExistente
          ? await atualizarRegistroAnotacaoListas(idExistente, userId, payload)
          : await inserirRegistroAnotacaoListas(payload);
      }

      if (!registroSalvo) {
        throw new Error("O banco não confirmou a anotação salva.");
      }

      const anotacaoId = pegarTexto(registroSalvo.id);
      const tipoSalvo =
        normalizarTipoDiarioListas(registroSalvo.tipo) || editorAnotacao.tipo;
      const visibilidadeSalva = normalizarVisibilidadeAnotacaoListas(
        registroSalvo.visibilidade,
        visibilidadeHerdada,
      );
      const textoSalvo = pegarTexto(registroSalvo.texto, payload.texto);
      const quemPodeComentarSalvo = normalizarQuemPodeComentarAnotacaoListas(
        registroSalvo.quem_pode_comentar ?? registroSalvo.quemPodeComentar,
        editorAnotacao.quemPodeComentar,
      );
      const visibilidadeComentariosSalva =
        normalizarVisibilidadeComentariosAnotacaoListas(
          registroSalvo.visibilidade_comentarios ??
            registroSalvo.visibilidadeComentarios,
          editorAnotacao.visibilidadeComentarios,
        );
      const permitirCurtidasSalvo = pegarBooleanoListas(
        registroSalvo.permitir_curtidas ?? registroSalvo.permitirCurtidas,
        editorAnotacao.permitirCurtidas,
      );
      const contemSpoilerSalvo = pegarBooleanoListas(
        registroSalvo.contem_spoiler ?? registroSalvo.contemSpoiler,
        editorAnotacao.contemSpoiler,
      );

      if (anotacaoId) {
        await removerAnotacoesDuplicadasListas(userId, obraId, anotacaoId);
      }

      salvarAnotacaoLocalListas(userId, {
        id: anotacaoId,
        user_id: userId,
        obra_id: obraId,
        tipo: tipoSalvo,
        texto: textoSalvo,
        visibilidade: visibilidadeSalva,
        quem_pode_comentar: quemPodeComentarSalvo,
        visibilidade_comentarios: visibilidadeComentariosSalva,
        permitir_curtidas: permitirCurtidasSalvo,
        contem_spoiler: contemSpoilerSalvo,
        atualizado_em: pegarTexto(registroSalvo.atualizado_em, atualizadoEm),
      });

      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: textoSalvo,
        anotacaoId,
        anotacaoTipo: tipoSalvo,
        anotacaoVisibilidade: visibilidadeSalva,
        anotacaoQuemPodeComentar: quemPodeComentarSalvo,
        anotacaoVisibilidadeComentarios: visibilidadeComentariosSalva,
        anotacaoPermitirCurtidas: permitirCurtidasSalvo,
        anotacaoSpoiler: contemSpoilerSalvo,
      } as Partial<TItem>);

      const chaveAnotacaoSalva = anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));
      setAnotacoesSpoilerReveladas((atuais) => ({
        ...atuais,
        [chaveAnotacaoSalva]: false,
      }));

      if (anotacaoId && !interacoesAnotacoes[anotacaoId]) {
        setInteracoesAnotacoes((atual) => ({
          ...atual,
          [anotacaoId]: criarInteracaoAnotacaoListasVazia(),
        }));
      }

      setEditorAnotacao(editorAnotacaoVazio);
      setMensagemAcao("Anotação salva.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a anotação.",
      }));
    }
  }

  async function removerAnotacaoListas() {
    const userId = usuarioAtualId.trim();
    const obraId = editorAnotacao.obraId.trim();

    if (
      !perfilEhProprio ||
      !userId ||
      !obraId ||
      !window.confirm("Remover esta anotação?")
    ) {
      return;
    }

    setEditorAnotacao((atual) => ({ ...atual, salvando: true, erro: "" }));

    try {
      await removerRegistroAnotacaoListas(userId, obraId);

      removerAnotacaoLocalListas(userId, obraId);
      atualizarAnotacaoNosItensListas(obraId, {
        anotacao: undefined,
        anotacaoId: undefined,
        anotacaoTipo: undefined,
        anotacaoVisibilidade: undefined,
        anotacaoQuemPodeComentar: undefined,
        anotacaoVisibilidadeComentarios: undefined,
        anotacaoPermitirCurtidas: undefined,
        anotacaoSpoiler: undefined,
      } as Partial<TItem>);
      const chaveAnotacaoRemovida = editorAnotacao.anotacaoId || obraId;
      setAnotacoesAbertas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setAnotacoesSpoilerReveladas((atuais) => {
        const proximo = { ...atuais };
        delete proximo[chaveAnotacaoRemovida];
        return proximo;
      });
      setEditorAnotacao(editorAnotacaoVazio);
      setMensagemAcao("Anotação removida.");
    } catch (error) {
      setEditorAnotacao((atual) => ({
        ...atual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a anotação.",
      }));
    }
  }

  return {
    atualizarAnotacaoNosItensListas,
    abrirEditorAnotacaoListas,
    salvarAnotacaoListas,
    removerAnotacaoListas,
  };
}
