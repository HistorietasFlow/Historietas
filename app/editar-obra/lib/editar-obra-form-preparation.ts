import {
  normalizarAvisosConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import {
  limparTextoPersonalizado,
  opcaoExiste,
  prepararValorEditavel,
} from "./editar-obra-custom-value-utils";
import {
  formatarFormatoEdicaoObra,
  formatarGeneroEdicaoObra,
} from "./editar-obra-format-utils";

type ObraFormularioEdicao<TArquivo> = {
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: TArquivo | null;
};

type PrepararValoresFormularioEdicaoObraParams<TArquivo> = {
  obraAtual: ObraFormularioEdicao<TArquivo>;
  nomeAutorProfileAtual?: string;
  opcoesFormato: readonly string[];
  opcoesGenero: readonly string[];
  opcoesTags: readonly string[];
  outroFormatoValue: string;
  outroGeneroValue: string;
  limiteCaracteresFormatoGeneroPersonalizado: number;
  limiteCaracteresTagPersonalizada: number;
};

export function prepararValoresFormularioEdicaoObra<TArquivo>({
  obraAtual,
  nomeAutorProfileAtual = "",
  opcoesFormato,
  opcoesGenero,
  opcoesTags,
  outroFormatoValue,
  outroGeneroValue,
  limiteCaracteresFormatoGeneroPersonalizado,
  limiteCaracteresTagPersonalizada,
}: PrepararValoresFormularioEdicaoObraParams<TArquivo>) {
  const autorProfile = nomeAutorProfileAtual.trim();
  const formatoEditavel = prepararValorEditavel(
    formatarFormatoEdicaoObra(obraAtual.formato),
    opcoesFormato,
    outroFormatoValue,
    limiteCaracteresFormatoGeneroPersonalizado,
  );
  const generoEditavel = prepararValorEditavel(
    formatarGeneroEdicaoObra(obraAtual.genero),
    opcoesGenero,
    outroGeneroValue,
    limiteCaracteresFormatoGeneroPersonalizado,
  );
  const primeiraTag = obraAtual.tags.find((tag) => tag.trim() && tag !== "sem tags") || "";
  const tagEhPersonalizada = Boolean(primeiraTag) && !opcaoExiste(opcoesTags, primeiraTag);

  return {
    titulo: obraAtual.titulo,
    autor: autorProfile || obraAtual.autor,
    genero: generoEditavel.selecionado,
    generoPersonalizado: generoEditavel.personalizado,
    formato: formatoEditavel.selecionado,
    formatoPersonalizado: formatoEditavel.personalizado,
    classificacaoIndicativa:
      obraAtual.classificacaoIndicativa === "Não informada" ||
      obraAtual.classificacaoIndicativa === "Não informado"
        ? "Livre"
        : obraAtual.classificacaoIndicativa,
    avisosConteudo18: normalizarAvisosConteudo18(
      obraAtual.avisosConteudo,
      obraAtual.classificacaoIndicativa,
    ),
    sinopse: obraAtual.sinopse,
    usarTagPersonalizada: tagEhPersonalizada,
    tagPersonalizada: tagEhPersonalizada
      ? limparTextoPersonalizado(primeiraTag, limiteCaracteresTagPersonalizada).trim()
      : "",
    tags: primeiraTag || "",
    capa: obraAtual.capa,
    capaNome: obraAtual.capaNome,
    arquivoObra: obraAtual.arquivoObra || null,
  };
}
