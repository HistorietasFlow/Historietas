import type {
  AlvoDenunciaConteudoPerfil,
  AutorPerfil,
} from "../types";
import {
  obterDadosDenunciaConteudoPerfilAutor,
  obterDadosDenunciaPerfilAutor,
  obterVisibilidadeDenunciasPerfilAutor,
} from "./profile-display-utils";

export function obterEstadoVisualDenunciasPerfilAutor({
  perfilParaMostrar,
  alvoDenunciaConteudoPerfil,
  denunciaPerfilAberta,
  podeEditarPerfil,
}: {
  perfilParaMostrar: AutorPerfil | null;
  alvoDenunciaConteudoPerfil: AlvoDenunciaConteudoPerfil;
  denunciaPerfilAberta: boolean;
  podeEditarPerfil: boolean;
}) {
  const dadosDenunciaPerfil = obterDadosDenunciaPerfilAutor(
    perfilParaMostrar,
  );
  const dadosDenunciaConteudoPerfil =
    obterDadosDenunciaConteudoPerfilAutor(alvoDenunciaConteudoPerfil);
  const {
    denunciaPerfilVisivel,
    denunciaConteudoVisivel,
  } = obterVisibilidadeDenunciasPerfilAutor({
    denunciaPerfilAberta,
    podeEditarPerfil,
    perfilParaMostrar,
    alvoDenunciaConteudoPerfil,
  });

  return {
    dadosDenunciaPerfil,
    dadosDenunciaConteudoPerfil,
    denunciaPerfilVisivel,
    denunciaConteudoVisivel,
  };
}
