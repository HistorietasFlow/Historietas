import { useEffect, useRef } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  obterMensagemErro,
  obterSessaoRecuperacao,
  invalidarContextoRecuperacao,
  type ContextoRecuperacao,
  type EstadoLink,
} from "../lib/redefinir-senha-recovery-utils";
import {
  atualizarSenhaNaSessaoRecuperacao,
  ContextoRecuperacaoObsoleto,
} from "../lib/redefinir-senha-session-mutation";
import type { TranslationKey } from "../lib/redefinir-senha-translations";

type RedefinirSenhaRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

type UseRedefinirSenhaSaveActionParams = {
  router: RedefinirSenhaRouter;
  salvando: boolean;
  estadoLink: EstadoLink;
  contextoRecuperacaoRef: { current: ContextoRecuperacao };
  novaSenha: string;
  confirmacao: string;
  t: (key: TranslationKey) => string;
  setEstadoLink: Dispatch<SetStateAction<EstadoLink>>;
  setErro: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
};

export function useRedefinirSenhaSaveAction({
  router,
  salvando,
  estadoLink,
  contextoRecuperacaoRef,
  novaSenha,
  confirmacao,
  t,
  setEstadoLink,
  setErro,
  setSalvando,
}: UseRedefinirSenhaSaveActionParams) {
  const controleRef = useRef({ ativo: true, ocupado: false });
  useEffect(() => {
    const controle = { ativo: true, ocupado: false };
    controleRef.current = controle;
    return () => { controle.ativo = false; };
  }, []);

  async function salvarNovaSenha(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const controle = controleRef.current;
    const contexto = contextoRecuperacaoRef.current;
    if (!controle.ativo || controle.ocupado || salvando || estadoLink !== "valido" ||
      contexto.estado !== "valido" || !contexto.sessao || contexto.consumido) {
      return;
    }

    setErro("");

    if (novaSenha.length < 8) {
      setErro(t("passwordMin"));
      return;
    }

    if (
      !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novaSenha) ||
      !/\d/.test(novaSenha)
    ) {
      setErro(t("passwordComposition"));
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro(t("passwordMismatch"));
      return;
    }

    const sessaoEsperada = contexto.sessao;
    const estaAtual = () => controle.ativo && contextoRecuperacaoRef.current === contexto &&
      window.location.search === contexto.query && sessaoEsperada.expiraEm > Date.now() / 1000;
    function rejeitarContexto() {
      if (!controle.ativo) return;
      if (contextoRecuperacaoRef.current === contexto) {
        invalidarContextoRecuperacao(contextoRecuperacaoRef);
        setEstadoLink("invalido");
        setErro(t("sessionInvalid"));
      }
    }
    const mesmaSessao = (sessao: Awaited<ReturnType<typeof obterSessaoRecuperacao>>) =>
      sessao?.usuarioId === sessaoEsperada.usuarioId && sessao.sessaoId === sessaoEsperada.sessaoId &&
      sessao.accessToken === sessaoEsperada.accessToken;

    controle.ocupado = true;
    setSalvando(true);
    try {
      const sessaoAtual = await obterSessaoRecuperacao();
      if (!estaAtual()) { rejeitarContexto(); return; }
      if (!mesmaSessao(sessaoAtual)) { rejeitarContexto(); return; }
      contexto.emAlteracao = true;
      const { data, error } = await atualizarSenhaNaSessaoRecuperacao(sessaoEsperada, novaSenha, estaAtual);
      // Registrar confirmação mesmo se um refresh já invalidou a interface.
      if (!error && data.user?.id === sessaoEsperada.usuarioId) contexto.consumido = true;
      if (!estaAtual()) { rejeitarContexto(); return; }
      if (error) { setErro(obterMensagemErro(error, t("genericError"))); return; }
      if (data.user?.id !== sessaoEsperada.usuarioId) { rejeitarContexto(); return; }

      // O contexto confirmado permanece consumido mesmo se o logout falhar.
      const sessaoAntesLogout = await obterSessaoRecuperacao();
      if (!estaAtual()) { rejeitarContexto(); return; }
      if (!mesmaSessao(sessaoAntesLogout)) { rejeitarContexto(); return; }
      contexto.logoutSolicitado = true;
      const { error: erroLogout } = await supabase.auth.signOut();
      if (!estaAtual()) { rejeitarContexto(); return; }
      if (erroLogout) {
        invalidarContextoRecuperacao(contextoRecuperacaoRef);
        setEstadoLink("invalido");
        setErro(t("genericError"));
        return;
      }
      const { data: final, error: erroFinal } = await supabase.auth.getSession();
      if (!estaAtual()) { rejeitarContexto(); return; }
      if (erroFinal || final.session) { rejeitarContexto(); return; }
      router.replace("/login?senhaRedefinida=1");
      router.refresh();
    } catch (error) {
      if (!estaAtual() || error instanceof ContextoRecuperacaoObsoleto) { rejeitarContexto(); return; }
      setErro(obterMensagemErro(error, t("genericError")));
      if (contexto.consumido) {
        invalidarContextoRecuperacao(contextoRecuperacaoRef);
        setEstadoLink("invalido");
      }
    } finally {
      contexto.emAlteracao = false;
      controle.ocupado = false;
      if (controle.ativo) setSalvando(false);
    }
  }

  return { salvarNovaSenha };
}
