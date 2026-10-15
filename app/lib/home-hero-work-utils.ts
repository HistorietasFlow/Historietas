import { normalizarTexto } from "../../lib/utils";
import {
  criarIdentificadoresObraCatalogoHome,
  criarIdentificadoresObraLocalHome,
  normalizarListaIdsHome,
} from "./home-collection-utils";
import { compactarNumeroHome } from "./home-format-utils";
import { obterTotalComentariosObraHome, obterTotalCurtidasObraHome } from "./home-local-work-utils";
import { formatarGeneroHome } from "./home-metadata-utils";

type CapituloObraHeroLocalHome = {
  curtiu: boolean;
  comentario: string;
};

type ObraLocalHeroHome<Capitulo extends CapituloObraHeroLocalHome> = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  arquivoObra?: unknown;
  capitulos: Capitulo[];
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

type ObraHeroHome<Capitulo extends CapituloObraHeroLocalHome> = {
  id?: string;
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
  capa?: string;
  capaUrl?: string;
  arquivoObra?: unknown;
  capitulos?: Capitulo[];
};

export function criarObraHeroLocalHome<Capitulo extends CapituloObraHeroLocalHome>(
  obra: ObraLocalHeroHome<Capitulo>
): ObraHeroHome<Capitulo> {
  return {
    id: obra.id,
    titulo: obra.titulo,
    autor: obra.autor,
    genero: formatarGeneroHome(obra.genero),
    formato: obra.formato || "História",
    classificacaoIndicativa: obra.classificacaoIndicativa,
    sinopse: obra.sinopse || "Nenhuma sinopse informada.",
    tags: obra.tags,
    status: obra.capitulos.length > 0 ? "Em andamento" : "Publicado",
    views: compactarNumeroHome(obra.visualizacoes || 0),
    likes: compactarNumeroHome(obterTotalCurtidasObraHome(obra)),
    comentarios: compactarNumeroHome(obterTotalComentariosObraHome(obra)),
    disponivel: true,
    capa: obra.capa,
    capaUrl: obra.capa,
    arquivoObra: obra.arquivoObra,
    slug: obra.slug,
    link: obra.link,
    capitulos: obra.capitulos,
  };
}

export function encontrarObraLocalPorHeroHome(
  obrasLocais: ObraLocalHeroHome<CapituloObraHeroLocalHome>[],
  heroObra: ObraHeroHome<CapituloObraHeroLocalHome>,
  heroFavoritoId: string
) {
  const identificadoresHero = new Set(
    normalizarListaIdsHome([
      heroFavoritoId,
      ...criarIdentificadoresObraCatalogoHome(heroObra),
      normalizarTexto(heroObra.titulo),
    ])
  );

  return (
    obrasLocais.find((obra) => {
      return criarIdentificadoresObraLocalHome(obra).some((identificador) =>
        identificadoresHero.has(identificador)
      );
    }) || null
  );
}

export function formatarSinopseHeroMobile(sinopse: string | undefined) {
  const textoBase = String(sinopse || "Nenhuma sinopse informada.")
    .replace(/\s+/g, " ")
    .trim();

  if (!textoBase) {
    return "Nenhuma sinopse informada.";
  }

  const textoComPalavrasSeguras = textoBase
    .split(" ")
    .map((palavra) => {
      if (palavra.length <= 18) {
        return palavra;
      }

      return `${palavra.slice(0, 16)}…`;
    })
    .join(" ");

  if (textoComPalavrasSeguras.length <= 132) {
    return textoComPalavrasSeguras;
  }

  return `${textoComPalavrasSeguras.slice(0, 129).trim()}…`;
}
