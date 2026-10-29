import { normalizarTexto } from "../../../lib/utils";
import type { ModoConteudoExplorar } from "../components/explorar-section-components";

export function criarHrefListaExplorar({
  titulo,
  modo,
  genero = "",
}: {
  titulo: string;
  modo: ModoConteudoExplorar;
  genero?: string;
}) {
  const parametros = new URLSearchParams();
  const tituloLimpo = titulo.trim();
  const generoLimpo = genero.trim();
  const tituloNormalizado = normalizarTexto(tituloLimpo);

  parametros.set("modo", modo);

  if (tituloLimpo) {
    parametros.set("titulo", tituloLimpo);
  }

  if (generoLimpo) {
    parametros.set("genero", generoLimpo);
  }

  if (modo === "autores") {
    parametros.set("secao", "autores");

    if (tituloNormalizado === "mais bem avaliados") {
      parametros.set("ordem", "avaliacao");
    } else if (tituloNormalizado === "autores em destaque") {
      parametros.set("ordem", "popularidade");
    } else {
      parametros.set("ordem", "recentes");
    }

    return `/listas?${parametros.toString()}`;
  }

  if (tituloNormalizado === "recomendacoes para voce") {
    parametros.set("secao", "recomendacoes");
    parametros.set("ordem", "popularidade");
  } else if (tituloNormalizado === "publicacoes recentes") {
    parametros.set("secao", "recentes");
    parametros.set("ordem", "recentes");
  } else if (tituloNormalizado === "novos capitulos") {
    parametros.set("secao", "novos-capitulos");
    parametros.set("ordem", "recentes");
  } else if (tituloNormalizado === "mais curtidas") {
    parametros.set("secao", "mais-curtidas");
    parametros.set("ordem", "popularidade");
  } else if (tituloNormalizado === "mais comentadas") {
    parametros.set("secao", "mais-comentadas");
    parametros.set("ordem", "popularidade");
  } else if (tituloNormalizado === "para ler agora") {
    parametros.set("secao", "para-ler-agora");
    parametros.set("ordem", "recentes");
  } else {
    parametros.set("secao", "catalogo");
    parametros.set("ordem", "recentes");
  }

  return `/listas?${parametros.toString()}`;
}
