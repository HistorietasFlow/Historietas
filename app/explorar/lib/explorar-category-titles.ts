import { normalizarTexto } from "../../../lib/utils";

const TITULOS_CRIATIVOS_OBRAS_EXPLORAR: Record<string, string> = {
  acao: "Ação do começo ao fim",
  aventura: "Aventuras sem limites",
  comedia: "Para rir agora",
  drama: "Histórias que deixam marcas",
  fantasia: "Mundos além da imaginação",
  ficcao: "Além do que é possível",
  misterio: "Mistérios para desvendar",
  romance: "Amores que deixam marcas",
  suspense: "Tensão até a última página",
  terror: "Histórias para perder o sono",
  sobrenatural: "Entre este mundo e o outro",
  historico: "Viagens por outros tempos",
  biografia: "Vidas que merecem ser contadas",
  outros: "Descobertas fora do comum",
};

const TITULOS_CRIATIVOS_AUTORES_EXPLORAR: Record<string, string> = {
  acao: "Autores que aceleram o coração",
  aventura: "Autores de grandes jornadas",
  comedia: "Autores para arrancar risadas",
  drama: "Autores que tocam fundo",
  fantasia: "Criadores de mundos impossíveis",
  ficcao: "Autores que enxergam além",
  misterio: "Mestres dos enigmas",
  romance: "Autores que escrevem sentimentos",
  suspense: "Mestres da tensão",
  terror: "Autores que dominam o medo",
  sobrenatural: "Vozes do desconhecido",
  historico: "Autores que revivem o passado",
  biografia: "Autores de vidas reais",
  outros: "Novas vozes para descobrir",
};

export function obterTituloCriativoObrasExplorar(genero: string) {
  return (
    TITULOS_CRIATIVOS_OBRAS_EXPLORAR[normalizarTexto(genero)] ||
    "Histórias para descobrir"
  );
}

export function obterTituloCriativoAutoresExplorar(genero: string) {
  return (
    TITULOS_CRIATIVOS_AUTORES_EXPLORAR[normalizarTexto(genero)] ||
    "Autores para descobrir"
  );
}
