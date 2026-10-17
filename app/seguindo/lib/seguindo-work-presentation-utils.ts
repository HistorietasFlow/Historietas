import { normalizarTexto } from "../../../lib/utils";
import { formatarGeneroSeguindo } from "./seguindo-format-utils";

type ObraApresentacaoSeguindo = {
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  criadaEm: string;
  ultimaLeituraEm: string;
  capitulos: Array<{
    titulo: string;
  }>;
};

export function dataAtividadeObra(
  obra: Pick<ObraApresentacaoSeguindo, "ultimaLeituraEm" | "criadaEm">,
) {
  const datas = [obra.ultimaLeituraEm, obra.criadaEm]
    .map((data) => new Date(data).getTime())
    .filter((data) => Number.isFinite(data));

  return datas.length > 0 ? Math.max(...datas) : 0;
}

export function textoBuscaObra(obra: ObraApresentacaoSeguindo) {
  return normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroSeguindo(obra.genero),
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" "),
  );
}

export function mostrarClassificacao(
  obra: Pick<ObraApresentacaoSeguindo, "classificacaoIndicativa">,
) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada"
  );
}
