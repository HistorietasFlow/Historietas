import { ProfileHighlightItem } from "../components/profile-highlight-item";
import { obterHrefObraPerfilAutor } from "../lib/profile-work-display-utils";
import { criarCapaDestaquePerfilAutor } from "../styles";
import type { ObraLocal } from "../types";

export function usePerfilAutorHighlightRenderer() {
  function renderizarObraDestaquePerfilAutor(obra: ObraLocal) {
    const obraHref = obterHrefObraPerfilAutor(obra);

    return (
      <ProfileHighlightItem
        key={`destaque-${obra.id}`}
        href={obraHref}
        titulo={obra.titulo}
        capaStyle={criarCapaDestaquePerfilAutor(obra.capa)}
      />
    );
  }

  return { renderizarObraDestaquePerfilAutor };
}
