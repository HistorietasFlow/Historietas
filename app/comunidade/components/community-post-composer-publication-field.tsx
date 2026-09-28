import type { RefObject } from "react";
import type { SugestaoPublicacaoComunidade } from "./community-publication-suggestion";
import { SUGESTOES_PUBLICACAO_COMUNIDADE } from "./community-publication-suggestions";
import { CommunityPostComposerField } from "./community-post-composer-field";
import { CommunityPostComposerFieldLabel } from "./community-post-composer-field-label";
import { CommunityPostComposerPublicationHeader } from "./community-post-composer-publication-header";
import { CommunityPostComposerPublicationTools } from "./community-post-composer-publication-tools";
import { CommunityPostComposerPollTemplateButton } from "./community-post-composer-poll-template-button";
import { CommunityPostComposerCharacterCount } from "./community-post-composer-character-count";
import { CommunityPostComposerSuggestionsSection } from "./community-post-composer-suggestions-section";
import { CommunityPostComposerSuggestionsLabel } from "./community-post-composer-suggestions-label";
import { CommunityPostComposerSuggestionsList } from "./community-post-composer-suggestions-list";
import { CommunityPostComposerSuggestionButton } from "./community-post-composer-suggestion-button";
import { CommunityPostComposerTextarea } from "./community-post-composer-textarea";

type CommunityPostComposerPublicationFieldProps = {
  publicandoPost: boolean;
  textoPostRef: RefObject<HTMLTextAreaElement | null>;
  onPrepararEnquete: () => void;
  onAplicarSugestao: (sugestao: SugestaoPublicacaoComunidade) => void;
};

export function CommunityPostComposerPublicationField({
  publicandoPost,
  textoPostRef,
  onPrepararEnquete,
  onAplicarSugestao,
}: CommunityPostComposerPublicationFieldProps) {
  return (
    <CommunityPostComposerField>
      <CommunityPostComposerPublicationHeader>
        <CommunityPostComposerFieldLabel>Publicação</CommunityPostComposerFieldLabel>

        <CommunityPostComposerPublicationTools>
          <CommunityPostComposerPollTemplateButton
            disabled={publicandoPost}
            onClick={onPrepararEnquete}
          >
            Modelo de enquete
          </CommunityPostComposerPollTemplateButton>

          <CommunityPostComposerCharacterCount>
            máx. 700
          </CommunityPostComposerCharacterCount>
        </CommunityPostComposerPublicationTools>
      </CommunityPostComposerPublicationHeader>

      <CommunityPostComposerSuggestionsSection>
        <CommunityPostComposerSuggestionsLabel>
          Sugestões para começar
        </CommunityPostComposerSuggestionsLabel>

        <CommunityPostComposerSuggestionsList>
          {SUGESTOES_PUBLICACAO_COMUNIDADE.map((sugestao) => (
            <CommunityPostComposerSuggestionButton
              key={sugestao.rotulo}
              disabled={publicandoPost}
              onClick={() => onAplicarSugestao(sugestao)}
            >
              {sugestao.rotulo}
            </CommunityPostComposerSuggestionButton>
          ))}
        </CommunityPostComposerSuggestionsList>
      </CommunityPostComposerSuggestionsSection>

      <CommunityPostComposerTextarea
        ref={textoPostRef}
        disabled={publicandoPost}
      />
    </CommunityPostComposerField>
  );
}
