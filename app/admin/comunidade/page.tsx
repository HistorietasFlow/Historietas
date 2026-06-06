"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";

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
  user_id: string;
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


function normalizarTexto(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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

function formatarData(dataIso: string | null) {
  if (!dataIso) {
    return "Não informado";
  }

  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Não informado";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

function criarDecoracaoHeroStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "42px", transform: "rotate(-12deg)" },
    { top: "48%", right: "15%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "6%", fontSize: "34px", transform: "rotate(8deg)" },
    { top: "16%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.13,
    lineHeight: 1,
    fontWeight: 950,
    filter:
      "drop-shadow(0 0 18px color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
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
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [menuDenunciaAbertoId, setMenuDenunciaAbertoId] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

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


  useEffect(() => {
    let cancelado = false;

    async function iniciarModeracao() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { data: sessaoResposta, error: sessaoErro } =
          await supabase.auth.getSession();

        if (sessaoErro) {
          throw sessaoErro;
        }

        const user = sessaoResposta.session?.user || null;

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
    setMenuDenunciaAbertoId("");
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

  async function carregarDenuncias() {
    setErro("");

    const { data: denunciasResposta, error: denunciasErro } = await supabase
      .from("comunidade_denuncias")
      .select(
        "id, alvo_tipo, alvo_id, denunciante_id, motivo, detalhe, status, arquivada, observacao_admin, analisado_por, analisado_em, criado_em"
      )
      .order("criado_em", { ascending: false });

    if (denunciasErro) {
      throw denunciasErro;
    }

    const denunciasMapeadas: DenunciaComunidade[] = (
      denunciasResposta || []
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

    const [perfisResposta, postsResposta, comentariosResposta] =
      await Promise.all([
        denuncianteIds.length > 0
          ? supabase.from("profiles").select("user_id, nome").in("user_id", denuncianteIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length > 0
          ? supabase
              .from("comunidade_posts")
              .select(
                "id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em"
              )
              .in("id", postIds)
          : Promise.resolve({ data: [], error: null }),
        comentarioIds.length > 0
          ? supabase
              .from("comunidade_comentarios")
              .select("id, post_id, autor_nome, texto, criado_em")
              .in("id", comentarioIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    const perfis = perfisResposta.error
      ? []
      : ((perfisResposta.data || []) as PerfilModeracao[]);

    const posts = postsResposta.error
      ? []
      : ((postsResposta.data || []) as PostDenunciado[]);

    const comentarios = comentariosResposta.error
      ? []
      : ((comentariosResposta.data || []) as ComentarioDenunciado[]);

    const perfisPorId = new Map(
      perfis.map((perfil) => [
        perfil.user_id,
        perfil.nome?.trim() || "Usuário sem nome",
      ])
    );

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
        .eq("id", denuncia.id);

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
        denunciaAtual.id === denuncia.id
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

  function limparFiltros() {
    setStatusFiltro("todas");
    setBusca("");
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
        </header>

        <section style={toolsStyle}>
          <label style={searchBoxStyle}>
            <span style={toolLabelStyle}>Buscar denúncias</span>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por motivo, autor, texto, tipo, spoiler ou denunciante..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={100}
              style={inputStyle}
            />
          </label>

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
            <span style={toolLabelStyle}>Status</span>

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
                          ⋯
                        </button>

                        {menuAberto && (
                          <div style={reportMenuStyle}>
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
                          </div>
                        )}
                      </div>
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
                        <span style={boxLabelStyle}>Observação interna</span>
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
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
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
  padding: "18px 0 40px",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  width: "100%",
  margin: "0 auto 14px",
  padding: 0,
  minWidth: 0,
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginBottom: "18px",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  margin: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
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
  background:
    "radial-gradient(ellipse at 8% 74%, var(--historietas-glow-primary, rgba(42,20,76,0.54)) 0%, transparent 62%), radial-gradient(ellipse at 76% 68%, var(--historietas-glow-secondary, rgba(32,13,58,0.36)) 0%, transparent 64%), linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.96)) 42%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
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
  boxShadow:
    "0 0 22px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #DDD6FE) 40%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow:
    "var(--historietas-logo-shadow, 0 0 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent))",
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
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, rgba(255,255,255,0.08))",
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
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, rgba(255,255,255,0.10))",
  color: "var(--historietas-accent, #FFD6A8)",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.12), transparent 28%), linear-gradient(135deg, rgba(26,13,43,0.98) 0%, rgba(12,7,23,0.98) 100%)",
  padding: "18px",
  boxShadow:
    "var(--historietas-hero-shadow, 0 26px 70px rgba(0,0,0,0.36), 0 0 46px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.08))",
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
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};


const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "16px",
  marginBottom: "16px",
  padding: "20px 16px",
  borderRadius: "28px",
  background:
    "radial-gradient(circle at 14% 0%, var(--historietas-glow-secondary, rgba(249,115,22,0.18)), transparent 34%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.92)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.98)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
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
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.92)), var(--historietas-surface-strong, rgba(12,7,23,0.97)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  textAlign: "center",
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
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.94)), var(--historietas-surface-strong, rgba(12,7,23,0.98)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  textAlign: "center",
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
  margin: "0",
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
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  gap: "10px",
  padding: "12px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.82)), var(--historietas-surface-strong, rgba(12,7,23,0.95)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  marginBottom: "10px",
  minWidth: 0,
};

const searchBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const toolLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  outline: "none",
  borderRadius: "999px",
  background: "var(--historietas-input-bg, rgba(255,255,255,0.055))",
  color: "var(--historietas-input-text, var(--historietas-text-primary, #FFFFFF))",
  padding: "0 14px",
  boxSizing: "border-box",
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "center",
};

const statusFilterWrapStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  scrollSnapAlign: "center",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 52%, transparent)",
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  margin: "0 0 10px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  textAlign: "center",
};

const summaryTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const clearButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(249,115,22,0.20)",
  background: "rgba(249,115,22,0.10)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
};

const reportCardStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.82)), var(--historietas-surface-strong, rgba(12,7,23,0.96)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.085))",
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
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
};

const reportMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  zIndex: 30,
  width: "244px",
  minWidth: "220px",
  maxWidth: "calc(100vw - 44px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "5px",
  padding: "8px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, var(--historietas-surface-strong, rgba(12,7,23,0.98)), var(--historietas-surface, rgba(31,16,52,0.96)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  boxSizing: "border-box",
};

const reportMenuItemStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "34px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "0 10px",
  borderRadius: "12px",
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 900,
  fontFamily: "inherit",
  textAlign: "left",
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
  cursor: "pointer",
  boxShadow: "none",
};

const reportMenuItemLinkStyle: CSSProperties = {
  ...reportMenuItemStyle,
  textDecoration: "none",
  boxSizing: "border-box",
};

const reportMenuItemActiveStyle: CSSProperties = {
  ...reportMenuItemStyle,
  background: "var(--historietas-active-surface, rgba(249,115,22,0.16))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  cursor: "default",
};

const reportMenuDangerItemStyle: CSSProperties = {
  ...reportMenuItemStyle,
  background: "var(--historietas-danger-surface, rgba(248,113,113,0.12))",
  border: "1px solid rgba(248,113,113,0.22)",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const reportMenuDividerStyle: CSSProperties = {
  height: "1px",
  margin: "2px 0",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.08))",
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
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9.8px",
  fontWeight: 950,
  letterSpacing: "0.105em",
  textTransform: "uppercase",
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
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  cursor: "default",
};

const analysisButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
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