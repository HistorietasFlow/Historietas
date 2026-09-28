import type { RefObject } from "react";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import { CommunityPostComposerField } from "./community-post-composer-field";
import { CommunityPostComposerFieldLabel } from "./community-post-composer-field-label";
import { CommunityPostComposerInput } from "./community-post-composer-input";
import { getCommunityPostComposerRelatedChapterInputStyle } from "./community-post-composer-related-chapter-input-style";
import { CommunityPostComposerRelatedWorkSearch } from "./community-post-composer-related-work-search";
import { CommunityPostComposerRelatedWorkSuggestions } from "./community-post-composer-related-work-suggestions";
import { CommunityPostComposerRelatedWorkSuggestionButton } from "./community-post-composer-related-work-suggestion-button";
import { CommunityPostComposerRelatedWorkSuggestionContent } from "./community-post-composer-related-work-suggestion-content";
import { CommunityPostComposerRelatedWorkSuggestionTitle } from "./community-post-composer-related-work-suggestion-title";
import { CommunityPostComposerRelatedWorkSuggestionAuthor } from "./community-post-composer-related-work-suggestion-author";
import { CommunityPostComposerRelatedWorkSuggestionBadge } from "./community-post-composer-related-work-suggestion-badge";

type CommunityPostComposerRelatedFieldsProps = {
  publicandoPost: boolean;
  obraRelacionadaBusca: string;
  capituloRelacionadoPost: string;
  sugestoesObrasAbertas: boolean;
  sugestoesObrasRelacionadasVisiveis: ObraRelacionadaSugestao[];
  obraRelacionadaRef: RefObject<HTMLInputElement | null>;
  onAlterarObraRelacionada: (valor: string) => void;
  onFocarObraRelacionada: () => void;
  onDesfocarObraRelacionada: () => void;
  onSelecionarObraRelacionada: (obra: ObraRelacionadaSugestao) => void;
  onAlterarCapituloRelacionado: (valor: string) => void;
};

export function CommunityPostComposerRelatedFields({
  publicandoPost,
  obraRelacionadaBusca,
  capituloRelacionadoPost,
  sugestoesObrasAbertas,
  sugestoesObrasRelacionadasVisiveis,
  obraRelacionadaRef,
  onAlterarObraRelacionada,
  onFocarObraRelacionada,
  onDesfocarObraRelacionada,
  onSelecionarObraRelacionada,
  onAlterarCapituloRelacionado,
}: CommunityPostComposerRelatedFieldsProps) {
  return (
    <>
      <CommunityPostComposerField>
        <CommunityPostComposerFieldLabel>Obra relacionada</CommunityPostComposerFieldLabel>

        <CommunityPostComposerRelatedWorkSearch>
          <CommunityPostComposerInput
            ref={obraRelacionadaRef}
            disabled={publicandoPost}
            value={obraRelacionadaBusca}
            onChange={(event) => onAlterarObraRelacionada(event.target.value)}
            onFocus={onFocarObraRelacionada}
            onBlur={onDesfocarObraRelacionada}
            placeholder="Opcional: nome da obra"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={90}
          />

          {sugestoesObrasAbertas &&
            sugestoesObrasRelacionadasVisiveis.length > 0 && (
              <CommunityPostComposerRelatedWorkSuggestions>
                {sugestoesObrasRelacionadasVisiveis.map((obra) => (
                  <CommunityPostComposerRelatedWorkSuggestionButton
                    key={obra.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelecionarObraRelacionada(obra);
                    }}
                  >
                    <CommunityPostComposerRelatedWorkSuggestionContent>
                      <CommunityPostComposerRelatedWorkSuggestionTitle>
                        {obra.titulo}
                      </CommunityPostComposerRelatedWorkSuggestionTitle>

                      <CommunityPostComposerRelatedWorkSuggestionAuthor>
                        {obra.autor}
                      </CommunityPostComposerRelatedWorkSuggestionAuthor>
                    </CommunityPostComposerRelatedWorkSuggestionContent>

                    <CommunityPostComposerRelatedWorkSuggestionBadge>
                      OBRA
                    </CommunityPostComposerRelatedWorkSuggestionBadge>
                  </CommunityPostComposerRelatedWorkSuggestionButton>
                ))}
              </CommunityPostComposerRelatedWorkSuggestions>
            )}
        </CommunityPostComposerRelatedWorkSearch>
      </CommunityPostComposerField>

      <CommunityPostComposerField>
        <CommunityPostComposerFieldLabel>Capítulo relacionado</CommunityPostComposerFieldLabel>

        <CommunityPostComposerInput
          disabled={publicandoPost || !obraRelacionadaBusca.trim()}
          value={capituloRelacionadoPost}
          onChange={(event) =>
            onAlterarCapituloRelacionado(event.target.value)
          }
          placeholder="Opcional: número ou título do capítulo"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={60}
          style={getCommunityPostComposerRelatedChapterInputStyle(
            Boolean(obraRelacionadaBusca.trim()),
          )}
        />
      </CommunityPostComposerField>
    </>
  );
}
