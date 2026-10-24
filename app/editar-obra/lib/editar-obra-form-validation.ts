import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { contarLetrasNumeros } from "./editar-obra-custom-value-utils";

type DadosFormularioEdicaoObra = {
  titulo: string;
  autor: string;
  autorProfileAtivo: string;
  generoFinal: string;
  generoEhPersonalizado: boolean;
  generoPersonalizadoValido: boolean;
  formatoFinal: string;
  formatoEhPersonalizado: boolean;
  formatoPersonalizadoValido: boolean;
  tagPersonalizadaValida: boolean;
  classificacaoIndicativa: string;
  avisosConteudo18: readonly unknown[];
  sinopse: string;
};

export function validarFormularioEdicaoObra({
  titulo,
  autor,
  autorProfileAtivo,
  generoFinal,
  generoEhPersonalizado,
  generoPersonalizadoValido,
  formatoFinal,
  formatoEhPersonalizado,
  formatoPersonalizadoValido,
  tagPersonalizadaValida,
  classificacaoIndicativa,
  avisosConteudo18,
  sinopse,
}: DadosFormularioEdicaoObra) {
  const tituloLimpo = titulo.trim();
  const autorLimpo = autorProfileAtivo || autor.trim();
  const generoLimpo = generoFinal;
  const formatoLimpo = formatoFinal;
  const classificacaoLimpa = classificacaoIndicativa.trim();
  const sinopseLimpa = sinopse.trim();

  if (contarLetrasNumeros(tituloLimpo) < 3) {
    return "O título precisa ter pelo menos 3 letras ou números.";
  }

  if (contarLetrasNumeros(autorLimpo) < 2) {
    return "O autor precisa ter pelo menos 2 letras ou números.";
  }

  if (!formatoLimpo || formatoLimpo === "Não informado" || !formatoPersonalizadoValido) {
    return formatoEhPersonalizado
      ? "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
      : "Escolha um formato para a obra.";
  }

  if (!generoLimpo || generoLimpo === "Não informado" || !generoPersonalizadoValido) {
    return generoEhPersonalizado
      ? "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
      : "Escolha um gênero para a obra.";
  }

  if (!tagPersonalizadaValida) {
    return "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.";
  }

  if (
    !classificacaoLimpa ||
    classificacaoLimpa === "Não informado" ||
    classificacaoLimpa === "Não informada"
  ) {
    return "Escolha a classificação indicativa da obra.";
  }

  if (ehClassificacao18(classificacaoLimpa) && avisosConteudo18.length === 0) {
    return "Selecione pelo menos um aviso de conteúdo para a obra 18+.";
  }

  if (contarLetrasNumeros(sinopseLimpa) < 20) {
    return "A sinopse precisa ter pelo menos 20 letras ou números.";
  }

  return "";
}

export function calcularProgressoFormularioEdicaoObra({
  titulo,
  autor,
  generoFinal,
  generoPersonalizadoValido,
  formatoFinal,
  formatoPersonalizadoValido,
  classificacaoIndicativa,
  avisosConteudo18,
  sinopse,
}: Pick<
  DadosFormularioEdicaoObra,
  | "titulo"
  | "autor"
  | "generoFinal"
  | "generoPersonalizadoValido"
  | "formatoFinal"
  | "formatoPersonalizadoValido"
  | "classificacaoIndicativa"
  | "avisosConteudo18"
  | "sinopse"
>) {
  const camposValidos = [
    contarLetrasNumeros(titulo.trim()) >= 3,
    contarLetrasNumeros(autor.trim()) >= 2,
    Boolean(generoFinal) && generoPersonalizadoValido,
    Boolean(formatoFinal) && formatoPersonalizadoValido,
    Boolean(classificacaoIndicativa.trim()) &&
      classificacaoIndicativa.trim() !== "Não informado" &&
      classificacaoIndicativa.trim() !== "Não informada" &&
      (!ehClassificacao18(classificacaoIndicativa) || avisosConteudo18.length > 0),
    contarLetrasNumeros(sinopse.trim()) >= 20,
  ].filter(Boolean).length;

  return Math.round((camposValidos / 6) * 100);
}
