import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
  normalizarAvisosConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import { obterTagsFinaisEdicaoObra } from "./editar-obra-tags-list-utils";

type PrepararValoresSalvamentoEdicaoObraParams = {
  titulo: string;
  autor: string;
  autorProfileAtivo: string;
  generoFinal: string;
  formatoFinal: string;
  classificacaoIndicativa: string;
  avisosConteudo18: AvisoConteudo18[];
  sinopse: string;
  tagsTratadas: string[];
};

export function prepararValoresSalvamentoEdicaoObra({
  titulo,
  autor,
  autorProfileAtivo,
  generoFinal,
  formatoFinal,
  classificacaoIndicativa,
  avisosConteudo18,
  sinopse,
  tagsTratadas,
}: PrepararValoresSalvamentoEdicaoObraParams) {
  const tituloFinal = titulo.trim();
  const autorFormularioFinal = autor.trim();
  const autorFinal = autorProfileAtivo || autorFormularioFinal;
  const generoFinalSalvo = generoFinal;
  const formatoFinalSalvo = formatoFinal;
  const classificacaoFinal = classificacaoIndicativa.trim();
  const capaBloqueadaPorClassificacao =
    ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
    ehClassificacao18(classificacaoFinal);
  const avisosConteudoFinal = normalizarAvisosConteudo18(
    avisosConteudo18,
    classificacaoFinal,
  );
  const sinopseFinal = sinopse.trim();
  const tagsFinais = obterTagsFinaisEdicaoObra(tagsTratadas);

  return {
    tituloFinal,
    autorFormularioFinal,
    autorFinal,
    generoFinalSalvo,
    formatoFinalSalvo,
    classificacaoFinal,
    capaBloqueadaPorClassificacao,
    avisosConteudoFinal,
    sinopseFinal,
    tagsFinais,
  };
}
