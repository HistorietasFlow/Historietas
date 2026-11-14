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
import type { ContextoSeguimentoComunidade } from "./community-user-follow-context";

type SetState<T> = Dispatch<SetStateAction<T>>;

type AlternarSeguirUsuarioBuscaComunidadeParams = {
  usuarioAlvo: UsuarioBuscaComunidade;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  contextoSeguimento: ContextoSeguimentoComunidade;
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
  contextoSeguimento,
  acoesComunidadeRef,
  usuariosSeguidosIds,
  setUsuariosSeguidosIds,
  setUsuarioSeguindoId,
  setErro,
  setFeedbackAcao,
  feedbackTimerRef,
}: AlternarSeguirUsuarioBuscaComunidadeParams) {
  if (!contextoSeguimento.vigente()) return;
  if (!exigirLogin() || !usuario) {
    return;
  }

  if (contextoSeguimento.usuarioId !== usuario.id || usuarioAlvo.id === usuario.id) {
    return;
  }

  const chaveAcao = `seguir-usuario:${usuarioAlvo.id}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  const alteracaoAnterior = contextoSeguimento.alteracoes.get(usuarioAlvo.id);
  const estavaSeguindo = alteracaoAnterior ?? usuariosSeguidosIds.includes(usuarioAlvo.id);
  const deveSeguir = !estavaSeguindo;

  function aplicarSeguimento(ativo: boolean) {
    setUsuariosSeguidosIds((idsAtuais) => ativo
      ? Array.from(new Set([...idsAtuais, usuarioAlvo.id]))
      : idsAtuais.filter((id) => id !== usuarioAlvo.id));
  }

  function reverterSeguimento() {
    if (alteracaoAnterior === undefined) contextoSeguimento.alteracoes.delete(usuarioAlvo.id);
    else contextoSeguimento.alteracoes.set(usuarioAlvo.id, alteracaoAnterior);
    // Uma leitura inicial pode ter terminado durante a escrita. Use essa
    // confirmação sem desfazer alterações de outros alvos ou ações anteriores.
    aplicarSeguimento(alteracaoAnterior ??
      contextoSeguimento.idsCarregados?.includes(usuarioAlvo.id) ?? estavaSeguindo);
  }

  setUsuarioSeguindoId(usuarioAlvo.id);
  contextoSeguimento.alteracoes.set(usuarioAlvo.id, deveSeguir);
  aplicarSeguimento(deveSeguir);

  try {
    const resultado = await salvarSeguindoUsuarioComunidade(
      usuario.id,
      usuarioAlvo.id,
      deveSeguir,
      contextoSeguimento
    );

    if (!contextoSeguimento.vigente()) return;
    if (!resultado.ok) {
      reverterSeguimento();
      setErro(
        resultado.erro || "Não foi possível atualizar este usuário agora."
      );
      return;
    }

    const seguindoAgora = resultado.estado === "seguindo";

    contextoSeguimento.alteracoes.set(usuarioAlvo.id, seguindoAgora);
    aplicarSeguimento(seguindoAgora);
    setErro("");
    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
      resultado.estado === "solicitado"
        ? `Solicitação para seguir ${usuarioAlvo.nome} enviada.`
        : seguindoAgora
        ? `Você começou a seguir ${usuarioAlvo.nome}.`
        : `Você deixou de seguir ${usuarioAlvo.nome}.`
    );
  } catch {
    if (contextoSeguimento.vigente()) {
      reverterSeguimento();
      setErro("Não foi possível atualizar este usuário agora.");
    }
  } finally {
    if (contextoSeguimento.vigente()) {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
      setUsuarioSeguindoId((idAtual) =>
        idAtual === usuarioAlvo.id ? null : idAtual
      );
    }
  }
}
