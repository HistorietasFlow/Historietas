import type {
  ChangeEventHandler,
  CSSProperties,
  RefObject,
} from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { ProfileAvatarInput } from "./profile-avatar-input";
import { ProfileBio } from "./profile-bio";
import { ProfileHeroActions } from "./profile-hero-actions";
import { ProfileHeroIdentity } from "./profile-hero-identity";

type ProfileHeroProps = {
  heroStyle: CSSProperties;
  identityRowStyle: CSSProperties;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  onSelectAvatar: ChangeEventHandler<HTMLInputElement>;
  autorNome: string;
  avatar: string;
  isDesktop: boolean;
  podeEditar: boolean;
  onEdit: () => void;
  avaliacaoDiarioPrivada: boolean;
  avaliacaoEhDiario: boolean;
  avaliacaoMedia: number;
  avaliacaoTotal: number;
  avaliacaoVisivel: boolean;
  language: HistorietasLanguage;
  obrasSeguidasHref: string;
  obrasSeguidasTotal: number;
  seguidoresHref: string;
  seguidoresTotal: number;
  seguindoHref: string;
  seguindoTotal: number;
  bioFallback: string;
  bioPersonalizada: string;
  actionsStyle: CSSProperties;
  mostrarDestaquesAutor: boolean;
  onShare: () => void;
  onToggleOwnerHighlights: () => void;
  existeBloqueio: boolean;
  onFollow: () => void;
  followDisabled: boolean;
  followAriaLabel: string;
  followTitle: string | undefined;
  followBaseStyle: CSSProperties;
  followOpacity: number;
  followCursor: string;
  followLabel: string;
  mostrarDestaquesVisitante: boolean;
  obrasVisiveis: boolean;
  onToggleVisitorHighlights: () => void;
  message: string;
};

export function ProfileHero({
  heroStyle,
  identityRowStyle,
  avatarInputRef,
  onSelectAvatar,
  autorNome,
  avatar,
  isDesktop,
  podeEditar,
  onEdit,
  avaliacaoDiarioPrivada,
  avaliacaoEhDiario,
  avaliacaoMedia,
  avaliacaoTotal,
  avaliacaoVisivel,
  language,
  obrasSeguidasHref,
  obrasSeguidasTotal,
  seguidoresHref,
  seguidoresTotal,
  seguindoHref,
  seguindoTotal,
  bioFallback,
  bioPersonalizada,
  actionsStyle,
  mostrarDestaquesAutor,
  onShare,
  onToggleOwnerHighlights,
  existeBloqueio,
  onFollow,
  followDisabled,
  followAriaLabel,
  followTitle,
  followBaseStyle,
  followOpacity,
  followCursor,
  followLabel,
  mostrarDestaquesVisitante,
  obrasVisiveis,
  onToggleVisitorHighlights,
  message,
}: ProfileHeroProps) {
  return (
    <section style={heroStyle}>
      <div style={identityRowStyle}>
        <ProfileHeroIdentity
          autorNome={autorNome}
          avatar={avatar}
          isDesktop={isDesktop}
          podeEditar={podeEditar}
          onEdit={onEdit}
          avaliacaoDiarioPrivada={avaliacaoDiarioPrivada}
          avaliacaoEhDiario={avaliacaoEhDiario}
          avaliacaoMedia={avaliacaoMedia}
          avaliacaoTotal={avaliacaoTotal}
          avaliacaoVisivel={avaliacaoVisivel}
          language={language}
          obrasSeguidasHref={obrasSeguidasHref}
          obrasSeguidasTotal={obrasSeguidasTotal}
          seguidoresHref={seguidoresHref}
          seguidoresTotal={seguidoresTotal}
          seguindoHref={seguindoHref}
          seguindoTotal={seguindoTotal}
        />
      </div>

      <ProfileBio
        bioFallback={bioFallback}
        bioPersonalizada={bioPersonalizada}
        isDesktop={isDesktop}
        podeEditar={podeEditar}
        onEdit={onEdit}
      />

      <ProfileHeroActions
        actionsStyle={actionsStyle}
        podeEditar={podeEditar}
        mostrarDestaquesAutor={mostrarDestaquesAutor}
        onEdit={onEdit}
        onShare={onShare}
        onToggleOwnerHighlights={onToggleOwnerHighlights}
        existeBloqueio={existeBloqueio}
        onFollow={onFollow}
        followDisabled={followDisabled}
        followAriaLabel={followAriaLabel}
        followTitle={followTitle}
        followBaseStyle={followBaseStyle}
        followOpacity={followOpacity}
        followCursor={followCursor}
        followLabel={followLabel}
        mostrarDestaquesVisitante={mostrarDestaquesVisitante}
        obrasVisiveis={obrasVisiveis}
        onToggleVisitorHighlights={onToggleVisitorHighlights}
        message={message}
      />

      {podeEditar && (
        <ProfileAvatarInput
          avatarInputRef={avatarInputRef}
          onSelectAvatar={onSelectAvatar}
        />
      )}
    </section>
  );
}
