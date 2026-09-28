import { createPortal } from "react-dom";
import {
  obterTextoBotaoCompartilharPostComunidade,
  obterTextoBotaoDenunciarPostComunidade,
  obterTextoBotaoFixarPostComunidade,
  obterTextoBotaoRemoverPostComunidade,
  obterTextoBotaoSalvarPostComunidade,
} from "./community-post-action-text";
import type { PostComunidade } from "./community-post-model";
import { CommunityPostOptionsButton } from "./community-post-options-button";
import { CommunityPostOptionsContainer } from "./community-post-options-container";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import { VISIBILIDADES_POST_COMUNIDADE } from "./community-post-visibility-options";
import { CommunitySheetDangerAction } from "./community-sheet-danger-action";
import { CommunitySheetHandle } from "./community-sheet-handle";
import { CommunitySheetMenuAction } from "./community-sheet-menu-action";
import { CommunitySheetOverlay } from "./community-sheet-overlay";
import { CommunitySheetSurface } from "./community-sheet-surface";
import { CommunitySheetTitle } from "./community-sheet-title";
import { CommunitySheetVisibilityMenu } from "./community-sheet-visibility-menu";
import { CommunitySheetVisibilityOption } from "./community-sheet-visibility-option";
import { CommunitySheetVisibilityTitle } from "./community-sheet-visibility-title";

type CommunityPostOptionsMenuProps = {
  post: PostComunidade;
  postMenuAbertoId: string | null;
  menuOpcoesAberto: boolean;
  postSalvo: boolean;
  postSalvando: boolean;
  postCompartilhando: boolean;
  podeAlterarVisibilidade: boolean;
  postVisibilidadeAtualizando: boolean;
  usuarioEhAdmin: boolean;
  postFixando: boolean;
  podeRemover: boolean;
  postRemovendo: boolean;
  podeDenunciarPost: boolean;
  postDenunciando: boolean;
  onAlternarMenu: () => void;
  onFecharMenu: () => void;
  onSalvar: () => void;
  onCompartilhar: () => void;
  onAtualizarVisibilidade: (
    visibilidade: VisibilidadePostComunidade
  ) => void;
  onAlternarFixado: () => void;
  onRemover: () => void;
  onDenunciar: () => void;
};

export function CommunityPostOptionsMenu({
  post,
  postMenuAbertoId,
  menuOpcoesAberto,
  postSalvo,
  postSalvando,
  postCompartilhando,
  podeAlterarVisibilidade,
  postVisibilidadeAtualizando,
  usuarioEhAdmin,
  postFixando,
  podeRemover,
  postRemovendo,
  podeDenunciarPost,
  postDenunciando,
  onAlternarMenu,
  onFecharMenu,
  onSalvar,
  onCompartilhar,
  onAtualizarVisibilidade,
  onAlternarFixado,
  onRemover,
  onDenunciar,
}: CommunityPostOptionsMenuProps) {
  return (
    <CommunityPostOptionsContainer>
      <CommunityPostOptionsButton
        type="button"
        aria-label="Abrir opções da publicação"
        aria-haspopup="menu"
        aria-expanded={menuOpcoesAberto}
        onClick={() => onAlternarMenu()}
        menuOpen={Boolean(postMenuAbertoId)}
      >
        ⋮
      </CommunityPostOptionsButton>

      {menuOpcoesAberto && typeof document !== "undefined"
        ? createPortal(
            <CommunitySheetOverlay
              ariaLabel="Ações da publicação"
              closeAriaLabel="Fechar ações da publicação"
              onClose={() => onFecharMenu()}
            >
              <CommunitySheetSurface role="menu">
                <CommunitySheetHandle />

                <CommunitySheetTitle>
                  Ações da publicação
                </CommunitySheetTitle>

                <CommunitySheetMenuAction
                  onClick={() => onSalvar()}
                  disabled={postSalvando}
                >
                  {obterTextoBotaoSalvarPostComunidade(
                    postSalvando,
                    postSalvo
                  )}
                </CommunitySheetMenuAction>

                <CommunitySheetMenuAction
                  onClick={() => onCompartilhar()}
                  disabled={postCompartilhando}
                >
                  {obterTextoBotaoCompartilharPostComunidade(
                    postCompartilhando
                  )}
                </CommunitySheetMenuAction>

                {podeAlterarVisibilidade && (
                  <CommunitySheetVisibilityMenu>
                    <CommunitySheetVisibilityTitle>
                      Quem pode ver esta publicação?
                    </CommunitySheetVisibilityTitle>

                    {VISIBILIDADES_POST_COMUNIDADE.map((opcao) => {
                      const ativa = post.visibilidade === opcao.valor;

                      return (
                        <CommunitySheetVisibilityOption
                          key={`${post.id}-visibilidade-${opcao.valor}`}
                          active={ativa}
                          onClick={() =>
                            onAtualizarVisibilidade(opcao.valor)
                          }
                          disabled={postVisibilidadeAtualizando}
                        >
                          {opcao.rotulo}
                        </CommunitySheetVisibilityOption>
                      );
                    })}
                  </CommunitySheetVisibilityMenu>
                )}

                {usuarioEhAdmin && (
                  <CommunitySheetMenuAction
                    onClick={() => onAlternarFixado()}
                    disabled={postFixando}
                  >
                    {obterTextoBotaoFixarPostComunidade(
                      postFixando,
                      post
                    )}
                  </CommunitySheetMenuAction>
                )}

                {podeRemover && (
                  <CommunitySheetDangerAction
                    onClick={() => onRemover()}
                    disabled={postRemovendo}
                  >
                    {obterTextoBotaoRemoverPostComunidade(
                      postRemovendo
                    )}
                  </CommunitySheetDangerAction>
                )}

                {podeDenunciarPost && (
                  <CommunitySheetDangerAction
                    onClick={() => onDenunciar()}
                    disabled={postDenunciando}
                  >
                    {obterTextoBotaoDenunciarPostComunidade(
                      postDenunciando
                    )}
                  </CommunitySheetDangerAction>
                )}
              </CommunitySheetSurface>
            </CommunitySheetOverlay>,
            document.body
          )
        : null}
    </CommunityPostOptionsContainer>
  );
}
