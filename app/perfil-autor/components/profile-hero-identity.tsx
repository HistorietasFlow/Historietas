import type { HistorietasLanguage } from "../../../lib/i18n";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileHeaderInfo } from "./profile-header-info";
import { ProfileStats } from "./profile-stats";

type ProfileHeroIdentityProps = {
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
};

export function ProfileHeroIdentity({
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
}: ProfileHeroIdentityProps) {
  return (
    <>
      <ProfileAvatar
        autorNome={autorNome}
        avatar={avatar}
        isDesktop={isDesktop}
        podeEditar={podeEditar}
        onEdit={onEdit}
      />

      <ProfileHeaderInfo autorNome={autorNome} isDesktop={isDesktop}>
        <ProfileStats
          avaliacaoDiarioPrivada={avaliacaoDiarioPrivada}
          avaliacaoEhDiario={avaliacaoEhDiario}
          avaliacaoMedia={avaliacaoMedia}
          avaliacaoTotal={avaliacaoTotal}
          avaliacaoVisivel={avaliacaoVisivel}
          autorNome={autorNome}
          isDesktop={isDesktop}
          language={language}
          obrasSeguidasHref={obrasSeguidasHref}
          obrasSeguidasTotal={obrasSeguidasTotal}
          seguidoresHref={seguidoresHref}
          seguidoresTotal={seguidoresTotal}
          seguindoHref={seguindoHref}
          seguindoTotal={seguindoTotal}
        />
      </ProfileHeaderInfo>
    </>
  );
}
