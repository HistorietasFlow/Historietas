"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase/client";
import { formatarData, normalizarTexto } from "../../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useNotificacoes } from "../../../components/NotificacoesProvider";

type TipoAlvoDenuncia = "post" | "comentario";

type StatusDenuncia =
  | "pendente"
  | "em_analise"
  | "resolvida"
  | "rejeitada";

type StatusFiltroDenuncia = StatusDenuncia | "todas" | "arquivadas";

type DenunciaComunidade = {
  id: string;
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
  denuncianteId: string;
  motivo: string;
  detalhe: string;
  status: StatusDenuncia;
  arquivada: boolean;
  observacaoAdmin: string;
  analisadoPor: string | null;
  analisadoEm: string | null;
  criadoEm: string;
};

type PostDenunciado = {
  id: string;
  autor_nome: string;
  categoria: string;
  tipo_publicacao: string | null;
  tem_spoiler: boolean | null;
  texto: string;
  obra_relacionada: string | null;
  criado_em: string;
};

type ComentarioDenunciado = {
  id: string;
  post_id: string;
  autor_nome: string;
  texto: string;
  criado_em: string;
};

type PerfilModeracao = {
  id?: string | null;
  user_id?: string | null;
  nome: string | null;
};

type DenunciaComContexto = DenunciaComunidade & {
  denuncianteNome: string;
  alvoResumo: string;
  alvoAutor: string;
  alvoData: string;
  alvoPostId: string;
  alvoCategoria?: string;
  alvoTipoPublicacao?: string;
  alvoTemSpoiler?: boolean;
  alvoObra?: string;
};

const STATUS_DENUNCIAS: StatusDenuncia[] = [
  "pendente",
  "em_analise",
  "resolvida",
  "rejeitada",
];

const STATUS_LABEL: Record<StatusDenuncia, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  resolvida: "Resolvida",
  rejeitada: "Rejeitada",
};

const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";

function criarStorageKeyUsuarioAdminComunidade(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioAdminComunidade(chave: string, userId = "") {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(
      criarStorageKeyUsuarioAdminComunidade(chave, userId)
    );
  } catch {
    return null;
  }
}

function contarNotificacoesNaoLidasLocaisAdminComunidade(userId = "") {
  try {
    const notificacoesTexto = lerStorageUsuarioAdminComunidade(
      NOTIFICATIONS_STORAGE_KEY,
      userId
    );
    const notificacoesJson: unknown = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    if (!Array.isArray(notificacoesJson)) {
      return 0;
    }

    return notificacoesJson.filter((notificacao) => {
      if (
        !notificacao ||
        typeof notificacao !== "object" ||
        Array.isArray(notificacao)
      ) {
        return false;
      }

      return !(notificacao as { lida?: unknown }).lida;
    }).length;
  } catch {
    return 0;
  }
}

async function contarNotificacoesNaoLidasSupabaseAdminComunidade(
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("notificacoes")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userIdLimpo)
      .eq("lida", false);

    if (error) {
      return 0;
    }

    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

function criarLoginHrefAdminModeracao() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/admin";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function normalizarStatus(valor: unknown): StatusDenuncia {
  return STATUS_DENUNCIAS.includes(valor as StatusDenuncia)
    ? (valor as StatusDenuncia)
    : "pendente";
}

function normalizarTipoAlvo(valor: unknown): TipoAlvoDenuncia {
  return valor === "comentario" ? "comentario" : "post";
}


function conteudoDenunciadoIndisponivel(denuncia: DenunciaComContexto) {
  const resumo = normalizarTexto(denuncia.alvoResumo);

  return (
    resumo.includes("conteudo removido pela moderacao") ||
    resumo.includes("publicacao nao encontrada ou removida") ||
    resumo.includes("comentario nao encontrado ou removido") ||
    resumo.includes("nao encontrada ou removida")
  );
}

function criarMensagemErro(acao: string, erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return `${acao}: erro desconhecido.`;
  }

  const supabaseErro = erro as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  const detalhes = [
    supabaseErro.message,
    supabaseErro.code ? `código ${supabaseErro.code}` : "",
    supabaseErro.details,
    supabaseErro.hint,
  ]
    .filter(Boolean)
    .join(" · ");

  return detalhes ? `${acao}: ${detalhes}` : `${acao}: erro desconhecido.`;
}

function obterNomePerfilModeracao(perfil: PerfilModeracao) {
  return typeof perfil.nome === "string" && perfil.nome.trim()
    ? perfil.nome.trim()
    : "Usuário sem nome";
}

function criarMapaNomesPerfisModeracao(perfis: PerfilModeracao[]) {
  const mapa = new Map<string, string>();

  perfis.forEach((perfil) => {
    const nome = obterNomePerfilModeracao(perfil);
    const userId = perfil.user_id?.trim() || "";
    const id = perfil.id?.trim() || "";

    if (userId) {
      mapa.set(userId, nome);
    }

    if (id) {
      mapa.set(id, nome);
    }
  });

  return mapa;
}

function erroOpcionalIgnoravel(erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return false;
  }

  const supabaseErro = erro as { code?: string; message?: string };
  const codigo = supabaseErro.code || "";
  const mensagem = (supabaseErro.message || "").toLowerCase();

  return (
    codigo === "42P01" ||
    codigo === "42703" ||
    mensagem.includes("does not exist") ||
    mensagem.includes("schema cache") ||
    mensagem.includes("could not find")
  );
}

async function apagarRegistrosOpcionais(
  tabela: string,
  campo: string,
  valor: string
) {
  if (!valor.trim()) {
    return;
  }

  try {
    const { error } = await supabase.from(tabela).delete().eq(campo, valor);

    if (error && !erroOpcionalIgnoravel(error)) {
      console.warn(`Não consegui limpar ${tabela}:`, error.message);
    }
  } catch {
    // Tabelas auxiliares podem não existir em algumas versões do banco.
  }
}

async function apagarRegistrosOpcionaisEmLista(
  tabela: string,
  campo: string,
  valores: string[]
) {
  const valoresValidos = valores.filter((valor) => valor.trim());

  if (valoresValidos.length === 0) {
    return;
  }

  try {
    const { error } = await supabase.from(tabela).delete().in(campo, valoresValidos);

    if (error && !erroOpcionalIgnoravel(error)) {
      console.warn(`Não consegui limpar ${tabela}:`, error.message);
    }
  } catch {
    // Tabelas auxiliares podem não existir em algumas versões do banco.
  }
}

async function buscarIdsComentariosDoPost(postId: string) {
  const postIdLimpo = postId.trim();

  if (!postIdLimpo) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from("comunidade_comentarios")
      .select("id")
      .eq("post_id", postIdLimpo)
      .limit(1000);

    if (error) {
      return [] as string[];
    }

    return (data || [])
      .map((comentario) => String(comentario.id || ""))
      .filter(Boolean);
  } catch {
    return [] as string[];
  }
}

async function removerDependenciasConteudoComunidade(
  denuncia: Pick<DenunciaComContexto, "alvoTipo" | "alvoId">
) {
  const alvoId = denuncia.alvoId.trim();

  if (!alvoId) {
    return;
  }

  if (denuncia.alvoTipo === "comentario") {
    await apagarRegistrosOpcionais(
      "comunidade_comentario_curtidas",
      "comentario_id",
      alvoId
    );
    await apagarRegistrosOpcionais(
      "comunidade_comentarios_salvos",
      "comentario_id",
      alvoId
    );
    return;
  }

  const comentariosDoPost = await buscarIdsComentariosDoPost(alvoId);

  await apagarRegistrosOpcionais("comunidade_post_curtidas", "post_id", alvoId);
  await apagarRegistrosOpcionais("comunidade_post_salvos", "post_id", alvoId);
  await apagarRegistrosOpcionais("comunidade_salvos", "post_id", alvoId);

  if (comentariosDoPost.length > 0) {
    await apagarRegistrosOpcionaisEmLista(
      "comunidade_comentario_curtidas",
      "comentario_id",
      comentariosDoPost
    );
    await apagarRegistrosOpcionaisEmLista(
      "comunidade_comentarios_salvos",
      "comentario_id",
      comentariosDoPost
    );
  }

  await apagarRegistrosOpcionais("comunidade_comentarios", "post_id", alvoId);
}


export default function AdminComunidadePage() {
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [denuncias, setDenuncias] = useState<DenunciaComContexto[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroDenuncia>(
    "todas"
  );
  const [busca, setBusca] = useState("");
  const [buscaModeracaoAberta, setBuscaModeracaoAberta] = useState(false);
  const [mostrarFiltrosModeracao, setMostrarFiltrosModeracao] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [menuDenunciaAbertoId, setMenuDenunciaAbertoId] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();


  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);


  async function carregarDenuncias() {
    setErro("");

    const { data: denunciasResposta, error: denunciasErro } = await supabase
      .from("comunidade_denuncias")
      .select(
        "id, alvo_tipo, alvo_id, denunciante_id, motivo, detalhe, status, arquivada, observacao_admin, analisado_por, analisado_em, criado_em"
      )
      .order("criado_em", { ascending: false })
      .limit(200);

    if (denunciasErro) {
      throw denunciasErro;
    }

    const denunciasMapeadas: DenunciaComunidade[] = (
      (denunciasResposta || []) as unknown as Record<string, unknown>[]
    ).map((denuncia) => ({
      id: String(denuncia.id),
      alvoTipo: normalizarTipoAlvo(denuncia.alvo_tipo),
      alvoId: String(denuncia.alvo_id),
      denuncianteId: String(denuncia.denunciante_id),
      motivo: String(denuncia.motivo || "Conteúdo inadequado"),
      detalhe: String(denuncia.detalhe || ""),
      status: normalizarStatus(denuncia.status),
      arquivada: Boolean(denuncia.arquivada),
      observacaoAdmin: String(denuncia.observacao_admin || ""),
      analisadoPor: denuncia.analisado_por
        ? String(denuncia.analisado_por)
        : null,
      analisadoEm: denuncia.analisado_em ? String(denuncia.analisado_em) : null,
      criadoEm: String(denuncia.criado_em),
    }));

    const denuncianteIds = Array.from(
      new Set(denunciasMapeadas.map((denuncia) => denuncia.denuncianteId))
    );

    const postIds = denunciasMapeadas
      .filter((denuncia) => denuncia.alvoTipo === "post")
      .map((denuncia) => denuncia.alvoId);

    const comentarioIds = denunciasMapeadas
      .filter((denuncia) => denuncia.alvoTipo === "comentario")
      .map((denuncia) => denuncia.alvoId);

    const [
      perfisPorUserIdResposta,
      perfisPorIdResposta,
      postsResposta,
      comentariosResposta,
    ] = await Promise.all([
      denuncianteIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, user_id, nome")
            .in("user_id", denuncianteIds)
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
      denuncianteIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, user_id, nome")
            .in("id", denuncianteIds)
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
      postIds.length > 0
        ? supabase
            .from("comunidade_posts")
            .select(
              "id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em"
            )
            .in("id", postIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      comentarioIds.length > 0
        ? supabase
            .from("comunidade_comentarios")
            .select("id, post_id, autor_nome, texto, criado_em")
            .in("id", comentarioIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const perfis = [
      ...(perfisPorUserIdResposta.error
        ? []
        : ((perfisPorUserIdResposta.data || []) as unknown as PerfilModeracao[])),
      ...(perfisPorIdResposta.error
        ? []
        : ((perfisPorIdResposta.data || []) as unknown as PerfilModeracao[])),
    ];

    const posts = postsResposta.error
      ? []
      : ((postsResposta.data || []) as unknown as PostDenunciado[]);

    const comentarios = comentariosResposta.error
      ? []
      : ((comentariosResposta.data || []) as unknown as ComentarioDenunciado[]);

    const perfisPorId = criarMapaNomesPerfisModeracao(perfis);

    const postsPorId = new Map(posts.map((post) => [post.id, post]));
    const comentariosPorId = new Map(
      comentarios.map((comentario) => [comentario.id, comentario])
    );

    const denunciasComContexto = denunciasMapeadas.map((denuncia) => {
      if (denuncia.alvoTipo === "post") {
        const post = postsPorId.get(denuncia.alvoId);

        return {
          ...denuncia,
          denuncianteNome:
            perfisPorId.get(denuncia.denuncianteId) || "Usuário",
          alvoResumo: post?.texto || "Publicação não encontrada ou removida.",
          alvoAutor: post?.autor_nome || "Autor não encontrado",
          alvoData: post?.criado_em || "",
          alvoPostId: post?.id || denuncia.alvoId,
          alvoCategoria: post?.categoria || "",
          alvoTipoPublicacao: post?.tipo_publicacao || "Discussão",
          alvoTemSpoiler: Boolean(post?.tem_spoiler),
          alvoObra: post?.obra_relacionada || "",
        };
      }

      const comentario = comentariosPorId.get(denuncia.alvoId);

      return {
        ...denuncia,
        denuncianteNome: perfisPorId.get(denuncia.denuncianteId) || "Usuário",
        alvoResumo:
          comentario?.texto || "Comentário não encontrado ou removido.",
        alvoAutor: comentario?.autor_nome || "Autor não encontrado",
        alvoData: comentario?.criado_em || "",
        alvoPostId: comentario?.post_id || "",
      };
    });

    setDenuncias(denunciasComContexto);
    setObservacoes((observacoesAtuais) => {
      const proximasObservacoes = { ...observacoesAtuais };

      denunciasComContexto.forEach((denuncia) => {
        if (!(denuncia.id in proximasObservacoes)) {
          proximasObservacoes[denuncia.id] = denuncia.observacaoAdmin;
        }
      });

      return proximasObservacoes;
    });
  }


  useEffect(() => {
    let cancelado = false;

    async function iniciarModeracao() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { data: usuarioResposta, error: usuarioErro } =
          await supabase.auth.getUser();

        if (usuarioErro) {
          throw usuarioErro;
        }

        const user = usuarioResposta.user || null;

        if (!user) {
          if (!cancelado) {
            setUsuarioId("");
            setEhAdmin(false);
            setDenuncias([]);
            router.replace(criarLoginHrefAdminModeracao());
          }

          return;
        }

        const { data: adminResposta, error: adminErro } =
          await supabase.rpc("usuario_e_admin");

        if (adminErro) {
          throw adminErro;
        }

        const adminConfirmado = adminResposta === true;

        if (!cancelado) {
          setUsuarioId(user.id);
          setEhAdmin(adminConfirmado);
        }

        if (adminConfirmado) {
          await carregarDenuncias();
        }
      } catch (error) {
        if (!cancelado) {
          setErro(criarMensagemErro("Erro ao carregar moderação", error));
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    iniciarModeracao();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const denunciasAtivas = useMemo(() => {
    return denuncias.filter((denuncia) => !denuncia.arquivada);
  }, [denuncias]);

  const denunciasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return denuncias.filter((denuncia) => {
      const arquivada = denuncia.arquivada;

      if (statusFiltro === "arquivadas") {
        if (!arquivada) {
          return false;
        }
      } else {
        if (arquivada) {
          return false;
        }

        const statusCombina =
          statusFiltro === "todas" || denuncia.status === statusFiltro;

        if (!statusCombina) {
          return false;
        }
      }

      if (!buscaNormalizada) {
        return true;
      }

      const conteudoBusca = normalizarTexto(
        [
          denuncia.motivo,
          denuncia.detalhe,
          denuncia.status,
          denuncia.denuncianteNome,
          denuncia.alvoTipo,
          denuncia.alvoResumo,
          denuncia.alvoAutor,
          denuncia.alvoPostId,
          denuncia.alvoCategoria || "",
          denuncia.alvoTipoPublicacao || "",
          denuncia.alvoTemSpoiler ? "spoiler contem spoiler" : "",
          denuncia.alvoObra || "",
          arquivada ? "arquivada ocultada painel" : "",
        ].join(" ")
      );

      return conteudoBusca.includes(buscaNormalizada);
    });
  }, [busca, denuncias, statusFiltro]);

  useEffect(() => {
    const fecharMenuTimer = window.setTimeout(() => {
      setMenuDenunciaAbertoId("");
    }, 0);

    return () => {
      window.clearTimeout(fecharMenuTimer);
    };
  }, [busca, statusFiltro]);

  const totalPendentes = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "pendente"
  ).length;

  const totalEmAnalise = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "em_analise"
  ).length;

  const totalResolvidas = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "resolvida"
  ).length;

  const totalRejeitadas = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "rejeitada"
  ).length;

  async function atualizarStatusDenuncia(
    denunciaId: string,
    novoStatus: StatusDenuncia
  ) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem atualizar denúncias.");
      return;
    }

    const chaveAcao = `${denunciaId}-${novoStatus}`;

    if (acaoEmAndamento) {
      return;
    }

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    const observacaoAtual = observacoes[denunciaId]?.trim() || "";
    const analisadoEm = new Date().toISOString();

    try {
      const { error } = await supabase
        .from("comunidade_denuncias")
        .update({
          status: novoStatus,
          observacao_admin: observacaoAtual.slice(0, 800),
          analisado_por: usuarioId,
          analisado_em: analisadoEm,
        })
        .eq("id", denunciaId);

      if (error) {
        throw error;
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                status: novoStatus,
                observacaoAdmin: observacaoAtual.slice(0, 800),
                analisadoPor: usuarioId,
                analisadoEm,
              }
            : denuncia
        )
      );

      setSucesso(`Denúncia marcada como ${STATUS_LABEL[novoStatus].toLowerCase()}.`);
    } catch (error) {
      setErro(criarMensagemErro("Erro ao atualizar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerConteudoDenunciado(denuncia: DenunciaComContexto) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover conteúdo denunciado.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const tipoConteudo =
      denuncia.alvoTipo === "post" ? "publicação" : "comentário";

    if (
      !window.confirm(
        `Remover esta ${tipoConteudo} denunciada? Essa ação apaga o conteúdo da Comunidade.`
      )
    ) {
      return;
    }

    const chaveAcao = `${denuncia.id}-remover-conteudo`;
    const observacaoAtual = observacoes[denuncia.id]?.trim() || "";
    const observacaoFinal =
      observacaoAtual ||
      `Conteúdo removido pela moderação em ${new Date().toLocaleDateString(
        "pt-BR"
      )}.`;
    const analisadoEm = new Date().toISOString();

    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      await removerDependenciasConteudoComunidade(denuncia);

      const resultadoRemocao =
        denuncia.alvoTipo === "post"
          ? await supabase.from("comunidade_posts").delete().eq("id", denuncia.alvoId)
          : await supabase
              .from("comunidade_comentarios")
              .delete()
              .eq("id", denuncia.alvoId);

      if (resultadoRemocao.error) {
        throw resultadoRemocao.error;
      }

      const { error: erroAtualizacao } = await supabase
        .from("comunidade_denuncias")
        .update({
          status: "resolvida",
          observacao_admin: observacaoFinal.slice(0, 800),
          analisado_por: usuarioId,
          analisado_em: analisadoEm,
        })
        .eq("alvo_tipo", denuncia.alvoTipo)
        .eq("alvo_id", denuncia.alvoId);

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover conteúdo denunciado", error));
      setAcaoEmAndamento("");
      return;
    }

    setDenuncias((denunciasAtuais) =>
      denunciasAtuais.map((denunciaAtual) =>
        denunciaAtual.alvoTipo === denuncia.alvoTipo &&
        denunciaAtual.alvoId === denuncia.alvoId
          ? {
              ...denunciaAtual,
              status: "resolvida",
              observacaoAdmin: observacaoFinal.slice(0, 800),
              analisadoPor: usuarioId,
              analisadoEm,
              alvoResumo: `Conteúdo removido pela moderação. Registro anterior: ${denunciaAtual.alvoResumo}`,
            }
          : denunciaAtual
      )
    );

    setObservacoes((observacoesAtuais) => ({
      ...observacoesAtuais,
      [denuncia.id]: observacaoFinal.slice(0, 800),
    }));

    setSucesso(
      `${
        denuncia.alvoTipo === "post" ? "Publicação removida" : "Comentário removido"
      } e denúncia marcada como resolvida.`
    );
    setAcaoEmAndamento("");
  }

  async function arquivarDenuncia(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem arquivar denúncias.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const chaveAcao = `${denunciaId}-arquivar`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase
        .from("comunidade_denuncias")
        .update({ arquivada: true })
        .eq("id", denunciaId);

      if (error) {
        throw error;
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                arquivada: true,
              }
            : denuncia
        )
      );

      setSucesso("Denúncia arquivada e ocultada do painel principal.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao arquivar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function restaurarDenunciaArquivada(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem restaurar denúncias.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const chaveAcao = `${denunciaId}-restaurar`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase
        .from("comunidade_denuncias")
        .update({ arquivada: false })
        .eq("id", denunciaId);

      if (error) {
        throw error;
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.map((denuncia) =>
          denuncia.id === denunciaId
            ? {
                ...denuncia,
                arquivada: false,
              }
            : denuncia
        )
      );

      setSucesso("Denúncia restaurada para o painel principal.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao restaurar denúncia", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  async function removerDenunciaResolvida(denunciaId: string) {
    if (!usuarioId || !ehAdmin) {
      setErro("Apenas moderadores podem remover denúncias resolvidas.");
      return;
    }

    if (acaoEmAndamento) {
      return;
    }

    const denuncia = denuncias.find((item) => item.id === denunciaId);

    if (!denuncia || denuncia.status !== "resolvida") {
      setErro("Somente denúncias resolvidas podem ser removidas do painel.");
      return;
    }

    const chaveAcao = `${denunciaId}-remover-denuncia`;

    setMenuDenunciaAbertoId("");
    setAcaoEmAndamento(chaveAcao);
    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase
        .from("comunidade_denuncias")
        .delete()
        .eq("id", denunciaId)
        .eq("status", "resolvida");

      if (error) {
        throw error;
      }

      setDenuncias((denunciasAtuais) =>
        denunciasAtuais.filter((denunciaAtual) => denunciaAtual.id !== denunciaId)
      );
      setObservacoes((observacoesAtuais) => {
        const proximasObservacoes = { ...observacoesAtuais };
        delete proximasObservacoes[denunciaId];
        return proximasObservacoes;
      });
      setSucesso("Denúncia resolvida removida do painel.");
    } catch (error) {
      setErro(criarMensagemErro("Erro ao remover denúncia resolvida", error));
    } finally {
      setAcaoEmAndamento("");
    }
  }

  function limparFiltros() {
    setStatusFiltro("todas");
    setBusca("");
    setBuscaModeracaoAberta(false);
    setMostrarFiltrosModeracao(false);
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={loadingCardStyle}>
            <strong style={loadingTitleStyle}>Abrindo moderação...</strong>
            <span style={loadingTextStyle}>
              Conferindo permissão de moderação e denúncias da Comunidade.
            </span>
          </div>
        </section>
      </main>
    );
  }

  if (!usuarioId) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={accessCardStyle}>
            <span style={miniTitleStyle}>ÁREA RESTRITA</span>
            <h1 style={titleStyle}>Moderação da Comunidade</h1>
            <p style={descriptionStyle}>
              Entre com uma conta com permissão de moderação para revisar denúncias.
            </p>

            {erro && <span style={errorStyle}>{erro}</span>}

            <Link href={criarLoginHrefAdminModeracao()} style={primaryLinkStyle}>
              Entrar
            </Link>
          </section>
        </section>
      </main>
    );
  }

  if (!ehAdmin) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={accessCardStyle}>
            <span style={miniTitleStyle}>ACESSO NEGADO</span>
            <h1 style={titleStyle}>Acesso de moderação necessário</h1>
            <p style={descriptionStyle}>
              Esta área exibe denúncias da Comunidade e só pode ser acessada por
              contas com permissão de moderação.
            </p>

            {erro && <span style={errorStyle}>{erro}</span>}

            <Link href="/comunidade" style={secondaryLinkStyle}>
              Voltar para Comunidade
            </Link>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopTitleHomeLinkStyle : titleHomeLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopPageTitleTextStyle : pageTitleTextStyle}
            >
              MODERAÇÃO
            </span>
          </Link>

          <button
            type="button"
            aria-label={buscaModeracaoAberta ? "Fechar busca" : "Abrir busca"}
            aria-expanded={buscaModeracaoAberta || Boolean(busca.trim())}
            onClick={() => setBuscaModeracaoAberta((aberta) => !aberta)}
            style={titleSearchButtonStyle}
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

          {isDesktop ? (
            <Link
              href="/notificacoes"
              style={desktopNotificationButtonStyle}
              aria-label={
                notificacoesNaoLidas > 0
                  ? `Notificações: ${notificacoesNaoLidas} não lidas`
                  : "Notificações"
              }
            >
              N

              {notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}
        </header>

        <section style={toolsStyle}>
          {(buscaModeracaoAberta || busca.trim()) && (
            <label style={adminSearchShellStyle}>
              <span style={adminSearchIconStyle}>
                <svg
                  width="20"
                  height="20"
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
              </span>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar denúncias..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={100}
                style={adminSearchInputStyle}
              />
            </label>
          )}

          <div style={adminFilterControlsRowStyle}>
            <button
              type="button"
              onClick={() => setMostrarFiltrosModeracao(true)}
              style={adminFilterLabelButtonStyle}
            >
              <span>Filtrar e ordenar</span>
              <span style={adminFilterActionIconStyle}>⇅</span>
            </button>
          </div>

          <section className="admin-comunidade-stats" style={statsGridStyle}>
            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{denunciasAtivas.length}</strong>
              <span style={statLabelStyle}>total</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalPendentes}</strong>
              <span style={statLabelStyle}>pendentes</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalEmAnalise}</strong>
              <span style={statLabelStyle}>em análise</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalResolvidas}</strong>
              <span style={statLabelStyle}>resolvidas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalRejeitadas}</strong>
              <span style={statLabelStyle}>rejeitadas</span>
            </div>
          </section>

          <div style={statusFilterWrapStyle}>
            <div className="admin-comunidade-filter-buttons" style={filterButtonsStyle}>
              {(["todas", ...STATUS_DENUNCIAS, "arquivadas"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFiltro(status)}
                  style={
                    statusFiltro === status
                      ? activeFilterButtonStyle
                      : filterButtonStyle
                  }
                >
                  {status === "todas"
                    ? "Todas"
                    : status === "arquivadas"
                      ? "Arquivadas"
                      : STATUS_LABEL[status]}
                </button>
              ))}
            </div>

            {(busca || statusFiltro !== "todas") && (
              <button type="button" onClick={limparFiltros} style={clearButtonStyle}>
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        {mostrarFiltrosModeracao && (
          <section
            style={adminFiltersSheetOverlayStyle}
            aria-label="Filtrar denúncias"
          >
            <button
              type="button"
              aria-label="Fechar filtros"
              onClick={() => setMostrarFiltrosModeracao(false)}
              style={adminFiltersSheetBackdropStyle}
            />

            <article style={adminFiltersSheetStyle}>
              <div style={adminFiltersSheetHandleStyle} />

              <strong style={adminFiltersSheetTitleStyle}>
                Filtrar e ordenar
              </strong>

              <span style={adminFiltersSheetSectionLabelStyle}>Status</span>

              {(["todas", ...STATUS_DENUNCIAS, "arquivadas"] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFiltro(status);
                      setMostrarFiltrosModeracao(false);
                    }}
                    style={
                      statusFiltro === status
                        ? adminFiltersSheetOptionActiveStyle
                        : adminFiltersSheetOptionStyle
                    }
                  >
                    <span>
                      {status === "todas"
                        ? "Todas"
                        : status === "arquivadas"
                          ? "Arquivadas"
                          : STATUS_LABEL[status]}
                    </span>

                    <span
                      style={
                        statusFiltro === status
                          ? adminFiltersSheetRadioActiveStyle
                          : adminFiltersSheetRadioStyle
                      }
                    />
                  </button>
                )
              )}

              {(busca || statusFiltro !== "todas") && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  style={adminFiltersSheetClearButtonStyle}
                >
                  Limpar filtros
                </button>
              )}
            </article>
          </section>
        )}

        {(erro || sucesso) && (
          <section style={feedbackWrapStyle}>
            {erro && <span style={errorStyle}>{erro}</span>}
            {sucesso && <span style={successStyle}>{sucesso}</span>}
          </section>
        )}

        <section style={summaryStyle}>
          <strong style={summaryTitleStyle}>
            {denunciasFiltradas.length === 1
              ? "1 denúncia encontrada"
              : `${denunciasFiltradas.length} denúncias encontradas`}
          </strong>
        </section>

        <section style={listStyle}>
          {denunciasFiltradas.length > 0 ? (
            denunciasFiltradas.map((denuncia) => {
              const acaoAtiva = acaoEmAndamento.startsWith(denuncia.id);
              const observacao = observacoes[denuncia.id] || "";
              const menuAberto = menuDenunciaAbertoId === denuncia.id;
              const denunciaArquivada = denuncia.arquivada;
              const conteudoIndisponivel =
                conteudoDenunciadoIndisponivel(denuncia);
              const denunciaResolvidaComConteudoIndisponivel =
                denuncia.status === "resolvida" && conteudoIndisponivel;

              return (
                <article key={denuncia.id} style={reportCardStyle}>
                  <div className="admin-comunidade-report-header" style={reportHeaderStyle}>
                    <div style={reportTitleWrapStyle}>
                      <div style={reportMetaLineStyle}>
                        <span
                          style={{
                            ...targetBadgeStyle,
                            ...(denuncia.alvoTipo === "post"
                              ? postTargetBadgeStyle
                              : commentTargetBadgeStyle),
                          }}
                        >
                          {denuncia.alvoTipo === "post" ? "Publicação" : "Comentário"}
                        </span>

                        <span style={reportDotStyle}>•</span>

                        <span style={reportDateStyle}>
                          Denunciado em {formatarData(denuncia.criadoEm)}
                        </span>

                        <span style={reportDotStyle}>•</span>

                        <span style={statusInlineStyle}>
                          {STATUS_LABEL[denuncia.status]}
                        </span>

                        {denunciaArquivada && (
                          <>
                            <span style={reportDotStyle}>•</span>
                            <span style={archivedInlineStyle}>Arquivada</span>
                          </>
                        )}
                      </div>

                      <strong style={reportTitleStyle}>{denuncia.motivo}</strong>
                    </div>

                    <div style={reportHeaderRightStyle}>
                      <div style={reportMenuWrapStyle}>
                        <button
                          type="button"
                          aria-label={
                            menuAberto
                              ? "Fechar ações da denúncia"
                              : "Abrir ações da denúncia"
                          }
                          aria-expanded={menuAberto}
                          onClick={() =>
                            setMenuDenunciaAbertoId((denunciaAbertaId) =>
                              denunciaAbertaId === denuncia.id ? "" : denuncia.id
                            )
                          }
                          disabled={acaoAtiva}
                          style={{
                            ...reportMenuButtonStyle,
                            opacity: acaoAtiva ? 0.58 : 1,
                            cursor: acaoAtiva ? "not-allowed" : "pointer",
                          }}
                        >
                          ⋮
                        </button>

                        {menuAberto && (
                          <section
                            style={reportMenuOverlayStyle}
                            aria-label="Ações da denúncia"
                          >
                            <button
                              type="button"
                              aria-label="Fechar ações da denúncia"
                              onClick={() => setMenuDenunciaAbertoId("")}
                              style={reportMenuBackdropStyle}
                            />

                            <article role="menu" style={reportMenuStyle}>
                              <div style={reportMenuHandleStyle} />

                              <strong style={reportMenuTitleStyle}>
                                Ações da denúncia
                              </strong>
                            {denuncia.alvoPostId && (
                              <Link
                                href={`/comunidade?post=${encodeURIComponent(
                                  denuncia.alvoPostId
                                )}`}
                                onClick={() => setMenuDenunciaAbertoId("")}
                                style={reportMenuItemLinkStyle}
                              >
                                Abrir publicação na Comunidade
                              </Link>
                            )}

                            {denunciaArquivada ? (
                              <button
                                type="button"
                                onClick={() => void restaurarDenunciaArquivada(denuncia.id)}
                                disabled={acaoAtiva}
                                style={reportMenuItemStyle}
                              >
                                Restaurar para o painel
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void arquivarDenuncia(denuncia.id)}
                                disabled={acaoAtiva}
                                style={reportMenuItemStyle}
                              >
                                Arquivar denúncia
                              </button>
                            )}

                            {denuncia.status === "resolvida" && (
                              <button
                                type="button"
                                onClick={() => void removerDenunciaResolvida(denuncia.id)}
                                disabled={acaoAtiva}
                                style={reportMenuDangerItemStyle}
                              >
                                {acaoEmAndamento === `${denuncia.id}-remover-denuncia`
                                  ? "Removendo..."
                                  : "Remover do painel"}
                              </button>
                            )}

                            {denuncia.status === "pendente" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuDenunciaAbertoId("");
                                  void atualizarStatusDenuncia(
                                    denuncia.id,
                                    "em_analise"
                                  );
                                }}
                                disabled={acaoAtiva}
                                style={reportMenuItemStyle}
                              >
                                {acaoEmAndamento === `${denuncia.id}-em_analise`
                                  ? "Assumindo..."
                                  : "Assumir análise"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setMenuDenunciaAbertoId("");
                                void removerConteudoDenunciado(denuncia);
                              }}
                              disabled={
                                acaoAtiva ||
                                conteudoIndisponivel
                              }
                              style={reportMenuDangerItemStyle}
                            >
                              {acaoEmAndamento ===
                              `${denuncia.id}-remover-conteudo`
                                ? "Removendo..."
                                : denuncia.alvoTipo === "post"
                                  ? "Remover publicação"
                                  : "Remover comentário"}
                            </button>

                            <div style={reportMenuDividerStyle} />

                            {STATUS_DENUNCIAS.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setMenuDenunciaAbertoId("");
                                  void atualizarStatusDenuncia(
                                    denuncia.id,
                                    status
                                  );
                                }}
                                disabled={acaoAtiva || denuncia.status === status}
                                style={
                                  denuncia.status === status
                                    ? reportMenuItemActiveStyle
                                    : reportMenuItemStyle
                                }
                              >
                                {acaoEmAndamento === `${denuncia.id}-${status}`
                                  ? "Salvando..."
                                  : `Marcar como ${STATUS_LABEL[
                                      status
                                    ].toLowerCase()}`}
                              </button>
                            ))}

                            </article>
                          </section>
                        )}</div>
                    </div>
                  </div>

                  <div className="admin-comunidade-report-body" style={reportBodyStyle}>
                    <section style={contentBoxStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={boxLabelStyle}>Conteúdo denunciado</span>
                        <span style={sectionHintStyle}>
                          {conteudoIndisponivel
                            ? "Indisponível"
                            : denuncia.alvoTipo === "post"
                              ? "Publicação"
                              : "Comentário"}
                        </span>
                      </div>

                      <p
                        style={
                          denunciaResolvidaComConteudoIndisponivel
                            ? reportedTextCompactStyle
                            : reportedTextStyle
                        }
                      >
                        {conteudoIndisponivel
                          ? "Conteúdo removido ou indisponível."
                          : denuncia.alvoResumo}
                      </p>

                      {!conteudoIndisponivel && (
                        <div style={metaGridStyle}>
                        <span style={metaItemStyle}>
                          Autor: <strong>{denuncia.alvoAutor}</strong>
                        </span>

                        <span style={metaItemStyle}>
                          Data: <strong>{formatarData(denuncia.alvoData)}</strong>
                        </span>

                        {denuncia.alvoCategoria && (
                          <span style={metaItemStyle}>
                            Categoria: <strong>{denuncia.alvoCategoria}</strong>
                          </span>
                        )}

                        {denuncia.alvoTipo === "post" && denuncia.alvoTipoPublicacao && (
                          <span style={metaItemStyle}>
                            Tipo: <strong>{denuncia.alvoTipoPublicacao}</strong>
                          </span>
                        )}

                        {denuncia.alvoTipo === "post" && (
                          <span
                            style={
                              denuncia.alvoTemSpoiler
                                ? spoilerMetaItemStyle
                                : metaItemStyle
                            }
                          >
                            Spoiler:{" "}
                            <strong>
                              {denuncia.alvoTemSpoiler ? "Sim" : "Não"}
                            </strong>
                          </span>
                        )}

                          {denuncia.alvoObra && (
                            <span style={metaItemStyle}>
                              Obra: <strong>{denuncia.alvoObra}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </section>

                    <section style={contentBoxStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={boxLabelStyle}>Denúncia</span>
                        <span style={sectionHintStyle}>Registro interno</span>
                      </div>

                      <div style={reasonGridStyle}>
                        <span style={reasonItemStyle}>
                          Denunciante: <strong>{denuncia.denuncianteNome}</strong>
                        </span>
                      </div>

                      {denuncia.detalhe ? (
                        <p style={detailTextStyle}>{denuncia.detalhe}</p>
                      ) : (
                        <p style={mutedTextStyle}>Sem detalhe adicional.</p>
                      )}
                    </section>

                    <label style={adminNoteStyle}>
                      <div style={sectionHeaderLineStyle}>
                        <span style={adminObservationLabelStyle}>Observação interna</span>
                        {!denunciaResolvidaComConteudoIndisponivel && (
                          <span style={sectionHintStyle}>Até 800 caracteres</span>
                        )}
                      </div>

                      <textarea
                        value={observacao}
                        onChange={(event) =>
                          setObservacoes((observacoesAtuais) => ({
                            ...observacoesAtuais,
                            [denuncia.id]: event.target.value,
                          }))
                        }
                        disabled={acaoAtiva}
                        placeholder="Ex.: conteúdo analisado, ação tomada, manter observação interna..."
                        maxLength={800}
                        rows={denunciaResolvidaComConteudoIndisponivel ? 1 : 2}
                        style={
                          denunciaResolvidaComConteudoIndisponivel
                            ? compactTextareaStyle
                            : textareaStyle
                        }
                      />
                    </label>
                  </div>

                  {denuncia.analisadoEm && (
                    <span style={analysisMetaStyle}>
                      Última análise em {formatarData(denuncia.analisadoEm)}
                    </span>
                  )}
                </article>
              );
            })
          ) : (
            <article style={emptyStyle}>
              <strong style={emptyTitleStyle}>Nenhuma denúncia encontrada.</strong>
              <p style={emptyTextStyle}>
                Tente limpar os filtros ou aguarde novas denúncias da Comunidade.
              </p>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}


const adminComunidadePageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }


  .admin-comunidade-filter-buttons {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .admin-comunidade-filter-buttons::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  @media (max-width: 760px) {
    .admin-comunidade-header-actions {
      grid-template-columns: 1fr !important;
    }

    .admin-comunidade-report-header {
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: start !important;
    }

    .admin-comunidade-report-body {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "20px 0 42px",
};

const titleHeaderStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "4px",
  marginBottom: "18px",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "22px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "42px",
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, #04000A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, #070212)",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  textAlign: "center",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const titleSearchButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: 0,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  WebkitAppearance: "none",
  appearance: "none",
};

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 42%, #FDBA74 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
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

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
  padding: "2px 0",
  minWidth: 0,
};

const mobileTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "12px",
  padding: "0",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
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
  maxWidth: "calc(100% - 174px)",
  overflow: "hidden",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  boxShadow: "none",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #DDD6FE) 40%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const topButtonStyle: CSSProperties = {
  minHeight: "38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 13px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.28)",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopTopButtonStyle: CSSProperties = {
  ...topButtonStyle,
  minHeight: "42px",
  padding: "0 18px",
  background:
    "linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(124,58,237,0.13) 100%)",
  border: "1px solid rgba(249,115,22,0.26)",
  color: "var(--historietas-accent, #FFD6A8)",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.075)",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.92)) 0%, var(--historietas-surface-strong, rgba(8,3,18,0.98)) 100%)",
  padding: "18px",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};


const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "16px",
  marginBottom: "16px",
  padding: "20px 16px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.90)) 0%, var(--historietas-surface-strong, rgba(8,3,18,0.98)) 100%)",
  border: "1px solid rgba(255,255,255,0.075)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
  overflow: "hidden",
};

const headerTextStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "780px",
  margin: "0 auto",
  textAlign: "center",
};

const headerActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 180px))",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minWidth: 0,
  width: "100%",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "8px auto 0",
  fontSize: "clamp(34px, 10vw, 60px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  textAlign: "center",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 44%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 18px 42px rgba(0,0,0,0.22)",
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
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "13px",
  lineHeight: 1.62,
  fontWeight: 650,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const loadingCardStyle: CSSProperties = {
  minHeight: "220px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "8px",
  padding: "28px 18px",
  borderRadius: "28px",
  background: "rgba(4,0,10,0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
  boxShadow: "none",
};

const loadingTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  fontWeight: 950,
};

const loadingTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  fontWeight: 750,
  ...safeTextStyle,
};

const accessCardStyle: CSSProperties = {
  maxWidth: "680px",
  margin: "34px auto 0",
  display: "grid",
  justifyItems: "center",
  gap: "12px",
  padding: "28px 18px",
  borderRadius: "30px",
  background: "rgba(4,0,10,0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
  boxShadow: "none",
};

const primaryLinkStyle: CSSProperties = {
  minHeight: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 18px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  border: "none",
  fontSize: "13px",
  fontWeight: 950,
  boxSizing: "border-box",
  textAlign: "center",
};

const secondaryLinkStyle: CSSProperties = {
  minHeight: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 15px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  fontSize: "12px",
  fontWeight: 950,
  boxSizing: "border-box",
  textAlign: "center",
};

const secondaryButtonStyle: CSSProperties = {
  ...secondaryLinkStyle,
  cursor: "pointer",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  margin: "2px 0 0",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "2px",
  minHeight: "54px",
  padding: "7px 3px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "7.4px",
  lineHeight: 1.06,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

const toolsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "7px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  marginBottom: "12px",
  minWidth: 0,
  boxShadow: "none",
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const searchBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const toolLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "11px",
  fontWeight: 870,
  letterSpacing: "0.02em",
  textTransform: "none",
  textAlign: "center",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  border: "1px solid rgba(255,255,255,0.08)",
  outline: "none",
  borderRadius: "999px",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 16px",
  boxSizing: "border-box",
  fontSize: "14px",
  fontWeight: 720,
  textAlign: "center",
  boxShadow: "none",
  minWidth: 0,
};

const adminSearchShellStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "#04000A",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 15px",
  boxSizing: "border-box",
  boxShadow: "none",
  outline: "none",
};

const adminSearchIconStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

const adminSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: 0,
  boxSizing: "border-box",
};

const adminFilterControlsRowStyle: CSSProperties = {
  minHeight: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const adminFilterLabelButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "left",
  padding: 0,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  ...safeTextStyle,
};

const adminFilterActionIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const statusFilterWrapStyle: CSSProperties = {
  display: "grid",
  justifyItems: "stretch",
  gap: "7px",
  minWidth: 0,
};

const filterButtonsStyle: CSSProperties = {
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  marginLeft: "-12px",
  marginRight: "-12px",
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "flex-start",
  gap: "7px",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 12px",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
  WebkitOverflowScrolling: "touch",
};

const filterButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "34px",
  padding: "0 13px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.06)",
  color: "#D4D4D8",
  fontSize: "10.5px",
  fontWeight: 880,
  cursor: "pointer",
  boxShadow: "none",
  scrollSnapAlign: "center",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const feedbackWrapStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginBottom: "12px",
};

const errorStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "rgba(248,113,113,0.12)",
  border: "1px solid rgba(248,113,113,0.22)",
  color: "#FCA5A5",
  fontSize: "12px",
  fontWeight: 850,
  ...safeTextStyle,
};

const successStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.22)",
  color: "#86EFAC",
  fontSize: "12px",
  fontWeight: 850,
  ...safeTextStyle,
};

const summaryStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "2px",
  padding: "4px 0 6px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#D4D4D8",
  textAlign: "center",
  marginBottom: "6px",
  boxShadow: "none",
};

const summaryTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const clearButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 13px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(4,0,10,0.72)",
  color: "#DDD6FE",
  fontSize: "10.5px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "none",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
};

const reportCardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "24px",
  background: "rgba(4,0,10,0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
};

const reportHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "10px",
  minWidth: 0,
};

const reportTitleWrapStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "start",
  justifyItems: "start",
  minWidth: 0,
};

const reportMetaLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

const reportDotStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 950,
  lineHeight: 1,
};

const targetBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const postTargetBadgeStyle: CSSProperties = {
  color: "#DDD6FE",
};

const commentTargetBadgeStyle: CSSProperties = {
  color: "#FDBA74",
};

const reportTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  lineHeight: 1.24,
  fontWeight: 950,
  ...safeTextStyle,
};

const reportDateStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 800,
};

const statusInlineStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const archivedInlineStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const reportHeaderRightStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "6px",
  minWidth: 0,
};

const reportMenuWrapStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const reportMenuButtonStyle: CSSProperties = {
  width: "24px",
  height: "30px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: 0,
  lineHeight: 1,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: 0,
  position: "relative",
  zIndex: 2,
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const adminFiltersSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const adminFiltersSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};

const adminFiltersSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(820px, calc(100% - 4px))",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(104px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  border: "1px solid rgba(255,255,255,0.06)",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const adminFiltersSheetHandleStyle: CSSProperties = {
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const adminFiltersSheetTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const adminFiltersSheetSectionLabelStyle: CSSProperties = {
  display: "block",
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const adminFiltersSheetOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const adminFiltersSheetOptionActiveStyle: CSSProperties = {
  ...adminFiltersSheetOptionStyle,
  fontWeight: 900,
  background: "transparent",
};

const adminFiltersSheetRadioStyle: CSSProperties = {
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const adminFiltersSheetRadioActiveStyle: CSSProperties = {
  ...adminFiltersSheetRadioStyle,
  border: "6.5px solid #FFFFFF",
};

const adminFiltersSheetClearButtonStyle: CSSProperties = {
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  marginTop: "12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
  textAlign: "center",
  ...safeTextStyle,
};

const reportMenuOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const reportMenuBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};

const reportMenuStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(820px, calc(100% - 4px))",
  maxHeight: "calc(100dvh - 190px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "#070212",
  border: "1px solid rgba(255,255,255,0.06)",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

const reportMenuHandleStyle: CSSProperties = {
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const reportMenuTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const reportMenuItemStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "16px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const reportMenuItemLinkStyle: CSSProperties = {
  ...reportMenuItemStyle,
  textDecoration: "none",
};

const reportMenuItemActiveStyle: CSSProperties = {
  ...reportMenuItemStyle,
  color: "rgba(244,244,245,0.58)",
  cursor: "default",
  fontWeight: 900,
};

const reportMenuDangerItemStyle: CSSProperties = {
  ...reportMenuItemStyle,
  color: "#FB7185",
};

const reportMenuDividerStyle: CSSProperties = {
  display: "none",
  height: 0,
  margin: 0,
  background: "transparent",
};

const reportBodyStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.08fr) minmax(260px, 0.92fr)",
  gap: "12px 18px",
  minWidth: 0,
  paddingTop: "10px",
  borderTop: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
};

const contentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  alignContent: "start",
};

const sectionHeaderLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const sectionHintStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "9.8px",
  fontWeight: 850,
  ...safeTextStyle,
};

const boxLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "9.8px",
  fontWeight: 950,
  letterSpacing: "0.105em",
  textTransform: "uppercase",
};

const adminObservationLabelStyle: CSSProperties = {
  ...boxLabelStyle,
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const reportedTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13.2px",
  lineHeight: 1.48,
  fontWeight: 800,
  maxHeight: "118px",
  overflowY: "auto",
  paddingRight: "2px",
  ...safeTextStyle,
};

const reportedTextCompactStyle: CSSProperties = {
  ...reportedTextStyle,
  maxHeight: "none",
  overflowY: "visible",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "4px 12px",
  minWidth: 0,
};

const metaItemStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

const spoilerMetaItemStyle: CSSProperties = {
  ...metaItemStyle,
  color: "#FDBA74",
};

const reasonGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "4px 12px",
  minWidth: 0,
};

const reasonItemStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 800,
  ...safeTextStyle,
};

const detailTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.45,
  fontWeight: 750,
  maxHeight: "92px",
  overflowY: "auto",
  paddingRight: "2px",
  ...safeTextStyle,
};

const mutedTextStyle: CSSProperties = {
  ...detailTextStyle,
  color: "var(--historietas-text-muted, #A1A1AA)",
};

const adminNoteStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  gridColumn: "1 / -1",
  paddingTop: "10px",
  borderTop: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  outline: "none",
  borderRadius: "14px",
  background: "var(--historietas-input-bg, rgba(255,255,255,0.055))",
  color: "var(--historietas-input-text, var(--historietas-text-primary, #FFFFFF))",
  padding: "9px 10px",
  boxSizing: "border-box",
  fontSize: "12.5px",
  lineHeight: 1.4,
  fontWeight: 800,
  resize: "vertical",
  minHeight: "58px",
};

const compactTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "44px",
  resize: "none",
};

const reportActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
  paddingTop: "2px",
};

const statusButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
};

const activeStatusButtonStyle: CSSProperties = {
  ...statusButtonStyle,
  background: "var(--historietas-active-surface, rgba(249,115,22,0.16))",
  border: "1px solid rgba(249,115,22,0.28)",
  color: "var(--historietas-accent, #FDBA74)",
  cursor: "default",
};

const analysisButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid rgba(249,115,22,0.26)",
  background: "rgba(249,115,22,0.10)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
};

const dangerButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid rgba(248,113,113,0.30)",
  background: "var(--historietas-danger-surface, rgba(248,113,113,0.12))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
};

const analysisMetaStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 800,
  textAlign: "right",
  ...safeTextStyle,
};

const emptyStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  padding: "28px 16px",
  borderRadius: "26px",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textAlign: "center",
};

const emptyTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 950,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  fontWeight: 750,
  ...safeTextStyle,
};