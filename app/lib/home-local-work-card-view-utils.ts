import { criarSlugBase } from "../../lib/utils";
import { compactarNumeroHome } from "./home-format-utils";
import {
  obterTotalComentariosObraHome,
  obterTotalCurtidasObraHome,
  obraTemArquivoAnexado,
} from "./home-local-work-utils";
import {
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
} from "./home-reading-utils";
import {
  criarHrefLeituraCapituloHome,
  criarHrefPerfilAutorHome,
} from "./home-route-utils";

type CapituloObraLocalCardHome = {
  id: string;
  comentario: string;
  criadoEm: string;
  curtiu: boolean;
  lido: boolean;
  lidoEm: string;
  titulo: string;
};

type ObraLocalCardHome = {
  arquivoObra?: unknown;
  autor: string;
  autorId?: string;
  capitulos: CapituloObraLocalCardHome[];
  criadaEm: string;
  id: string;
  link: string;
  publicado: boolean;
  slug: string;
  titulo: string;
  totalComentarios: number;
  totalCurtidas: number;
  ultimaLeituraEm: string;
  ultimoCapituloLidoId: string;
  visualizacoes: number;
};

export function criarDadosObraLocalCardHome(
  obra: ObraLocalCardHome,
  tipo: "continuar" | "catalogo" | "novo-capitulo",
) {
  const visualizacoesObra = compactarNumeroHome(obra.visualizacoes || 0);
  const totalCurtidas = compactarNumeroHome(obterTotalCurtidasObraHome(obra));
  const totalComentarios = compactarNumeroHome(
    obterTotalComentariosObraHome(obra),
  );
  const obraTemArquivo = obraTemArquivoAnexado(obra);
  const iconeConteudoObra = obraTemArquivo ? "📄" : "📚";
  const totalConteudoObra = compactarNumeroHome(
    obraTemArquivo ? 1 : obra.capitulos.length,
  );

  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
  const ultimoCapituloPublicado =
    obra.capitulos.length > 0 ? obra.capitulos[obra.capitulos.length - 1] : null;
  const slugObra = obra.slug || criarSlugBase(obra.titulo);
  const verObraHref = obra.link?.trim() || `/obra/${slugObra}`;
  const numeroCapituloContinuar = capituloParaContinuar
    ? Math.max(
        1,
        obra.capitulos.findIndex(
          (capitulo) => capitulo.id === capituloParaContinuar.id,
        ) + 1,
      )
    : 0;
  const numeroUltimoCapitulo = ultimoCapituloPublicado
    ? Math.max(
        1,
        obra.capitulos.findIndex(
          (capitulo) => capitulo.id === ultimoCapituloPublicado.id,
        ) + 1,
      )
    : 0;
  const continuarLeituraHref = capituloParaContinuar
    ? criarHrefLeituraCapituloHome(
        obra,
        capituloParaContinuar,
        numeroCapituloContinuar || 1,
      )
    : verObraHref;
  const ultimoCapituloHref = ultimoCapituloPublicado
    ? criarHrefLeituraCapituloHome(
        obra,
        ultimoCapituloPublicado,
        numeroUltimoCapitulo || 1,
      )
    : verObraHref;
  const perfilAutorHref = criarHrefPerfilAutorHome(obra.autor, obra.autorId || "");

  const actionHref =
    tipo === "continuar"
      ? continuarLeituraHref
      : tipo === "novo-capitulo"
        ? ultimoCapituloHref
        : verObraHref;
  const actionLabel =
    tipo === "continuar"
      ? "Continuar"
      : tipo === "novo-capitulo"
        ? "Ler agora"
        : "Ver obra";
  const actionSubLabel =
    tipo === "continuar"
      ? numeroCapituloContinuar > 0
        ? `Leitura Cap. ${String(numeroCapituloContinuar).padStart(2, "0")}`
        : "Leitura"
      : tipo === "novo-capitulo" && numeroUltimoCapitulo > 0
        ? `Cap ${numeroUltimoCapitulo}`
        : "";
  const cardComAlturaExtra = progressoLeitura > 0 || tipo === "novo-capitulo";

  return {
    actionHref,
    actionLabel,
    actionSubLabel,
    capituloParaContinuar,
    cardComAlturaExtra,
    continuarLeituraHref,
    iconeConteudoObra,
    numeroCapituloContinuar,
    numeroUltimoCapitulo,
    perfilAutorHref,
    progressoLeitura,
    slugObra,
    totalComentarios,
    totalConteudoObra,
    totalCurtidas,
    ultimoCapituloHref,
    ultimoCapituloPublicado,
    verObraHref,
    visualizacoesObra,
  };
}
