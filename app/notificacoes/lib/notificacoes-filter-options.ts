import type {
  FiltroNotificacao,
  OrdenacaoNotificacao,
} from "./notificacoes-filter-utils";

type OpcaoNotificacao<T extends string> = {
  valor: T;
  rotulo: string;
};

export function criarOpcoesFiltroNotificacoes(): Array<
  OpcaoNotificacao<FiltroNotificacao>
> {
  return [
    { valor: "todas", rotulo: "Todas" },
    { valor: "nao-lidas", rotulo: "Novas" },
    { valor: "lidas", rotulo: "Lidas" },
    { valor: "capitulos", rotulo: "Capítulos" },
    { valor: "comunidade", rotulo: "Comunidade" },
  ];
}

export function criarOpcoesOrdenacaoNotificacoes(): Array<
  OpcaoNotificacao<OrdenacaoNotificacao>
> {
  return [
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "antigas", rotulo: "Mais antigas" },
  ];
}

export function filtrosNotificacoesEstaoAtivos(
  busca: string,
  filtro: FiltroNotificacao,
  ordenacao: OrdenacaoNotificacao,
) {
  return Boolean(
    busca.trim() || filtro !== "todas" || ordenacao !== "recentes",
  );
}
