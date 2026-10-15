import {
  obterTotalCapitulosObraCatalogoHome,
  obraCatalogoTemArquivoAnexadoHome,
} from "./home-catalog-utils";
import { compactarNumeroHome } from "./home-format-utils";
import { criarHrefObraCatalogoHome } from "./home-route-utils";

type ObraCatalogoCardHome = {
  arquivoObra?: unknown;
  capitulos?: unknown;
  disponivel: boolean;
  link?: string;
  slug?: string;
  titulo: string;
};

export function criarDadosObraCatalogoCardHome(obra: ObraCatalogoCardHome) {
  const obraHref = criarHrefObraCatalogoHome(obra);
  const obraTemArquivo = obraCatalogoTemArquivoAnexadoHome(obra);
  const iconeConteudoObra = obraTemArquivo ? "📄" : "📚";
  const totalConteudoObra = compactarNumeroHome(
    obraTemArquivo ? 1 : obterTotalCapitulosObraCatalogoHome(obra),
  );

  return {
    obraHref,
    iconeConteudoObra,
    totalConteudoObra,
  };
}
