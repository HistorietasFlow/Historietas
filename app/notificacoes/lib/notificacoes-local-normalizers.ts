import { criarSlugBase } from "../../../lib/utils";
import {
  corrigirTextoQuebrado,
  limparTextoExibicao,
} from "./notificacoes-text-utils";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "./notificacoes-models";

export function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

export function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? limparTextoExibicao(capitulo.titulo)
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? corrigirTextoQuebrado(capitulo.texto) : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string"
        ? corrigirTextoQuebrado(capitulo.comentario)
        : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

export function normalizarObra(obra: Partial<ObraLocal>, index: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => limparTextoExibicao(tag))
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? limparTextoExibicao(obra.titulo)
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? limparTextoExibicao(obra.autor)
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId
        : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? limparTextoExibicao(obra.genero)
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? limparTextoExibicao(obra.formato)
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? limparTextoExibicao(obra.classificacaoIndicativa)
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? corrigirTextoQuebrado(obra.sinopse)
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${index + 1}`
          ),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(
                  typeof obra.titulo === "string" && obra.titulo.trim()
                    ? obra.titulo
                    : `obra-${index + 1}`
                )
          }`,
  };
}

export function normalizarTipoNotificacao(valor: unknown): NotificacaoLocal["tipo"] {
  const tipoOriginal = typeof valor === "string" ? valor.trim() : "";
  const tipoAlias = tipoOriginal.toLowerCase().replace(/[ _]+/g, "-");

  const aliases: Record<string, NotificacaoLocal["tipo"]> = {
    "capitulo-novo": "novo-capitulo",
    "novo-capitulo-publicado": "novo-capitulo",
    "comunidade-curtida-post": "curtida-comunidade",
    "comunidade-post-curtida": "curtida-comunidade",
    "curtida-post-comunidade": "curtida-comunidade",
    "curtida-comunidade-post": "curtida-comunidade",
    "curtida-publicacao-comunidade": "curtida-comunidade",
    "curtida-publicacao": "curtida-comunidade",
    "comunidade-comentario-post": "comentario-comunidade",
    "comunidade-post-comentario": "comentario-comunidade",
    "comentario-post-comunidade": "comentario-comunidade",
    "comentario-comunidade-post": "comentario-comunidade",
    "comentario-publicacao-comunidade": "comentario-comunidade",
    "comentario-publicacao": "comentario-comunidade",
    "review": "review-comunidade",
    "avaliacao-comunidade": "review-comunidade",
  };

  const tipoPeloAlias = aliases[tipoAlias];

  if (tipoPeloAlias) {
    return tipoPeloAlias;
  }

  const tiposValidos = new Set<NotificacaoLocal["tipo"]>([
    "novo-capitulo",
    "comentario-obra",
    "curtida-obra",
    "comentario-capitulo",
    "curtida-capitulo",
    "curtida-comentario-capitulo",
    "comentario-comunidade",
    "curtida-comunidade",
    "review-comunidade",
    "atividade-comunidade",
    "curtida-diario",
    "comentario-diario",
    "atividade-diario",
    "novo-seguidor",
    "solicitacao-seguidor",
    "denuncia-comunidade",
    "moderacao-comunidade",
    "problema-tecnico",
  ]);

  if (tiposValidos.has(tipoAlias as NotificacaoLocal["tipo"])) {
    return tipoAlias as NotificacaoLocal["tipo"];
  }

  return "atividade-comunidade";
}

export function normalizarNotificacao(
  notificacao: Partial<NotificacaoLocal>,
  index: number
): NotificacaoLocal {
  const notificacaoBruta = notificacao as Partial<NotificacaoLocal> &
    Record<string, unknown>;

  return {
    id:
      typeof notificacao.id === "string" && notificacao.id.trim()
        ? notificacao.id
        : `notificacao-${index + 1}`,
    obraId: typeof notificacao.obraId === "string" ? notificacao.obraId : "",
    capituloId:
      typeof notificacao.capituloId === "string" ? notificacao.capituloId : "",
    link:
      typeof notificacao.link === "string" && notificacao.link.trim()
        ? notificacao.link.trim()
        : "",
    titulo:
      typeof notificacao.titulo === "string" && notificacao.titulo.trim()
        ? limparTextoExibicao(notificacao.titulo)
        : "Nova notificação",
    mensagem:
      typeof notificacao.mensagem === "string" && notificacao.mensagem.trim()
        ? corrigirTextoQuebrado(notificacao.mensagem)
        : "Uma obra recebeu uma atualização.",
    tipo: normalizarTipoNotificacao(notificacaoBruta.tipo),
    lida: notificacaoBruta.lida === true,
    criadaEm:
      typeof notificacao.criadaEm === "string" && notificacao.criadaEm.trim()
        ? notificacao.criadaEm
        : new Date().toISOString(),
    autorId:
      typeof notificacaoBruta.autorId === "string"
        ? notificacaoBruta.autorId.trim()
        : "",
    autorNome:
      typeof notificacaoBruta.autorNome === "string"
        ? limparTextoExibicao(notificacaoBruta.autorNome)
        : "",
    autorAvatar:
      typeof notificacaoBruta.autorAvatar === "string"
        ? notificacaoBruta.autorAvatar.trim()
        : "",
    solicitacaoId:
      typeof notificacaoBruta.solicitacaoId === "string"
        ? notificacaoBruta.solicitacaoId.trim()
        : typeof notificacaoBruta.solicitacao_id === "string"
          ? notificacaoBruta.solicitacao_id.trim()
          : "",
  };
}
