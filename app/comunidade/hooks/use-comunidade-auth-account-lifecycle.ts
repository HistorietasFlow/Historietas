"use client";

import { useEffect, useEffectEvent } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { prepararPerfilEStatusAdminComunidade } from "../components/community-authenticated-user-preparation";
import { obterNomeUsuario } from "../components/community-user-name";
import type { UsuarioComunidade } from "../components/community-user";
import type { PostComunidade } from "../components/community-post-model";
import type { DenunciaAlvoComunidade } from "../components/community-report-target";
import type { ResultadoVotosEnquete } from "../components/community-poll-votes-result";
import { erroEhSessaoAusenteComunidade } from "../components/community-supabase-missing-session-error-check";
import { obterUsuarioAutenticadoComunidadeAtual } from "../components/community-supabase-current-user-loader";
import { obterParametroObraComunidade } from "../components/community-url-parameters";

type SetState<T> = Dispatch<SetStateAction<T>>;

function criarControleIdentidadeComunidade() {
  let identidadeAtual: string | null = null;
  let identidadePendente = "";
  let possuiIdentidadePendente = false;

  function aplicarIdentidade(usuarioId: string) {
    if (identidadeAtual === usuarioId) {
      return null;
    }

    identidadeAtual = usuarioId;
    return usuarioId;
  }

  function aplicarIdentidadePendente() {
    if (!possuiIdentidadePendente) {
      return null;
    }

    possuiIdentidadePendente = false;
    return aplicarIdentidade(identidadePendente);
  }

  function obterIdentidadeAtual() {
    return identidadeAtual;
  }

  function resolverIdentidadeInicial(usuarioId: string) {
    let identidadeAlterada: string | null = null;

    if (identidadeAtual === null) {
      identidadeAtual = usuarioId;
    } else {
      identidadeAlterada = aplicarIdentidade(usuarioId);
    }

    return aplicarIdentidadePendente() ?? identidadeAlterada;
  }

  function registrarSessaoInicial(usuarioId: string) {
    if (identidadeAtual !== null) {
      return null;
    }

    identidadeAtual = usuarioId;
    return aplicarIdentidadePendente();
  }

  function processarEvento(evento: string, usuarioId: string) {
    if (evento === "INITIAL_SESSION") {
      return registrarSessaoInicial(usuarioId);
    }

    if (identidadeAtual === null) {
      identidadePendente = usuarioId;
      possuiIdentidadePendente = true;
      return null;
    }

    return aplicarIdentidade(usuarioId);
  }

  return {
    obterIdentidadeAtual,
    resolverIdentidadeInicial,
    processarEvento,
  };
}

type UseComunidadeAuthAccountLifecycleOptions = {
  autenticacaoComunidadeVersaoRef: RefObject<number>;
  reviewsDiarioSincronizadasRef: RefObject<Set<string>>;
  usuarioReviewsDiarioRef: RefObject<string>;
  acoesComunidadeRef: RefObject<Set<string>>;
  textoPostRef: RefObject<HTMLTextAreaElement | null>;
  obraRelacionadaRef: RefObject<HTMLInputElement | null>;
  setUsuario: SetState<UsuarioComunidade | null>;
  setUsuarioEhAdmin: SetState<boolean>;
  setCarregandoUsuario: SetState<boolean>;
  setPostMenuAbertoId: SetState<string | null>;
  setMenuAcoesRapidasComunidadeAberto: SetState<boolean>;
  setComposerAberto: SetState<boolean>;
  setComentariosPostId: SetState<string | null>;
  setPostsSalvosIds: SetState<string[]>;
  setVotosEnquetes: SetState<Record<string, string>>;
  setResultadosEnquetes: SetState<ResultadoVotosEnquete>;
  setUsuariosSeguidosIds: SetState<string[]>;
  setUsuarioSeguindoId: SetState<string | null>;
  setPostCurtindoId: SetState<string | null>;
  setPostSalvandoId: SetState<string | null>;
  setPostCompartilhandoId: SetState<string | null>;
  setPostRemovendoId: SetState<string | null>;
  setPostFixandoId: SetState<string | null>;
  setDenunciaAlvo: SetState<DenunciaAlvoComunidade | null>;
  setFeedbackAcao: SetState<string>;
  setObraRelacionadaBusca: SetState<string>;
  setCapituloRelacionadoPost: SetState<string>;
  setSugestoesObrasAbertas: SetState<boolean>;
  setPosts: SetState<PostComunidade[]>;
  setCarregandoFeed: SetState<boolean>;
  carregarPostsComunidade: (
    mostrarCarregamento: boolean,
    pagina: number,
    obraFiltro: string,
  ) => unknown;
};

export function useComunidadeAuthAccountLifecycle({
  autenticacaoComunidadeVersaoRef,
  reviewsDiarioSincronizadasRef,
  usuarioReviewsDiarioRef,
  acoesComunidadeRef,
  textoPostRef,
  obraRelacionadaRef,
  setUsuario,
  setUsuarioEhAdmin,
  setCarregandoUsuario,
  setPostMenuAbertoId,
  setMenuAcoesRapidasComunidadeAberto,
  setComposerAberto,
  setComentariosPostId,
  setPostsSalvosIds,
  setVotosEnquetes,
  setResultadosEnquetes,
  setUsuariosSeguidosIds,
  setUsuarioSeguindoId,
  setPostCurtindoId,
  setPostSalvandoId,
  setPostCompartilhandoId,
  setPostRemovendoId,
  setPostFixandoId,
  setDenunciaAlvo,
  setFeedbackAcao,
  setObraRelacionadaBusca,
  setCapituloRelacionadoPost,
  setSugestoesObrasAbertas,
  setPosts,
  setCarregandoFeed,
  carregarPostsComunidade,
}: UseComunidadeAuthAccountLifecycleOptions) {
  const carregarPostsComunidadeNoEfeito = useEffectEvent(
    (mostrarCarregamento: boolean, pagina: number, obraFiltro: string) =>
      carregarPostsComunidade(mostrarCarregamento, pagina, obraFiltro),
  );

  useEffect(() => {
    let cancelado = false;
    const timersAutenticacao = new Set<number>();
    const controleIdentidade = criarControleIdentidadeComunidade();

    function limparEstadoContaAnterior() {
      setUsuario(null);
      setUsuarioEhAdmin(false);
      setPostMenuAbertoId(null);
      setMenuAcoesRapidasComunidadeAberto(false);
      setComposerAberto(false);
      setComentariosPostId(null);
      setPostsSalvosIds([]);
      setVotosEnquetes({});
      setResultadosEnquetes({});
      setUsuariosSeguidosIds([]);
      setUsuarioSeguindoId(null);
      setPostCurtindoId(null);
      setPostSalvandoId(null);
      setPostCompartilhandoId(null);
      setPostRemovendoId(null);
      setPostFixandoId(null);
      setDenunciaAlvo(null);
      setFeedbackAcao("");
      setObraRelacionadaBusca("");
      setCapituloRelacionadoPost("");
      setSugestoesObrasAbertas(false);
      reviewsDiarioSincronizadasRef.current.clear();
      usuarioReviewsDiarioRef.current = "";
      acoesComunidadeRef.current.clear();

      if (textoPostRef.current) {
        textoPostRef.current.value = "";
      }

      if (obraRelacionadaRef.current) {
        obraRelacionadaRef.current.value = "";
      }
    }

    function agendarMudancaIdentidade(usuarioId: string) {
      autenticacaoComunidadeVersaoRef.current += 1;
      limparEstadoContaAnterior();
      setCarregandoUsuario(true);
      setPosts([]);
      setCarregandoFeed(true);

      timersAutenticacao.forEach((timer) => window.clearTimeout(timer));
      timersAutenticacao.clear();

      const timer = window.setTimeout(() => {
        timersAutenticacao.delete(timer);

        if (
          cancelado ||
          controleIdentidade.obterIdentidadeAtual() !== usuarioId
        ) {
          return;
        }

        void carregarUsuario();

        const obraFiltroUrl = obterParametroObraComunidade(
          new URLSearchParams(window.location.search),
        );

        void carregarPostsComunidadeNoEfeito(true, 0, obraFiltroUrl);
      }, 0);

      timersAutenticacao.add(timer);
    }

    function resolverIdentidadeInicial(usuarioId: string) {
      const identidadeAlterada =
        controleIdentidade.resolverIdentidadeInicial(usuarioId);

      if (identidadeAlterada !== null) {
        agendarMudancaIdentidade(identidadeAlterada);
        return true;
      }

      return false;
    }

    async function carregarUsuario() {
      const versaoCarregamento =
        autenticacaoComunidadeVersaoRef.current + 1;

      autenticacaoComunidadeVersaoRef.current = versaoCarregamento;
      setCarregandoUsuario(true);

      try {
        const { data, error: usuarioErro } = await supabase.auth.getUser();

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current
        ) {
          return;
        }

        if (usuarioErro) {
          if (!erroEhSessaoAusenteComunidade(usuarioErro)) {
            console.warn(
              "Não consegui carregar usuário da Comunidade:",
              usuarioErro.message,
            );
          }

          if (
            erroEhSessaoAusenteComunidade(usuarioErro) &&
            resolverIdentidadeInicial("")
          ) {
            return;
          }

          setUsuario(null);
          setUsuarioEhAdmin(false);
          return;
        }

        const user = data.user || null;

        if (resolverIdentidadeInicial(user?.id || "")) {
          return;
        }

        if (!user) {
          setUsuario(null);
          setUsuarioEhAdmin(false);
          return;
        }

        const { nomeProfile, avatarProfile, usuarioAdmin } =
          await prepararPerfilEStatusAdminComunidade(user.id);

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current
        ) {
          return;
        }

        const usuarioConfirmado = await obterUsuarioAutenticadoComunidadeAtual();

        if (
          cancelado ||
          versaoCarregamento !== autenticacaoComunidadeVersaoRef.current ||
          !usuarioConfirmado ||
          usuarioConfirmado.id !== user.id
        ) {
          return;
        }

        setUsuarioEhAdmin(usuarioAdmin);
        setUsuario({
          id: user.id,
          email: user.email || "",
          nome: obterNomeUsuario(user.email || "", nomeProfile),
          avatar: avatarProfile,
        });
      } catch (error) {
        if (!erroEhSessaoAusenteComunidade(error)) {
          console.warn("Não consegui iniciar usuário da Comunidade:", error);
        }

        if (
          !cancelado &&
          versaoCarregamento === autenticacaoComunidadeVersaoRef.current
        ) {
          if (
            erroEhSessaoAusenteComunidade(error) &&
            resolverIdentidadeInicial("")
          ) {
            return;
          }

          setUsuario(null);
          setUsuarioEhAdmin(false);
        }
      } finally {
        if (
          !cancelado &&
          versaoCarregamento === autenticacaoComunidadeVersaoRef.current
        ) {
          setCarregandoUsuario(false);
        }
      }
    }

    void carregarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const identidadeAlterada = controleIdentidade.processarEvento(
        event,
        session?.user?.id || "",
      );

      if (identidadeAlterada === null) {
        return;
      }

      agendarMudancaIdentidade(identidadeAlterada);
    });

    return () => {
      cancelado = true;
      autenticacaoComunidadeVersaoRef.current += 1;
      timersAutenticacao.forEach((timer) => window.clearTimeout(timer));
      timersAutenticacao.clear();
      subscription.unsubscribe();
    };
  }, [
    acoesComunidadeRef,
    autenticacaoComunidadeVersaoRef,
    obraRelacionadaRef,
    reviewsDiarioSincronizadasRef,
    setCapituloRelacionadoPost,
    setCarregandoFeed,
    setCarregandoUsuario,
    setComentariosPostId,
    setComposerAberto,
    setDenunciaAlvo,
    setFeedbackAcao,
    setMenuAcoesRapidasComunidadeAberto,
    setObraRelacionadaBusca,
    setPostCompartilhandoId,
    setPostCurtindoId,
    setPostFixandoId,
    setPostMenuAbertoId,
    setPostRemovendoId,
    setPostSalvandoId,
    setPosts,
    setPostsSalvosIds,
    setResultadosEnquetes,
    setSugestoesObrasAbertas,
    setUsuario,
    setUsuarioEhAdmin,
    setUsuarioSeguindoId,
    setUsuariosSeguidosIds,
    setVotosEnquetes,
    textoPostRef,
    usuarioReviewsDiarioRef,
  ]);
}
