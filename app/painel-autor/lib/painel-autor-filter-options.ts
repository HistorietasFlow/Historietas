export type FiltroPainel =
  | "todas"
  | "publicadas"
  | "rascunhos"
  | "sem-capitulos"
  | "favoritas"
  | "concluidas"
  | "em-leitura";

export type OrdenacaoPainel =
  | "pontuacao"
  | "recentes"
  | "titulo"
  | "capitulos"
  | "progresso";

export const FILTROS_PAINEL: { valor: FiltroPainel; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas as obras" },
  { valor: "publicadas", rotulo: "Publicadas" },
  { valor: "rascunhos", rotulo: "Rascunhos" },
  { valor: "sem-capitulos", rotulo: "Sem capítulos" },
  { valor: "favoritas", rotulo: "Na lista" },
  { valor: "concluidas", rotulo: "Concluídas" },
  { valor: "em-leitura", rotulo: "Em leitura" },
];

export const ORDENACOES_PAINEL: { valor: OrdenacaoPainel; rotulo: string }[] = [
  { valor: "pontuacao", rotulo: "Melhor desempenho" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "titulo", rotulo: "Título" },
  { valor: "capitulos", rotulo: "Mais capítulos" },
  { valor: "progresso", rotulo: "Maior progresso" },
];
