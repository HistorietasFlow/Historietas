import { criarSlugBase, normalizarTexto } from "../../../../lib/utils";
import { carregarListaLocalObraPublica, salvarStorageUsuarioObraPublica } from "./obra-user-storage";

export function obterChavesInteracaoObraPublica(obra: {
  id: string;
  slug: string;
  link: string;
  titulo: string;
}) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        obra.link,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((chave) => chave.trim())
        .filter(Boolean)
    )
  );
}

export function obraEstaEmListaLocalObraPublica(
  obra: {
    id: string;
    slug: string;
    link: string;
    titulo: string;
  },
  chaveStorage: string,
  userId = "",
) {
  const chavesObra = new Set(obterChavesInteracaoObraPublica(obra));

  return carregarListaLocalObraPublica(chaveStorage, userId).some((item) =>
    chavesObra.has(item.trim())
  );
}

export function salvarListaLocalObraPublica(
  obra: {
    id: string;
    slug: string;
    link: string;
    titulo: string;
  },
  chaveStorage: string,
  ativo: boolean,
  userId = "",
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  const listaAtual = carregarListaLocalObraPublica(chaveStorage, userIdLimpo);
  const chavesObra = obterChavesInteracaoObraPublica(obra);
  const chavesSet = new Set(chavesObra);
  const listaSemObra = listaAtual.filter((item) => !chavesSet.has(item.trim()));
  const proximaLista = ativo
    ? Array.from(new Set([...listaSemObra, ...chavesObra]))
    : listaSemObra;

  salvarStorageUsuarioObraPublica(chaveStorage, userIdLimpo, proximaLista);

  return proximaLista;
}
