import { contarLetrasNumeros } from "./editar-capitulo-text-utils";

export function validarCapitulo(
  titulo: string,
  texto: string,
  numeroCapitulo: number,
) {
  const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
  const textoLimpo = texto.trim();

  if (contarLetrasNumeros(tituloFinal) < 3) {
    return "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.";
  }

  if (contarLetrasNumeros(textoLimpo) < 20) {
    return "O texto do capítulo precisa ter pelo menos 20 letras ou números.";
  }

  return "";
}
