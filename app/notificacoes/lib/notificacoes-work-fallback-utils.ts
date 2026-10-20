import { criarSlugBase } from "../../../lib/utils";
import { calcularProgressoLeitura } from "./notificacoes-local-normalizers";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "./notificacoes-models";

export function extrairSlugObraDeLinkNotificacao(link: string) {
  const match = /\/obra\/([^/?#]+)(?:\/|$)/i.exec(link.trim());
  const slugCodificado = match?.[1] || "";

  if (!slugCodificado) {
    return "";
  }

  try {
    return decodeURIComponent(slugCodificado);
  } catch {
    return slugCodificado;
  }
}

export function formatarTituloSlugNotificacao(slug: string) {
  const texto = slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!texto) {
    return "Obra";
  }

  return texto
    .split(" ")
    .map((parte) => parte.slice(0, 1).toUpperCase() + parte.slice(1))
    .join(" ");
}

export function extrairTituloObraDeMensagemNotificacao(
  notificacao: NotificacaoLocal
) {
  const mensagem = notificacao.mensagem.trim();
  const match = /\bem\s+(.+?)\.?$/i.exec(mensagem);
  const titulo = match?.[1]?.trim() || "";

  if (!titulo || /^sua obra$/i.test(titulo)) {
    return "";
  }

  return titulo.replace(/[.!?]+$/g, "").trim();
}

export function extrairTituloCapituloDeMensagemNotificacao(
  notificacao: NotificacaoLocal
) {
  const mensagem = notificacao.mensagem.trim();
  const match = /^(.+?)\s+foi\s+adicionado/i.exec(mensagem);

  return match?.[1]?.trim() || "Capítulo";
}

export function criarObraFallbackNotificacaoDireta(
  notificacao: NotificacaoLocal
): ObraLocal | null {
  const obraId = notificacao.obraId.trim();

  if (!obraId) {
    return null;
  }

  const slugLink = extrairSlugObraDeLinkNotificacao(notificacao.link);
  const tituloMensagem = extrairTituloObraDeMensagemNotificacao(notificacao);
  const slug = slugLink || criarSlugBase(tituloMensagem || obraId);
  const titulo = tituloMensagem || formatarTituloSlugNotificacao(slug);
  const capitulos: CapituloLocal[] = notificacao.capituloId
    ? [
        {
          id: notificacao.capituloId,
          titulo: extrairTituloCapituloDeMensagemNotificacao(notificacao),
          texto: "",
          curtiu: false,
          salvo: false,
          comentario: "",
          criadoEm: notificacao.criadaEm,
          lido: false,
          lidoEm: "",
        },
      ]
    : [];

  return {
    id: obraId,
    titulo,
    autor: "Autor não informado",
    autorId: notificacao.autorId || "",
    genero: "Não informado",
    formato: "Não informado",
    classificacaoIndicativa: "Não informada",
    sinopse: "Nenhuma sinopse informada.",
    tags: ["sem tags"],
    capa: "",
    capaNome: "",
    publicado: true,
    capitulos,
    criadaEm: notificacao.criadaEm,
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: calcularProgressoLeitura(capitulos),
    slug,
    link: slug ? `/obra/${slug}` : notificacao.link,
  };
}
