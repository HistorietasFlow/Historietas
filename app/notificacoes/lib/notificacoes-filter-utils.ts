import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { formatarData, normalizarTexto } from "../../../lib/utils";

export type FiltroNotificacao =
  | "todas"
  | "nao-lidas"
  | "lidas"
  | "capitulos"
  | "comunidade";

export type OrdenacaoNotificacao =
  | "recentes"
  | "antigas"
  | "obra"
  | "capitulo";

type CapituloParaNotificacao = {
  id: string;
  titulo: string;
};

type ObraParaNotificacao = {
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capitulos: CapituloParaNotificacao[];
};

type NotificacaoParaConsulta = {
  obraId: string;
  capituloId: string;
  link: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadaEm: string;
  autorNome?: string;
};

export function dataNotificacao(
  notificacao: Pick<NotificacaoParaConsulta, "criadaEm">,
) {
  const data = new Date(notificacao.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function notificacaoEhCapitulo(
  notificacao: Pick<NotificacaoParaConsulta, "tipo">,
) {
  return (
    notificacao.tipo === "novo-capitulo" ||
    notificacao.tipo === "comentario-capitulo" ||
    notificacao.tipo === "curtida-capitulo" ||
    notificacao.tipo === "curtida-comentario-capitulo"
  );
}

export function notificacaoEhComunidade(
  notificacao: Pick<NotificacaoParaConsulta, "tipo">,
) {
  return !notificacaoEhCapitulo(notificacao);
}

type FiltrarEOrdenarNotificacoesParametros<
  TNotificacao extends NotificacaoParaConsulta,
  TObra extends ObraParaNotificacao,
> = {
  notificacoes: TNotificacao[];
  obrasPorId: ReadonlyMap<string, TObra>;
  termoBusca: string;
  filtro: FiltroNotificacao;
  ordenacao: OrdenacaoNotificacao;
  acessoConteudo18Liberado: boolean;
};

export function filtrarEOrdenarNotificacoes<
  TNotificacao extends NotificacaoParaConsulta,
  TObra extends ObraParaNotificacao,
>({
  notificacoes,
  obrasPorId,
  termoBusca,
  filtro,
  ordenacao,
  acessoConteudo18Liberado,
}: FiltrarEOrdenarNotificacoesParametros<TNotificacao, TObra>) {
  const filtradas = notificacoes.filter((notificacao) => {
    const obraId = notificacao.obraId.trim();
    const obra = obrasPorId.get(obraId) || null;

    if (!acessoConteudo18Liberado && obraId) {
      const classificacaoNormalizada = normalizarTexto(
        obra?.classificacaoIndicativa || "",
      );
      const classificacaoDesconhecida =
        !obra ||
        !classificacaoNormalizada ||
        classificacaoNormalizada.startsWith("nao informad");

      if (
        classificacaoDesconhecida ||
        ehClassificacao18(obra?.classificacaoIndicativa || "")
      ) {
        return false;
      }
    }

    const capitulo =
      obra?.capitulos.find((item) => item.id === notificacao.capituloId) ||
      null;

    const passaFiltro =
      filtro === "todas" ||
      (filtro === "nao-lidas" && !notificacao.lida) ||
      (filtro === "lidas" && notificacao.lida) ||
      (filtro === "capitulos" && notificacaoEhCapitulo(notificacao)) ||
      (filtro === "comunidade" && notificacaoEhComunidade(notificacao));

    const textoBusca = normalizarTexto(
      [
        notificacao.titulo,
        notificacao.mensagem,
        notificacao.tipo,
        notificacao.link,
        notificacao.autorNome || "",
        obra?.titulo || "",
        obra?.autor || "",
        obra?.genero || "",
        obra?.formato || "",
        obra?.classificacaoIndicativa || "",
        capitulo?.titulo || "",
        formatarData(notificacao.criadaEm),
      ].join(" "),
    );

    const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

    return passaFiltro && passaBusca;
  });

  return [...filtradas].sort((notificacaoA, notificacaoB) => {
    const obraA = obrasPorId.get(notificacaoA.obraId) || null;
    const obraB = obrasPorId.get(notificacaoB.obraId) || null;
    const capituloA =
      obraA?.capitulos.find(
        (capitulo) => capitulo.id === notificacaoA.capituloId,
      ) || null;
    const capituloB =
      obraB?.capitulos.find(
        (capitulo) => capitulo.id === notificacaoB.capituloId,
      ) || null;

    if (ordenacao === "antigas") {
      return dataNotificacao(notificacaoA) - dataNotificacao(notificacaoB);
    }

    if (ordenacao === "obra") {
      return (obraA?.titulo || "zzz").localeCompare(obraB?.titulo || "zzz");
    }

    if (ordenacao === "capitulo") {
      return (capituloA?.titulo || "zzz").localeCompare(
        capituloB?.titulo || "zzz",
      );
    }

    return dataNotificacao(notificacaoB) - dataNotificacao(notificacaoA);
  });
}
