import type {
  EstadoBloqueioPerfil,
  PermissoesAbasPerfil,
} from "../../../lib/historietasPrivacy";
import type { AbaPerfilAutor } from "../types";
import { obterRotuloAcaoBloqueioPerfilAutor } from "./profile-display-utils";
import {
  obterVisibilidadeAbasPerfilAutor,
  obterVisibilidadeConteudosAbasPerfilAutor,
} from "./profile-tab-visibility-utils";

export function obterEstadoVisualAcessoPerfilAutor({
  perfilPertenceAoUsuario,
  editorPerfilAberto,
  editorSobreAberto,
  estadoBloqueioPerfil,
  bloqueioPerfilSalvando,
  privacidadePerfilCarregando,
  permissoesAbasPerfil,
  abaPerfil,
}: {
  perfilPertenceAoUsuario: boolean;
  editorPerfilAberto: boolean;
  editorSobreAberto: boolean;
  estadoBloqueioPerfil: EstadoBloqueioPerfil;
  bloqueioPerfilSalvando: boolean;
  privacidadePerfilCarregando: boolean;
  permissoesAbasPerfil: PermissoesAbasPerfil;
  abaPerfil: AbaPerfilAutor;
}) {
  const podeEditarPerfil = perfilPertenceAoUsuario;
  const perfilVisitante = !podeEditarPerfil;
  const editorPerfilVisivel = podeEditarPerfil && editorPerfilAberto;
  const editorSobreVisivel = podeEditarPerfil && editorSobreAberto;
  const bloqueadoPorMim = estadoBloqueioPerfil.bloqueadoPorMim;
  const existeBloqueioPerfil = estadoBloqueioPerfil.existeBloqueio;
  const rotuloAcaoBloqueioPerfil = obterRotuloAcaoBloqueioPerfilAutor({
    bloqueadoPorMim,
    salvando: bloqueioPerfilSalvando,
  });

  const {
    perfilBloqueadoEntreUsuarios,
    obrasPerfilVisivel,
    sobrePerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    bibliotecaPerfilVisivel,
    atividadesPerfilVisivel,
    totalAbasPerfilVisiveis,
    temAbasPerfilVisiveis,
    conteudoPrivadoBloqueado,
    primeiraAbaPerfilVisivel,
  } = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario,
    existeBloqueio: existeBloqueioPerfil,
    privacidadeCarregando: privacidadePerfilCarregando,
    permissoes: permissoesAbasPerfil,
  });
  const {
    bibliotecaPerfilAtiva,
    diarioPerfilAtivo,
    comunidadePerfilAtiva,
    sobrePerfilAtivo,
    obrasPerfilAtivo,
  } = obterVisibilidadeConteudosAbasPerfilAutor({
    abaPerfil,
    obrasPerfilVisivel,
    sobrePerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    bibliotecaPerfilVisivel,
  });

  return {
    podeEditarPerfil,
    perfilVisitante,
    editorPerfilVisivel,
    editorSobreVisivel,
    bloqueadoPorMim,
    existeBloqueioPerfil,
    rotuloAcaoBloqueioPerfil,
    perfilBloqueadoEntreUsuarios,
    obrasPerfilVisivel,
    sobrePerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    bibliotecaPerfilVisivel,
    atividadesPerfilVisivel,
    totalAbasPerfilVisiveis,
    temAbasPerfilVisiveis,
    conteudoPrivadoBloqueado,
    primeiraAbaPerfilVisivel,
    bibliotecaPerfilAtiva,
    diarioPerfilAtivo,
    comunidadePerfilAtiva,
    sobrePerfilAtivo,
    obrasPerfilAtivo,
  };
}
