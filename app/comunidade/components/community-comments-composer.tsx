import type { FormEventHandler, RefObject } from "react";
import { deveDesabilitarAcaoComentarioComunidade } from "./community-comment-interaction-status";
import {
  obterAriaLabelReacaoRapidaComunidade,
  obterReacoesRapidasComentarioComunidade,
} from "./community-comments-quick-reaction-label";
import { CommunityCommentsToolsContainer } from "./community-comments-tools-container";
import { CommunityCommentsQuickReactionsContainer } from "./community-comments-quick-reactions-container";
import { CommunityCommentsQuickReactionButton } from "./community-comments-quick-reaction-button";
import { CommunityCommentsFormContainer } from "./community-comments-form-container";
import {
  CommunityCommentsInputAvatar,
  deveExibirInicialAvatarFormularioComentarioComunidade,
  obterAvatarFormularioComentarioComunidade,
  obterInicialAvatarFormularioComentarioComunidade,
} from "./community-comments-input-avatar";
import { CommunityCommentsInputBox } from "./community-comments-input-box";
import { CommunityCommentsTextarea } from "./community-comments-textarea";
import {
  obterAriaLabelEnvioComentarioComunidade,
  obterAriaLabelMencaoComentarioComunidade,
  obterTextoBotaoEnviarComentarioComunidade,
  obterTextoCampoComentarioComunidade,
} from "./community-comments-composer-text";
import {
  deveDesabilitarInteracaoComentarioComunidade,
  envioComentarioEstaAtivoComunidade,
} from "./community-comments-composer-status";
import { CommunityCommentsMentionButton } from "./community-comments-mention-button";
import { CommunityCommentsSendButton } from "./community-comments-send-button";

type CommunityCommentsComposerProps = {
  comentarioRef: RefObject<HTMLTextAreaElement | null>;
  podeComentar: boolean;
  usuarioAvatar: string;
  usuarioNome: string;
  comentarioEnviando: boolean;
  onInserirNoComentario: (valor: string) => void;
  onEnviarComentario: FormEventHandler<HTMLFormElement>;
};

export function CommunityCommentsComposer({
  comentarioRef,
  podeComentar,
  usuarioAvatar,
  usuarioNome,
  comentarioEnviando,
  onInserirNoComentario,
  onEnviarComentario,
}: CommunityCommentsComposerProps) {
  return (
    <>
      <CommunityCommentsToolsContainer>
        <CommunityCommentsQuickReactionsContainer>
          {obterReacoesRapidasComentarioComunidade().map((emoji) => (
            <CommunityCommentsQuickReactionButton
              key={emoji}
              type="button"
              onClick={() => onInserirNoComentario(emoji)}
              disabled={deveDesabilitarAcaoComentarioComunidade(podeComentar)}
              aria-label={obterAriaLabelReacaoRapidaComunidade(emoji)}
            >
              {emoji}
            </CommunityCommentsQuickReactionButton>
          ))}
        </CommunityCommentsQuickReactionsContainer>
      </CommunityCommentsToolsContainer>

      <CommunityCommentsFormContainer onSubmit={onEnviarComentario}>
        <CommunityCommentsInputAvatar
          avatar={obterAvatarFormularioComentarioComunidade(
            podeComentar,
            usuarioAvatar
          )}
        >
          {deveExibirInicialAvatarFormularioComentarioComunidade(
            podeComentar,
            usuarioAvatar
          ) &&
            obterInicialAvatarFormularioComentarioComunidade(
              podeComentar,
              usuarioNome
            )}
        </CommunityCommentsInputAvatar>

        <CommunityCommentsInputBox>
          <CommunityCommentsTextarea
            aria-label={obterTextoCampoComentarioComunidade(podeComentar)}
            ref={comentarioRef}
            placeholder={obterTextoCampoComentarioComunidade(podeComentar)}
            disabled={deveDesabilitarInteracaoComentarioComunidade(
              podeComentar,
              comentarioEnviando
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="send"
            maxLength={420}
            rows={1}
          />
        </CommunityCommentsInputBox>

        <CommunityCommentsMentionButton
          type="button"
          onClick={() => onInserirNoComentario("@")}
          disabled={deveDesabilitarAcaoComentarioComunidade(podeComentar)}
          aria-label={obterAriaLabelMencaoComentarioComunidade()}
        >
          @
        </CommunityCommentsMentionButton>

        <CommunityCommentsSendButton
          type="submit"
          aria-label={obterAriaLabelEnvioComentarioComunidade()}
          disabled={deveDesabilitarInteracaoComentarioComunidade(
            podeComentar,
            comentarioEnviando
          )}
          active={envioComentarioEstaAtivoComunidade(
            podeComentar,
            comentarioEnviando
          )}
        >
          {obterTextoBotaoEnviarComentarioComunidade(comentarioEnviando)}
        </CommunityCommentsSendButton>
      </CommunityCommentsFormContainer>
    </>
  );
}
