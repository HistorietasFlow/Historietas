import type { DiarioPerfilItem } from "../types";
import { obterHrefItemDiarioPerfil } from "../lib/profile-diary-item-utils";
import { dataDiarioPerfilFormatada } from "../lib/profile-diary-local-utils";
import { ProfileRecentActivityItem } from "./profile-recent-activity-item";
import { ProfileRecentActivityPanel } from "./profile-recent-activity-panel";

type ProfileAboutRecentActivityProps = {
  expanded: boolean;
  loading: boolean;
  items: DiarioPerfilItem[];
  onToggle: () => void;
};

export function ProfileAboutRecentActivity({
  expanded,
  loading,
  items,
  onToggle,
}: ProfileAboutRecentActivityProps) {
  return (
    <ProfileRecentActivityPanel
      title="Atividade recente"
      toggleLabel={expanded ? "Ocultar" : "Abrir"}
      toggleIcon={expanded ? "↑" : "↓"}
      onToggle={onToggle}
      ariaLabel={expanded ? "Ocultar atividade recente" : "Abrir atividade recente"}
      expanded={expanded}
      getIsLoading={() => loading}
      getIsEmpty={() => items.length === 0}
      renderItems={() =>
        items.slice(0, 8).map((item) => (
          <ProfileRecentActivityItem
            key={`timeline-${item.chave}`}
            href={obterHrefItemDiarioPerfil(item)}
            title={item.titulo}
            description={item.descricao}
            formattedDate={dataDiarioPerfilFormatada(item.data)}
          />
        ))
      }
    />
  );
}
