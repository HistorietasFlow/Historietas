import type { Dispatch, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { salvarSeguindoUsuarioComunidade } from "./community-follow-user-saver";
import type {
  UsuarioBuscaComunidade,
  UsuarioComunidade,
} from "./community-user";

type SetState<T> = Dispatch<SetStateAction<T>>;

type AlternarSeguirUsuarioBuscaComunidadeParams = {
  usuarioAlvo: UsuarioBuscaComunidade;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  acoesComunidadeRef: { current: Set<string> };
  usuariosSeguidosIds: string[];
  setUsuariosSeguidosIds: SetState<string[]>;
  setUsuarioSeguindoId: SetState<string | null>;
  setErro: SetState<string>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
};

export async function alternarSeguirUsuarioBuscaComunidade({
  usuarioAlvo,
  exigirLogin,
  usuario,
  acoesComunidadeRef,
  usuariosSeguidosIds,
  setUsuariosSeguidosIds,
  setUsuarioSeguindoId,
  setErro,
  setFeedbackAcao,
  feedbackTimerRef,
}: AlternarSeguirUsuarioBuscaComunidadeParams) {
  if (!exigirLogin() || !usuario) {
    return;
  }

  if (usuarioAlvo.id === usuario.id) {
    return;
  }

  const chaveAcao = `seguir-usuario:${usuarioAlvo.id}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  const estavaSeguindo = usuariosSeguidosIds.includes(usuarioAlvo.id);
  const deveSeguir = !estavaSeguindo;
  const idsAnteriores = usuariosSeguidosIds;

  setUsuarioSeguindoId(usuarioAlvo.id);
  setUsuariosSeguidosIds((idsAtuais) =>
    deveSeguir
      ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
      : idsAtuais.filter((id) => id !== usuarioAlvo.id)
  );

  try {
    const resultado = await salvarSeguindoUsuarioComunidade(
      usuario.id,
      usuarioAlvo.id,
      deveSeguir
    );

    if (!resultado.ok) {
      setUsuariosSeguidosIds(idsAnteriores);
      setErro(
        resultado.erro || "Não foi possível atualizar este usuário agora."
      );
      return;
    }

    const seguindoAgora = resultado.estado === "seguindo";

    setUsuariosSeguidosIds((idsAtuais) =>
      seguindoAgora
        ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
        : idsAtuais.filter((id) => id !== usuarioAlvo.id)
    );
    setErro("");
    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
      resultado.estado === "solicitado"
        ? `Solicitação para seguir ${usuarioAlvo.nome} enviada.`
        : seguindoAgora
        ? `Você começou a seguir ${usuarioAlvo.nome}.`
        : `Você deixou de seguir ${usuarioAlvo.nome}.`
    );
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    setUsuarioSeguindoId((idAtual) =>
      idAtual === usuarioAlvo.id ? null : idAtual
    );
  }
}
