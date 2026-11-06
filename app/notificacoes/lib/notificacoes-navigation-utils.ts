import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";
import { notificacaoEhCapitulo } from "./notificacoes-filter-utils";

export function criarLoginHrefNotificacoes() {
  const params = new URLSearchParams({
    redirectTo: "/notificacoes",
  });

  return `/login?${params.toString()}`;
}

type CapituloParaLinkNotificacao = {
  id: string;
};

type ObraParaLinkNotificacao = {
  id: string;
  titulo: string;
  publicado: boolean;
  slug?: string;
  link?: string;
  capitulos: CapituloParaLinkNotificacao[];
};

type NotificacaoParaLink = {
  obraId: string;
  capituloId: string;
  link: string;
  tipo: string;
  autorId?: string;
  autorNome?: string;
};

export function criarHrefLeituraCapitulo(
  obra: Pick<ObraParaLinkNotificacao, "id" | "slug" | "titulo" | "publicado">,
  capituloId: string,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capituloId)}`;
}

export function linkDiretoValido(link: string) {
  const linkLimpo = link.trim();

  return (
    linkLimpo.startsWith("/") &&
    !linkLimpo.startsWith("//") &&
    !linkLimpo.includes("\\")
  );
}

export function criarHrefComentariosObraNotificacao(link: string) {
  const linkLimpo = link.trim();

  if (!linkDiretoValido(linkLimpo)) {
    return linkLimpo;
  }

  const url = new URL(linkLimpo, "https://historietas.local");
  const segmentos = url.pathname.split("/").filter(Boolean);

  if (segmentos.length !== 2 || segmentos[0] !== "obra") {
    return linkLimpo;
  }

  url.searchParams.set("comentarios", "1");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function criarPerfilHrefNotificacao(userId: string, nomeUsuario: string) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nomeUsuario.trim();

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  if (nomeLimpo) {
    params.set("autor", nomeLimpo);
  }

  const query = params.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

export function criarDiarioPerfilHrefNotificacao(
  userId: string,
  nomeUsuario = ""
) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nomeUsuario.trim();

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  if (nomeLimpo) {
    params.set("autor", nomeLimpo);
  }

  params.set("aba", "diario");

  return `/perfil-autor?${params.toString()}`;
}

export function montarLinkNotificacao(
  notificacao: NotificacaoParaLink,
  obra?: ObraParaLinkNotificacao | null
) {
  if (notificacao.tipo === "solicitacao-seguidor") {
    return "/seguindo?aba=seguidores&conteudo=seguidores";
  }

  if (notificacao.tipo === "novo-seguidor" && notificacao.autorId) {
    return criarPerfilHrefNotificacao(notificacao.autorId, notificacao.autorNome || "Usuário");
  }

  const linkDireto = notificacao.link.trim();

  if (linkDireto && linkDiretoValido(linkDireto)) {
    return notificacao.tipo === "comentario-obra"
      ? criarHrefComentariosObraNotificacao(linkDireto)
      : linkDireto;
  }

  if (
    (notificacao.tipo === "comentario-obra" ||
      notificacao.tipo === "curtida-obra") &&
    obra
  ) {
    const slugObra = obra.slug?.trim() || criarSlugBase(obra.titulo);

    const linkObra =
      obra.link?.trim() || `/obra/${encodeURIComponent(slugObra)}`;

    return notificacao.tipo === "comentario-obra"
      ? criarHrefComentariosObraNotificacao(linkObra)
      : linkObra;
  }

  if (
    notificacaoEhCapitulo(notificacao) &&
    obra &&
    notificacao.obraId &&
    notificacao.capituloId
  ) {
    const indiceCapitulo = obra.capitulos.findIndex(
      (capitulo) => capitulo.id === notificacao.capituloId
    );
    const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;

    return criarHrefLeituraCapitulo(
      obra,
      notificacao.capituloId,
      numeroCapitulo
    );
  }

  if (notificacao.obraId && notificacao.capituloId) {
    return `/ler-capitulo?obraId=${encodeURIComponent(
      notificacao.obraId
    )}&capituloId=${encodeURIComponent(notificacao.capituloId)}`;
  }

  return notificacaoEhCapitulo(notificacao) ? "/perfil-autor?aba=biblioteca" : "/comunidade";
}
