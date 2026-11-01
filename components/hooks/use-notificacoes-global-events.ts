import { useEffect, type MutableRefObject } from "react";

const CONFIGURACOES_ATUALIZADAS_EVENT =
  "historietas:configuracoes-atualizadas";

type UseNotificacoesGlobalEventsParams = {
  usuarioIdRef: MutableRefObject<string>;
  receberAvisosRef: MutableRefObject<boolean>;
  agendarAtualizacaoNotificacoes: (userId: string) => void;
  aplicarReceberAvisos: (ativo: boolean) => void;
  carregarReceberAvisos: (userId: string) => boolean;
  criarChaveConfiguracoesUsuario: (userId: string) => string;
  idUsuarioSupabaseValido: (userId: string) => boolean;
};

export function useNotificacoesGlobalEvents({
  usuarioIdRef,
  receberAvisosRef,
  agendarAtualizacaoNotificacoes,
  aplicarReceberAvisos,
  carregarReceberAvisos,
  criarChaveConfiguracoesUsuario,
  idUsuarioSupabaseValido,
}: UseNotificacoesGlobalEventsParams) {
  useEffect(() => {
    function atualizarAoReceberEventoLocal() {
      const userIdSeguro = usuarioIdRef.current;
      if (
        receberAvisosRef.current &&
        idUsuarioSupabaseValido(userIdSeguro)
      ) {
        agendarAtualizacaoNotificacoes(userIdSeguro);
      }
    }

    function atualizarPreferenciaDeAvisos() {
      const userIdSeguro = usuarioIdRef.current;
      const avisosAtivos = userIdSeguro
        ? carregarReceberAvisos(userIdSeguro)
        : true;

      aplicarReceberAvisos(avisosAtivos);
    }

    function atualizarAoMudarStorage(event: StorageEvent) {
      const chaveEsperada = criarChaveConfiguracoesUsuario(
        usuarioIdRef.current,
      );

      if (chaveEsperada && event.key === chaveEsperada) {
        atualizarPreferenciaDeAvisos();
      }
    }

    function atualizarAoRetomarPagina() {
      if (document.visibilityState !== "visible") {
        return;
      }

      atualizarPreferenciaDeAvisos();
      atualizarAoReceberEventoLocal();
    }

    window.addEventListener(
      "historietas:notificacoes-atualizadas",
      atualizarAoReceberEventoLocal,
    );
    window.addEventListener(
      CONFIGURACOES_ATUALIZADAS_EVENT,
      atualizarPreferenciaDeAvisos,
    );
    window.addEventListener("storage", atualizarAoMudarStorage);
    window.addEventListener("focus", atualizarAoRetomarPagina);
    document.addEventListener("visibilitychange", atualizarAoRetomarPagina);

    return () => {
      window.removeEventListener(
        "historietas:notificacoes-atualizadas",
        atualizarAoReceberEventoLocal,
      );
      window.removeEventListener(
        CONFIGURACOES_ATUALIZADAS_EVENT,
        atualizarPreferenciaDeAvisos,
      );
      window.removeEventListener("storage", atualizarAoMudarStorage);
      window.removeEventListener("focus", atualizarAoRetomarPagina);
      document.removeEventListener(
        "visibilitychange",
        atualizarAoRetomarPagina,
      );
    };
  }, [
    agendarAtualizacaoNotificacoes,
    aplicarReceberAvisos,
    carregarReceberAvisos,
    criarChaveConfiguracoesUsuario,
    idUsuarioSupabaseValido,
    receberAvisosRef,
    usuarioIdRef,
  ]);
}
