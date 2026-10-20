"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import {
  dataNotificacao,
  filtrarEOrdenarNotificacoes,
  notificacaoEhCapitulo,
  notificacaoEhComunidade,
  type FiltroNotificacao,
  type OrdenacaoNotificacao,
} from "./lib/notificacoes-filter-utils";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, formatarData, idObraSupabaseValido, normalizarTexto, obterNumeroSeguro } from "../../lib/utils";
import { useEffect, useMemo, useState } from "react";
import NotificacoesLanguageBridge from "./components/notificacoes-language-bridge";
import NotificacoesEmptyState from "./components/notificacoes-empty-state";
import NotificacoesLoadingSpinner from "./components/notificacoes-loading-spinner";
import NotificacoesOverlayPortal from "./components/notificacoes-overlay-portal";
import { useNotificacoesDesktopMode } from "./hooks/use-notificacoes-desktop-mode";
import { useNotificacoesOverlayBodyLock } from "./hooks/use-notificacoes-overlay-body-lock";
import {
  criarAvatarNotificacaoStyle,
  notificacaoTemAutorSocial,
  notificacaoUsaCardSocial,
  obterAcaoPrincipalNotificacao,
  obterDetalheNotificacao,
  obterIconeNotificacao,
  obterInicialNotificacao,
  obterNomeAutorNotificacao,
  obterTextoBlocoSocialNotificacao,
  obterTituloBlocoSocialNotificacao,
  obterTituloExibicaoNotificacao,
} from "./lib/notificacoes-display-utils";
import { notificacoesPageCss } from "./lib/notificacoes-page-css";
import {
  criarDiarioPerfilHrefNotificacao,
  criarHrefLeituraCapitulo,
  criarLoginHrefNotificacoes,
  criarPerfilHrefNotificacao,
  montarLinkNotificacao,
} from "./lib/notificacoes-navigation-utils";
import {
  mesclarNotificacoes,
  notificacoesRepresentamMesmoEvento,
} from "./lib/notificacoes-merge-utils";
import {
  pegarBooleano,
  pegarTexto,
} from "./lib/notificacoes-data-normalizers";
import {
  normalizarPerfilNotificacao,
  obterPerfilNotificacao,
  type PerfilNotificacao,
} from "./lib/notificacoes-profile-utils";
import {
  criarObraFallbackNotificacaoDireta,
  extrairSlugObraDeLinkNotificacao,
  extrairTituloCapituloDeMensagemNotificacao,
} from "./lib/notificacoes-work-fallback-utils";
import {
  criarNotificacoesDeCapitulos,
  notificacaoCapituloPertenceAObraSeguida,
} from "./lib/notificacoes-followed-chapters-utils";
import {
  carregarIdsNotificacoesApagadas,
  carregarNotificacoes,
  carregarObras,
  filtrarNotificacoesApagadas,
  prepararNotificacaoTexto,
  registrarNotificacoesApagadas,
  salvarNotificacoes,
} from "./lib/notificacoes-local-state-utils";
import {
  obterRotuloTipoAnotacaoDiarioNotificacao,
  obterStatusProblemaTecnicoNotificacao,
  obterTextoStatusDenunciaComunidadeNotificacao,
} from "./lib/notificacoes-status-text-utils";
import {
  calcularProgressoLeitura,
} from "./lib/notificacoes-local-normalizers";
import {
  mesclarObrasPorIdSlug,
  normalizarCapituloSupabase,
  normalizarNotificacaoSupabase,
  normalizarObraSupabase,
} from "./lib/notificacoes-record-normalizers";
import type {
  SupabaseCapituloRow,
  SupabaseObraRow,
} from "./lib/notificacoes-record-normalizers";
import {
  CHAVE_OBRAS,
  CHAVE_OBRAS_SEGUIDAS,
  lerIdsLocalStorage,
  salvarJsonStorageUsuarioNotificacoes,
} from "./lib/notificacoes-storage-utils";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "./lib/notificacoes-models";
import type { CSSProperties } from "react";

type EstadoSupabaseNotificacoes = {
  userId: string;
  obrasSeguidasIds: string[];
  notificacoesLidasIds: string[];
  notificacoesDiretas: NotificacaoLocal[];
};

async function carregarPerfisNotificacoes(userIds: string[]) {
  const ids = Array.from(
    new Set(
      userIds
        .map((id) => id.trim())
        .filter((id) => idObraSupabaseValido(id))
    )
  );
  const perfis = new Map<string, PerfilNotificacao>();

  if (ids.length === 0) {
    return perfis;
  }

  const selecoesProfiles = [
    "id,user_id,nome,avatar_url",
    "id,user_id,nome_usuario,avatar_url",
    "id,user_id,username,avatar_url",
    "id,user_id,display_name,avatar_url",
    "id,user_id,apelido,avatar_url",
  ] as const;

  async function carregarPorColuna(
    coluna: "user_id" | "id",
    idsBusca: string[]
  ) {
    if (idsBusca.length === 0) {
      return;
    }

    for (const campos of selecoesProfiles) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(campos)
          .in(coluna, idsBusca)
          .limit(1000);

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((item) => {
          const row = item as Record<string, unknown>;
          const perfil = normalizarPerfilNotificacao(row, "", "Usuário");

          if (perfil.userId && idObraSupabaseValido(perfil.userId)) {
            perfis.set(perfil.userId, perfil);
          }
        });

        return;
      } catch {
        // Tenta uma seleção menor ou outra coluna.
      }
    }
  }

  await carregarPorColuna("user_id", ids);

  const idsFaltantes = ids.filter((id) => !perfis.has(id));

  await carregarPorColuna("id", idsFaltantes);

  return perfis;
}

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select(
        "id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,link,publicado,criada_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(120);

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra, index)
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    const { data: capitulosData, error: capitulosError } = await supabase
      .from("capitulos")
      .select("id,obra_id,titulo,ordem,publicado,criado_em")
      .in("obra_id", idsObras)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(1000);

    if (capitulosError || !Array.isArray(capitulosData)) {
      return obrasSupabase;
    }

    const capitulosPorObra = new Map<string, CapituloLocal[]>();

    capitulosData.forEach((capitulo, index) => {
      const capituloNormalizado = normalizarCapituloSupabase(
        capitulo,
        index
      );

      if (!capituloNormalizado.obraId) {
        return;
      }

      const capitulosAtuais =
        capitulosPorObra.get(capituloNormalizado.obraId) || [];
      const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
      void _obraId;

      capitulosPorObra.set(capituloNormalizado.obraId, [
        ...capitulosAtuais,
        capituloSemObraId,
      ]);
    });

    return obrasSupabase.map((obra) => {
      const capitulos = capitulosPorObra.get(obra.id) || [];

      return {
        ...obra,
        capitulos,
        progressoLeitura: calcularProgressoLeitura(capitulos),
      };
    });
  } catch {
    return [];
  }
}

async function carregarObrasSeguidasUsuario(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("seguindo_obras")
      .select("obra_id")
      .eq("user_id", userId)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return Array.from(
      new Set(data.map(({ obra_id }) => obra_id.trim()).filter(Boolean)),
    );
  } catch {
    return [];
  }
}

async function carregarNotificacoesDiretasSupabase(
  userId: string
): Promise<NotificacaoLocal[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userIdLimpo)
      .limit(300);

    if (error || !Array.isArray(data)) {
      return [];
    }
    let notificacoesDataSeguras = data;

    if (!acessoConteudo18Confirmado()) {
      const tiposRelacionadosAObra = new Set([
        "novo-capitulo",
        "comentario-obra",
        "curtida-obra",
        "comentario-capitulo",
        "curtida-capitulo",
        "curtida-comentario-capitulo",
      ]);

      const referenciasNotificacoes = data.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return {
            item,
            obraId: "",
            slug: "",
            tipo: "",
          };
        }

        const registro = item as Record<string, unknown>;
        const metadata =
          registro.metadata &&
          typeof registro.metadata === "object" &&
          !Array.isArray(registro.metadata)
            ? (registro.metadata as Record<string, unknown>)
            : {};
        const obraId = pegarTexto(
          registro.obra_id ??
            registro.obraId ??
            metadata.obra_id ??
            metadata.obraId
        );
        const link = pegarTexto(
          registro.link ??
            registro.href ??
            metadata.link ??
            metadata.href
        );
        const slug = extrairSlugObraDeLinkNotificacao(link);
        const tipo = pegarTexto(registro.tipo ?? metadata.tipo)
          .trim()
          .toLowerCase();

        return {
          item,
          obraId,
          slug,
          tipo,
        };
      });

      const obraIds = Array.from(
        new Set(
          referenciasNotificacoes
            .map((referencia) => referencia.obraId)
            .filter(Boolean)
        )
      );
      const obraSlugs = Array.from(
        new Set(
          referenciasNotificacoes
            .map((referencia) => referencia.slug)
            .filter(Boolean)
        )
      );
      const classificacoesPorId = new Map<string, string>();
      const classificacoesPorSlug = new Map<string, string>();

      if (obraIds.length > 0) {
        try {
          const { data: obrasPorIdData, error: obrasPorIdError } =
            await supabase
              .from("obras")
              .select("id, slug, classificacao_indicativa")
              .in("id", obraIds)
              .limit(obraIds.length);

          if (!obrasPorIdError && Array.isArray(obrasPorIdData)) {
            obrasPorIdData.forEach((obra) => {
              if (!obra || typeof obra !== "object" || Array.isArray(obra)) {
                return;
              }

              const registro = obra as Record<string, unknown>;
              const id = pegarTexto(registro.id);
              const slug = pegarTexto(registro.slug);
              const classificacao = pegarTexto(
                registro.classificacao_indicativa
              );

              if (id && classificacao) {
                classificacoesPorId.set(id, classificacao);
              }

              if (slug && classificacao) {
                classificacoesPorSlug.set(slug, classificacao);
              }
            });
          }
        } catch {
          // Falha fechada: notificacoes de obra sem classificacao confirmada
          // serao descartadas enquanto o acesso 18+ nao estiver liberado.
        }
      }

      if (obraSlugs.length > 0) {
        try {
          const { data: obrasPorSlugData, error: obrasPorSlugError } =
            await supabase
              .from("obras")
              .select("id, slug, classificacao_indicativa")
              .in("slug", obraSlugs)
              .limit(obraSlugs.length);

          if (!obrasPorSlugError && Array.isArray(obrasPorSlugData)) {
            obrasPorSlugData.forEach((obra) => {
              if (!obra || typeof obra !== "object" || Array.isArray(obra)) {
                return;
              }

              const registro = obra as Record<string, unknown>;
              const id = pegarTexto(registro.id);
              const slug = pegarTexto(registro.slug);
              const classificacao = pegarTexto(
                registro.classificacao_indicativa
              );

              if (id && classificacao) {
                classificacoesPorId.set(id, classificacao);
              }

              if (slug && classificacao) {
                classificacoesPorSlug.set(slug, classificacao);
              }
            });
          }
        } catch {
          // Falha fechada: notificacoes de obra sem classificacao confirmada
          // serao descartadas enquanto o acesso 18+ nao estiver liberado.
        }
      }

      notificacoesDataSeguras = referenciasNotificacoes
        .filter((referencia) => {
          const relacionadaAObra =
            Boolean(referencia.obraId || referencia.slug) ||
            tiposRelacionadosAObra.has(referencia.tipo);

          if (!relacionadaAObra) {
            return true;
          }

          const classificacaoIndicativa =
            (referencia.obraId
              ? classificacoesPorId.get(referencia.obraId)
              : "") ||
            (referencia.slug
              ? classificacoesPorSlug.get(referencia.slug)
              : "") ||
            "";

          if (!classificacaoIndicativa) {
            return false;
          }

          return !ehClassificacao18(classificacaoIndicativa);
        })
        .map((referencia) => referencia.item);
    }

    const notificacoesNormalizadas = notificacoesDataSeguras
      .map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return null;
        }

        return normalizarNotificacaoSupabase(
          item as Record<string, unknown>,
          index
        );
      })
      .filter(
        (notificacao): notificacao is NotificacaoLocal => Boolean(notificacao)
      );

    const perfis = await carregarPerfisNotificacoes(
      notificacoesNormalizadas
        .map((notificacao) => notificacao.autorId || "")
        .filter(Boolean)
    );

    return notificacoesNormalizadas
      .map((notificacao) => {
        const perfil = notificacao.autorId
          ? perfis.get(notificacao.autorId)
          : null;

        return {
          ...notificacao,
          autorNome:
            notificacao.autorNome || perfil?.nome || "",
          autorAvatar:
            notificacao.autorAvatar || perfil?.avatar || "",
        };
      })
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
  } catch {
    return [];
  }
}

async function carregarObrasDasNotificacoesDiretasSupabase(
  notificacoesDiretas: NotificacaoLocal[]
): Promise<ObraLocal[]> {
  const obraIds = Array.from(
    new Set(
      notificacoesDiretas
        .map((notificacao) => notificacao.obraId.trim())
        .filter(Boolean)
    )
  );
  const capituloIds = Array.from(
    new Set(
      notificacoesDiretas
        .map((notificacao) => notificacao.capituloId.trim())
        .filter(Boolean)
    )
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return [];
  }

  const obrasPorId = new Map<string, ObraLocal>();
  const capitulosPorObra = new Map<string, CapituloLocal[]>();

  if (obraIds.length > 0) {
    const selecoesObras = [
      "id,titulo,autor,user_id,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,slug,publicado,criada_em",
      "id,titulo,autor,user_id,slug,publicado,criada_em",
      "id,titulo,slug,publicado,user_id",
      "id,titulo,slug,publicado",
      "id,titulo,slug",
    ];

    for (const campos of selecoesObras) {
      try {
        const { data: obrasData, error: obrasError } = await supabase
          .from("obras")
          .select(campos)
          .in("id", obraIds)
          .limit(obraIds.length);

        if (obrasError || !Array.isArray(obrasData)) {
          continue;
        }

        obrasData.forEach((obra, index) => {
          const obraNormalizada = normalizarObraSupabase(
            obra as unknown as SupabaseObraRow,
            index
          );

          if (obraNormalizada.id) {
            obrasPorId.set(obraNormalizada.id, obraNormalizada);
          }
        });

        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  if (capituloIds.length > 0) {
    const selecoesCapitulos = [
      "id,obra_id,titulo,ordem,numero,publicado,criado_em",
      "id,obra_id,titulo,numero,publicado,criado_em",
      "id,obra_id,titulo,ordem,publicado,criado_em",
      "id,obra_id,titulo,publicado,criado_em",
      "id,obra_id,titulo",
    ];

    for (const campos of selecoesCapitulos) {
      try {
        const { data: capitulosData, error: capitulosError } = await supabase
          .from("capitulos")
          .select(campos)
          .in("id", capituloIds)
          .limit(capituloIds.length);

        if (capitulosError || !Array.isArray(capitulosData)) {
          continue;
        }

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as unknown as SupabaseCapituloRow,
            index
          );

          if (!capituloNormalizado.obraId) {
            return;
          }

          const capitulosAtuais = capitulosPorObra.get(capituloNormalizado.obraId) || [];
          const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
          void _obraId;

          if (
            !capitulosAtuais.some(
              (capituloAtual) => capituloAtual.id === capituloSemObraId.id
            )
          ) {
            capitulosPorObra.set(capituloNormalizado.obraId, [
              ...capitulosAtuais,
              capituloSemObraId,
            ]);
          }
        });

        break;
      } catch {
        // Tenta uma seleção menor abaixo.
      }
    }
  }

  notificacoesDiretas.forEach((notificacao) => {
    if (!notificacao.obraId || obrasPorId.has(notificacao.obraId)) {
      return;
    }

    const obraFallback = criarObraFallbackNotificacaoDireta(notificacao);

    if (obraFallback) {
      obrasPorId.set(obraFallback.id, obraFallback);
    }
  });

  return Array.from(obrasPorId.values()).map((obra) => {
    const capitulosDiretos = capitulosPorObra.get(obra.id) || [];
    const capitulos = [...obra.capitulos];

    capitulosDiretos.forEach((capituloDireto) => {
      if (!capitulos.some((capitulo) => capitulo.id === capituloDireto.id)) {
        capitulos.push(capituloDireto);
      }
    });

    notificacoesDiretas
      .filter((notificacao) => notificacao.obraId === obra.id && notificacao.capituloId)
      .forEach((notificacao) => {
        if (capitulos.some((capitulo) => capitulo.id === notificacao.capituloId)) {
          return;
        }

        capitulos.push({
          id: notificacao.capituloId,
          titulo: extrairTituloCapituloDeMensagemNotificacao(notificacao),
          texto: "",
          curtiu: false,
          salvo: false,
          comentario: "",
          criadoEm: notificacao.criadaEm,
          lido: false,
          lidoEm: "",
        });
      });

    return {
      ...obra,
      capitulos,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });
}

async function carregarNotificacoesLidasSupabase(userId: string): Promise<string[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userIdLimpo)
      .eq("lida", true)
      .limit(2000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids = new Set<string>();

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const metadata =
        registro.metadata &&
        typeof registro.metadata === "object" &&
        !Array.isArray(registro.metadata)
          ? (registro.metadata as Record<string, unknown>)
          : {};
      const id =
        pegarTexto(registro.notificacao_id) ||
        pegarTexto(metadata.notificacao_id) ||
        pegarTexto(registro.id);

      if (id) {
        ids.add(id);
      }
    });

    return Array.from(ids);
  } catch {
    return [];
  }
}

async function carregarEstadoSupabaseNotificacoes(): Promise<EstadoSupabaseNotificacoes | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    ] = await Promise.all([
      carregarObrasSeguidasUsuario(userId),
      carregarNotificacoesLidasSupabase(userId),
      carregarNotificacoesDiretasSupabase(userId),
    ]);

    return {
      userId,
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    };
  } catch {
    return null;
  }
}

async function carregarNotificacoesComunidadeSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesSociais: NotificacaoLocal[] = [];
  const userIdsParaProfiles = new Set<string>();
  const postsPorId = new Map<string, { texto: string; autorNome: string }>();
  const comentariosComunidade: Record<string, unknown>[] = [];
  const denunciasComunidade: Record<string, unknown>[] = [];
  const seguidoresPerfil: Record<string, unknown>[] = [];
  const solicitacoesSeguidoresPerfil: Record<string, unknown>[] = [];
  const comentariosCapitulos: Record<string, unknown>[] = [];
  const reviewsComunidade: Record<string, unknown>[] = [];
  const obrasAutor = new Map<
    string,
    Pick<
      ObraLocal,
      "id" | "titulo" | "slug" | "publicado" | "classificacaoIndicativa"
    >
  >();
  const capitulosAutor = new Map<
    string,
    {
      id: string;
      titulo: string;
      obraId: string;
      obraTitulo: string;
      obraSlug: string;
      obraPublicada: boolean;
      numero: number;
    }
  >();

  try {
    const { data: postsData } = await supabase
      .from("comunidade_posts")
      .select("id, texto, autor_id, autor_nome, criado_em")
      .eq("autor_id", userId)
      .limit(120);

    const posts = Array.isArray(postsData) ? postsData : [];
    const postIds = posts
      .map((post) => pegarTexto((post as Record<string, unknown>).id))
      .filter(Boolean);

    posts.forEach((post) => {
      const registro = post as Record<string, unknown>;
      const postId = pegarTexto(registro.id);

      if (!postId) {
        return;
      }

      postsPorId.set(postId, {
        texto: pegarTexto(registro.texto, "sua publicação"),
        autorNome: pegarTexto(registro.autor_nome, "Você"),
      });
    });

    if (postIds.length > 0) {
      const { data: comentariosData } = await supabase
        .from("comunidade_comentarios")
        .select("id, post_id, autor_id, autor_nome, texto, criado_em")
        .in("post_id", postIds)
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(160);

      if (Array.isArray(comentariosData)) {
        comentariosData.forEach((comentario) => {
          const registro = comentario as Record<string, unknown>;
          const autorId = pegarTexto(registro.autor_id);

          comentariosComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // A página continua com notificações locais e de capítulos se a Comunidade falhar.
  }

  try {
    const { data: denunciasData } = await supabase.rpc(
      "listar_minhas_denuncias",
      {
        p_limite: 80,
      }
    );

    if (Array.isArray(denunciasData)) {
      denunciasData.forEach((denuncia) => {
        const registro = denuncia as Record<string, unknown>;
        const status = pegarTexto(registro.status);

        if (!["em_analise", "resolvida", "rejeitada"].includes(status)) {
          return;
        }

        denunciasComunidade.push(registro);
      });
    }
  } catch {
    // Denúncias continuam opcionais para não bloquear as notificações.
  }

  try {
    const { data: seguidoresData } = await supabase
      .from("seguindo_usuarios")
      .select("id, seguidor_id, seguido_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false })
      .limit(60);

    if (Array.isArray(seguidoresData)) {
      seguidoresData.forEach((seguidor) => {
        const registro = seguidor as Record<string, unknown>;
        const seguidorId = pegarTexto(registro.seguidor_id);

        seguidoresPerfil.push(registro);

        if (seguidorId) {
          userIdsParaProfiles.add(seguidorId);
        }
      });
    }
  } catch {
    // Seguir usuário é social; se falhar, as outras notificações continuam.
  }

  try {
    const { data: solicitacoesData } = await supabase
      .from("solicitacoes_seguidores")
      .select(
        "id, solicitante_id, destinatario_id, criado_em, atualizado_em"
      )
      .eq("destinatario_id", userId)
      .order("criado_em", { ascending: false })
      .limit(60);

    if (Array.isArray(solicitacoesData)) {
      solicitacoesData.forEach((solicitacao) => {
        const registro = solicitacao as Record<string, unknown>;
        const solicitanteId = pegarTexto(registro.solicitante_id);

        solicitacoesSeguidoresPerfil.push(registro);

        if (solicitanteId) {
          userIdsParaProfiles.add(solicitanteId);
        }
      });
    }
  } catch {
    // Solicitações são opcionais; as demais notificações continuam funcionando.
  }

  try {
    const { data: obrasAutorData } = await supabase
      .from("obras")
      .select("id, titulo, slug, publicado, user_id, classificacao_indicativa")
      .eq("user_id", userId)
      .limit(80);

    const obrasAutorRows = Array.isArray(obrasAutorData)
      ? (obrasAutorData as Record<string, unknown>[])
      : [];

    obrasAutorRows.forEach((obra, index) => {
      const obraId = pegarTexto(obra.id, `obra-autor-${index + 1}`);
      const titulo = pegarTexto(obra.titulo, "Obra sem título");
      const slug = pegarTexto(obra.slug, criarSlugBase(titulo));

      if (!obraId) {
        return;
      }

      obrasAutor.set(obraId, {
        id: obraId,
        titulo,
        slug,
        publicado: pegarBooleano(obra.publicado, true),
        classificacaoIndicativa: pegarTexto(
          obra.classificacao_indicativa,
          "Não informada"
        ),
      });
    });

    const obraIds = Array.from(obrasAutor.keys());

    if (obraIds.length > 0) {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id, obra_id, titulo, ordem, publicado, criado_em")
        .in("obra_id", obraIds)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(600);

      if (Array.isArray(capitulosData)) {
        capitulosData.forEach((capitulo, index) => {
          const registro = capitulo as Record<string, unknown>;
          const capituloId = pegarTexto(registro.id);
          const obraId = pegarTexto(registro.obra_id);
          const obra = obrasAutor.get(obraId);

          if (!capituloId || !obra) {
            return;
          }

          capitulosAutor.set(capituloId, {
            id: capituloId,
            titulo: pegarTexto(registro.titulo, `Capítulo ${index + 1}`),
            obraId,
            obraTitulo: obra.titulo,
            obraSlug: obra.slug,
            obraPublicada: obra.publicado,
            numero: obterNumeroSeguro(registro.ordem, index + 1),
          });
        });
      }

      const capituloIds = Array.from(capitulosAutor.keys());

      if (capituloIds.length > 0) {
        const { data: comentariosCapitulosData } = await supabase
          .from("comentarios_capitulos")
          .select("id,capitulo_id,user_id,comentario,criado_em,atualizado_em")
          .in("capitulo_id", capituloIds)
          .neq("user_id", userId)
          .order("atualizado_em", { ascending: false })
          .limit(200);

        if (Array.isArray(comentariosCapitulosData)) {
          comentariosCapitulosData.forEach((comentario) => {
            const registro = comentario as Record<string, unknown>;
            const autorId = pegarTexto(registro.user_id);

            comentariosCapitulos.push(registro);

            if (autorId) {
              userIdsParaProfiles.add(autorId);
            }
          });
        }
      }

      const { data: reviewsData } = await supabase
        .from("comunidade_posts")
        .select("id, autor_id, autor_nome, texto, obra_relacionada, tipo_publicacao, criado_em")
        .eq("tipo_publicacao", "Review")
        .neq("autor_id", userId)
        .order("criado_em", { ascending: false })
        .limit(80);

      if (Array.isArray(reviewsData)) {
        reviewsData.forEach((review) => {
          const registro = review as Record<string, unknown>;
          const obraRelacionada = normalizarTexto(
            pegarTexto(registro.obra_relacionada)
          );
          const obraDoAutor = Array.from(obrasAutor.values()).find((obra) => {
            const tituloNormalizado = normalizarTexto(obra.titulo);

            return (
              obraRelacionada &&
              tituloNormalizado &&
              (obraRelacionada === tituloNormalizado ||
                obraRelacionada.includes(tituloNormalizado) ||
                tituloNormalizado.includes(obraRelacionada))
            );
          });

          const classificacaoNormalizada = normalizarTexto(
            obraDoAutor?.classificacaoIndicativa || ""
          );

          if (
            !obraDoAutor ||
            !obraDoAutor.publicado ||
            !classificacaoNormalizada ||
            classificacaoNormalizada.startsWith("nao informad") ||
            ehClassificacao18(obraDoAutor.classificacaoIndicativa)
          ) {
            return;
          }

          registro.obra_id_validado = obraDoAutor.id;
          registro.obra_titulo_validado = obraDoAutor.titulo;

          const autorId = pegarTexto(registro.autor_id);
          reviewsComunidade.push(registro);

          if (autorId) {
            userIdsParaProfiles.add(autorId);
          }
        });
      }
    }
  } catch {
    // Comentários de capítulo/reviews são extras; não bloqueiam a página.
  }

  const perfis = await carregarPerfisNotificacoes(Array.from(userIdsParaProfiles));

  comentariosComunidade.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const postId = pegarTexto(registro.post_id);

    if (!comentarioId || !postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Alguém")
    );
    const id = `comunidade-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.texto);
    const post = postsPorId.get(postId);
    const trechoPost = post?.texto
      ? post.texto.slice(0, 90)
      : "uma publicação sua";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Novo comentário na Comunidade",
      mensagem: `${perfilAutor.nome} comentou em "${trechoPost}${
        trechoPost.length >= 90 ? "..." : ""
      }"${textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."}`,
      tipo: "comentario-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  seguidoresPerfil.forEach((registro) => {
    const seguidorId = pegarTexto(registro.seguidor_id);

    if (!seguidorId) {
      return;
    }

    const perfilSeguidor = obterPerfilNotificacao(perfis, seguidorId, "Usuário");
    const id = `novo-seguidor-${pegarTexto(registro.id, seguidorId)}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: criarPerfilHrefNotificacao(seguidorId, perfilSeguidor.nome),
      titulo: "Novo seguidor",
      mensagem: `${perfilSeguidor.nome} começou a seguir seu perfil.`,
      tipo: "novo-seguidor",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId: seguidorId,
      autorNome: perfilSeguidor.nome,
      autorAvatar: perfilSeguidor.avatar,
    });
  });

  solicitacoesSeguidoresPerfil.forEach((registro) => {
    const solicitacaoId = pegarTexto(registro.id);
    const solicitanteId = pegarTexto(registro.solicitante_id);

    if (!solicitacaoId || !solicitanteId) {
      return;
    }

    const perfilSolicitante = obterPerfilNotificacao(
      perfis,
      solicitanteId,
      "Usuário"
    );
    const id = `solicitacao-seguidor-${solicitacaoId}`;

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link: "/seguindo?aba=seguidores&conteudo=seguidores",
      titulo: "Nova solicitação para seguir",
      mensagem: `${perfilSolicitante.nome} quer seguir seu perfil.`,
      tipo: "solicitacao-seguidor",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId: solicitanteId,
      autorNome: perfilSolicitante.nome,
      autorAvatar: perfilSolicitante.avatar,
      solicitacaoId,
    });
  });

  comentariosCapitulos.forEach((registro) => {
    const capituloId = pegarTexto(registro.capitulo_id);
    const capitulo = capitulosAutor.get(capituloId);

    if (!capitulo) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const comentarioId =
      pegarTexto(registro.id) ||
      `${capituloId}-${autorId}-${pegarTexto(registro.atualizado_em ?? registro.criado_em)}`;
    const id = `capitulo-comentario-${comentarioId}`;
    const textoComentario = pegarTexto(registro.comentario ?? registro.texto);

    notificacoesSociais.push({
      id,
      obraId: capitulo.obraId,
      capituloId,
      link: criarHrefLeituraCapitulo(
        {
          id: capitulo.obraId,
          slug: capitulo.obraSlug,
          titulo: capitulo.obraTitulo,
          publicado: capitulo.obraPublicada,
        },
        capituloId,
        capitulo.numero
      ),
      titulo: "Novo comentário no capítulo",
      mensagem: `${perfilAutor.nome} comentou em ${capitulo.titulo}${
        textoComentario ? `: ${textoComentario.slice(0, 90)}` : "."
      }`,
      tipo: "comentario-capitulo",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  reviewsComunidade.forEach((registro) => {
    const postId = pegarTexto(registro.id);

    if (!postId) {
      return;
    }

    const autorId = pegarTexto(registro.autor_id);
    const perfilAutor = obterPerfilNotificacao(
      perfis,
      autorId,
      pegarTexto(registro.autor_nome, "Leitor")
    );
    const obraId = pegarTexto(registro.obra_id_validado);
    const obraRelacionada = pegarTexto(
      registro.obra_titulo_validado,
      "sua obra"
    );
    const textoReview = pegarTexto(registro.texto);
    const id = `comunidade-review-${postId}`;

    notificacoesSociais.push({
      id,
      obraId,
      capituloId: "",
      link: `/comunidade?post=${encodeURIComponent(postId)}`,
      titulo: "Nova review publicada",
      mensagem: `${perfilAutor.nome} publicou uma review sobre ${obraRelacionada}${
        textoReview ? `: ${textoReview.slice(0, 90)}` : "."
      }`,
      tipo: "review-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  denunciasComunidade.forEach((registro) => {
    const denunciaId = pegarTexto(registro.denuncia_id);
    const status = pegarTexto(registro.status, "em_analise");

    if (!denunciaId) {
      return;
    }

    const id = `comunidade-denuncia-${denunciaId}-${status}`;
    const statusTexto = obterTextoStatusDenunciaComunidadeNotificacao(status);
    const alvoTipo = pegarTexto(registro.alvo_tipo, "conteúdo");
    const alvoId = pegarTexto(registro.alvo_id);
    const link =
      alvoTipo === "post" && alvoId
        ? `/comunidade?post=${encodeURIComponent(alvoId)}`
        : "/comunidade";

    notificacoesSociais.push({
      id,
      obraId: "",
      capituloId: "",
      link,
      titulo: `Denúncia ${statusTexto}`,
      mensagem: `A moderação marcou sua denúncia como ${statusTexto}.`,
      tipo: "denuncia-comunidade",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.analisado_em ?? registro.criado_em,
        new Date().toISOString()
      ),
      autorId: "",
      autorNome: "Moderação",
      autorAvatar: "",
    });
  });

  return notificacoesSociais.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}


async function carregarNotificacoesProblemasTecnicosSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc(
      "listar_meus_problemas_tecnicos",
      {
        p_limite: 80,
      }
    );

    if (error || !Array.isArray(data)) {
      return [];
    }

    const idsLidos = new Set(notificacoesLidasIds);
    const notificacoesCriadas: NotificacaoLocal[] = [];

    data.forEach((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const problemaId =
        pegarTexto(registro.problema_id) || pegarTexto(registro.id);
      const status = pegarTexto(
        registro.status ?? registro.problema_status
      );
      const statusNotificacao =
        obterStatusProblemaTecnicoNotificacao(status);

      if (!problemaId || !statusNotificacao) {
        return;
      }

      const tituloChamado = pegarTexto(
        registro.titulo,
        "Problema técnico"
      ).slice(0, 120);
      const id = `problema-tecnico-${problemaId}-${status}`;

      notificacoesCriadas.push({
        id,
        obraId: "",
        capituloId: "",
        link: "/ajuda#problema-tecnico",
        titulo: statusNotificacao.titulo,
        mensagem: `Seu chamado técnico "${tituloChamado}" foi atualizado para ${statusNotificacao.texto}.`,
        tipo: "problema-tecnico",
        lida: idsLidos.has(id),
        criadaEm: pegarTexto(
          registro.atualizado_em ??
            registro.analisado_em ??
            registro.criado_em,
          new Date().toISOString()
        ),
        autorId: "",
        autorNome: "Suporte técnico",
        autorAvatar: "",
      });
    });

    return notificacoesCriadas.sort(
      (a, b) => dataNotificacao(b) - dataNotificacao(a)
    );
  } catch {
    return [];
  }
}

async function carregarNotificacoesDiarioSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  if (!userId) {
    return [];
  }

  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesDiario: NotificacaoLocal[] = [];
  const anotacoesDoUsuario: Record<string, unknown>[] = [];
  const curtidasAnotacoes: Record<string, unknown>[] = [];
  const comentariosAnotacoes: Record<string, unknown>[] = [];
  const atividadesSeguidos: Record<string, unknown>[] = [];
  const usuariosParaPerfil = new Set<string>();
  const obrasIds = new Set<string>();

  try {
    const { data: anotacoesData } = await supabase
      .from("diario_anotacoes")
      .select("id, user_id, obra_id, tipo, texto, visibilidade, criado_em, atualizado_em")
      .eq("user_id", userId)
      .order("atualizado_em", { ascending: false })
      .limit(120);

    if (Array.isArray(anotacoesData)) {
      anotacoesData.forEach((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return;
        }

        const registro = item as Record<string, unknown>;
        const anotacaoId = pegarTexto(registro.id);
        const obraId = pegarTexto(registro.obra_id);

        if (!anotacaoId) {
          return;
        }

        anotacoesDoUsuario.push(registro);

        if (obraId) {
          obrasIds.add(obraId);
        }
      });
    }
  } catch {
    // O Diário continua sem notificações de interação se a consulta falhar.
  }

  const anotacoesPorId = new Map(
    anotacoesDoUsuario
      .map((anotacao) => [pegarTexto(anotacao.id), anotacao] as const)
      .filter(([anotacaoId]) => Boolean(anotacaoId))
  );
  const anotacaoIds = Array.from(anotacoesPorId.keys());

  if (anotacaoIds.length > 0) {
    try {
      const [curtidasResposta, comentariosResposta] = await Promise.all([
        supabase
          .from("diario_anotacao_curtidas")
          .select("id, anotacao_id, user_id, criado_em")
          .in("anotacao_id", anotacaoIds)
          .neq("user_id", userId)
          .order("criado_em", { ascending: false })
          .limit(160),
        supabase
          .from("diario_anotacao_comentarios")
          .select("id, anotacao_id, user_id, texto, criado_em, atualizado_em")
          .in("anotacao_id", anotacaoIds)
          .neq("user_id", userId)
          .order("criado_em", { ascending: false })
          .limit(160),
      ]);

      if (Array.isArray(curtidasResposta.data)) {
        curtidasResposta.data.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);

          curtidasAnotacoes.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }
        });
      }

      if (Array.isArray(comentariosResposta.data)) {
        comentariosResposta.data.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);

          comentariosAnotacoes.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }
        });
      }
    } catch {
      // Interações do Diário são complementares às demais notificações.
    }
  }

  try {
    const { data: seguindoData } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id")
      .eq("seguidor_id", userId)
      .limit(120);

    const usuariosSeguidos = Array.isArray(seguindoData)
      ? seguindoData
          .map((item) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? pegarTexto((item as Record<string, unknown>).seguido_id)
              : ""
          )
          .filter(Boolean)
      : [];

    usuariosSeguidos.forEach((seguidoId) => usuariosParaPerfil.add(seguidoId));

    if (usuariosSeguidos.length > 0) {
      const { data: atividadesData } = await supabase
        .from("diario_atividades")
        .select(
          "id, user_id, tipo, obra_id, capitulo_id, texto, nota, visibilidade, metadata, criado_em, atualizado_em"
        )
        .in("user_id", usuariosSeguidos)
        .eq("visibilidade", "publico")
        .in("tipo", ["concluiu_obra", "avaliou_obra"])
        .order("criado_em", { ascending: false })
        .limit(100);

      if (Array.isArray(atividadesData)) {
        atividadesData.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);
          const obraId = pegarTexto(registro.obra_id);

          atividadesSeguidos.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }

          if (obraId) {
            obrasIds.add(obraId);
          }
        });
      }
    }
  } catch {
    // Atividades públicas de perfis seguidos não bloqueiam as demais notificações.
  }

  const obrasPorId = new Map<
    string,
    { id: string; titulo: string; slug: string; publicado: boolean }
  >();

  if (obrasIds.size > 0) {
    try {
      const { data: obrasData } = await supabase
        .from("obras")
        .select("id, titulo, slug, publicado, classificacao_indicativa")
        .in("id", Array.from(obrasIds))
        .limit(200);

      if (Array.isArray(obrasData)) {
        obrasData.forEach((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const obraId = pegarTexto(registro.id);

          if (!obraId) {
            return;
          }

          const classificacaoIndicativa = pegarTexto(

            registro.classificacao_indicativa

          );


          if (ehClassificacao18(classificacaoIndicativa)) {

            return;

          }


          const titulo = pegarTexto(registro.titulo, `Obra ${index + 1}`);

          obrasPorId.set(obraId, {
            id: obraId,
            titulo,
            slug: pegarTexto(registro.slug, criarSlugBase(titulo)),
            publicado: pegarBooleano(registro.publicado, true),
          });
        });
      }
    } catch {
      // O texto da anotação continua permitindo identificar a notificação.
    }
  }

  const perfis = await carregarPerfisNotificacoes(
    Array.from(usuariosParaPerfil)
  );
  const linkDiarioProprio = criarDiarioPerfilHrefNotificacao(userId);

  curtidasAnotacoes.forEach((registro) => {
    const curtidaId = pegarTexto(registro.id);
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const anotacao = anotacoesPorId.get(anotacaoId);

    if (!curtidaId || !anotacao) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const obraId = pegarTexto(anotacao.obra_id);
    const obra = obrasPorId.get(obraId);
    const tipoAnotacao = obterRotuloTipoAnotacaoDiarioNotificacao(
      pegarTexto(anotacao.tipo)
    );
    const id = `diario-curtida-${curtidaId}`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: linkDiarioProprio,
      titulo: "Nova curtida no Diário",
      mensagem: `${perfilAutor.nome} curtiu sua ${tipoAnotacao}${
        obra?.titulo ? ` sobre ${obra.titulo}` : ""
      }.`,
      tipo: "curtida-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  comentariosAnotacoes.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const anotacao = anotacoesPorId.get(anotacaoId);

    if (!comentarioId || !anotacao) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const obraId = pegarTexto(anotacao.obra_id);
    const obra = obrasPorId.get(obraId);
    const comentario = pegarTexto(registro.texto);
    const tipoAnotacao = obterRotuloTipoAnotacaoDiarioNotificacao(
      pegarTexto(anotacao.tipo)
    );
    const id = `diario-comentario-${comentarioId}`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: linkDiarioProprio,
      titulo: "Novo comentário no Diário",
      mensagem: `${perfilAutor.nome} comentou na sua ${tipoAnotacao}${
        obra?.titulo ? ` sobre ${obra.titulo}` : ""
      }${comentario ? `: ${comentario.slice(0, 120)}` : "."}`,
      tipo: "comentario-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  atividadesSeguidos.forEach((registro) => {
    const atividadeId = pegarTexto(registro.id);

    if (!atividadeId) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Usuário");
    const tipoAtividade = pegarTexto(registro.tipo);
    const obraId = pegarTexto(registro.obra_id);

    if (!obraId) {
      return;
    }

    const obra = obrasPorId.get(obraId);
    const tituloObra = obra?.titulo || "uma obra";
    const nota = obterNumeroSeguro(registro.nota, 0);
    const id = `diario-atividade-${atividadeId}`;
    const mensagem =
      tipoAtividade === "avaliou_obra"
        ? `${perfilAutor.nome} avaliou ${tituloObra}${
            nota > 0 ? ` com ${nota.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} estrelas` : ""
          }.`
        : `${perfilAutor.nome} concluiu ${tituloObra}.`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: criarDiarioPerfilHrefNotificacao(autorId, perfilAutor.nome),
      titulo:
        tipoAtividade === "avaliou_obra"
          ? "Nova avaliação no Diário"
          : "Obra concluída no Diário",
      mensagem,
      tipo: "atividade-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  return notificacoesDiario.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}

async function obterUserIdAtualNotificacoes(fallbackUserId = "") {
  const fallbackLimpo = fallbackUserId.trim();

  if (fallbackLimpo && fallbackLimpo !== "anon") {
    return fallbackLimpo;
  }

  try {
    const { data } = await supabase.auth.getUser();

    return data.user?.id || "";
  } catch {
    return "";
  }
}

async function sincronizarNotificacoesLidasSupabase(
  notificacoesParaSincronizar: NotificacaoLocal[],
  lida: boolean,
  userIdAtual = ""
) {
  const idsNotificacoes = Array.from(
    new Set(
      notificacoesParaSincronizar
        .map((notificacao) => notificacao.id.trim())
        .filter(Boolean)
    )
  );

  if (idsNotificacoes.length === 0) {
    return;
  }

  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return;
    }

    const { error: erroRpc } = await supabase.rpc("marcar_notificacoes_lidas", {
      notificacao_ids: idsNotificacoes,
      novo_estado: lida,
    });

    if (!erroRpc) {
      return;
    }

    const { error: erroPorNotificacaoId } = await supabase
      .from("notificacoes")
      .update({ lida })
      .eq("user_id", userId)
      .in("notificacao_id", idsNotificacoes);

    if (!erroPorNotificacaoId) {
      return;
    }

    const idsUuid = idsNotificacoes.filter((id) =>
      idObraSupabaseValido(id)
    );

    if (idsUuid.length > 0) {
      await supabase
        .from("notificacoes")
        .update({ lida })
        .eq("user_id", userId)
        .in("id", idsUuid);
    }
  } catch {
    // O estado local continua funcionando se a sincronização remota falhar.
  }
}

async function sincronizarNotificacaoLidaSupabase(
  notificacao: NotificacaoLocal,
  lida: boolean,
  userIdAtual = ""
) {
  await sincronizarNotificacoesLidasSupabase([notificacao], lida, userIdAtual);
}

async function apagarNotificacoesSupabase(
  notificacoesParaApagar: NotificacaoLocal[],
  userIdAtual = ""
) {
  const ids = Array.from(
    new Set(
      notificacoesParaApagar
        .map((notificacao) => notificacao.id.trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) {
    return;
  }

  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return;
    }

    await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", userId)
      .in("notificacao_id", ids);

    const idsUuid = ids.filter((id) => idObraSupabaseValido(id));

    if (idsUuid.length > 0) {
      await supabase
        .from("notificacoes")
        .delete()
        .eq("user_id", userId)
        .in("id", idsUuid);
    }
  } catch {
    // A remoção local continua funcionando se o Supabase falhar.
  }
}

async function apagarNotificacaoSupabase(
  notificacao: NotificacaoLocal,
  userIdAtual = ""
) {
  await apagarNotificacoesSupabase([notificacao], userIdAtual);
}

async function excluirNotificacoesLidasSupabase(userIdAtual = "") {
  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return false;
    }

    const { error } = await supabase.rpc("excluir_notificacoes_lidas");

    return !error;
  } catch {
    return false;
  }
}
export default function NotificacoesPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoLocal[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaTopoAberta, setBuscaTopoAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [carregando, setCarregando] = useState(true);
  const [usuarioNotificacoesId, setUsuarioNotificacoesId] = useState("");
  const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("");
  const [solicitacaoRespondendoId, setSolicitacaoRespondendoId] = useState("");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);
  const { definirNotificacoesNaoLidas } = useNotificacoes();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const isDesktop = useNotificacoesDesktopMode();

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDados() {
      let manterCarregando = false;
      let usuarioAutenticado = false;
      let usuarioAtualId = "";

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!componenteAtivo) {
          return;
        }

        if (erroUsuario || !dadosUsuario.user) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        usuarioAtualId = dadosUsuario.user.id;
        usuarioAutenticado = true;
        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);
        const obrasSupabase = await carregarObrasPublicadasSupabase();
        const estadoSupabase = await carregarEstadoSupabaseNotificacoes();
        const notificacoesDiretasSupabase = estadoSupabase?.notificacoesDiretas || [];
        const obrasDiretasSupabase =
          await carregarObrasDasNotificacoesDiretasSupabase(
            notificacoesDiretasSupabase
          );
        const idsNotificacoesApagadas =
          carregarIdsNotificacoesApagadas(usuarioAtualId);
        const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, [
          ...obrasSupabase,
          ...obrasDiretasSupabase,
        ]);
        const obrasSeguidasLocais = lerIdsLocalStorage(
          CHAVE_OBRAS_SEGUIDAS,
          usuarioAtualId
        );
        const obrasSeguidasIds = Array.from(
          new Set([
            ...obrasSeguidasLocais,
            ...(estadoSupabase?.obrasSeguidasIds || []),
          ])
        );
        const idsSeguidos = new Set(
          obrasSeguidasIds
            .map((id) => id.trim())
            .filter((id) => Boolean(id))
        );
        const obrasPorIdMescladas = new Map(
          obrasMescladas.map((obra) => [obra.id, obra])
        );
        const notificacoesLocaisFiltradas = notificacoesLocais.filter(
          (notificacao) =>
            !notificacaoEhCapitulo(notificacao) ||
            notificacaoCapituloPertenceAObraSeguida(
              notificacao,
              obrasPorIdMescladas,
              idsSeguidos,
              usuarioAtualId
            )
        );
        const notificacoesLidasIds = estadoSupabase?.notificacoesLidasIds || [];
        const notificacoesCapitulosSupabase = criarNotificacoesDeCapitulos(
          obrasMescladas,
          obrasSeguidasIds,
          notificacoesLidasIds,
          usuarioAtualId
        );
        const [
          notificacoesComunidadeSupabase,
          notificacoesDiarioSupabase,
          notificacoesProblemasTecnicosSupabase,
        ] = await Promise.all([
          carregarNotificacoesComunidadeSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesDiarioSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesProblemasTecnicosSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
        ]);
        const notificacoesMescladas = filtrarNotificacoesApagadas(
          mesclarNotificacoes(notificacoesLocaisFiltradas, [
            ...notificacoesCapitulosSupabase,
            ...notificacoesDiretasSupabase,
            ...notificacoesComunidadeSupabase,
            ...notificacoesDiarioSupabase,
            ...notificacoesProblemasTecnicosSupabase,
          ]),
          idsNotificacoesApagadas
        ).map((notificacao) => prepararNotificacaoTexto(notificacao));

        try {
          salvarJsonStorageUsuarioNotificacoes(
            CHAVE_OBRAS,
            usuarioAtualId,
            obrasMescladas
          );
          salvarNotificacoes(notificacoesMescladas, usuarioAtualId);
        } catch {
          // Se o navegador bloquear localStorage, a página continua com o estado em memória.
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasMescladas);
        setNotificacoes(notificacoesMescladas);
        definirNotificacoesNaoLidas(
          notificacoesMescladas.filter((notificacao) => !notificacao.lida).length
        );
      } catch {
        if (!componenteAtivo) {
          return;
        }

        if (!usuarioAutenticado || !usuarioAtualId) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasLocais);
        setNotificacoes(notificacoesLocais);
        definirNotificacoesNaoLidas(
          notificacoesLocais.filter((notificacao) => !notificacao.lida).length
        );
      } finally {
        if (componenteAtivo && !manterCarregando) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, [router, definirNotificacoesNaoLidas]);


  const obrasPorId = useMemo(() => {
    return new Map(obras.map((obra) => [obra.id, obra]));
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return notificacoes.filter((notificacao) => !notificacao.lida).length;
  }, [notificacoes]);

  const totalLidas = Math.max(totalNotificacoes - totalNaoLidas, 0);
  const termoBusca = normalizarTexto(busca);

  const acessoConteudo18Liberado = acessoConteudo18Confirmado();

  const notificacoesFiltradas = useMemo(() => {
    return filtrarEOrdenarNotificacoes({
      notificacoes,
      obrasPorId,
      termoBusca,
      filtro,
      ordenacao,
      acessoConteudo18Liberado,
    });
  }, [
    notificacoes,
    obrasPorId,
    termoBusca,
    filtro,
    ordenacao,
    acessoConteudo18Liberado,
  ]);

  const filtrosAtivos = Boolean(
    busca.trim() || filtro !== "todas" || ordenacao !== "recentes"
  );

  const opcoesFiltro: Array<{ valor: FiltroNotificacao; rotulo: string }> = [
    { valor: "todas", rotulo: "Todas" },
    { valor: "nao-lidas", rotulo: "Novas" },
    { valor: "lidas", rotulo: "Lidas" },
    { valor: "capitulos", rotulo: "Capítulos" },
    { valor: "comunidade", rotulo: "Comunidade" },
  ];

  const opcoesOrdenacao: Array<{ valor: OrdenacaoNotificacao; rotulo: string }> = [
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "antigas", rotulo: "Mais antigas" },
  ];

  function encontrarObra(obraId: string) {
    return obrasPorId.get(obraId) || null;
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    const obra = encontrarObra(obraId);

    if (!obra) {
      return null;
    }

    return obra.capitulos.find((capitulo) => capitulo.id === capituloId) || null;
  }

  function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    const notificacoesNormalizadas = mesclarNotificacoes(
      [],
      novasNotificacoes
    ).map((notificacao) => prepararNotificacaoTexto(notificacao));

    setNotificacoes(notificacoesNormalizadas);
    definirNotificacoesNaoLidas(
      notificacoesNormalizadas.filter((notificacao) => !notificacao.lida).length
    );
    salvarNotificacoes(notificacoesNormalizadas, usuarioNotificacoesId);
  }

  function marcarComoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, true, usuarioNotificacoesId);
    }
  }

  function marcarComoNaoLida(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (notificacao.id !== id) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: false,
      };
    });

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void sincronizarNotificacaoLidaSupabase(notificacaoAtual, false, usuarioNotificacoesId);
    }
  }

  function abrirNotificacao(id: string) {
    marcarComoLida(id);
  }

  async function responderSolicitacaoSeguidorNotificacao(
    notificacao: NotificacaoLocal,
    aceitar: boolean
  ) {
    const solicitacaoId = notificacao.solicitacaoId?.trim() || "";

    if (
      !solicitacaoId ||
      !idObraSupabaseValido(solicitacaoId) ||
      solicitacaoRespondendoId
    ) {
      return;
    }

    setSolicitacaoRespondendoId(solicitacaoId);

    try {
      const { data, error } = await supabase.rpc(
        "responder_solicitacao_seguidor",
        {
          p_solicitacao_id: solicitacaoId,
          p_aceitar: aceitar,
        }
      );

      if (error || (data !== "aceita" && data !== "recusada")) {
        window.alert(
          error?.message || "Não foi possível responder esta solicitação."
        );
        return;
      }

      const notificacoesRelacionadas = notificacoes.filter(
        (notificacaoAtual) =>
          notificacaoAtual.tipo === "solicitacao-seguidor" &&
          (notificacaoAtual.solicitacaoId?.trim() === solicitacaoId ||
            notificacoesRepresentamMesmoEvento(
              notificacaoAtual,
              notificacao
            ))
      );
      const idsRelacionados = new Set(
        notificacoesRelacionadas.map((notificacaoAtual) =>
          notificacaoAtual.id.trim()
        )
      );

      registrarNotificacoesApagadas(
        usuarioNotificacoesId,
        Array.from(idsRelacionados)
      );
      atualizarNotificacoes(
        notificacoes.filter(
          (notificacaoAtual) => !idsRelacionados.has(notificacaoAtual.id.trim())
        )
      );

      if (notificacoesRelacionadas.length > 0) {
        void apagarNotificacoesSupabase(
          notificacoesRelacionadas,
          usuarioNotificacoesId
        );
      }

      fecharMenuNotificacao();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Não foi possível responder esta solicitação."
      );
    } finally {
      setSolicitacaoRespondendoId("");
    }
  }

  function marcarTodasComoLidas() {
    const notificacoesParaSincronizar = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );
    const novasNotificacoes = notificacoes.map((notificacao) => ({
      ...notificacao,
      lida: true,
    }));

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function marcarFiltradasComoLidas() {
    const idsFiltrados = new Set(
      notificacoesFiltradas.map((notificacao) => notificacao.id)
    );
    const notificacoesParaSincronizar = notificacoes.filter((notificacao) => {
      return idsFiltrados.has(notificacao.id) && !notificacao.lida;
    });

    const novasNotificacoes = notificacoes.map((notificacao) => {
      if (!idsFiltrados.has(notificacao.id)) {
        return notificacao;
      }

      return {
        ...notificacao,
        lida: true,
      };
    });

    atualizarNotificacoes(novasNotificacoes);
    void sincronizarNotificacoesLidasSupabase(
      notificacoesParaSincronizar,
      true,
      usuarioNotificacoesId
    );
  }

  function apagarNotificacao(id: string) {
    const notificacaoAtual = notificacoes.find((notificacao) => notificacao.id === id);
    const novasNotificacoes = notificacoes.filter((notificacao) => {
      return notificacao.id !== id;
    });

    if (notificacaoAtual) {
      registrarNotificacoesApagadas(usuarioNotificacoesId, [notificacaoAtual.id]);
    }

    atualizarNotificacoes(novasNotificacoes);

    if (notificacaoAtual) {
      void apagarNotificacaoSupabase(notificacaoAtual, usuarioNotificacoesId);
    }
  }

  function limparTodas() {
    const notificacoesParaApagar = [...notificacoes];

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesParaApagar.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes([]);
    void apagarNotificacoesSupabase(
      notificacoesParaApagar,
      usuarioNotificacoesId
    );
  }

  function limparLidas() {
    const notificacoesLidas = notificacoes.filter((notificacao) => notificacao.lida);
    const novasNotificacoes = notificacoes.filter(
      (notificacao) => !notificacao.lida
    );

    registrarNotificacoesApagadas(
      usuarioNotificacoesId,
      notificacoesLidas.map((notificacao) => notificacao.id)
    );
    atualizarNotificacoes(novasNotificacoes);
    void excluirNotificacoesLidasSupabase(usuarioNotificacoesId).then((excluiu) => {
      if (!excluiu) {
        void apagarNotificacoesSupabase(
          notificacoesLidas,
          usuarioNotificacoesId
        );
      }
    });
  }

  function alternarMenuNotificacao(id: string) {
    setMostrarPainelOrdenacao(false);
    setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id));
  }

  function fecharMenuNotificacao() {
    setMenuNotificacaoAbertoId("");
  }

  function fecharMenusNotificacoes() {
    setMenuNotificacaoAbertoId("");
    setMostrarPainelOrdenacao(false);
  }

  function limparFiltros() {
    fecharMenusNotificacoes();
    setBusca("");
    setBuscaTopoAberta(false);
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  const notificacaoMenuAberta = menuNotificacaoAbertoId
    ? notificacoes.find((notificacao) => notificacao.id === menuNotificacaoAbertoId) || null
    : null;

  const menuOverlayAberto = Boolean(
    mostrarPainelOrdenacao || notificacaoMenuAberta
  );
  useNotificacoesOverlayBodyLock(menuOverlayAberto);

  if (carregando) {
    return (
      <main data-historietas-notificacoes-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>
        <NotificacoesLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <NotificacoesLoadingSpinner
          label="Carregando notificações"
          pageStyle={loadingPageStyle}
          spinnerStyle={loadingSpinnerStyle}
        />
      </main>
    );
  }

  return (
    <main data-historietas-notificacoes-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>
      <NotificacoesLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={notificacoesTopFilterBoxStyle}>
          {isDesktop ? (
            <div style={desktopTitleHeaderStyle}>
              <h1 style={desktopNotificationsTitleStyle}>Notificações</h1>

              <div style={desktopNotificationsTopActionsStyle}>
                <label style={desktopNotificationsSearchShellStyle}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={desktopNotificationsSearchIconStyle}
                  >
                    <circle
                      cx="10.85"
                      cy="10.85"
                      r="6.65"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16.05 16.05L20.25 20.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    value={busca}
                    onChange={(event) => {
                      fecharMenusNotificacoes();
                      setBusca(event.target.value);
                    }}
                    className="notificacoes-search-input"
                    aria-label="Buscar notificações..."
                    placeholder="Buscar notificações..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={desktopNotificationsSearchInputStyle}
                    type="text"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    fecharMenusNotificacoes();
                    setMostrarPainelOrdenacao((aberto) => !aberto);
                  }}
                  style={desktopNotificationsFilterButtonStyle}
                  aria-label="Abrir opções das notificações"
                  aria-expanded={mostrarPainelOrdenacao}
                >
                  <span>Filtros</span>
                  <span aria-hidden="true">+</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={titleHeaderStyle}>
              <button
                type="button"
                onClick={() => {
                  fecharMenusNotificacoes();
                  setMostrarPainelOrdenacao((aberto) => !aberto);
                }}
                style={notificacoesHeaderFilterButtonStyle}
                aria-label="Abrir opções das notificações"
                aria-expanded={mostrarPainelOrdenacao}
              >
                <span>Notificações</span>
                <span style={notificacoesHeaderFilterIconStyle} aria-hidden="true">
                  +
                </span>
              </button>

              {buscaTopoAberta || Boolean(busca.trim()) ? (
                <>
                  <label style={notificationSearchShellStyle}>
                    <input
                      value={busca}
                      onChange={(event) => {
                        fecharMenusNotificacoes();
                        setBusca(event.target.value);
                      }}
                      className="notificacoes-search-input"
                      aria-label="Buscar notificações..."
                    placeholder="Buscar notificações..."
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={90}
                      style={notificationSearchInputStyle}
                      type="text"
                      autoFocus
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      fecharMenusNotificacoes();
                      setBusca("");
                      setBuscaTopoAberta(false);
                    }}
                    aria-label="Fechar busca"
                    aria-expanded="true"
                    style={mobileSearchToggleStyle}
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
                  onClick={() => {
                    fecharMenusNotificacoes();
                    setBuscaTopoAberta(true);
                  }}
                  aria-label="Abrir busca"
                  aria-expanded="false"
                  style={mobileSearchToggleStyle}
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
            </div>
          )}
        </section>

        {totalNotificacoes > 0 && filtrosAtivos && (
          <section
            style={
              isDesktop
                ? desktopNotificationsControlsStyle
                : notificationsControlsStyle
            }
          >
            <button
              type="button"
              onClick={limparFiltros}
              style={notificationClearButtonStyle}
            >
              Limpar busca e filtros
            </button>
          </section>
        )}

        {mostrarPainelOrdenacao && (
              <NotificacoesOverlayPortal>
                <div
                data-historietas-notificacoes-overlay="true"
                style={notificationSortingBackdropStyle}
                onClick={() => setMostrarPainelOrdenacao(false)}
              >
                <div
                  style={isDesktop ? desktopNotificationSortingSheetStyle : notificationSortingSheetStyle}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span style={notificationSortingHandleStyle} />

                  <strong style={notificationSortingTitleStyle}>Opções de notificações</strong>

                  <div style={notificationSortingOptionsListStyle}>
                    <span style={notificationSortingSectionLabelStyle}>Mostrar</span>

                    {opcoesFiltro.map((opcao) => {
                      const ativo = filtro === opcao.valor;

                      return (
                        <button
                          key={opcao.valor}
                          type="button"
                          onClick={() => {
                            setFiltro(opcao.valor);
                            setMostrarPainelOrdenacao(false);
                          }}
                          style={
                            ativo
                              ? notificationSortingOptionActiveStyle
                              : notificationSortingOptionStyle
                          }
                        >
                          <span>{opcao.rotulo}</span>

                          <span
                            style={
                              ativo
                                ? notificationSortingOptionRadioActiveStyle
                                : notificationSortingOptionRadioStyle
                            }
                          >
                            {ativo ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}

                    <span style={notificationSortingSectionLabelStyle}>Classificar por</span>

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
                            ativo
                              ? notificationSortingOptionActiveStyle
                              : notificationSortingOptionStyle
                          }
                        >
                          <span>{opcao.rotulo}</span>

                          <span
                            style={
                              ativo
                                ? notificationSortingOptionRadioActiveStyle
                                : notificationSortingOptionRadioStyle
                            }
                          >
                            {ativo ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}

                    <span style={notificationSortingSectionLabelStyle}>Ações</span>

                    <button
                      type="button"
                      onClick={() => {
                        marcarTodasComoLidas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        notificacoes.length === 0
                          ? notificationActionsOptionDisabledStyle
                          : notificationActionsOptionStyle
                      }
                      disabled={notificacoes.length === 0}
                    >
                      Marcar todas como lidas
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        marcarFiltradasComoLidas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        notificacoesFiltradas.length === 0
                          ? notificationActionsOptionDisabledStyle
                          : notificationActionsOptionStyle
                      }
                      disabled={notificacoesFiltradas.length === 0}
                    >
                      Marcar seleção
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        limparLidas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        totalLidas === 0
                          ? notificationActionsOptionDisabledStyle
                          : notificationActionsOptionStyle
                      }
                      disabled={totalLidas === 0}
                    >
                      Apagar lidas
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        limparTodas();
                        setMostrarPainelOrdenacao(false);
                      }}
                      style={
                        notificacoes.length === 0
                          ? notificationActionsDangerOptionDisabledStyle
                          : notificationActionsDangerOptionStyle
                      }
                      disabled={notificacoes.length === 0}
                    >
                      Limpar todos
                    </button>
                  </div>
                </div>
              </div>
              </NotificacoesOverlayPortal>
        )}

        {notificacoes.length === 0 ? (
          <NotificacoesEmptyState mensagem="Nenhuma notificação" />
        ) : notificacoesFiltradas.length === 0 ? (
          <NotificacoesEmptyState mensagem="Nada encontrado" />
        ) : (
          <section style={isDesktop ? desktopListStyle : listStyle} aria-label="Lista de notificações">
            {notificacoesFiltradas.map((notificacaoOriginal, notificacaoIndex) => {
              const notificacao = prepararNotificacaoTexto(notificacaoOriginal);
              const obra = encontrarObra(notificacao.obraId);
              const capitulo = encontrarCapitulo(
                notificacao.obraId,
                notificacao.capituloId
              );

              const usaCardSocial = notificacaoUsaCardSocial(notificacao);
              const tituloObra = obra?.titulo || "Obra não encontrada";
              const tituloCapitulo = capitulo?.titulo || "Capítulo não encontrado";
              const tituloExibicao = obterTituloExibicaoNotificacao(notificacao);
              const tituloBlocoSocial = obterTituloBlocoSocialNotificacao(notificacao);
              const textoBlocoSocial = obterTextoBlocoSocialNotificacao(notificacao);
              const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
              const autorNotificacaoHref = criarPerfilHrefNotificacao(
                notificacao.autorId || "",
                autorNotificacaoNome
              );

              const menuEstaAberto = menuNotificacaoAbertoId === notificacao.id;

              const cardVisualStyle = notificacao.lida
                ? usaCardSocial
                  ? isDesktop
                    ? desktopReadCommunityCardStyle
                    : readCommunityCardStyle
                  : isDesktop
                    ? desktopReadCardStyle
                    : readCardStyle
                : usaCardSocial
                  ? isDesktop
                    ? desktopCommunityCardStyle
                    : communityCardStyle
                  : isDesktop
                    ? desktopCardStyle
                    : cardStyle;

              const iconVisualStyle = notificacao.lida
                ? readNotificationIconStyle
                : usaCardSocial
                  ? communityNotificationIconStyle
                  : unreadNotificationIconStyle;
              const avatarVisualStyle = criarAvatarNotificacaoStyle(
                notificacao,
                iconVisualStyle
              );
              const cardSeparadorStyle: CSSProperties =
                notificacaoIndex < notificacoesFiltradas.length - 1
                  ? {}
                  : { borderBottom: "0" };

              return (
                <article
                  key={notificacao.id}
                  style={{ ...cardVisualStyle, ...cardSeparadorStyle }}
                >
                  <div style={cardHeaderStyle}>
                    {notificacao.autorId ? (
                      <Link
                        href={autorNotificacaoHref}
                        aria-label={`Abrir perfil de ${autorNotificacaoNome}`}
                        style={avatarVisualStyle}
                      >
                        {notificacao.autorAvatar?.trim()
                          ? ""
                          : obterInicialNotificacao(notificacao)}
                      </Link>
                    ) : (
                      <div style={iconVisualStyle} aria-hidden="true">
                        {obterIconeNotificacao(notificacao, notificacao.lida)}
                      </div>
                    )}

                    <div style={cardHeaderTextStyle}>
                      <div style={notificationTitleRowStyle}>
                        <h2 style={notificationTitleStyle}>
                          {tituloExibicao}
                        </h2>

                        <div style={cardMenuWrapperStyle}>
                          <button
                            type="button"
                            aria-label={`Abrir ações de ${tituloExibicao}`}
                            aria-expanded={menuEstaAberto}
                            onClick={() => alternarMenuNotificacao(notificacao.id)}
                            style={cardMenuButtonStyle}
                          >
                            ⋮
                          </button>

                                                  </div>
                      </div>

                      <span style={communityDateTextStyle}>
                        DATA: {formatarData(notificacao.criadaEm)}
                      </span>

                      {!usaCardSocial && (
                        <p style={notificationMessageStyle}>
                          {notificacao.mensagem}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    style={
                      usaCardSocial
                        ? isDesktop
                          ? desktopCommunityMetaGridStyle
                          : communityMetaGridStyle
                        : isDesktop
                          ? desktopMetaGridStyle
                          : metaGridStyle
                    }
                  >
                    {usaCardSocial ? (
                      <div
                        style={
                          notificacao.tipo === "comentario-comunidade" ||
                          notificacao.tipo === "comentario-obra" ||
                          notificacao.tipo === "comentario-capitulo" ||
                          notificacao.tipo === "comentario-diario"
                            ? communityCommentBoxStyle
                            : communityUpdateBoxStyle
                        }
                      >
                        {notificacaoTemAutorSocial(notificacao) ? (
                          notificacao.autorId ? (
                            <Link
                              href={autorNotificacaoHref}
                              style={notificationAuthorInlineLinkStyle}
                            >
                              {tituloBlocoSocial}
                            </Link>
                          ) : (
                            <span style={notificationAuthorInlineLinkStyle}>
                              {tituloBlocoSocial}
                            </span>
                          )
                        ) : (
                          <span style={communityInlineStatusStyle}>
                            <span>Atualização</span>
                            <span style={communityInlineStatusDotStyle}>•</span>
                            <span>{obterDetalheNotificacao(notificacao)}</span>
                          </span>
                        )}

                        {textoBlocoSocial.trim() ? (
                          <p style={communityCommentTextStyle}>
                            {textoBlocoSocial}
                          </p>
                        ) : null}

                        {notificacao.tipo === "solicitacao-seguidor" &&
                        notificacao.solicitacaoId ? (
                          <div style={followerRequestActionsStyle}>
                            <button
                              type="button"
                              onClick={() =>
                                void responderSolicitacaoSeguidorNotificacao(
                                  notificacao,
                                  true
                                )
                              }
                              style={
                                solicitacaoRespondendoId
                                  ? followerRequestAcceptButtonDisabledStyle
                                  : followerRequestAcceptButtonStyle
                              }
                              disabled={Boolean(solicitacaoRespondendoId)}
                            >
                              {solicitacaoRespondendoId ===
                              notificacao.solicitacaoId
                                ? "Aceitando..."
                                : "Aceitar"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void responderSolicitacaoSeguidorNotificacao(
                                  notificacao,
                                  false
                                )
                              }
                              style={
                                solicitacaoRespondendoId
                                  ? followerRequestRejectButtonDisabledStyle
                                  : followerRequestRejectButtonStyle
                              }
                              disabled={Boolean(solicitacaoRespondendoId)}
                            >
                              {solicitacaoRespondendoId ===
                              notificacao.solicitacaoId
                                ? "Recusando..."
                                : "Recusar"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div style={metaBoxStyle}>
                          <span style={metaLabelStyle}>Obra</span>
                          <strong data-historietas-i18n-ignore="true" style={metaValueStyle}>{tituloObra}</strong>
                        </div>

                        <div style={metaBoxStyle}>
                          <span style={metaLabelStyle}>Capítulo</span>
                          <strong data-historietas-i18n-ignore="true" style={metaValueStyle}>{tituloCapitulo}</strong>
                        </div>
                      </>
                    )}
                  </div>

                </article>
              );
            })}
          </section>
        )}

        {notificacaoMenuAberta && (
          <NotificacoesOverlayPortal>
            {(() => {
              const notificacao = prepararNotificacaoTexto(notificacaoMenuAberta);
              const obra = encontrarObra(notificacao.obraId);
              const ehComunidade = notificacaoEhComunidade(notificacao);
              const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
              const autorNotificacaoHref = criarPerfilHrefNotificacao(
                notificacao.autorId || "",
                autorNotificacaoNome
              );
              const linkNotificacao = montarLinkNotificacao(notificacao, obra);
              const labelAcaoPrincipal = obterAcaoPrincipalNotificacao(notificacao);

              return (
                <div
                  data-historietas-notificacoes-overlay="true"
                  style={notificationSortingBackdropStyle}
                  onClick={fecharMenuNotificacao}
                >
                  <div
                    style={isDesktop ? desktopNotificationActionsSheetStyle : notificationActionsSheetStyle}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span style={notificationSortingHandleStyle} />

                    <h2 style={notificationSortingTitleStyle}>AÇÕES DA NOTIFICAÇÃO</h2>

                    <div style={notificationSortingOptionsListStyle}>
                      <Link
                        href={linkNotificacao}
                        style={notificationActionsOptionLinkStyle}
                        onClick={() => {
                          abrirNotificacao(notificacao.id);
                          fecharMenuNotificacao();
                        }}
                      >
                        {labelAcaoPrincipal}
                      </Link>

                      {notificacao.autorId && (
                        <Link
                          href={autorNotificacaoHref}
                          style={notificationActionsOptionLinkStyle}
                          onClick={fecharMenuNotificacao}
                        >
                          Abrir perfil
                        </Link>
                      )}

                      {notificacao.tipo === "solicitacao-seguidor" &&
                      notificacao.solicitacaoId ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void responderSolicitacaoSeguidorNotificacao(
                                notificacao,
                                true
                              )
                            }
                            style={
                              solicitacaoRespondendoId
                                ? notificationActionsOptionDisabledStyle
                                : notificationActionsOptionStyle
                            }
                            disabled={Boolean(solicitacaoRespondendoId)}
                          >
                            {solicitacaoRespondendoId ===
                            notificacao.solicitacaoId
                              ? "Aceitando..."
                              : "Aceitar"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void responderSolicitacaoSeguidorNotificacao(
                                notificacao,
                                false
                              )
                            }
                            style={
                              solicitacaoRespondendoId
                                ? notificationActionsDangerOptionDisabledStyle
                                : notificationActionsDangerOptionStyle
                            }
                            disabled={Boolean(solicitacaoRespondendoId)}
                          >
                            {solicitacaoRespondendoId ===
                            notificacao.solicitacaoId
                              ? "Recusando..."
                              : "Recusar"}
                          </button>
                        </>
                      ) : null}

                      {notificacao.lida ? (
                        <button
                          type="button"
                          onClick={() => {
                            marcarComoNaoLida(notificacao.id);
                            fecharMenuNotificacao();
                          }}
                          style={notificationActionsOptionStyle}
                        >
                          Marcar como nova
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            marcarComoLida(notificacao.id);
                            fecharMenuNotificacao();
                          }}
                          style={notificationActionsOptionStyle}
                        >
                          Marcar como lida
                        </button>
                      )}

                      {obra && !ehComunidade && (
                        <Link
                          href={`/obra/${obra.slug || criarSlugBase(obra.titulo)}`}
                          style={notificationActionsOptionLinkStyle}
                          onClick={fecharMenuNotificacao}
                        >
                          Abrir obra
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          apagarNotificacao(notificacao.id);
                          fecharMenuNotificacao();
                        }}
                        style={notificationActionsDangerOptionStyle}
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </NotificacoesOverlayPortal>
        )}
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};


const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
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
  opacity: 0,
};

const loadingPageStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-notificacoes-bg-page, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "8px 0 calc(14px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};






const notificacoesTopFilterBoxStyle: CSSProperties = {
  marginTop: "0",
  display: "grid",
  gap: "3px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "3px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopTitleHeaderStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  marginBottom: "18px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "24px",
  minWidth: 0,
  boxSizing: "border-box",
};

const desktopNotificationsTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const desktopNotificationsTopActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  minWidth: 0,
};

const desktopNotificationsSearchShellStyle: CSSProperties = {
  position: "relative",
  width: "min(390px, 34vw)",
  minWidth: "230px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopNotificationsSearchIconStyle: CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.56)",
  pointerEvents: "none",
};

const desktopNotificationsSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  padding: "0 14px 0 42px",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  boxSizing: "border-box",
};

const desktopNotificationsFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "42px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const mobileSearchToggleStyle: CSSProperties = {
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

const notificacoesHeaderFilterButtonStyle: CSSProperties = {
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
  minWidth: "max-content",
  maxWidth: "none",
  flex: "0 0 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  whiteSpace: "nowrap",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};


const notificacoesHeaderFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};























const notificationsControlsStyle: CSSProperties = {
  position: "relative",
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  padding: "0",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const desktopNotificationsControlsStyle: CSSProperties = {
  ...notificationsControlsStyle,
  maxWidth: "760px",
  marginLeft: "auto",
  marginRight: "auto",
};

const notificationSearchShellStyle: CSSProperties = {
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


const notificationSearchInputStyle: CSSProperties = {
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

const notificationClearButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  justifySelf: "center",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(244,244,245,0.88)",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  padding: "0 13px",
  cursor: "pointer",
  boxShadow: "none",
};

const notificationSortingBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 2147483646,
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

const notificationSortingSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 2147483647,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: 0,
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-bg-start, var(--historietas-notificacoes-bg-page, #000000))",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const desktopNotificationSortingSheetStyle: CSSProperties = {
  ...notificationSortingSheetStyle,
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

const notificationSortingHandleStyle: CSSProperties = {
  display: "block",
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const notificationSortingTitleStyle: CSSProperties = {
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

const notificationSortingOptionsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const notificationSortingSectionLabelStyle: CSSProperties = {
  margin: 0,
  display: "block",
  padding: "11px 30px 5px",
  borderTop: "none",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const notificationSortingOptionStyle: CSSProperties = {
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

const notificationSortingOptionActiveStyle: CSSProperties = {
  ...notificationSortingOptionStyle,
  fontWeight: 900,
};

const notificationSortingOptionRadioStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 900,
};

const notificationSortingOptionRadioActiveStyle: CSSProperties = {
  ...notificationSortingOptionRadioStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

const notificationActionsSheetStyle: CSSProperties = {
  ...notificationSortingSheetStyle,
  maxHeight: "calc(100dvh - 116px)",
};

const desktopNotificationActionsSheetStyle: CSSProperties = {
  ...desktopNotificationSortingSheetStyle,
  maxHeight: "82vh",
};

const notificationActionsOptionStyle: CSSProperties = {
  ...notificationSortingOptionStyle,
  justifyContent: "flex-start",
  fontWeight: 900,
};

const notificationActionsOptionLinkStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  textDecoration: "none",
};

const notificationActionsOptionDisabledStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const notificationActionsDangerOptionStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  color: "var(--historietas-notificacoes-danger-text, #FFFFFF)",
};

const notificationActionsDangerOptionDisabledStyle: CSSProperties = {
  ...notificationActionsDangerOptionStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};






















const listStyle: CSSProperties = {
  marginTop: "9px",
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
};

const cardStyle: CSSProperties = {
  position: "relative",
  borderRadius: 0,
  padding: "8px 0",
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const readCardStyle: CSSProperties = {
  ...cardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.78,
  boxShadow: "none",
};

const communityCardStyle: CSSProperties = {
  ...cardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
};

const readCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.78,
  boxShadow: "none",
};

const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const notificationIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-notificacoes-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  fontWeight: 950,
  lineHeight: 1,
  textDecoration: "none",
  boxShadow: "none",
  flex: "0 0 auto",
  transform: "translateY(-2px)",
};

const unreadNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-danger-surface, rgba(127,29,29,0.24))",
  border: "1px solid var(--historietas-notificacoes-danger-strong, rgba(248,113,113,0.36))",
  color: "#FFFFFF",
  boxShadow: "none",
};

const readNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-success-bg, rgba(34,197,94,0.12))",
  border: "1px solid var(--historietas-notificacoes-success-border, rgba(34,197,94,0.18))",
  color: "#FFFFFF",
  boxShadow: "none",
};

const communityNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
};

const cardHeaderTextStyle: CSSProperties = {
  display: "grid",
  gap: "1px",
  paddingTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
  justifyItems: "stretch",
};





const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const notificationTitleRowStyle: CSSProperties = {
  position: "relative",
  display: "block",
  paddingRight: "28px",
  minWidth: 0,
  maxWidth: "100%",
};

const cardMenuWrapperStyle: CSSProperties = {
  position: "absolute",
  top: "-3px",
  right: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  minWidth: 0,
  zIndex: 20,
};

const cardMenuButtonStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent",
};








const communityDateTextStyle: CSSProperties = {
  display: "block",
  width: "100%",
  margin: "0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9.5px",
  lineHeight: 1.12,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

const notificationMessageStyle: CSSProperties = {
  width: "100%",
  margin: "1px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.28,
  fontWeight: 700,
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 0,
  marginTop: "3px",
  minWidth: 0,
  maxWidth: "100%",
};

const communityMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
};

const metaBoxStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  borderRadius: 0,
  padding: "4px 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const metaLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

const notificationAuthorInlineLinkStyle: CSSProperties = {
  ...metaLabelStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

const metaValueStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const communityCommentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  borderRadius: 0,
  padding: "4px 0 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

const communityUpdateBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "4px 0 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

const communityInlineStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.2,
  textAlign: "left",
  whiteSpace: "nowrap",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const communityInlineStatusDotStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "10px",
  lineHeight: 1,
  flex: "0 0 auto",
};

const communityCommentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 720,
  textAlign: "left",
  ...safeTextStyle,
};

const followerRequestActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "8px",
  minWidth: 0,
};

const followerRequestAcceptButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "var(--historietas-accent, #A1A1AA)",
  color: "#000000",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  padding: "0 12px",
  boxSizing: "border-box",
};

const followerRequestRejectButtonStyle: CSSProperties = {
  ...followerRequestAcceptButtonStyle,
  background: "transparent",
  color: "var(--historietas-notificacoes-danger-text, #FFFFFF)",
};

const followerRequestAcceptButtonDisabledStyle: CSSProperties = {
  ...followerRequestAcceptButtonStyle,
  opacity: 0.5,
  cursor: "not-allowed",
};

const followerRequestRejectButtonDisabledStyle: CSSProperties = {
  ...followerRequestRejectButtonStyle,
  opacity: 0.5,
  cursor: "not-allowed",
};





const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "34px 0 64px",
};












const desktopListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  columnGap: "16px",
  rowGap: "16px",
  alignItems: "start",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  boxShadow: "none",
};

const desktopReadCardStyle: CSSProperties = {
  ...readCardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.018)",
  boxShadow: "none",
};

const desktopCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  boxShadow: "none",
};

const desktopReadCommunityCardStyle: CSSProperties = {
  ...readCommunityCardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.018)",
  boxShadow: "none",
};

const desktopMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
};

const desktopCommunityMetaGridStyle: CSSProperties = {
  ...communityMetaGridStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
};
