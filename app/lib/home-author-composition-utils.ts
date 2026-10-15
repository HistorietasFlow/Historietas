import {
  criarBioAutorPadrao,
  encontrarPerfilAutor,
  normalizarChaveAutor,
} from "./home-author-profile-utils";
import type { PerfisAutoresSalvos } from "./home-author-profile-utils";
import { formatarGeneroHome } from "./home-metadata-utils";
import { criarHrefPerfilAutorHome } from "./home-route-utils";

export type AutorHome = {
  chave: string;
  nome: string;
  autorId: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
};

export function criarAutorHome(
  nomeAutor: string,
  autorId: string,
  generos: string[],
  totalObras: number,
  totalCapitulos: number,
  totalCurtidas: number,
  totalComentarios: number,
  perfisAutores: PerfisAutoresSalvos
): AutorHome {
  const perfil = encontrarPerfilAutor(perfisAutores, nomeAutor);
  const generosUnicos = Array.from(
    new Set(
      generos
        .filter((genero) => Boolean(genero.trim()))
        .map((genero) => formatarGeneroHome(genero))
    )
  );
  const bioPerfil = perfil?.bio.trim() || "";

  return {
    chave: autorId.trim() || normalizarChaveAutor(nomeAutor),
    nome: nomeAutor.trim() || "Autor não informado",
    autorId: autorId.trim(),
    avatar: perfil?.avatar.trim() || "",
    bio: bioPerfil || criarBioAutorPadrao(generosUnicos),
    totalObras,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    generos: generosUnicos.slice(0, 2),
    href: criarHrefPerfilAutorHome(nomeAutor, autorId),
  };
}
