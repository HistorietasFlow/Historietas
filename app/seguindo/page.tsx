"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalSeguidores?: number;
  totalFavoritas?: number;
  totalConcluidas?: number;
};

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

type AutorSeguido = {
  chave: string;
  nome: string;
  autorId: string;
  obras: ObraLocal[];
  totalCapitulos: number;
  totalPublicadas: number;
  totalRascunhos: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalFavoritas: number;
  totalConcluidas: number;
  totalComClassificacao: number;
  totalLidos: number;
  totalEmLeitura: number;
  progressoMedio: number;
};

type UsuarioSeguido = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

type AtividadeSeguindo = {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioHandle: string;
  usuarioAvatar: string;
  tipo: string;
  tipoRotulo: string;
  titulo: string;
  descricao: string;
  data: string;
  href: string;
};


type SupabaseObraRow = {
  id: string;
  user_id?: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id?: string | null;
  titulo: string | null;
  texto?: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type TotaisInteracoesSeguindo = {
  curtidasPorObra: Record<string, number>;
  comentariosPorObra: Record<string, number>;
  salvosPorObra: Record<string, number>;
  lidosPorObra: Record<string, number>;
  seguidoresPorObra: Record<string, number>;
  favoritasPorObra: Record<string, number>;
  concluidasPorObra: Record<string, number>;
  curtidasPorCapitulo: Record<string, number>;
  comentariosPorCapitulo: Record<string, number>;
  salvosPorCapitulo: Record<string, number>;
  lidosPorCapitulo: Record<string, number>;
};

const totaisInteracoesSeguindoVazios: TotaisInteracoesSeguindo = {
  curtidasPorObra: {},
  comentariosPorObra: {},
  salvosPorObra: {},
  lidosPorObra: {},
  seguidoresPorObra: {},
  favoritasPorObra: {},
  concluidasPorObra: {},
  curtidasPorCapitulo: {},
  comentariosPorCapitulo: {},
  salvosPorCapitulo: {},
  lidosPorCapitulo: {},
};

type UsuariosPorChaveSeguindo = Record<string, string[]>;

type RegistroSupabaseGenerico = Record<string, unknown>;

function normalizarRegistrosSupabaseGenericos(
  valor: unknown
): RegistroSupabaseGenerico[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor.filter((registro): registro is RegistroSupabaseGenerico => {
    return (
      Boolean(registro) &&
      typeof registro === "object" &&
      !Array.isArray(registro)
    );
  });
}

type FiltroSeguindo =
  | "todos"
  | "obras"
  | "autores"
  | "usuarios"
  | "em-leitura"
  | "favoritas"
  | "concluidas";

type AbaSeguimentoPagina = "seguidores" | "seguindo";

type OrdenacaoSeguindo = "padrao" | "recentes" | "antigos" | "titulo" | "progresso" | "capitulos";

type AbaConteudoSeguindo = "seguidores" | "obras" | "pessoas";

const STORAGE_KEY = "historietas-obras";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

function criarStorageKeyUsuarioSeguindo(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerJsonStorageUsuarioSeguindo(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioSeguindo(chave, userIdLimpo);
    const texto = chaveStorage ? localStorage.getItem(chaveStorage) : null;

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioSeguindo(chave: string, userId: string, valor: unknown) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioSeguindo(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é apoio; a página continua com o estado em memória.
  }
}

function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatarGeneroSeguindo(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

function criarLoginHrefSeguindo() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/seguindo";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/seguindo";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function obterParametrosSociaisSeguindoUrl(userIdLogado: string) {
  if (typeof window === "undefined") {
    return {
      aba: "seguindo" as AbaSeguimentoPagina,
      perfilId: "",
      perfilNome: "",
      conteudo: "obras" as AbaConteudoSeguindo,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const abaValor = params.get("aba");
  const abaParam = abaValor === "seguidores" ? "seguidores" : "seguindo";
  const conteudoParam = params.get("conteudo");
  const conteudoSeguro: AbaConteudoSeguindo =
    conteudoParam === "seguidores" ||
    conteudoParam === "pessoas" ||
    conteudoParam === "obras"
      ? conteudoParam
      : abaValor === "seguidores"
        ? "seguidores"
        : abaValor === "seguindo"
          ? "pessoas"
          : "obras";
  const perfilIdParam = (params.get("userId") || params.get("autorId") || "").trim();
  const perfilNomeParam = (params.get("autor") || params.get("nome") || "").trim();
  const perfilIdSeguro = idUsuarioSupabaseValido(perfilIdParam)
    ? perfilIdParam
    : abaParam === "seguidores" && !conteudoParam
      ? userIdLogado
      : "";

  return {
    aba: abaParam as AbaSeguimentoPagina,
    perfilId: perfilIdSeguro,
    perfilNome: perfilNomeParam,
    conteudo: conteudoSeguro,
  };
}

function criarHrefLeituraCapitulo(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: CapituloLocal,
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
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function criarHrefPerfilAutorSeguindo(nomeAutor: string, autorId?: string) {
  const params = new URLSearchParams();
  const nomeAutorLimpo = nomeAutor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", nomeAutorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function idUsuarioSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefPerfilUsuarioSeguindo(usuario: UsuarioSeguido) {
  const params = new URLSearchParams();

  params.set("userId", usuario.id);
  params.set("autorId", usuario.id);
  params.set("autor", usuario.nome.trim() || "Usuário");

  return `/perfil-autor?${params.toString()}`;
}

function criarHandleUsuarioSeguindo(
  nome: string,
  handleSalvo = "",
  userId = ""
) {
  const handleLimpo = handleSalvo.trim().replace(/^@+/, "");

  if (handleLimpo) {
    return `@${handleLimpo}`;
  }

  const handleNome = normalizarTexto(nome)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  if (handleNome) {
    return `@${handleNome}`;
  }

  return userId ? `@usuario.${userId.slice(0, 4)}` : "@usuario";
}

function normalizarUsuarioBuscaSeguindo(
  profile: RegistroSupabaseGenerico
): UsuarioSeguido | null {
  const id =
    obterTextoRegistro(profile, "user_id") ||
    obterTextoRegistro(profile, "id");
  const nome = obterNomeProfileSeguindo(profile);

  if (!idUsuarioSupabaseValido(id) || !nome) {
    return null;
  }

  const handleSalvo =
    obterTextoRegistro(profile, "username") ||
    obterTextoRegistro(profile, "nome_usuario") ||
    obterTextoRegistro(profile, "apelido");

  return {
    id,
    nome: nome.slice(0, 80),
    handle: criarHandleUsuarioSeguindo(nome, handleSalvo, id),
    bio: (
      obterBioProfileSeguindo(profile) ||
      "Perfil de leitor no Historietas."
    ).slice(0, 140),
    avatar: obterAvatarProfileSeguindo(profile),
    criadoEm: "",
  };
}

async function buscarUsuariosParaSeguirSupabase(termo: string) {
  const termoLimpo = termo.trim().replace(/^@+/, "").slice(0, 80);

  if (termoLimpo.length < 2) {
    return [] as UsuarioSeguido[];
  }

  const termoSeguro = termoLimpo.replace(/[%_]/g, "");
  const padraoBusca = `%${termoSeguro}%`;
  const consultas = [
    {
      coluna: "nome",
      campos: "id,user_id,nome,avatar_url",
    },
    {
      coluna: "username",
      campos: "id,user_id,nome,avatar_url,username",
    },
    {
      coluna: "nome_usuario",
      campos: "id,user_id,nome,avatar_url,nome_usuario",
    },
  ] as const;

  const resultados = await Promise.all(
    consultas.map(async ({ coluna, campos }) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(campos)
          .ilike(coluna, padraoBusca)
          .limit(20);

        if (error || !Array.isArray(data)) {
          return [] as RegistroSupabaseGenerico[];
        }

        return normalizarRegistrosSupabaseGenericos(data);
      } catch {
        return [] as RegistroSupabaseGenerico[];
      }
    })
  );

  const usuariosPorId = new Map<string, UsuarioSeguido>();

  resultados.flat().forEach((profile) => {
    const usuarioEncontrado = normalizarUsuarioBuscaSeguindo(profile);

    if (usuarioEncontrado) {
      usuariosPorId.set(usuarioEncontrado.id, usuarioEncontrado);
    }
  });

  const termoNormalizado = normalizarTexto(termoLimpo);

  return Array.from(usuariosPorId.values())
    .filter((usuarioEncontrado) => {
      const textoUsuario = normalizarTexto(
        [
          usuarioEncontrado.nome,
          usuarioEncontrado.handle,
          usuarioEncontrado.bio,
        ].join(" ")
      );

      return textoUsuario.includes(termoNormalizado);
    })
    .sort((usuarioA, usuarioB) => {
      const textoA = normalizarTexto(`${usuarioA.nome} ${usuarioA.handle}`);
      const textoB = normalizarTexto(`${usuarioB.nome} ${usuarioB.handle}`);
      const iniciaA = textoA.startsWith(termoNormalizado);
      const iniciaB = textoB.startsWith(termoNormalizado);

      if (iniciaA !== iniciaB) {
        return iniciaA ? -1 : 1;
      }

      return usuarioA.nome.localeCompare(usuarioB.nome, "pt-BR");
    })
    .slice(0, 12);
}

function obterAvatarProfileSeguindo(profile: RegistroSupabaseGenerico | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "avatar_url") ||
    obterTextoRegistro(profile, "avatar") ||
    obterTextoRegistro(profile, "foto_url") ||
    obterTextoRegistro(profile, "imagem_url") ||
    obterTextoRegistro(profile, "photo_url")
  );
}

function obterNomeProfileSeguindo(profile: RegistroSupabaseGenerico | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "nome") ||
    obterTextoRegistro(profile, "nome_usuario") ||
    obterTextoRegistro(profile, "username") ||
    obterTextoRegistro(profile, "display_name") ||
    obterTextoRegistro(profile, "apelido")
  );
}

function obterBioProfileSeguindo(profile: RegistroSupabaseGenerico | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistro(profile, "bio") ||
    obterTextoRegistro(profile, "sobre_bio") ||
    obterTextoRegistro(profile, "sobre") ||
    obterTextoRegistro(profile, "descricao")
  );
}

function criarAvatarUsuarioSeguindoStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return {
      ...authorAvatarStyle,
      textDecoration: "none",
    };
  }

  return {
    ...authorAvatarStyle,
    textDecoration: "none",
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

function normalizarListaTexto(lista: string[]) {
  return Array.from(
    new Set(
      lista
        .map((item) => item.trim())
        .filter((item) => Boolean(item))
    )
  );
}

function normalizarNumeroSeguindo(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

function contarCapitulosComFlagSeguindo(
  obra: Pick<ObraLocal, "capitulos">,
  campo: "curtiu" | "salvo" | "lido",
) {
  return obra.capitulos.filter((capitulo) => Boolean(capitulo[campo])).length;
}

function contarComentariosLocaisSeguindo(obra: Pick<ObraLocal, "capitulos">) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function obterTotalCurtidasObraSeguindo(
  obra: Pick<ObraLocal, "capitulos" | "totalCurtidas">,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalCurtidas, 0),
    contarCapitulosComFlagSeguindo(obra, "curtiu"),
  );
}

function obterTotalComentariosObraSeguindo(
  obra: Pick<ObraLocal, "capitulos" | "totalComentarios">,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalComentarios, 0),
    contarComentariosLocaisSeguindo(obra),
  );
}

function obterTotalSalvosObraSeguindo(
  obra: Pick<
    ObraLocal,
    | "capitulos"
    | "totalSalvos"
    | "totalSeguidores"
    | "totalFavoritas"
  >,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalSalvos, 0),
    normalizarNumeroSeguindo(obra.totalSeguidores, 0),
    normalizarNumeroSeguindo(obra.totalFavoritas, 0),
    contarCapitulosComFlagSeguindo(obra, "salvo"),
  );
}

function obterTotalLidosObraSeguindo(
  obra: Pick<ObraLocal, "capitulos" | "totalLidos">,
) {
  return Math.max(
    normalizarNumeroSeguindo(obra.totalLidos, 0),
    contarCapitulosComFlagSeguindo(obra, "lido"),
  );
}

function obterTotalConcluidasObraSeguindo(
  obra: Pick<ObraLocal, "totalConcluidas">,
) {
  return normalizarNumeroSeguindo(obra.totalConcluidas, 0);
}

function criarChavesObra(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">) {
  return normalizarListaTexto([
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
    obra.link,
  ]);
}

function obraEstaNaLista(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">, lista: string[]) {
  const listaNormalizada = new Set(normalizarListaTexto(lista));

  return criarChavesObra(obra).some((chave) => listaNormalizada.has(chave));
}

function removerObraDaLista(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">, lista: string[]) {
  const chavesParaRemover = new Set(criarChavesObra(obra));

  return normalizarListaTexto(lista).filter((item) => !chavesParaRemover.has(item));
}

function adicionarObraNaLista(obra: Pick<ObraLocal, "id" | "titulo" | "slug" | "link">, lista: string[]) {
  return normalizarListaTexto([...lista, obra.id]);
}

function dataAtividadeObra(obra: ObraLocal) {
  const datas = [obra.ultimaLeituraEm, obra.criadaEm]
    .map((data) => new Date(data).getTime())
    .filter((data) => Number.isFinite(data));

  return datas.length > 0 ? Math.max(...datas) : 0;
}

function textoBuscaObra(obra: ObraLocal) {
  return normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      formatarGeneroSeguindo(obra.genero),
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" ")
  );
}

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada"
  );
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const temCapituloLido = obra.capitulos.some((capitulo) => capitulo.lido);

  if (!temCapituloLido) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? obra.capitulos.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = obra.capitulos
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return obra.capitulos.find((capitulo) => !capitulo.lido) || null;
}

function obraEmLeitura(obra: ObraLocal) {
  const progresso = calcularProgressoLeitura(obra.capitulos);

  return progresso > 0 && progresso < 100;
}

function criarCoverStyle(capa: string, isDesktop = false): CSSProperties {
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  if (!capa) {
    return {
      ...baseStyle,
      background: "var(--historietas-seguindo-bg-deep, #04000A)",
      backgroundImage: "linear-gradient(135deg, var(--historietas-seguindo-surface, #08030F) 0%, var(--historietas-seguindo-bg-deep, #04000A) 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...baseStyle,
    background: "var(--historietas-seguindo-bg-deep, #04000A)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function normalizarCapituloSalvo(
  capitulo: CapituloSalvo,
  obraIndex: number,
  capituloIndex: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
    texto:
      typeof capitulo.texto === "string" && capitulo.texto.trim()
        ? capitulo.texto
        : "Nenhum texto foi escrito ainda.",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm:
      typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado:
      typeof capitulo.publicado === "boolean" ? capitulo.publicado : true,
  };
}

function normalizarObraSalva(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo: CapituloSalvo, capituloIndex: number) =>
        normalizarCapituloSalvo(capitulo, obraIndex, capituloIndex)
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo
      : "Obra sem título";
  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug
      : criarSlugBase(titulo || `obra-${obraIndex + 1}`);

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: Array.isArray(obra.tags)
      ? obra.tags.filter((tag): tag is string => typeof tag === "string")
      : ["sem tags"],
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
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
    totalCurtidas: normalizarNumeroSeguindo(
      obra.totalCurtidas ?? obra.curtidas ?? obra.likes ?? obra.total_curtidas,
      capitulosNormalizados.filter((capitulo) => capitulo.curtiu).length,
    ),
    totalComentarios: normalizarNumeroSeguindo(
      obra.totalComentarios ?? obra.comentarios ?? obra.total_comentarios,
      capitulosNormalizados.filter((capitulo) => capitulo.comentario.trim()).length,
    ),
    totalSalvos: normalizarNumeroSeguindo(
      obra.totalSalvos ?? obra.salvos ?? obra.total_salvos,
      capitulosNormalizados.filter((capitulo) => capitulo.salvo).length,
    ),
    totalLidos: normalizarNumeroSeguindo(
      obra.totalLidos ?? obra.lidos ?? obra.total_lidos,
      capitulosNormalizados.filter((capitulo) => capitulo.lido).length,
    ),
    totalSeguidores: normalizarNumeroSeguindo(
      obra.totalSeguidores ?? obra.seguidores ?? obra.total_seguidores,
      0,
    ),
    totalFavoritas: normalizarNumeroSeguindo(
      obra.totalFavoritas ?? obra.favoritas ?? obra.total_favoritas,
      0,
    ),
    totalConcluidas: normalizarNumeroSeguindo(
      obra.totalConcluidas ?? obra.concluidas ?? obra.total_concluidas,
      0,
    ),
  };
}

function obterTextoRegistro(registro: RegistroSupabaseGenerico, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

function obterIdObraRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "obra_id") ||
    obterTextoRegistro(registro, "obraId") ||
    obterTextoRegistro(registro, "id_obra")
  );
}

function obterIdCapituloRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "capitulo_id") ||
    obterTextoRegistro(registro, "capituloId") ||
    obterTextoRegistro(registro, "id_capitulo")
  );
}

function obterTextoComentarioRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "comentario") ||
    obterTextoRegistro(registro, "texto") ||
    obterTextoRegistro(registro, "conteudo")
  );
}

function registroIndicaLido(registro: RegistroSupabaseGenerico) {
  const valor = registro.lido;

  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "string") {
    return valor.toLowerCase() === "true";
  }

  return true;
}

function criarSetObrasPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .map((registro) => obterIdObraRegistro(registro))
      .filter((obraId) => Boolean(obraId))
  );
}

function criarSetCapitulosPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .map((registro) => obterIdCapituloRegistro(registro))
      .filter((capituloId) => Boolean(capituloId))
  );
}

function criarMapaCapitulosLidosPorRegistro(
  registros: RegistroSupabaseGenerico[]
) {
  const progressoPorCapitulo = new Map<string, string>();

  registros.forEach((registro) => {
    if (!registroIndicaLido(registro)) {
      return;
    }

    const capituloId = obterIdCapituloRegistro(registro);

    if (!capituloId || progressoPorCapitulo.has(capituloId)) {
      return;
    }

    const lidoEm =
      obterTextoRegistro(registro, "atualizado_em") ||
      obterTextoRegistro(registro, "updated_at") ||
      obterTextoRegistro(registro, "criado_em") ||
      obterTextoRegistro(registro, "created_at");

    progressoPorCapitulo.set(capituloId, lidoEm);
  });

  return progressoPorCapitulo;
}

function criarMapaComentariosPorCapitulo(
  registros: RegistroSupabaseGenerico[]
) {
  const mapa = new Map<string, string>();

  registros.forEach((registro) => {
    const capituloId = obterIdCapituloRegistro(registro);
    const comentario = obterTextoComentarioRegistro(registro);

    if (capituloId && comentario) {
      mapa.set(capituloId, comentario);
    }
  });

  return mapa;
}

async function carregarIdsObrasUsuarioSupabase(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
  userId: string
): Promise<RegistroSupabaseGenerico[]> {
  if (!userId) {
    return [] as RegistroSupabaseGenerico[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .eq("user_id", userId)
      .limit(1000);

    if (error) {
      console.warn(`Não consegui carregar ${tabela} no Supabase:`, error.message);
      return [];
    }

    return normalizarRegistrosSupabaseGenericos(data);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Supabase:`, error);
    return [];
  }
}

async function carregarRegistrosCapitulosUsuarioSupabase(
  tabela:
    | "salvos_capitulos"
    | "curtidas_capitulos"
    | "comentarios_capitulos"
    | "progresso_leitura",
  userId: string,
  capituloIds: string[]
): Promise<RegistroSupabaseGenerico[]> {
  if (!userId || capituloIds.length === 0) {
    return [] as RegistroSupabaseGenerico[];
  }

  const camposPorTabela = {
    salvos_capitulos: ["capitulo_id"],
    curtidas_capitulos: ["capitulo_id"],
    comentarios_capitulos: [
      "capitulo_id,texto",
      "capitulo_id,comentario",
      "capitulo_id,conteudo",
    ],
    progresso_leitura: ["capitulo_id,lido"],
  } satisfies Record<typeof tabela, string[]>;

  for (const campos of camposPorTabela[tabela]) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select(campos)
        .eq("user_id", userId)
        .in("capitulo_id", capituloIds)
        .limit(1000);

      if (!error) {
        return normalizarRegistrosSupabaseGenericos(data);
      }

      if (tabela !== "comentarios_capitulos") {
        console.warn(`Não consegui carregar ${tabela} no Supabase:`, error.message);
        return [];
      }
    } catch (error) {
      if (tabela !== "comentarios_capitulos") {
        console.warn(`Não consegui acessar ${tabela} no Supabase:`, error);
        return [];
      }
    }
  }

  return [] as RegistroSupabaseGenerico[];
}


async function carregarProgressoLeituraUsuarioSeguindo(
  userId: string,
  capituloIds: string[]
) {
  const userIdLimpo = userId.trim();
  const idsUnicos = Array.from(
    new Set(capituloIds.map((capituloId) => capituloId.trim()).filter(Boolean))
  );

  if (!userIdLimpo || idsUnicos.length === 0) {
    return {
      registros: [] as RegistroSupabaseGenerico[],
      carregado: Boolean(userIdLimpo),
    };
  }

  try {
    const { data, error } = await supabase
      .from("progresso_leitura")
      .select("obra_id,capitulo_id,lido,atualizado_em,criado_em")
      .eq("user_id", userIdLimpo)
      .in("capitulo_id", idsUnicos)
      .order("atualizado_em", { ascending: false })
      .limit(5000);

    if (error) {
      console.warn(
        "Não consegui carregar progresso_leitura no Supabase:",
        error.message
      );

      return {
        registros: [] as RegistroSupabaseGenerico[],
        carregado: false,
      };
    }

    return {
      registros: normalizarRegistrosSupabaseGenericos(data),
      carregado: true,
    };
  } catch (error) {
    console.warn("Não consegui acessar progresso_leitura no Supabase:", error);

    return {
      registros: [] as RegistroSupabaseGenerico[],
      carregado: false,
    };
  }
}


function adicionarUsuarioUnicoSeguindo(
  usuariosPorChave: Map<string, Set<string>>,
  chave: string,
  userId: string,
) {
  const chaveLimpa = chave.trim();
  const userIdLimpo = userId.trim();

  if (!chaveLimpa || !userIdLimpo) {
    return;
  }

  const usuarios = usuariosPorChave.get(chaveLimpa) || new Set<string>();

  usuarios.add(userIdLimpo);
  usuariosPorChave.set(chaveLimpa, usuarios);
}

function converterUsuariosSeguindo(
  usuariosPorChave: Map<string, Set<string>>,
): UsuariosPorChaveSeguindo {
  return Array.from(usuariosPorChave.entries()).reduce<
    UsuariosPorChaveSeguindo
  >((resultado, [chave, usuarios]) => {
    resultado[chave] = Array.from(usuarios);

    return resultado;
  }, {});
}

function combinarUsuariosSeguindo(
  ...fontes: UsuariosPorChaveSeguindo[]
): UsuariosPorChaveSeguindo {
  const usuariosCombinados = new Map<string, Set<string>>();

  fontes.forEach((fonte) => {
    Object.entries(fonte).forEach(([chave, usuarios]) => {
      usuarios.forEach((userId) => {
        adicionarUsuarioUnicoSeguindo(usuariosCombinados, chave, userId);
      });
    });
  });

  return converterUsuariosSeguindo(usuariosCombinados);
}

function contarUsuariosSeguindo(
  usuariosPorChave: UsuariosPorChaveSeguindo,
) {
  return Object.entries(usuariosPorChave).reduce<Record<string, number>>(
    (contagens, [chave, usuarios]) => {
      contagens[chave] = new Set(
        usuarios.map((userId) => userId.trim()).filter(Boolean),
      ).size;

      return contagens;
    },
    {},
  );
}

function mapearUsuariosCapitulosParaObrasSeguindo(
  usuariosPorCapitulo: UsuariosPorChaveSeguindo,
  obraIdPorCapitulo: Record<string, string>,
) {
  const usuariosPorObra = new Map<string, Set<string>>();

  Object.entries(usuariosPorCapitulo).forEach(([capituloId, usuarios]) => {
    const obraId = obraIdPorCapitulo[capituloId]?.trim() || "";

    usuarios.forEach((userId) => {
      adicionarUsuarioUnicoSeguindo(usuariosPorObra, obraId, userId);
    });
  });

  return converterUsuariosSeguindo(usuariosPorObra);
}

async function carregarUsuariosTabelaSeguindo(
  tabela: string,
  coluna: string,
  ids: string[],
  somenteLidos = false,
): Promise<UsuariosPorChaveSeguindo> {
  const idsUnicos = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );
  const usuariosPorChave = new Map<string, Set<string>>();

  if (idsUnicos.length === 0) {
    return {};
  }

  const tamanhoLote = 80;
  const tamanhoPagina = 1000;

  for (
    let inicioLote = 0;
    inicioLote < idsUnicos.length;
    inicioLote += tamanhoLote
  ) {
    const idsLote = idsUnicos.slice(inicioLote, inicioLote + tamanhoLote);
    let inicioPagina = 0;

    while (true) {
      try {
        let consulta = supabase
          .from(tabela)
          .select(`${coluna},user_id`)
          .in(coluna, idsLote)
          .range(inicioPagina, inicioPagina + tamanhoPagina - 1);

        if (somenteLidos) {
          consulta = consulta.eq("lido", true);
        }

        const { data, error } = await consulta;

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((registro) => {
          if (
            !registro ||
            typeof registro !== "object" ||
            Array.isArray(registro)
          ) {
            return;
          }

          const linha = registro as RegistroSupabaseGenerico;
          const id = obterTextoRegistro(linha, coluna);
          const userId = obterTextoRegistro(linha, "user_id");

          adicionarUsuarioUnicoSeguindo(
            usuariosPorChave,
            id,
            userId,
          );
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicioPagina += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return converterUsuariosSeguindo(usuariosPorChave);
}


function somarTotaisCapitulosSeguindo(
  capitulos: Pick<SupabaseCapituloRow, "id">[],
  contagens: Record<string, number>,
) {
  return capitulos.reduce((total, capitulo) => {
    return total + normalizarNumeroSeguindo(contagens[capitulo.id], 0);
  }, 0);
}

function obterTotalRegistroObraSeguindo(
  obraId: string,
  contagens: Record<string, number>,
) {
  return normalizarNumeroSeguindo(contagens[obraId], 0);
}

function converterObraSupabaseParaLocal({
  obraBanco,
  capitulosBanco,
  obraLocal,
  capitulosSalvos,
  capitulosCurtidos,
  progressoPorCapitulo,
  progressoCarregado,
  comentariosCapitulos,
  totaisReais = totaisInteracoesSeguindoVazios,
  index,
}: {
  obraBanco: SupabaseObraRow;
  capitulosBanco: SupabaseCapituloRow[];
  obraLocal?: ObraLocal;
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  progressoPorCapitulo: Map<string, string>;
  progressoCarregado: boolean;
  comentariosCapitulos: Map<string, string>;
  totaisReais?: TotaisInteracoesSeguindo;
  index: number;
}): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  let ultimoCapituloLidoId = progressoCarregado
    ? ""
    : obraLocal?.ultimoCapituloLidoId || "";
  let ultimaLeituraEm = progressoCarregado
    ? ""
    : obraLocal?.ultimaLeituraEm || "";

  const capitulosRemotos = capitulosBanco.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const comentarioSupabase = comentariosCapitulos.get(capitulo.id) || "";
    const temProgressoRemoto = progressoPorCapitulo.has(capitulo.id);
    const lido = progressoCarregado
      ? temProgressoRemoto
      : Boolean(capituloLocal?.lido);
    const lidoEmRemoto = progressoPorCapitulo.get(capitulo.id) || "";
    const lidoEm = lido
      ? lidoEmRemoto || capituloLocal?.lidoEm || ""
      : "";

    if (lido) {
      const tempoAtual = new Date(lidoEm).getTime();
      const tempoUltimo = new Date(ultimaLeituraEm).getTime();
      const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
      const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

      if (!ultimoCapituloLidoId || tempoAtualSeguro >= tempoUltimoSeguro) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capituloLocal?.texto || "",
      curtiu: Boolean(capituloLocal?.curtiu) || capitulosCurtidos.has(capitulo.id),
      salvo: Boolean(capituloLocal?.salvo) || capitulosSalvos.has(capitulo.id),
      comentario: comentarioSupabase || capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido,
      lidoEm,
      publicado: true,
    };
  });

  const capitulosMesclados = capitulosRemotos;
  const tituloObra =
    obraBanco.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obraBanco.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const totalCurtidasUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.curtidasPorObra,
  );
  const totalComentariosUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.comentariosPorObra,
  );
  const totalSalvosUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.salvosPorObra,
  );
  const totalLidosUsuariosObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.lidosPorObra,
  );
  const totalSeguidoresObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.seguidoresPorObra,
  );
  const totalFavoritasObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.favoritasPorObra,
  );
  const totalConcluidasObra = obterTotalRegistroObraSeguindo(
    obraBanco.id,
    totaisReais.concluidasPorObra,
  );
  const totalCurtidasCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.curtidasPorCapitulo,
  );
  const totalComentariosCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.comentariosPorCapitulo,
  );
  const totalSalvosCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.salvosPorCapitulo,
  );
  const totalLidosCapitulos = somarTotaisCapitulosSeguindo(
    capitulosBanco,
    totaisReais.lidosPorCapitulo,
  );

  return {
    id: obraBanco.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obraBanco.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obraBanco.user_id?.trim() || obraLocal?.autorId || "",
    genero: obraBanco.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraBanco.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraBanco.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraBanco.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraBanco.tags) && obraBanco.tags.length > 0
        ? obraBanco.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obraBanco.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraBanco.capa_nome?.trim() || obraLocal?.capaNome || "",
    publicado: Boolean(obraBanco.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraBanco.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug: slugObra,
    link: obraBanco.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
    totalCurtidas: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalCurtidas, 0),
      totalCurtidasUsuariosObra,
      totalCurtidasCapitulos,
    ),
    totalComentarios: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalComentarios, 0),
      totalComentariosUsuariosObra,
      totalComentariosCapitulos,
    ),
    totalSalvos: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalSalvos, 0),
      totalSalvosUsuariosObra,
      totalSalvosCapitulos,
      totalSeguidoresObra,
      totalFavoritasObra,
    ),
    totalLidos: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalLidos, 0),
      totalLidosUsuariosObra,
      totalLidosCapitulos,
    ),
    totalSeguidores: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalSeguidores, 0),
      totalSeguidoresObra,
    ),
    totalFavoritas: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalFavoritas, 0),
      totalFavoritasObra,
    ),
    totalConcluidas: Math.max(
      normalizarNumeroSeguindo(obraLocal?.totalConcluidas, 0),
      totalConcluidasObra,
    ),
  };
}

function mesclarObrasSeguindo(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [...obrasLocais];

  obrasSupabase.forEach((obraSupabase) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase = obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

      return obraLocal.id === obraSupabase.id || slugLocal === slugSupabase;
    });

    if (indiceExistente >= 0) {
      obrasMescladas[indiceExistente] = {
        ...obrasMescladas[indiceExistente],
        ...obraSupabase,
      };
      return;
    }

    obrasMescladas.unshift(obraSupabase);
  });

  return obrasMescladas;
}

async function carregarSeguindoSupabase(
  obrasLocais: ObraLocal[],
  obrasSeguidasLocais: string[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[],
  perfilSocialId = ""
) {
  try {
    let userId = "";

    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id || "";
    } catch {
      userId = "";
    }

    const perfilSocialIdLimpo = perfilSocialId.trim();
    const userIdObrasSeguidas = idUsuarioSupabaseValido(perfilSocialIdLimpo)
      ? perfilSocialIdLimpo
      : userId;

    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn("Não consegui carregar obras no Seguindo:", erroObras.message);

      return {
        obras: obrasLocais,
        obrasSeguidas: obrasSeguidasLocais,
        obrasFavoritas: obrasFavoritasLocais,
        obrasConcluidas: obrasConcluidasLocais,
      };
    }

    const obrasSupabaseBanco = Array.isArray(obrasBanco)
      ? (obrasBanco as unknown as SupabaseObraRow[])
      : [];
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocais,
        obrasSeguidas: obrasSeguidasLocais,
        obrasFavoritas: obrasFavoritasLocais,
        obrasConcluidas: obrasConcluidasLocais,
      };
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
      .in("obra_id", obraIds)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(600);

    if (erroCapitulos) {
      console.warn("Não consegui carregar capítulos no Seguindo:", erroCapitulos.message);
    }

    const capitulosSupabaseBanco = erroCapitulos
      ? []
      : Array.isArray(capitulosBanco)
      ? (capitulosBanco as unknown as SupabaseCapituloRow[])
      : [];
    const capituloIds = capitulosSupabaseBanco
      .map((capitulo) => capitulo.id)
      .filter((capituloId) => Boolean(capituloId));
    const obraIdPorCapitulo = capitulosSupabaseBanco.reduce<
      Record<string, string>
    >((mapa, capitulo) => {
      if (capitulo.id && capitulo.obra_id) {
        mapa[capitulo.id] = capitulo.obra_id;
      }

      return mapa;
    }, {});

    const [
      seguidasBanco,
      favoritasBanco,
      concluidasBanco,
      salvosCapitulosBanco,
      curtidasCapitulosBanco,
      comentariosCapitulosBanco,
      progressoLeituraBanco,
      usuariosCurtidasPublicasCapitulos,
      usuariosComentariosPublicosCapitulos,
      usuariosSalvosPublicosCapitulos,
      usuariosLeiturasPublicasCapitulos,
      usuariosCurtidasPublicasObras,
      usuariosComentariosPublicosObras,
      usuariosSeguidoresPublicosObras,
      usuariosFavoritasPublicasObras,
      usuariosConcluidasPublicasObras,
    ] = await Promise.all([
      carregarIdsObrasUsuarioSupabase("seguindo_obras", userIdObrasSeguidas),
      carregarIdsObrasUsuarioSupabase("favoritos", userId),
      carregarIdsObrasUsuarioSupabase("concluidas", userId),
      carregarRegistrosCapitulosUsuarioSupabase(
        "salvos_capitulos",
        userId,
        capituloIds
      ),
      carregarRegistrosCapitulosUsuarioSupabase(
        "curtidas_capitulos",
        userId,
        capituloIds
      ),
      carregarRegistrosCapitulosUsuarioSupabase(
        "comentarios_capitulos",
        userId,
        capituloIds
      ),
      carregarProgressoLeituraUsuarioSeguindo(
        userId,
        capituloIds
      ),
      carregarUsuariosTabelaSeguindo(
        "curtidas_capitulos",
        "capitulo_id",
        capituloIds,
      ),
      carregarUsuariosTabelaSeguindo(
        "comentarios_capitulos",
        "capitulo_id",
        capituloIds,
      ),
      carregarUsuariosTabelaSeguindo(
        "salvos_capitulos",
        "capitulo_id",
        capituloIds,
      ),
      carregarUsuariosTabelaSeguindo(
        "progresso_leitura",
        "capitulo_id",
        capituloIds,
        true,
      ),
      carregarUsuariosTabelaSeguindo("obra_curtidas", "obra_id", obraIds),
      carregarUsuariosTabelaSeguindo("comentarios_obras", "obra_id", obraIds),
      carregarUsuariosTabelaSeguindo("seguindo_obras", "obra_id", obraIds),
      carregarUsuariosTabelaSeguindo("favoritos", "obra_id", obraIds),
      carregarUsuariosTabelaSeguindo("concluidas", "obra_id", obraIds),
    ]);

    const seguidasSupabase = criarSetObrasPorRegistro(seguidasBanco);
    const favoritasSupabase = criarSetObrasPorRegistro(favoritasBanco);
    const concluidasSupabase = criarSetObrasPorRegistro(concluidasBanco);
    const capitulosSalvos = criarSetCapitulosPorRegistro(salvosCapitulosBanco);
    const capitulosCurtidos = criarSetCapitulosPorRegistro(curtidasCapitulosBanco);
    const progressoPorCapitulo = criarMapaCapitulosLidosPorRegistro(
      progressoLeituraBanco.registros
    );
    const progressoCarregado = progressoLeituraBanco.carregado;
    const comentariosCapitulos = criarMapaComentariosPorCapitulo(
      comentariosCapitulosBanco
    );
    const curtidasCapitulosPorObra =
      mapearUsuariosCapitulosParaObrasSeguindo(
        usuariosCurtidasPublicasCapitulos,
        obraIdPorCapitulo,
      );
    const comentariosCapitulosPorObra =
      mapearUsuariosCapitulosParaObrasSeguindo(
        usuariosComentariosPublicosCapitulos,
        obraIdPorCapitulo,
      );
    const salvosCapitulosPorObra =
      mapearUsuariosCapitulosParaObrasSeguindo(
        usuariosSalvosPublicosCapitulos,
        obraIdPorCapitulo,
      );
    const leiturasCapitulosPorObra =
      mapearUsuariosCapitulosParaObrasSeguindo(
        usuariosLeiturasPublicasCapitulos,
        obraIdPorCapitulo,
      );

    const usuariosCurtidasPorObra = combinarUsuariosSeguindo(
      usuariosCurtidasPublicasObras,
      curtidasCapitulosPorObra,
    );
    const usuariosComentariosPorObra = combinarUsuariosSeguindo(
      usuariosComentariosPublicosObras,
      comentariosCapitulosPorObra,
    );
    const usuariosSalvosPorObra = combinarUsuariosSeguindo(
      usuariosSeguidoresPublicosObras,
      usuariosFavoritasPublicasObras,
      salvosCapitulosPorObra,
    );

    const totaisReais: TotaisInteracoesSeguindo = {
      curtidasPorObra: contarUsuariosSeguindo(usuariosCurtidasPorObra),
      comentariosPorObra: contarUsuariosSeguindo(
        usuariosComentariosPorObra,
      ),
      salvosPorObra: contarUsuariosSeguindo(usuariosSalvosPorObra),
      lidosPorObra: contarUsuariosSeguindo(leiturasCapitulosPorObra),
      seguidoresPorObra: contarUsuariosSeguindo(
        usuariosSeguidoresPublicosObras,
      ),
      favoritasPorObra: contarUsuariosSeguindo(
        usuariosFavoritasPublicasObras,
      ),
      concluidasPorObra: contarUsuariosSeguindo(
        usuariosConcluidasPublicasObras,
      ),
      curtidasPorCapitulo: contarUsuariosSeguindo(
        usuariosCurtidasPublicasCapitulos,
      ),
      comentariosPorCapitulo: contarUsuariosSeguindo(
        usuariosComentariosPublicosCapitulos,
      ),
      salvosPorCapitulo: contarUsuariosSeguindo(
        usuariosSalvosPublicosCapitulos,
      ),
      lidosPorCapitulo: contarUsuariosSeguindo(
        usuariosLeiturasPublicasCapitulos,
      ),
    };

    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocais.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      return converterObraSupabaseParaLocal({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        progressoPorCapitulo,
        progressoCarregado,
        comentariosCapitulos,
        totaisReais,
        index,
      });
    });

    const obrasMescladas = mesclarObrasSeguindo(obrasLocais, obrasSupabase);

    return {
      obras: obrasMescladas,
      obrasSeguidas: Array.from(
        new Set([...obrasSeguidasLocais, ...Array.from(seguidasSupabase)])
      ),
      obrasFavoritas: Array.from(
        new Set([...obrasFavoritasLocais, ...Array.from(favoritasSupabase)])
      ),
      obrasConcluidas: Array.from(
        new Set([...obrasConcluidasLocais, ...Array.from(concluidasSupabase)])
      ),
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Seguindo:", error);

    return {
      obras: obrasLocais,
      obrasSeguidas: obrasSeguidasLocais,
      obrasFavoritas: obrasFavoritasLocais,
      obrasConcluidas: obrasConcluidasLocais,
    };
  }
}

async function carregarUsuariosSeguidosSupabase(userId: string) {
  if (!userId) {
    return [] as UsuarioSeguido[];
  }

  try {
    const { data: seguindoData, error: seguindoError } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id, criado_em")
      .eq("seguidor_id", userId)
      .order("criado_em", { ascending: false })
      .limit(120);

    if (seguindoError || !Array.isArray(seguindoData)) {
      return [] as UsuarioSeguido[];
    }

    const registrosSeguindo = normalizarRegistrosSupabaseGenericos(seguindoData);
    const usuariosIds = Array.from(
      new Set(
        registrosSeguindo
          .map((registro) => obterTextoRegistro(registro, "seguido_id"))
          .filter((id) => idUsuarioSupabaseValido(id) && id !== userId)
      )
    );

    if (usuariosIds.length === 0) {
      return [] as UsuarioSeguido[];
    }

    const profilesPorUsuario = new Map<string, RegistroSupabaseGenerico>();

    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(
          "*"
        )
        .in("user_id", usuariosIds)
        .limit(120);

      if (Array.isArray(profilesData)) {
        normalizarRegistrosSupabaseGenericos(profilesData).forEach((profile) => {
          const profileUserId = obterTextoRegistro(profile, "user_id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
    }

    const usuariosSemProfile = usuariosIds.filter(
      (usuarioId) => !profilesPorUsuario.has(usuarioId)
    );

    if (usuariosSemProfile.length > 0) {
      try {
        const { data: profilesDataPorId } = await supabase
          .from("profiles")
          .select(
            "*"
          )
          .in("id", usuariosSemProfile)
          .limit(120);

        if (Array.isArray(profilesDataPorId)) {
          normalizarRegistrosSupabaseGenericos(profilesDataPorId).forEach((profile) => {
            const profileUserId =
              obterTextoRegistro(profile, "user_id") || obterTextoRegistro(profile, "id");

            if (profileUserId) {
              profilesPorUsuario.set(profileUserId, profile);
            }
          });
        }
      } catch {
        // Profiles é complementar; a página segue com nome padrão se falhar.
      }
    }

    return registrosSeguindo
      .map((registro) => {
        const seguidoId = obterTextoRegistro(registro, "seguido_id");

        if (!idUsuarioSupabaseValido(seguidoId)) {
          return null;
        }

        const profile = profilesPorUsuario.get(seguidoId);
        const nome = obterNomeProfileSeguindo(profile) || seguidoId;
        const handleSalvo =
          obterTextoRegistro(profile || {}, "username") ||
          obterTextoRegistro(profile || {}, "nome_usuario") ||
          obterTextoRegistro(profile || {}, "apelido");
        const handle = criarHandleUsuarioSeguindo(
          nome,
          handleSalvo,
          seguidoId
        );
        const bio =
          obterBioProfileSeguindo(profile) ||
          "Perfil de leitor no Historietas.";
        const avatar = obterAvatarProfileSeguindo(profile);

        return {
          id: seguidoId,
          nome: nome.slice(0, 80),
          handle,
          bio: bio.slice(0, 140),
          avatar,
          criadoEm: obterTextoRegistro(registro, "criado_em"),
        } satisfies UsuarioSeguido;
      })
      .filter((usuario): usuario is UsuarioSeguido => Boolean(usuario));
  } catch (error) {
    console.warn("Não consegui carregar usuários seguidos:", error);
    return [] as UsuarioSeguido[];
  }
}


async function carregarUsuariosSeguidoresSupabase(userId: string) {
  if (!userId) {
    return [] as UsuarioSeguido[];
  }

  try {
    const { data: seguidoresData, error: seguidoresError } = await supabase
      .from("seguindo_usuarios")
      .select("seguidor_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false })
      .limit(120);

    if (seguidoresError || !Array.isArray(seguidoresData)) {
      return [] as UsuarioSeguido[];
    }

    const registrosSeguidores = normalizarRegistrosSupabaseGenericos(seguidoresData);
    const usuariosIds = Array.from(
      new Set(
        registrosSeguidores
          .map((registro) => obterTextoRegistro(registro, "seguidor_id"))
          .filter((id) => idUsuarioSupabaseValido(id) && id !== userId)
      )
    );

    if (usuariosIds.length === 0) {
      return [] as UsuarioSeguido[];
    }

    const profilesPorUsuario = new Map<string, RegistroSupabaseGenerico>();

    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(
          "*"
        )
        .in("user_id", usuariosIds)
        .limit(120);

      if (Array.isArray(profilesData)) {
        normalizarRegistrosSupabaseGenericos(profilesData).forEach((profile) => {
          const profileUserId = obterTextoRegistro(profile, "user_id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
    }

    const usuariosSemProfile = usuariosIds.filter(
      (usuarioId) => !profilesPorUsuario.has(usuarioId)
    );

    if (usuariosSemProfile.length > 0) {
      try {
        const { data: profilesDataPorId } = await supabase
          .from("profiles")
          .select(
            "*"
          )
          .in("id", usuariosSemProfile)
          .limit(120);

        if (Array.isArray(profilesDataPorId)) {
          normalizarRegistrosSupabaseGenericos(profilesDataPorId).forEach((profile) => {
            const profileUserId =
              obterTextoRegistro(profile, "user_id") || obterTextoRegistro(profile, "id");

            if (profileUserId) {
              profilesPorUsuario.set(profileUserId, profile);
            }
          });
        }
      } catch {
        // Profiles é complementar; a página segue com nome padrão se falhar.
      }
    }

    return registrosSeguidores
      .map((registro) => {
        const seguidorId = obterTextoRegistro(registro, "seguidor_id");

        if (!idUsuarioSupabaseValido(seguidorId)) {
          return null;
        }

        const profile = profilesPorUsuario.get(seguidorId);
        const nome = obterNomeProfileSeguindo(profile) || seguidorId;
        const handleSalvo =
          obterTextoRegistro(profile || {}, "username") ||
          obterTextoRegistro(profile || {}, "nome_usuario") ||
          obterTextoRegistro(profile || {}, "apelido");
        const handle = criarHandleUsuarioSeguindo(
          nome,
          handleSalvo,
          seguidorId
        );
        const bio =
          obterBioProfileSeguindo(profile) ||
          "Perfil de leitor no Historietas.";
        const avatar = obterAvatarProfileSeguindo(profile);

        return {
          id: seguidorId,
          nome: nome.slice(0, 80),
          handle,
          bio: bio.slice(0, 140),
          avatar,
          criadoEm: obterTextoRegistro(registro, "criado_em"),
        } satisfies UsuarioSeguido;
      })
      .filter((usuario): usuario is UsuarioSeguido => Boolean(usuario));
  } catch (error) {
    console.warn("Não consegui carregar seguidores:", error);
    return [] as UsuarioSeguido[];
  }
}


function obterMetadataAtividadeSeguindo(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {} as RegistroSupabaseGenerico;
  }

  return valor as RegistroSupabaseGenerico;
}

function formatarDataAtividadeSeguindo(dataIso: string) {
  if (!dataIso) {
    return "Data não informada";
  }

  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function obterRotuloAtividadeSeguindo(tipo: string) {
  if (tipo === "leu_capitulo") {
    return "Leitura";
  }

  if (tipo === "comecou_ler") {
    return "Começou";
  }

  if (tipo === "concluiu_obra") {
    return "Concluiu";
  }

  if (tipo === "avaliou_obra") {
    return "Avaliou";
  }

  if (tipo === "favoritou_obra") {
    return "Favoritou";
  }

  if (tipo === "salvou_obra") {
    return "Salvou";
  }

  if (tipo === "publicou_review") {
    return "Review";
  }

  if (tipo === "criou_lista") {
    return "Lista";
  }

  return "Diário";
}

function montarTextoAtividadeSeguindo({
  tipo,
  tituloObra,
  nota,
}: {
  tipo: string;
  tituloObra: string;
  nota: number;
}) {
  if (tipo === "leu_capitulo") {
    return `leu um capítulo de ${tituloObra}`;
  }

  if (tipo === "comecou_ler") {
    return `começou a ler ${tituloObra}`;
  }

  if (tipo === "concluiu_obra") {
    return `concluiu ${tituloObra}`;
  }

  if (tipo === "avaliou_obra") {
    const notaTexto = Number.isFinite(nota) && nota > 0
      ? ` com ${nota.toFixed(1).replace(".", ",")} estrelas`
      : "";

    return `avaliou ${tituloObra}${notaTexto}`;
  }

  if (tipo === "favoritou_obra") {
    return `favoritou ${tituloObra}`;
  }

  if (tipo === "salvou_obra") {
    return `salvou ${tituloObra}`;
  }

  if (tipo === "publicou_review") {
    return `publicou uma review${tituloObra ? ` sobre ${tituloObra}` : ""}`;
  }

  if (tipo === "criou_lista") {
    return "criou uma lista de leitura";
  }

  return tituloObra ? `interagiu com ${tituloObra}` : "registrou uma atividade no Diário";
}

function obterDataRegistroAtividadeSeguindo(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "criado_em") ||
    obterTextoRegistro(registro, "created_at") ||
    obterTextoRegistro(registro, "atualizado_em") ||
    obterTextoRegistro(registro, "updated_at")
  );
}

function obterVisibilidadeAtividadeSeguindo(
  registro: RegistroSupabaseGenerico,
  fallback: "publico" | "parcial" | "privado",
) {
  const visibilidade = obterTextoRegistro(registro, "visibilidade") || fallback;

  if (
    visibilidade === "publico" ||
    visibilidade === "parcial" ||
    visibilidade === "privado"
  ) {
    return visibilidade;
  }

  return fallback;
}

function registroAtividadeSeguindoPodeAparecer(
  registro: RegistroSupabaseGenerico,
  fallback: "publico" | "parcial" | "privado",
) {
  const visibilidade = obterVisibilidadeAtividadeSeguindo(registro, fallback);

  return visibilidade === "publico" || visibilidade === "parcial";
}

function criarAtividadeSeguindoPorDados({
  id,
  usuario,
  tipo,
  tituloObra,
  nota,
  data,
  href,
}: {
  id: string;
  usuario: UsuarioSeguido;
  tipo: string;
  tituloObra: string;
  nota: number;
  data: string;
  href: string;
}): AtividadeSeguindo {
  return {
    id,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioHandle: usuario.handle,
    usuarioAvatar: usuario.avatar,
    tipo,
    tipoRotulo: obterRotuloAtividadeSeguindo(tipo),
    titulo: tituloObra,
    descricao: montarTextoAtividadeSeguindo({
      tipo,
      tituloObra,
      nota,
    }),
    data,
    href,
  };
}

function criarAtividadeSeguindoDoDiario({
  registro,
  usuariosPorId,
  obrasPorId,
}: {
  registro: RegistroSupabaseGenerico;
  usuariosPorId: Map<string, UsuarioSeguido>;
  obrasPorId: Map<string, ObraLocal>;
}) {
  if (!registroAtividadeSeguindoPodeAparecer(registro, "privado")) {
    return null;
  }

  const atividadeId = obterTextoRegistro(registro, "id");
  const usuarioId = obterTextoRegistro(registro, "user_id");
  const usuario = usuariosPorId.get(usuarioId);

  if (!atividadeId || !usuario) {
    return null;
  }

  const metadata = obterMetadataAtividadeSeguindo(registro.metadata);
  const tipo = obterTextoRegistro(registro, "tipo") || "diario";
  const obraId = obterTextoRegistro(registro, "obra_id");
  const obra = obraId ? obrasPorId.get(obraId) || null : null;
  const tituloObra =
    obra?.titulo ||
    obterTextoRegistro(metadata, "obra_titulo") ||
    obterTextoRegistro(metadata, "titulo_obra") ||
    obterTextoRegistro(metadata, "obra_relacionada") ||
    "atividade de leitura";
  const nota = Number(registro.nota ?? metadata.nota ?? metadata.rating ?? 0);
  const postId = obterTextoRegistro(metadata, "post_id");
  const href =
    obra?.link ||
    (obra?.slug
      ? `/obra/${obra.slug}`
      : postId
        ? `/comunidade?post=${encodeURIComponent(postId)}`
        : criarHrefPerfilUsuarioSeguindo(usuario));

  return criarAtividadeSeguindoPorDados({
    id: `diario-${atividadeId}`,
    usuario,
    tipo,
    tituloObra,
    nota,
    data: obterDataRegistroAtividadeSeguindo(registro),
    href,
  });
}

function criarAtividadeSeguindoDeObra({
  registro,
  usuariosPorId,
  obrasPorId,
  tipo,
  fallbackVisibilidade,
}: {
  registro: RegistroSupabaseGenerico;
  usuariosPorId: Map<string, UsuarioSeguido>;
  obrasPorId: Map<string, ObraLocal>;
  tipo: "favoritou_obra" | "concluiu_obra" | "avaliou_obra";
  fallbackVisibilidade: "publico" | "parcial" | "privado";
}) {
  if (!registroAtividadeSeguindoPodeAparecer(registro, fallbackVisibilidade)) {
    return null;
  }

  const usuarioId = obterTextoRegistro(registro, "user_id");
  const usuario = usuariosPorId.get(usuarioId);
  const obraId = obterIdObraRegistro(registro);
  const obra = obraId ? obrasPorId.get(obraId) || null : null;

  if (!usuario || !obra) {
    return null;
  }

  const nota = Number(registro.nota ?? registro.rating ?? registro.avaliacao ?? 0);
  const data = obterDataRegistroAtividadeSeguindo(registro) || obra.criadaEm;
  const registroId = obterTextoRegistro(registro, "id") || `${usuarioId}-${tipo}-${obraId}`;

  return criarAtividadeSeguindoPorDados({
    id: `${tipo}-${registroId}`,
    usuario,
    tipo,
    tituloObra: obra.titulo,
    nota,
    data,
    href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
  });
}

async function carregarRegistrosAtividadesTabelaSeguindo(
  tabela: "diario_atividades" | "favoritos" | "concluidas" | "obra_avaliacoes",
  usuariosIds: string[],
): Promise<RegistroSupabaseGenerico[]> {
  const camposPorTabela = {
    diario_atividades:
      "id,user_id,tipo,obra_id,capitulo_id,texto,nota,visibilidade,metadata,criado_em,created_at,atualizado_em,updated_at",
    favoritos:
      "id,user_id,obra_id,visibilidade,criado_em,created_at,atualizado_em,updated_at",
    concluidas:
      "id,user_id,obra_id,visibilidade,criado_em,created_at,atualizado_em,updated_at",
    obra_avaliacoes:
      "id,user_id,obra_id,nota,rating,avaliacao,visibilidade,criado_em,created_at,atualizado_em,updated_at",
  } satisfies Record<typeof tabela, string>;

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(camposPorTabela[tabela])
      .in("user_id", usuariosIds)
      .limit(120);

    if (error || !Array.isArray(data)) {
      return [] as RegistroSupabaseGenerico[];
    }

    return normalizarRegistrosSupabaseGenericos(data);
  } catch (error) {
    console.warn(`Não consegui carregar ${tabela} no feed Seguindo:`, error);
    return [] as RegistroSupabaseGenerico[];
  }
}

function ordenarAtividadesSeguindo(itens: AtividadeSeguindo[]) {
  return [...itens].sort(
    (atividadeA, atividadeB) =>
      new Date(atividadeB.data).getTime() - new Date(atividadeA.data).getTime(),
  );
}

function deduplicarAtividadesSeguindo(itens: AtividadeSeguindo[]) {
  const atividadesPorChave = new Map<string, AtividadeSeguindo>();

  ordenarAtividadesSeguindo(itens).forEach((atividade) => {
    const chave = [
      atividade.usuarioId,
      atividade.tipo,
      normalizarTexto(atividade.titulo),
      atividade.href,
    ].join("|");

    if (!atividadesPorChave.has(chave)) {
      atividadesPorChave.set(chave, atividade);
    }
  });

  return ordenarAtividadesSeguindo(Array.from(atividadesPorChave.values()));
}

async function carregarAtividadesSeguindoSupabase(
  usuariosSeguidosBase: UsuarioSeguido[],
  obrasDisponiveis: ObraLocal[],
  usuarioLogadoId: string,
) {
  const usuariosIds = usuariosSeguidosBase
    .map((usuarioSeguido) => usuarioSeguido.id)
    .filter((id) => idUsuarioSupabaseValido(id) && id !== usuarioLogadoId);

  if (usuariosIds.length === 0) {
    return [] as AtividadeSeguindo[];
  }

  const usuariosPorId = new Map(
    usuariosSeguidosBase.map((usuarioSeguido) => [usuarioSeguido.id, usuarioSeguido])
  );
  const obrasPorId = new Map(
    obrasDisponiveis
      .filter((obra) => Boolean(obra.id))
      .map((obra) => [obra.id, obra])
  );

  const [diarioAtividades, favoritos, concluidas, avaliacoes] = await Promise.all([
    carregarRegistrosAtividadesTabelaSeguindo("diario_atividades", usuariosIds),
    carregarRegistrosAtividadesTabelaSeguindo("favoritos", usuariosIds),
    carregarRegistrosAtividadesTabelaSeguindo("concluidas", usuariosIds),
    carregarRegistrosAtividadesTabelaSeguindo("obra_avaliacoes", usuariosIds),
  ]);

  const atividadesDiario = diarioAtividades
    .map((registro) =>
      criarAtividadeSeguindoDoDiario({
        registro,
        usuariosPorId,
        obrasPorId,
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  const atividadesFavoritos = favoritos
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "favoritou_obra",
        fallbackVisibilidade: "parcial",
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  const atividadesConcluidas = concluidas
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "concluiu_obra",
        fallbackVisibilidade: "parcial",
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  const atividadesAvaliacoes = avaliacoes
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "avaliou_obra",
        fallbackVisibilidade: "publico",
      }),
    )
    .filter((atividade): atividade is AtividadeSeguindo => Boolean(atividade));

  return deduplicarAtividadesSeguindo([
    ...atividadesDiario,
    ...atividadesFavoritos,
    ...atividadesConcluidas,
    ...atividadesAvaliacoes,
  ]).slice(0, 30);
}

async function sincronizarObraUsuarioSupabase(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return;
    }

    await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (ativo) {
      const visibilidade = tabela === "seguindo_obras" ? "privado" : "parcial";
      const payloadBase = {
        user_id: userId,
        obra_id: obraId,
      };
      const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
        ...payloadBase,
        visibilidade,
      });

      if (!erroComVisibilidade) {
        return;
      }

      const { error: erroSemVisibilidade } = await supabase
        .from(tabela)
        .insert(payloadBase);

      if (erroSemVisibilidade) {
        throw erroSemVisibilidade;
      }
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no Supabase:`, error);
  }
}

export default function SeguindoPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [usuariosSeguidos, setUsuariosSeguidos] = useState<UsuarioSeguido[]>([]);
  const [usuariosSeguidores, setUsuariosSeguidores] = useState<UsuarioSeguido[]>([]);
  const [, setAtividadesSeguindo] = useState<AtividadeSeguindo[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaSeguindoAberta, setBuscaSeguindoAberta] = useState(false);
  const [usuariosSugestoesBusca, setUsuariosSugestoesBusca] = useState<
    UsuarioSeguido[]
  >([]);
  const [carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes] =
    useState(false);
  const [usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId] =
    useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroSeguindo>("todos");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoSeguindo>("padrao");
  const [abaConteudo, setAbaConteudo] =
    useState<AbaConteudoSeguindo>("obras");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState("");
  const [abaSeguimento, setAbaSeguimento] =
    useState<AbaSeguimentoPagina>("seguindo");
  const [perfilSocialId, setPerfilSocialId] = useState("");
  const [perfilSocialNome, setPerfilSocialNome] = useState("");
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0
    );

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(atualizarModoDesktopTimer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(atualizarModoDesktopTimer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    if (!mostrarPainelOrdenacao || typeof document === "undefined") {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const overscrollAnterior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.body.style.overscrollBehavior = overscrollAnterior;
    };
  }, [mostrarPainelOrdenacao]);

  useEffect(() => {
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (!userId) {
          router.replace(criarLoginHrefSeguindo());
          return;
        }

        const parametrosSociais = obterParametrosSociaisSeguindoUrl(userId);

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioLogadoId(userId);
            setAbaSeguimento(parametrosSociais.aba);
            setAbaConteudo(parametrosSociais.conteudo);
            setPerfilSocialId(parametrosSociais.perfilId);
            setPerfilSocialNome(parametrosSociais.perfilNome);
            setVerificandoAcesso(false);
          }
        }, 0);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefSeguindo());
        }
      }
    }

    void verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router]);


  async function carregarDadosSeguindo() {
    window.setTimeout(() => {
      setCarregando(true);
    }, 0);

    let obrasNormalizadas: ObraLocal[] = [];
    let seguindoNormalizado: string[] = [];
    let autoresNormalizados: string[] = [];
    let favoritasNormalizadas: string[] = [];
    let concluidasNormalizadas: string[] = [];

    try {
      const obrasJson = lerJsonStorageUsuarioSeguindo(STORAGE_KEY, usuarioLogadoId);

      obrasNormalizadas = Array.isArray(obrasJson)
        ? (obrasJson as ObraSalva[]).map((obra, obraIndex) =>
            normalizarObraSalva(obra, obraIndex)
          )
        : [];

      const seguindoJson = lerJsonStorageUsuarioSeguindo(
        FOLLOW_STORAGE_KEY,
        usuarioLogadoId
      );

      seguindoNormalizado = Array.isArray(seguindoJson)
        ? normalizarListaTexto(
            seguindoJson.filter((id): id is string => typeof id === "string")
          )
        : [];

      const autoresJson = lerJsonStorageUsuarioSeguindo(
        AUTHOR_FOLLOW_STORAGE_KEY,
        usuarioLogadoId
      );

      autoresNormalizados = Array.isArray(autoresJson)
        ? autoresJson
            .filter((autor): autor is string => typeof autor === "string")
            .map((autor) => normalizarNomeAutor(autor))
        : [];

      const favoritasJson = lerJsonStorageUsuarioSeguindo(
        FAVORITES_STORAGE_KEY,
        usuarioLogadoId
      );

      favoritasNormalizadas = Array.isArray(favoritasJson)
        ? normalizarListaTexto(
            favoritasJson.filter((id): id is string => typeof id === "string")
          )
        : [];

      const concluidasJson = lerJsonStorageUsuarioSeguindo(
        COMPLETED_STORAGE_KEY,
        usuarioLogadoId
      );

      concluidasNormalizadas = Array.isArray(concluidasJson)
        ? normalizarListaTexto(
            concluidasJson.filter((id): id is string => typeof id === "string")
          )
        : [];

    } catch {
      obrasNormalizadas = [];
      seguindoNormalizado = [];
      autoresNormalizados = [];
      favoritasNormalizadas = [];
      concluidasNormalizadas = [];
    }

    window.setTimeout(() => {
      setObras(obrasNormalizadas);
      setObrasSeguidas(perfilSocialId ? [] : seguindoNormalizado);
      setAutoresSeguidos(autoresNormalizados);
      setObrasFavoritas(favoritasNormalizadas);
      setObrasConcluidas(concluidasNormalizadas);
      setCarregando(false);
    }, 0);

    const perfilIdParaListaSocial = perfilSocialId || usuarioLogadoId;
    const [
      dadosSupabase,
      usuariosSeguidosSupabase,
      usuariosSeguidoresSupabase,
    ] = await Promise.all([
      carregarSeguindoSupabase(
        obrasNormalizadas,
        perfilSocialId ? [] : seguindoNormalizado,
        favoritasNormalizadas,
        concluidasNormalizadas,
        perfilSocialId
      ),
      carregarUsuariosSeguidosSupabase(perfilIdParaListaSocial),
      carregarUsuariosSeguidoresSupabase(perfilIdParaListaSocial),
    ]);

    obrasNormalizadas = dadosSupabase.obras.map((obra, index) =>
      normalizarObraSalva(obra as ObraSalva, index)
    );
    const atividadesSeguindoSupabase = await carregarAtividadesSeguindoSupabase(
      usuariosSeguidosSupabase,
      obrasNormalizadas,
      usuarioLogadoId
    );
    seguindoNormalizado = normalizarListaTexto(dadosSupabase.obrasSeguidas);
    favoritasNormalizadas = normalizarListaTexto(dadosSupabase.obrasFavoritas);
    concluidasNormalizadas = normalizarListaTexto(dadosSupabase.obrasConcluidas);

    salvarJsonStorageUsuarioSeguindo(
      STORAGE_KEY,
      usuarioLogadoId,
      obrasNormalizadas
    );
    salvarJsonStorageUsuarioSeguindo(
      FOLLOW_STORAGE_KEY,
      usuarioLogadoId,
      seguindoNormalizado
    );
    salvarJsonStorageUsuarioSeguindo(
      AUTHOR_FOLLOW_STORAGE_KEY,
      usuarioLogadoId,
      autoresNormalizados
    );
    salvarJsonStorageUsuarioSeguindo(
      FAVORITES_STORAGE_KEY,
      usuarioLogadoId,
      favoritasNormalizadas
    );
    salvarJsonStorageUsuarioSeguindo(
      COMPLETED_STORAGE_KEY,
      usuarioLogadoId,
      concluidasNormalizadas
    );

    window.setTimeout(() => {
      setObras(obrasNormalizadas);
      setObrasSeguidas(seguindoNormalizado);
      setAutoresSeguidos(autoresNormalizados);
      setUsuariosSeguidos(usuariosSeguidosSupabase);
      setUsuariosSeguidores(usuariosSeguidoresSupabase);
      setAtividadesSeguindo(atividadesSeguindoSupabase);
      setObrasFavoritas(favoritasNormalizadas);
      setObrasConcluidas(concluidasNormalizadas);
      setCarregando(false);
    }, 0);
  }
  useEffect(() => {
    if (!usuarioLogadoId) {
      return;
    }

    const carregarDadosTimer = window.setTimeout(() => {
      void carregarDadosSeguindo();
    }, 0);

    return () => {
      window.clearTimeout(carregarDadosTimer);
    };
  }, [usuarioLogadoId, perfilSocialId]);


  const termoBusca = normalizarTexto(busca);
  const visualizandoListaSocialDoPerfil = Boolean(perfilSocialId);
  const buscaSugestoesUsuariosAtiva = Boolean(
    buscaSeguindoAberta &&
      termoBusca.length >= 2 &&
      !visualizandoListaSocialDoPerfil &&
      (abaConteudo === "pessoas" || abaConteudo === "seguidores")
  );
  const usuariosBaseSocial =
    abaConteudo === "seguidores" ? usuariosSeguidores : usuariosSeguidos;
  const tituloListaSocial =
    abaConteudo === "seguidores"
      ? "SEGUIDORES"
      : abaConteudo === "pessoas"
        ? "PESSOAS SEGUIDAS"
        : "OBRAS SEGUIDAS";
  const descricaoListaSocial = perfilSocialNome.trim()
    ? `${tituloListaSocial.toLowerCase()} de ${perfilSocialNome.trim()}`
    : tituloListaSocial.toLowerCase();
  const podeRemoverUsuariosDaLista =
    !visualizandoListaSocialDoPerfil && abaConteudo === "pessoas";

  useEffect(() => {
    let cancelado = false;

    if (!buscaSugestoesUsuariosAtiva) {
      setUsuariosSugestoesBusca([]);
      setCarregandoUsuariosSugestoes(false);
      return;
    }

    setCarregandoUsuariosSugestoes(true);

    const timerBusca = window.setTimeout(() => {
      void buscarUsuariosParaSeguirSupabase(busca)
        .then((usuariosEncontrados) => {
          if (cancelado) {
            return;
          }

          const idsJaSeguidos = new Set(
            usuariosSeguidos.map((usuarioSeguido) => usuarioSeguido.id)
          );

          setUsuariosSugestoesBusca(
            usuariosEncontrados.filter((usuarioEncontrado) => {
              return (
                usuarioEncontrado.id !== usuarioLogadoId &&
                !idsJaSeguidos.has(usuarioEncontrado.id)
              );
            })
          );
        })
        .finally(() => {
          if (!cancelado) {
            setCarregandoUsuariosSugestoes(false);
          }
        });
    }, 220);

    return () => {
      cancelado = true;
      window.clearTimeout(timerBusca);
    };
  }, [
    busca,
    buscaSugestoesUsuariosAtiva,
    usuarioLogadoId,
    usuariosSeguidos,
  ]);

  const obrasSeguidasBase = useMemo(() => {
    return obras.filter((obra) => obraEstaNaLista(obra, obrasSeguidas));
  }, [obras, obrasSeguidas]);

  const autoresBase = useMemo<AutorSeguido[]>(() => {
    const mapa = new Map<string, { nome: string; obras: ObraLocal[] }>();

    obras.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const chaveAutor = normalizarNomeAutor(nomeAutor);

      if (!autoresSeguidos.includes(chaveAutor)) {
        return;
      }

      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          obras: [...autorExistente.obras, obra],
        });

        return;
      }

      mapa.set(chaveAutor, {
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.entries())
      .map(([chave, grupoAutor]) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0
        );

        const totalCurtidas = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalCurtidasObraSeguindo(obra);
        }, 0);

        const totalComentarios = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalComentariosObraSeguindo(obra);
        }, 0);

        const totalSalvos = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalSalvosObraSeguindo(obra);
        }, 0);

        const totalFavoritas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasFavoritas)
        ).length;

        const totalConcluidas = obrasDoAutor.filter((obra) =>
          obraEstaNaLista(obra, obrasConcluidas)
        ).length;

        const totalComClassificacao = obrasDoAutor.filter((obra) =>
          mostrarClassificacao(obra)
        ).length;

        const totalLidos = obrasDoAutor.reduce((total, obra) => {
          return total + obterTotalLidosObraSeguindo(obra);
        }, 0);

        const totalEmLeitura = obrasDoAutor.filter((obra) =>
          obraEmLeitura(obra)
        ).length;

        const progressoMedio =
          obrasDoAutor.length > 0
            ? Math.round(
                obrasDoAutor.reduce((total, obra) => {
                  return total + calcularProgressoLeitura(obra.capitulos);
                }, 0) / obrasDoAutor.length
              )
            : 0;

        return {
          chave,
          nome: grupoAutor.nome,
          autorId:
            obrasDoAutor.find((obra) => Boolean(obra.autorId?.trim()))
              ?.autorId?.trim() || "",
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalRascunhos: obrasDoAutor.filter((obra) => !obra.publicado).length,
          totalCurtidas,
          totalComentarios,
          totalSalvos,
          totalFavoritas,
          totalConcluidas,
          totalComClassificacao,
          totalLidos,
          totalEmLeitura,
          progressoMedio,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
  }, [obras, autoresSeguidos, obrasFavoritas, obrasConcluidas]);

  const obrasFiltradas = useMemo(() => {
    if (abaConteudo !== "obras") {
      return [] as ObraLocal[];
    }

    const filtradas = obrasSeguidasBase.filter((obra) => {
      if (filtro === "autores" || filtro === "usuarios") {
        return false;
      }

      const passaBusca = termoBusca
        ? textoBuscaObra(obra).includes(termoBusca)
        : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "obras" ||
        (filtro === "em-leitura" && obraEmLeitura(obra)) ||
        (filtro === "favoritas" && obraEstaNaLista(obra, obrasFavoritas)) ||
        (filtro === "concluidas" && obraEstaNaLista(obra, obrasConcluidas));

      return passaBusca && passaFiltro;
    });

    return [...filtradas].sort((obraA, obraB) => {
      if (ordenacao === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacao === "progresso") {
        return (
          calcularProgressoLeitura(obraB.capitulos) -
          calcularProgressoLeitura(obraA.capitulos)
        );
      }

      if (ordenacao === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      if (ordenacao === "antigos") {
        return dataAtividadeObra(obraA) - dataAtividadeObra(obraB);
      }

      return dataAtividadeObra(obraB) - dataAtividadeObra(obraA);
    });
  }, [
    obrasSeguidasBase,
    termoBusca,
    filtro,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
    visualizandoListaSocialDoPerfil,
    abaConteudo,
  ]);

  const autoresFiltrados = useMemo<AutorSeguido[]>(() => {
    if (visualizandoListaSocialDoPerfil || abaConteudo !== "pessoas") {
      return [] as AutorSeguido[];
    }

    const filtrados = autoresBase.filter((autor) => {
      if (filtro === "obras" || filtro === "usuarios") {
        return false;
      }

      const textoAutor = normalizarTexto(
        [
          autor.nome,
          autor.obras.map((obra) => obra.titulo).join(" "),
          autor.obras.map((obra) => obra.genero).join(" "),
          autor.obras.map((obra) => formatarGeneroSeguindo(obra.genero)).join(" "),
          autor.obras.map((obra) => obra.tags.join(" ")).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoAutor.includes(termoBusca) : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "autores" ||
        (filtro === "em-leitura" && autor.totalEmLeitura > 0) ||
        (filtro === "favoritas" && autor.totalFavoritas > 0) ||
        (filtro === "concluidas" && autor.totalConcluidas > 0);

      return passaBusca && passaFiltro;
    });

    return [...filtrados].sort((autorA, autorB) => {
      if (ordenacao === "progresso") {
        return autorB.progressoMedio - autorA.progressoMedio;
      }

      if (ordenacao === "capitulos") {
        return autorB.totalCapitulos - autorA.totalCapitulos;
      }

      return autorA.nome.localeCompare(autorB.nome);
    });
  }, [autoresBase, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil]);

  const usuariosFiltrados = useMemo<UsuarioSeguido[]>(() => {
    const filtrados = usuariosBaseSocial.filter((usuarioSeguido) => {
      if (
        abaConteudo !== "pessoas" &&
        abaConteudo !== "seguidores"
      ) {
        return false;
      }

      if (
        !visualizandoListaSocialDoPerfil &&
        filtro !== "todos" &&
        filtro !== "usuarios"
      ) {
        return false;
      }

      const textoUsuario = normalizarTexto(
        [usuarioSeguido.nome, usuarioSeguido.handle, usuarioSeguido.bio].join(" ")
      );

      return termoBusca ? textoUsuario.includes(termoBusca) : true;
    });

    return [...filtrados].sort((usuarioA, usuarioB) => {
      if (ordenacao === "titulo") {
        return usuarioA.nome.localeCompare(usuarioB.nome);
      }

      if (ordenacao === "antigos") {
        return (
          new Date(usuarioA.criadoEm).getTime() -
          new Date(usuarioB.criadoEm).getTime()
        );
      }

      return (
        new Date(usuarioB.criadoEm).getTime() - new Date(usuarioA.criadoEm).getTime()
      );
    });
  }, [usuariosBaseSocial, termoBusca, filtro, ordenacao, abaConteudo, visualizandoListaSocialDoPerfil]);

  const totalDisponivelGeral =
    obrasSeguidasBase.length +
    usuariosSeguidos.length +
    usuariosSeguidores.length +
    (visualizandoListaSocialDoPerfil ? 0 : autoresBase.length);

  const totalSemFiltros =
    abaConteudo === "seguidores"
      ? usuariosSeguidores.length
      : abaConteudo === "obras"
        ? obrasSeguidasBase.length
        : usuariosSeguidos.length +
          (visualizandoListaSocialDoPerfil ? 0 : autoresBase.length);

  const totalSeguindo =
    abaConteudo === "seguidores"
      ? usuariosFiltrados.length
      : abaConteudo === "obras"
        ? obrasFiltradas.length
        : usuariosFiltrados.length +
          (visualizandoListaSocialDoPerfil ? 0 : autoresFiltrados.length);


  const opcoesOrdenacao: Array<{ valor: OrdenacaoSeguindo; rotulo: string }> =
    abaConteudo === "obras"
      ? [
          { valor: "padrao", rotulo: "Padrão" },
          { valor: "recentes", rotulo: "Mais recentes" },
          { valor: "antigos", rotulo: "Mais antigos" },
          { valor: "titulo", rotulo: "A-Z" },
          { valor: "progresso", rotulo: "Maior progresso" },
          { valor: "capitulos", rotulo: "Mais capítulos" },
        ]
      : [
          { valor: "padrao", rotulo: "Padrão" },
          { valor: "recentes", rotulo: "Mais recentes" },
          { valor: "antigos", rotulo: "Mais antigos" },
          { valor: "titulo", rotulo: "A-Z" },
        ];

  function trocarAbaConteudo(novaAba: AbaConteudoSeguindo) {
    setAbaConteudo(novaAba);
    setAbaSeguimento(
      novaAba === "seguidores" ? "seguidores" : "seguindo"
    );
    setBusca("");
    setFiltro(novaAba === "obras" ? "todos" : "usuarios");
    setOrdenacao("padrao");

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const perfilIdParaUrl = perfilSocialId || usuarioLogadoId;

    params.set("conteudo", novaAba);

    if (novaAba === "seguidores") {
      params.set("aba", "seguidores");
    } else if (novaAba === "pessoas") {
      params.set("aba", "seguindo");
    } else {
      params.delete("aba");
    }

    if (perfilIdParaUrl && visualizandoListaSocialDoPerfil) {
      params.set("userId", perfilIdParaUrl);
      params.set("autorId", perfilIdParaUrl);
    }

    if (perfilSocialNome.trim()) {
      params.set("autor", perfilSocialNome.trim());
    }

    window.history.replaceState(null, "", `/seguindo?${params.toString()}`);
  }

  function deixarDeSeguirObra(obra: ObraLocal) {
    const novasObrasSeguidas = removerObraDaLista(obra, obrasSeguidas);

    salvarJsonStorageUsuarioSeguindo(
      FOLLOW_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasSeguidas
    );

    setObrasSeguidas(novasObrasSeguidas);
    void sincronizarObraUsuarioSupabase("seguindo_obras", obra.id, false);
  }

  function deixarDeSeguirAutor(autorChave: string) {
    const novosAutoresSeguidos = autoresSeguidos.filter(
      (autor) => autor !== autorChave
    );

    salvarJsonStorageUsuarioSeguindo(
      AUTHOR_FOLLOW_STORAGE_KEY,
      usuarioLogadoId,
      novosAutoresSeguidos
    );

    setAutoresSeguidos(novosAutoresSeguidos);
  }

  function deixarDeSeguirUsuario(usuarioId: string) {
    const usuarioIdLimpo = usuarioId.trim();

    if (!usuarioIdLimpo) {
      return;
    }

    setUsuariosSeguidos((usuariosAtuais) =>
      usuariosAtuais.filter((usuarioSeguido) => usuarioSeguido.id !== usuarioIdLimpo)
    );
    setAtividadesSeguindo((atividadesAtuais) =>
      atividadesAtuais.filter((atividade) => atividade.usuarioId !== usuarioIdLimpo)
    );

    if (!usuarioLogadoId) {
      return;
    }

    void supabase
      .from("seguindo_usuarios")
      .delete()
      .eq("seguidor_id", usuarioLogadoId)
      .eq("seguido_id", usuarioIdLimpo);
  }

  async function seguirUsuarioSugestao(usuarioSugestao: UsuarioSeguido) {
    const usuarioId = usuarioSugestao.id.trim();

    if (
      !idUsuarioSupabaseValido(usuarioLogadoId) ||
      !idUsuarioSupabaseValido(usuarioId) ||
      usuarioId === usuarioLogadoId ||
      usuarioSugestaoSeguindoId
    ) {
      return;
    }

    setUsuarioSugestaoSeguindoId(usuarioId);

    try {
      await supabase
        .from("seguindo_usuarios")
        .delete()
        .eq("seguidor_id", usuarioLogadoId)
        .eq("seguido_id", usuarioId);

      const { error } = await supabase.from("seguindo_usuarios").insert({
        seguidor_id: usuarioLogadoId,
        seguido_id: usuarioId,
      });

      if (error) {
        console.warn("Não consegui seguir o usuário:", error.message);
        return;
      }

      const usuarioSeguido: UsuarioSeguido = {
        ...usuarioSugestao,
        criadoEm: new Date().toISOString(),
      };

      setUsuariosSeguidos((usuariosAtuais) => {
        if (usuariosAtuais.some((usuarioAtual) => usuarioAtual.id === usuarioId)) {
          return usuariosAtuais;
        }

        return [usuarioSeguido, ...usuariosAtuais];
      });

      setUsuariosSugestoesBusca((usuariosAtuais) =>
        usuariosAtuais.filter((usuarioAtual) => usuarioAtual.id !== usuarioId)
      );
    } catch (error) {
      console.warn("Não consegui seguir o usuário:", error);
    } finally {
      setUsuarioSugestaoSeguindoId((idAtual) =>
        idAtual === usuarioId ? null : idAtual
      );
    }
  }

  function alternarFavoritoObra(obra: ObraLocal) {
    const obraVaiFicarFavorita = !obraEstaNaLista(obra, obrasFavoritas);
    const novasObrasFavoritas = obraVaiFicarFavorita
      ? adicionarObraNaLista(obra, obrasFavoritas)
      : removerObraDaLista(obra, obrasFavoritas);

    salvarJsonStorageUsuarioSeguindo(
      FAVORITES_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasFavoritas
    );

    setObrasFavoritas(novasObrasFavoritas);
    void sincronizarObraUsuarioSupabase(
      "favoritos",
      obra.id,
      obraVaiFicarFavorita
    );
  }

  function alternarConcluidoObra(obra: ObraLocal) {
    const obraVaiFicarConcluida = !obraEstaNaLista(obra, obrasConcluidas);
    const novasObrasConcluidas = obraVaiFicarConcluida
      ? adicionarObraNaLista(obra, obrasConcluidas)
      : removerObraDaLista(obra, obrasConcluidas);

    salvarJsonStorageUsuarioSeguindo(
      COMPLETED_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasConcluidas
    );

    setObrasConcluidas(novasObrasConcluidas);
    void sincronizarObraUsuarioSupabase(
      "concluidas",
      obra.id,
      obraVaiFicarConcluida
    );
  }

  if (verificandoAcesso) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header
          style={
            isDesktop
              ? desktopSeguindoHeaderStyle
              : seguindoHeaderStyle
          }
        >
          <button
            type="button"
            onClick={() => setMostrarPainelOrdenacao(true)}
            style={
              isDesktop
                ? desktopSeguindoHeaderFilterButtonStyle
                : seguindoHeaderFilterButtonStyle
            }
            aria-label="Abrir classificação de Seguindo"
          >
            <span>Seguindo</span>
            <span style={seguindoHeaderFilterIconStyle} aria-hidden="true">
              +
            </span>
          </button>

          {buscaSeguindoAberta ? (
            <>
              <label
                style={
                  isDesktop
                    ? desktopSeguindoHeaderSearchShellStyle
                    : seguindoHeaderSearchShellStyle
                }
              >
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder={
                    visualizandoListaSocialDoPerfil
                      ? `Pesquisar em ${descricaoListaSocial}`
                      : abaConteudo === "seguidores"
                        ? "Pesquisar seguidor ou perfil"
                        : abaConteudo === "obras"
                          ? "Pesquisar obra, autor, gênero ou tag"
                          : "Pesquisar pessoa, autor ou perfil"
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={seguindoHeaderSearchInputStyle}
                  type="text"
                  autoFocus
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setBuscaSeguindoAberta(false);
                }}
                aria-label="Fechar busca"
                aria-expanded="true"
                style={seguindoSearchToggleStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBuscaSeguindoAberta(true)}
              aria-label="Abrir busca"
              aria-expanded="false"
              style={seguindoSearchToggleStyle}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="10.85"
                  cy="10.85"
                  r="6.65"
                  stroke="currentColor"
                  strokeWidth="2.15"
                />
                <path
                  d="M16.05 16.05L20.25 20.25"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </header>

        {totalDisponivelGeral > 0 && (
          <>
            <section style={isDesktop ? desktopSocialToolbarStyle : socialToolbarStyle}>
              <div
                  style={{
                    ...socialTabsStyle,
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  }}
                >
                <>
                  <button
                    type="button"
                    onClick={() => trocarAbaConteudo("seguidores")}
                    style={{
                      ...(abaConteudo === "seguidores"
                        ? socialTabActiveStyle
                        : socialTabStyle),
                      ...(!isDesktop ? mobileThreeSocialTabStyle : {}),
                    }}
                  >
                    Seguidores
                    <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
                      {usuariosSeguidores.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => trocarAbaConteudo("obras")}
                    style={{
                      ...(abaConteudo === "obras"
                        ? socialTabActiveStyle
                        : socialTabStyle),
                      ...(!isDesktop ? mobileThreeSocialTabStyle : {}),
                    }}
                  >
                    Obras seguidas
                    <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
                      {obrasSeguidasBase.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => trocarAbaConteudo("pessoas")}
                    style={{
                      ...(abaConteudo === "pessoas"
                        ? socialTabActiveStyle
                        : socialTabStyle),
                      ...(!isDesktop ? mobileThreeSocialTabStyle : {}),
                    }}
                  >
                    Pessoas seguidas
                    <span style={isDesktop ? socialTabCountStyle : mobileThreeSocialTabCountStyle}>
                      {usuariosSeguidos.length}
                    </span>
                  </button>
                </>
              </div>

            </section>

            {mostrarPainelOrdenacao && (
              <div
                style={sortingBackdropStyle}
                onClick={() => setMostrarPainelOrdenacao(false)}
              >
                <div
                  style={isDesktop ? desktopSortingSheetStyle : sortingSheetStyle}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span style={sortingHandleStyle} />

                  <h2 style={sortingTitleStyle}>Classificar por</h2>

                  <div style={sortingOptionsListStyle}>
                    {opcoesOrdenacao.map((opcao) => {
                      const ativo = ordenacao === opcao.valor;

                      return (
                        <button
                          key={opcao.valor}
                          type="button"
                          onClick={() => {
                            setOrdenacao(opcao.valor);
                            setMostrarPainelOrdenacao(false);
                          }}
                          style={
                            ativo ? sortingOptionActiveStyle : sortingOptionStyle
                          }
                        >
                          <span>{opcao.rotulo}</span>

                          <span
                            style={
                              ativo
                                ? sortingOptionRadioActiveStyle
                                : sortingOptionRadioStyle
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {abaConteudo === "seguidores"
              ? visualizandoListaSocialDoPerfil
                ? "Nenhum seguidor ainda"
                : "Você ainda não tem seguidores"
              : abaConteudo === "obras"
                ? "Nenhuma obra seguida ainda"
                : visualizandoListaSocialDoPerfil
                  ? "Nenhum perfil seguido ainda"
                  : "Você ainda não segue nada"}
          </p>
        ) : (
          <>
            {totalSeguindo === 0 &&
              !carregandoUsuariosSugestoes &&
              usuariosSugestoesBusca.length === 0 && (
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                Nada encontrado
              </p>
            )}

            {abaConteudo === "obras" && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              {obrasFiltradas.length === 0 ? (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  Nenhuma obra seguida encontrada
                </p>
              ) : (
                <div style={isDesktop ? desktopGridStyle : gridStyle}>
                  {obrasFiltradas.map((obra) => {
                    const obraHref =
                      obra.link ||
                      `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;

                    return (
                      <article key={obra.id} style={isDesktop ? desktopCardStyle : cardStyle}>
                        <div style={criarCoverStyle(obra.capa, isDesktop)}>
                          <div style={overlayStyle} />

                        </div>

                        <div style={isDesktop ? desktopContentStyle : contentStyle}>
                          <div style={badgeRowStyle}>
                            <span style={badgeStyleSmall}>
                              {obra.formato || "Obra"}
                            </span>

                            <span style={genreStyle}>
                              {formatarGeneroSeguindo(obra.genero)}
                            </span>

                            {mostrarClassificacao(obra) && (
                              <span style={classificationBadgeStyle}>
                                {obra.classificacaoIndicativa}
                              </span>
                            )}

                          </div>

                          <h3 style={cardTitleStyle}>{obra.titulo}</h3>

                          <Link
                            href={criarHrefPerfilAutorSeguindo(
                              obra.autor,
                              obra.autorId
                            )}
                            style={authorLinkStyle}
                          >
                            Por {obra.autor}
                          </Link>

                          <div
                            style={{
                              ...actionsStyle,
                              gridTemplateColumns:
                                visualizandoListaSocialDoPerfil
                                  ? "minmax(0, 1fr)"
                                  : "minmax(0, 1fr) auto",
                              alignItems: "stretch",
                            }}
                          >
                            <Link
                              href={obraHref}
                              style={{
                                ...readButtonStyle,
                                width: "100%",
                                minHeight: "28px",
                              }}
                            >
                              Ver obra
                            </Link>

                            {!visualizandoListaSocialDoPerfil && (
                              <button
                                type="button"
                                onClick={() => deixarDeSeguirObra(obra)}
                                style={{
                                  ...unfollowButtonStyle,
                                  minWidth: isDesktop ? "124px" : "104px",
                                  minHeight: "28px",
                                }}
                              >
                                Deixar de seguir
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              </section>
            )}

            {(abaConteudo === "pessoas" ||
              abaConteudo === "seguidores") &&
              usuariosFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {usuariosFiltrados.map((usuarioSeguido) => {
                    const hrefPerfilUsuario = criarHrefPerfilUsuarioSeguindo(usuarioSeguido);

                    return (
                      <article
                        key={usuarioSeguido.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Abrir perfil de ${usuarioSeguido.nome}`}
                        onClick={() => router.push(hrefPerfilUsuario)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(hrefPerfilUsuario);
                          }
                        }}
                        style={{
                          ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
                          gridTemplateColumns: isDesktop
                            ? "58px minmax(0, 1fr)"
                            : "52px minmax(0, 1fr)",
                          gap: isDesktop ? "7px" : "6px",
                          width: isDesktop ? "104%" : "102%",
                          margin: "0 auto",
                          padding: isDesktop ? "6px 8px 6px 0" : "4px 7px 4px 0",
                          borderRadius: 0,
                          background: "transparent",
                          border: "none",
                          boxShadow: "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            ...criarAvatarUsuarioSeguindoStyle(usuarioSeguido.avatar),
                            width: isDesktop ? "58px" : "52px",
                            height: isDesktop ? "58px" : "52px",
                            borderRadius: "16px",
                            fontSize: isDesktop ? "25px" : "22px",
                          }}
                        >
                          {!usuarioSeguido.avatar && usuarioSeguido.nome.slice(0, 1).toUpperCase()}
                        </div>

                        <div
                          style={{
                            ...authorContentStyle,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: isDesktop ? "10px" : "7px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gap: "2px",
                              minWidth: 0,
                              flex: "1 1 auto",
                            }}
                          >
                            <h3
                              style={{
                                ...authorNameStyle,
                                fontSize: isDesktop ? "17px" : "15px",
                                lineHeight: 1.05,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {usuarioSeguido.nome}
                            </h3>

                            <span
                              style={{
                                ...authorLinkStyle,
                                fontSize: isDesktop ? "11px" : "10px",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {usuarioSeguido.handle}
                            </span>
                          </div>

                          {podeRemoverUsuariosDaLista && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                deixarDeSeguirUsuario(usuarioSeguido.id);
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
                              style={{
                                ...unfollowButtonStyle,
                                width: isDesktop ? "112px" : "92px",
                                minWidth: isDesktop ? "112px" : "92px",
                                minHeight: "25px",
                                padding: "0 3px",
                                fontSize: "9px",
                                flex: "0 0 auto",
                              }}
                            >
                              Deixar de seguir
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {buscaSugestoesUsuariosAtiva && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={sectionHeaderTextStyle}>
                    <h2 style={sectionTitleStyle}>SUGESTÕES PARA SEGUIR</h2>
                  </div>

                  <span style={sectionCounterStyle}>
                    {carregandoUsuariosSugestoes
                      ? "..."
                      : usuariosSugestoesBusca.length}
                  </span>
                </div>

                {carregandoUsuariosSugestoes ? (
                  <div style={suggestedUsersLoadingStyle}>
                    <span style={suggestedUsersLoadingItemStyle} />
                    <span style={suggestedUsersLoadingItemStyle} />
                  </div>
                ) : usuariosSugestoesBusca.length > 0 ? (
                  <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                    {usuariosSugestoesBusca.map((usuarioSugestao) => {
                      const hrefPerfil = criarHrefPerfilUsuarioSeguindo(
                        usuarioSugestao
                      );
                      const seguindoAgora =
                        usuarioSugestaoSeguindoId === usuarioSugestao.id;

                      return (
                        <article
                          key={usuarioSugestao.id}
                          style={{
                            ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
                            gridTemplateColumns: isDesktop
                              ? "58px minmax(0, 1fr) auto"
                              : "52px minmax(0, 1fr) auto",
                            gap: isDesktop ? "10px" : "7px",
                            width: isDesktop ? "104%" : "102%",
                            margin: "0 auto",
                            padding: isDesktop ? "6px 8px 6px 0" : "4px 7px 4px 0",
                            borderRadius: 0,
                            background: "transparent",
                            border: "none",
                            boxShadow: "none",
                          }}
                        >
                          <Link
                            href={hrefPerfil}
                            aria-label={`Abrir perfil de ${usuarioSugestao.nome}`}
                            style={{
                              ...criarAvatarUsuarioSeguindoStyle(
                                usuarioSugestao.avatar
                              ),
                              width: isDesktop ? "58px" : "52px",
                              height: isDesktop ? "58px" : "52px",
                              borderRadius: "16px",
                              fontSize: isDesktop ? "25px" : "22px",
                            }}
                          >
                            {!usuarioSugestao.avatar &&
                              usuarioSugestao.nome.slice(0, 1).toUpperCase()}
                          </Link>

                          <div style={suggestedUserInfoStyle}>
                            <Link
                              href={hrefPerfil}
                              style={suggestedUserNameStyle}
                            >
                              {usuarioSugestao.nome}
                            </Link>

                            <span style={suggestedUserHandleStyle}>
                              {usuarioSugestao.handle}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              seguirUsuarioSugestao(usuarioSugestao)
                            }
                            disabled={seguindoAgora}
                            style={{
                              ...suggestedUserFollowButtonStyle,
                              opacity: seguindoAgora ? 0.58 : 1,
                              cursor: seguindoAgora ? "not-allowed" : "pointer",
                            }}
                          >
                            {seguindoAgora ? "..." : "Seguir"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            )}

            {!visualizandoListaSocialDoPerfil && abaConteudo === "pessoas" && autoresFiltrados.length > 0 && (
              <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
                <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
                  <div style={sectionHeaderTextStyle}>
                    <h2 style={sectionTitleStyle}>AUTORES SEGUIDOS</h2>
                  </div>

                  <span style={sectionCounterStyle}>
                    {autoresFiltrados.length}
                  </span>
                </div>

                <div style={isDesktop ? desktopAuthorsGridStyle : authorsGridStyle}>
                  {autoresFiltrados.map((autor) => (
                    <article key={autor.chave} style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}>
                      <div style={authorAvatarStyle}>
                        {autor.nome.slice(0, 1).toUpperCase()}
                      </div>

                      <div style={authorContentStyle}>
                        <div style={authorBadgeRowStyle}>
                          <span style={badgeStyleSmall}>
                            {autor.obras.length} {" "}
                            {autor.obras.length === 1 ? "obra" : "obras"}
                          </span>

                          {autor.totalEmLeitura > 0 && (
                            <span style={readingBadgeStyle}>
                              {autor.totalEmLeitura} em leitura
                            </span>
                          )}
                        </div>

                        <h3 style={authorNameStyle}>{autor.nome}</h3>

                        <div style={actionsStyle}>
                          <div style={isDesktop ? desktopAuthorActionsGridStyle : authorActionsGridStyle}>
                            <Link
                              href={criarHrefPerfilAutorSeguindo(
                                autor.nome,
                                autor.autorId
                              )}
                              style={readButtonStyle}
                            >
                              Abrir perfil
                            </Link>

                            <button
                              type="button"
                              onClick={() => deixarDeSeguirAutor(autor.chave)}
                              style={unfollowButtonStyle}
                            >
                              Deixar de seguir
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const seguindoPageCss = `
  html {
    --historietas-seguindo-bg-page: #070212;
    --historietas-seguindo-bg-deep: #04000A;
    --historietas-seguindo-surface: #08030F;
    --historietas-seguindo-bg-end: #020006;
    --historietas-seguindo-purple-text: #DDD6FE;
    --historietas-seguindo-purple-soft: #A78BFA;
    --historietas-seguindo-success: #86EFAC;
    --historietas-seguindo-success-soft: #BBF7D0;
    --historietas-seguindo-danger-text: #FCA5A5;
    --historietas-seguindo-purple-border: rgba(59, 7, 100, 0.58);
    --historietas-seguindo-panel: rgba(4, 0, 10, 0.72);
    --historietas-seguindo-success-border: rgba(34,197,94,0.20);
    --historietas-seguindo-success-bg: rgba(34,197,94,0.085);
    --historietas-seguindo-success-active-bg: rgba(34,197,94,0.14);
    --historietas-seguindo-success-active-border: rgba(34,197,94,0.28);
    --historietas-seguindo-danger-border: rgba(239,68,68,0.18);
    --historietas-seguindo-danger-bg: rgba(239,68,68,0.075);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-seguindo-bg-page: #000000;
    --historietas-seguindo-bg-deep: #000000;
    --historietas-seguindo-surface: #050505;
    --historietas-seguindo-bg-end: #000000;
    --historietas-seguindo-purple-text: #FFFFFF;
    --historietas-seguindo-purple-soft: #D4D4D8;
    --historietas-seguindo-success: #FFFFFF;
    --historietas-seguindo-success-soft: #FFFFFF;
    --historietas-seguindo-danger-text: #FFFFFF;
    --historietas-seguindo-purple-border: rgba(255,255,255,0.18);
    --historietas-seguindo-panel: rgba(5,5,5,0.92);
    --historietas-seguindo-success-border: rgba(255,255,255,0.18);
    --historietas-seguindo-success-bg: rgba(255,255,255,0.06);
    --historietas-seguindo-success-active-bg: rgba(255,255,255,0.08);
    --historietas-seguindo-success-active-border: rgba(255,255,255,0.22);
    --historietas-seguindo-danger-border: rgba(255,255,255,0.18);
    --historietas-seguindo-danger-bg: rgba(255,255,255,0.06);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/seguindo"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/seguindo"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/seguindo"] {
    background: var(
      --historietas-bottom-nav-active-bg,
      rgba(59, 7, 100, 0.54)
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-border,
      rgba(109, 40, 217, 0.48)
    ) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/seguindo"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/seguindo"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/seguindo"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(
      --historietas-bottom-nav-active-icon-bg,
      #3B0764
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-icon-border,
      rgba(167, 139, 250, 0.46)
    ) !important;
  }

  html[data-historietas-tema-visual="foco"] nav a[href="/seguindo"],
  html[data-historietas-tema-visual="foco"] [data-bottom-nav] a[href="/seguindo"],
  html[data-historietas-tema-visual="foco"] [data-mobile-nav] a[href="/seguindo"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] nav a[href="/seguindo"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav] a[href="/seguindo"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav] a[href="/seguindo"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  .seguindo-summary-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .seguindo-summary-carousel::-webkit-scrollbar {
    display: none;
  }
`;

function criarDecoracaoTopoStyle(_index: number): CSSProperties {
  return {
    display: "none",
  };
}

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};


const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-seguindo-bg-page, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "10px 0 40px",
};

const seguindoHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSeguindoHeaderStyle: CSSProperties = {
  ...seguindoHeaderStyle,
};

const seguindoSearchToggleStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const seguindoHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "46%",
  flex: "0 1 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const desktopSeguindoHeaderFilterButtonStyle: CSSProperties = {
  ...seguindoHeaderFilterButtonStyle,
};

const seguindoHeaderFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const soonTopButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  color: "var(--historietas-seguindo-purple-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "40px",
  padding: "0 16px",
  fontSize: "12px",
};


const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: "-0.06em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 118px)",
  overflow: "hidden",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  border: "1px solid var(--historietas-seguindo-purple-border, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-seguindo-purple-text, #DDD6FE) 44%, var(--historietas-seguindo-purple-soft, #A78BFA) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  padding: 0,
  minWidth: 0,
  textAlign: "center",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const titleLogoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  border: "1px solid var(--historietas-seguindo-purple-border, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
  flex: "0 0 auto",
};

const desktopTitleLogoMarkStyle: CSSProperties = {
  ...titleLogoMarkStyle,
  width: "clamp(44px, 4.4vw, 58px)",
  height: "clamp(44px, 4.4vw, 58px)",
  borderRadius: "18px",
  fontSize: "clamp(22px, 2.2vw, 30px)",
};

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  color: "var(--historietas-accent, #F97316)",
  WebkitTextFillColor: "var(--historietas-accent, #F97316)",
  textAlign: "center",
  textShadow: "none",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginBottom: "18px",
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "12px",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, var(--historietas-seguindo-bg-page, #070212) 0%, var(--historietas-seguindo-bg-deep, #04000A) 58%, var(--historietas-seguindo-bg-end, #020006) 100%)",
  padding: "18px",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};


const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};


const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "6px",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gap: "8px",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "0 auto",
  fontSize: "clamp(38px, 10vw, 56px)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "100%",
  color: "var(--historietas-accent, #F97316)",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  fontSize: "clamp(46px, 4.7vw, 72px)",
  lineHeight: 0.94,
  maxWidth: "760px",
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 720,
  maxWidth: "680px",
  ...safeTextStyle,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const filterBoxStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "11px",
  marginTop: "14px",
  padding: "13px",
  borderRadius: "24px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden"
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  marginTop: "16px",
  padding: "16px",
  borderRadius: "26px",
  gap: "14px",
  overflow: "visible"
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  alignItems: "center",
  flexWrap: "nowrap",
};

const filterHeaderTitleBoxStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const filterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const filterResultBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "13px",
  right: "13px",
  width: "fit-content",
  maxWidth: "calc(100% - 26px)",
  padding: "8px 11px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-seguindo-purple-text, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  boxSizing: "border-box",
  ...safeTextStyle,
};

const suggestedUsersLoadingStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const suggestedUsersLoadingItemStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "62px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
};

const suggestedUserInfoStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "3px",
  minWidth: 0,
};

const suggestedUserNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  lineHeight: 1.08,
  fontWeight: 950,
  textDecoration: "none",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const suggestedUserHandleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.1,
  fontWeight: 800,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const suggestedUserFollowButtonStyle: CSSProperties = {
  minWidth: "76px",
  minHeight: "30px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  padding: "0 12px",
  fontFamily: "inherit",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "43px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 800,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "none",
  ...safeTextStyle
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  minHeight: "42px",
};

const socialToolbarStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  margin: "10px 0 18px",
  padding: "0 4px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSocialToolbarStyle: CSSProperties = {
  ...socialToolbarStyle,
  width: "min(760px, 100%)",
  margin: "-8px auto 22px",
  padding: 0,
};

const socialTabsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignItems: "end",
  minWidth: 0,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const socialTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "42px",
  border: "none",
  borderBottom: "2px solid transparent",
  background: "transparent",
  color: "rgba(212,212,216,0.68)",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  textAlign: "center",
  padding: "0 8px 9px",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const socialTabActiveStyle: CSSProperties = {
  ...socialTabStyle,
  color: "#FFFFFF",
  borderBottom: "2px solid rgba(255,255,255,0.92)",
};

const mobileThreeSocialTabStyle: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "-0.25px",
  padding: "0 1px 9px",
  overflow: "visible",
  textOverflow: "clip",
};

const socialTabCountStyle: CSSProperties = {
  display: "inline",
  marginLeft: "5px",
  color: "inherit",
  fontSize: "inherit",
  fontWeight: 950,
};

const mobileThreeSocialTabCountStyle: CSSProperties = {
  ...socialTabCountStyle,
  marginLeft: "3px",
};

const seguindoHeaderSearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
  height: "36px",
  marginLeft: "auto",
  marginRight: "-6px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};

const desktopSeguindoHeaderSearchShellStyle: CSSProperties = {
  ...seguindoHeaderSearchShellStyle,
  flex: "0 1 480px",
  maxWidth: "min(480px, calc(100% - 118px))",
};

const seguindoHeaderSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};

const sortingBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 240,
  background: "rgba(0,0,0,0.68)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

const sortingSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 241,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: 0,
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-bg-start, var(--historietas-seguindo-bg-page, #070212))",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const desktopSortingSheetStyle: CSSProperties = {
  ...sortingSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "24px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  margin: 0,
  paddingBottom: "18px",
};

const sortingHandleStyle: CSSProperties = {
  display: "block",
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const sortingTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  ...safeTextStyle,
};

const sortingOptionsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const sortingOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  textAlign: "left",
  padding: "0 30px",
  cursor: "pointer",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const sortingOptionActiveStyle: CSSProperties = {
  ...sortingOptionStyle,
  fontWeight: 900,
};

const sortingOptionRadioStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  boxSizing: "border-box",
};

const sortingOptionRadioActiveStyle: CSSProperties = {
  ...sortingOptionRadioStyle,
  border: "6.5px solid #FFFFFF",
  background: "transparent",
};

const quickFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const desktopQuickFiltersStyle: CSSProperties = {
  ...quickFiltersStyle,
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
};

const quickFilterStyle: CSSProperties = {
  flex: "1 1 94px",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterStyle,
  background: "var(--historietas-seguindo-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none"
};

const filterFooterStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
};

const desktopFilterFooterStyle: CSSProperties = {
  ...filterFooterStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "43px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  color: "#FFFFFF",
  padding: "0 15px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  textAlign: "center",
  textAlignLast: "center",
  boxShadow: "none"
};

const clearFilterButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopClearFilterButtonStyle: CSSProperties = {
  ...clearFilterButtonStyle,
  width: "auto",
  minHeight: "42px",
  padding: "0 16px",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const summaryGridStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  marginTop: "2px",
  marginLeft: "-13px",
  marginRight: "-13px",
  minWidth: 0,
  maxWidth: "calc(100% + 26px)",
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  padding: "0 13px",
};

const desktopSummaryGridStyle: CSSProperties = {
  ...summaryGridStyle,
  gap: "8px",
  marginTop: "2px",
  marginLeft: 0,
  marginRight: 0,
  maxWidth: "100%",
  padding: 0,
};

const summaryCardStyle: CSSProperties = {
  flex: "0 0 88px",
  minHeight: "46px",
  borderRadius: "14px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "7px 6px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "2px",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
  boxShadow: "none",
  boxSizing: "border-box",
};

const desktopSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  flexBasis: "100px",
  minHeight: "50px",
  padding: "7px 7px",
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-seguindo-purple-text, #DDD6FE)",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle
};

const desktopSummaryNumberStyle: CSSProperties = {
  ...summaryNumberStyle,
  fontSize: "18px",
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.08,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  width: "min(980px, 100%)",
  margin: "20px auto 0",
};

const sectionHeaderStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "auto auto",
  alignItems: "center",
  justifyContent: "center",
  columnGap: "11px",
  marginBottom: "10px",
  padding: "4px 0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  textAlign: "center"
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  width: "min(980px, 100%)",
  margin: "0 auto 12px",
  padding: "4px 0",
};

const miniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  marginBottom: "6px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionHeaderTextStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(24px, 6vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  textAlign: "center",
  paddingBottom: "2px",
  maxWidth: "100%",
  textTransform: "none",
  ...safeTextStyle
};

const sectionCounterStyle: CSSProperties = {
  position: "static",
  width: "42px",
  height: "42px",
  padding: 0,
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-seguindo-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%"
};

const desktopGridStyle: CSSProperties = {
  ...gridStyle,
  width: "min(980px, 100%)",
  margin: "0 auto",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px"
};

const authorsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%"
};

const desktopAuthorsGridStyle: CSSProperties = {
  ...authorsGridStyle,
  width: "min(980px, 100%)",
  margin: "0 auto",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px"
};

const cardStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "minmax(104px, 0.36fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  padding: "6px",
  borderRadius: "22px",
  overflow: "hidden",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box"
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "104px 1fr",
  gap: 0,
  padding: 0,
  borderRadius: "24px",
  boxShadow: "none"
};

const coverStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "108px",
  minHeight: "108px",
  maxWidth: "100%",
  alignSelf: "start",
  boxSizing: "border-box",
  borderRadius: "16px",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-seguindo-surface, #08030F) 0%, var(--historietas-seguindo-bg-deep, #04000A) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  overflow: "hidden",
  border: "none",
  borderBottom: "none",
  minWidth: 0,
  boxShadow: "none",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  height: "104px",
  minHeight: "104px",
  borderRadius: "24px 24px 0 0",
  borderBottom: "none"
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.26) 100%)",
};

const genreStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};


const contentStyle: CSSProperties = {
  padding: 0,
  display: "grid",
  alignContent: "start",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box"
};

const desktopContentStyle: CSSProperties = {
  ...contentStyle,
  padding: "8px",
  gap: "5px"
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  gap: "4px",
  flexWrap: "wrap",
  alignItems: "center",
  minWidth: 0,
};

const badgeStyleSmall: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  ...genreStyle,
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.08)",
};

const readingBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-seguindo-purple-text, #DDD6FE)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textShadow: "none",
  ...safeTextStyle
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

const authorBioStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 750,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const progressLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxShadow: "none"
};

const progressPercentStyle: CSSProperties = {
  color: "var(--historietas-seguindo-success, #86EFAC)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  boxShadow: "none"
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopPrimaryActionsGridStyle: CSSProperties = {
  ...primaryActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const secondaryActionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSecondaryActionsRowStyle: CSSProperties = {
  ...secondaryActionsRowStyle,
  gap: "6px",
};

const readButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  background: "var(--historietas-seguindo-surface, #08030F)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 9px",
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle
};

const continueButtonStyle: CSSProperties = {
  ...readButtonStyle,
  background: "var(--historietas-seguindo-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const disabledActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #71717A)",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 9px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const favoriteActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  lineHeight: 1,
  boxShadow: "none",
  ...safeTextStyle
};

const favoriteActionActiveStyle: CSSProperties = {
  ...favoriteActionStyle,
  background: "var(--historietas-seguindo-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none"
};

const completedActionStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-seguindo-success-border, rgba(34,197,94,0.20))",
  background: "var(--historietas-seguindo-success-bg, rgba(34,197,94,0.085))",
  color: "var(--historietas-seguindo-success, #86EFAC)",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 7px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  boxShadow: "none",
};

const completedActionActiveStyle: CSSProperties = {
  ...completedActionStyle,
  background: "var(--historietas-seguindo-success-active-bg, rgba(34,197,94,0.14))",
  border: "1px solid var(--historietas-seguindo-success-active-border, rgba(34,197,94,0.28))",
  color: "var(--historietas-seguindo-success-soft, #BBF7D0)",
  boxShadow: "none"
};

const unfollowButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-seguindo-danger-border, rgba(239,68,68,0.18))",
  background: "var(--historietas-seguindo-danger-bg, rgba(239,68,68,0.075))",
  color: "var(--historietas-seguindo-danger-text, #FCA5A5)",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "0 7px",
  textAlign: "center",
  lineHeight: 1.12,
  boxShadow: "none",
  ...safeTextStyle
};

const authorCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "22px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden"
};

const desktopAuthorCardStyle: CSSProperties = {
  ...authorCardStyle,
  gridTemplateColumns: "84px minmax(0, 1fr)",
  padding: "12px 14px",
  borderRadius: "22px",
  boxShadow: "none"
};

const authorAvatarStyle: CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-seguindo-bg-deep, #04000A)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "32px",
  fontWeight: 950,
  boxShadow: "none",
  flex: "0 0 auto"
};

const authorContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  alignContent: "center",
  minWidth: 0,
  maxWidth: "100%",
};

const authorBadgeRowStyle: CSSProperties = {
  display: "flex",
  gap: "5px",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-start",
  minWidth: 0,
  maxWidth: "100%",
};

const authorActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopAuthorActionsGridStyle: CSSProperties = {
  ...authorActionsGridStyle,
  gap: "8px",
};

const authorNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const exploreButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "999px",
  background: "var(--historietas-seguindo-surface, #08030F)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "none",
  ...safeTextStyle
};