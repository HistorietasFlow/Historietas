import { criarLinksComunidadePerfilAutor } from "./profile-community-links";
import {
  obterAriaLabelCopiarUsernamePerfilAutor,
  obterRotuloVisibilidadeUsernamePerfilAutor,
  obterUsernameExibidoPerfilAutor,
} from "./profile-display-utils";
import { obterEstilosResponsivosPerfilAutor } from "../styles";

export function obterEstadoVisualShellPerfilAutor({
  isDesktop,
  podeEditarPerfil,
  usernameCabecalhoVisivel,
  autorHandlePerfil,
  perfilNome,
}: {
  isDesktop: boolean;
  podeEditarPerfil: boolean;
  usernameCabecalhoVisivel: boolean;
  autorHandlePerfil: string;
  perfilNome: string;
}) {
  const {
    containerAtualStyle,
    heroAtualStyle,
    authorTopRowAtualStyle,
    avatarActionsAtualStyle,
    avatarSmallButtonAtualStyle,
    avatarRemoveButtonAtualStyle,
    profileActionsAtualStyle,
    profileVisitorActionsAtualStyle,
    profileHeaderAtualStyle,
    topWaterFadeAtualStyle,
    menuSheetAtualStyle,
  } = obterEstilosResponsivosPerfilAutor(isDesktop);
  const profileActionsExibicaoStyle = podeEditarPerfil
    ? profileActionsAtualStyle
    : profileVisitorActionsAtualStyle;
  const ariaLabelAlternarUsernameCabecalho =
    obterRotuloVisibilidadeUsernamePerfilAutor(usernameCabecalhoVisivel);
  const ariaLabelCopiarUsernameCabecalho =
    obterAriaLabelCopiarUsernamePerfilAutor(autorHandlePerfil);
  const usernameExibidoCabecalho =
    obterUsernameExibidoPerfilAutor(autorHandlePerfil);
  const {
    geral: comunidadeAutorHref,
    teorias: comunidadeAutorTeoriasHref,
    reviews: comunidadeAutorReviewsHref,
  } = criarLinksComunidadePerfilAutor(perfilNome);

  return {
    containerAtualStyle,
    heroAtualStyle,
    authorTopRowAtualStyle,
    avatarActionsAtualStyle,
    avatarSmallButtonAtualStyle,
    avatarRemoveButtonAtualStyle,
    profileActionsAtualStyle,
    profileVisitorActionsAtualStyle,
    profileHeaderAtualStyle,
    topWaterFadeAtualStyle,
    menuSheetAtualStyle,
    profileActionsExibicaoStyle,
    ariaLabelAlternarUsernameCabecalho,
    ariaLabelCopiarUsernameCabecalho,
    usernameExibidoCabecalho,
    comunidadeAutorHref,
    comunidadeAutorTeoriasHref,
    comunidadeAutorReviewsHref,
  };
}
