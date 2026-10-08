import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";
import { notificacaoEhCapitulo } from "./notificacoes-filter-utils";

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
    return linkDireto;
  }

  if (
    (notificacao.tipo === "comentario-obra" ||
      notificacao.tipo === "curtida-obra") &&
    obra
  ) {
    const slugObra = obra.slug?.trim() || criarSlugBase(obra.titulo);

    return obra.link?.trim() || `/obra/${encodeURIComponent(slugObra)}`;
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
