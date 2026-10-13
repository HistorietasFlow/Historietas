import type { CSSProperties } from "react";
import type { PublicacaoComunidadePerfil } from "../types";
import { authorCommunityPostWrapperStyle } from "../styles";
import { ProfileCommunityPostBody } from "./profile-community-post-body";
import { ProfileCommunityPostHeader } from "./profile-community-post-header";
import { ProfileCommunityPostLink } from "./profile-community-post-link";
import { ProfileCommunityPostPollInfo } from "./profile-community-post-poll-info";
import { ProfileCommunityPostReportButton } from "./profile-community-post-report-button";
import { ProfileCommunityPostSummary } from "./profile-community-post-summary";
import { ProfileCommunityPostWork } from "./profile-community-post-work";

type ProfileCommunityPostItemProps = {
  publicacao: PublicacaoComunidadePerfil;
  href: string;
  ariaLabel: string;
  resumo: string;
  totalOpcoesEnquete: number;
  exibirInfoEnquete: boolean;
  exibirObraRelacionada: boolean;
  paddingBottom: CSSProperties["paddingBottom"];
  dateLabel: string;
  showReportButton: boolean;
  onReport: () => void;
};

export function ProfileCommunityPostItem({
  publicacao,
  href,
  ariaLabel,
  resumo,
  totalOpcoesEnquete,
  exibirInfoEnquete,
  exibirObraRelacionada,
  paddingBottom,
  dateLabel,
  showReportButton,
  onReport,
}: ProfileCommunityPostItemProps) {
  return (
    <article style={authorCommunityPostWrapperStyle}>
      <ProfileCommunityPostLink
        href={href}
        paddingBottom={paddingBottom}
        ariaLabel={ariaLabel}
      >
        <ProfileCommunityPostHeader
          typeLabel={publicacao.tipoPublicacao}
          dateLabel={dateLabel}
        />

        <ProfileCommunityPostBody>
          <ProfileCommunityPostSummary>{resumo}</ProfileCommunityPostSummary>

          {exibirInfoEnquete && (
            <ProfileCommunityPostPollInfo>
              Enquete
              <span aria-hidden="true">•</span>
              {totalOpcoesEnquete}{" "}
              opções
            </ProfileCommunityPostPollInfo>
          )}
        </ProfileCommunityPostBody>

        {exibirObraRelacionada && (
          <ProfileCommunityPostWork>
            <span>OBRA</span>
            <strong data-historietas-user-content="true">
              {publicacao.obraRelacionada}
            </strong>
          </ProfileCommunityPostWork>
        )}
      </ProfileCommunityPostLink>

      {showReportButton && (
        <ProfileCommunityPostReportButton onClick={onReport} />
      )}
    </article>
  );
}
