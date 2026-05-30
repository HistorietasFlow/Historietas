"use client";

import Link from "next/link";
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

type DenunciaComunidade = {
  id: string;
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
  denuncianteId: string;
  motivo: string;
  detalhe: string;
  status: StatusDenuncia;
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

export default function AdminComunidadePage() {
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [denuncias, setDenuncias] = useState<DenunciaComContexto[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<StatusDenuncia | "todas">(
    "pendente"
  );
  const [busca, setBusca] = useState("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

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
  }, []);

  const denunciasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return denuncias.filter((denuncia) => {
      const statusCombina =
        statusFiltro === "todas" || denuncia.status === statusFiltro;

      if (!statusCombina) {
        return false;
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
          denuncia.alvoCategoria || "",
          denuncia.alvoTipoPublicacao || "",
          denuncia.alvoTemSpoiler ? "spoiler contem spoiler" : "",
          denuncia.alvoObra || "",
        ].join(" ")
      );

      return conteudoBusca.includes(buscaNormalizada);
    });
  }, [busca, denuncias, statusFiltro]);

  const totalPendentes = denuncias.filter(
    (denuncia) => denuncia.status === "pendente"
  ).length;

  const totalEmAnalise = denuncias.filter(
    (denuncia) => denuncia.status === "em_analise"
  ).length;

  const totalResolvidas = denuncias.filter(
    (denuncia) => denuncia.status === "resolvida"
  ).length;

  const totalRejeitadas = denuncias.filter(
    (denuncia) => denuncia.status === "rejeitada"
  ).length;

  async function carregarDenuncias() {
    setErro("");

    const { data: denunciasResposta, error: denunciasErro } = await supabase
      .from("comunidade_denuncias")
      .select(
        "id, alvo_tipo, alvo_id, denunciante_id, motivo, detalhe, status, observacao_admin, analisado_por, analisado_em, criado_em"
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
      setErro("Apenas administradores podem atualizar denúncias.");
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
      setErro("Apenas administradores podem remover conteúdo denunciado.");
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

  function limparFiltros() {
    setStatusFiltro("todas");
    setBusca("");
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>
        <section style={containerStyle}>
          <div style={loadingCardStyle}>
            <strong style={loadingTitleStyle}>Carregando moderação...</strong>
            <span style={loadingTextStyle}>
              Conferindo acesso administrativo e denúncias da Comunidade.
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
        <section style={containerStyle}>
          <section style={accessCardStyle}>
            <span style={miniTitleStyle}>ÁREA RESTRITA</span>
            <h1 style={titleStyle}>Moderação da Comunidade</h1>
            <p style={descriptionStyle}>
              Entre com uma conta administrativa para revisar denúncias.
            </p>

            {erro && <span style={errorStyle}>{erro}</span>}

            <Link href="/login" style={primaryLinkStyle}>
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
        <section style={containerStyle}>
          <section style={accessCardStyle}>
            <span style={miniTitleStyle}>ACESSO NEGADO</span>
            <h1 style={titleStyle}>Você não é administrador</h1>
            <p style={descriptionStyle}>
              Esta área exibe denúncias da Comunidade e só pode ser acessada por
              contas com permissão administrativa.
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

      <section style={containerStyle}>
        <header style={headerStyle}>
          <div style={headerTextStyle}>
            <span style={miniTitleStyle}>MODERAÇÃO</span>
            <h1 style={titleStyle}>Moderação da Comunidade</h1>
            <p style={descriptionStyle}>
              Revise denúncias enviadas por leitores e acompanhe o status de
              análise dos conteúdos sinalizados.
            </p>
          </div>

          <div className="admin-comunidade-header-actions" style={headerActionsStyle}>
            <Link href="/comunidade" style={secondaryLinkStyle}>
              Ver Comunidade
            </Link>

            <button
              type="button"
              onClick={() => carregarDenuncias()}
              disabled={Boolean(acaoEmAndamento)}
              style={secondaryButtonStyle}
            >
              Atualizar
            </button>
          </div>
        </header>

        <section className="admin-comunidade-stats" style={statsGridStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{denuncias.length}</strong>
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

          <div style={statusFilterWrapStyle}>
            <span style={toolLabelStyle}>Status</span>

            <div style={filterButtonsStyle}>
              {(["todas", ...STATUS_DENUNCIAS] as const).map((status) => (
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
                  {status === "todas" ? "Todas" : STATUS_LABEL[status]}
                </button>
              ))}
            </div>
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

          {(busca || statusFiltro !== "todas") && (
            <button type="button" onClick={limparFiltros} style={clearButtonStyle}>
              Limpar filtros
            </button>
          )}
        </section>

        <section style={listStyle}>
          {denunciasFiltradas.length > 0 ? (
            denunciasFiltradas.map((denuncia) => {
              const acaoAtiva = acaoEmAndamento.startsWith(denuncia.id);
              const observacao = observacoes[denuncia.id] || "";

              return (
                <article key={denuncia.id} style={reportCardStyle}>
                  <div className="admin-comunidade-report-header" style={reportHeaderStyle}>
                    <div style={reportTitleWrapStyle}>
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

                      <strong style={reportTitleStyle}>
                        {STATUS_LABEL[denuncia.status]}
                      </strong>

                      <span style={reportDateStyle}>
                        Denunciado em {formatarData(denuncia.criadoEm)}
                      </span>
                    </div>

                    <span style={statusPillStyle}>{STATUS_LABEL[denuncia.status]}</span>
                  </div>

                  <div className="admin-comunidade-report-body" style={reportBodyStyle}>
                    <section style={contentBoxStyle}>
                      <span style={boxLabelStyle}>Conteúdo denunciado</span>
                      <p style={reportedTextStyle}>{denuncia.alvoResumo}</p>

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
                    </section>

                    <section style={contentBoxStyle}>
                      <span style={boxLabelStyle}>Denúncia</span>

                      <div style={reasonGridStyle}>
                        <span style={reasonItemStyle}>
                          Motivo: <strong>{denuncia.motivo}</strong>
                        </span>

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
                      <span style={boxLabelStyle}>Observação interna</span>

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
                        rows={3}
                        style={textareaStyle}
                      />
                    </label>
                  </div>

                  <div style={reportActionsStyle}>
                    <button
                      type="button"
                      onClick={() => removerConteudoDenunciado(denuncia)}
                      disabled={
                        acaoAtiva ||
                        denuncia.alvoResumo.startsWith("Conteúdo removido pela moderação.")
                      }
                      style={dangerButtonStyle}
                    >
                      {acaoEmAndamento === `${denuncia.id}-remover-conteudo`
                        ? "Removendo..."
                        : denuncia.alvoTipo === "post"
                          ? "Remover publicação"
                          : "Remover comentário"}
                    </button>

                    {STATUS_DENUNCIAS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => atualizarStatusDenuncia(denuncia.id, status)}
                        disabled={acaoAtiva || denuncia.status === status}
                        style={
                          denuncia.status === status
                            ? activeStatusButtonStyle
                            : statusButtonStyle
                        }
                      >
                        {acaoEmAndamento === `${denuncia.id}-${status}`
                          ? "Salvando..."
                          : STATUS_LABEL[status]}
                      </button>
                    ))}
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
  @media (max-width: 760px) {
    .admin-comunidade-header-actions {
      grid-template-columns: 1fr !important;
    }

    .admin-comunidade-report-header {
      grid-template-columns: minmax(0, 1fr) !important;
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
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-primary, rgba(124,58,237,0.22)), transparent 32%), radial-gradient(circle at 88% 8%, var(--historietas-glow-secondary, rgba(249,115,22,0.13)), transparent 28%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 44%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(1180px, calc(100% - 28px))",
  margin: "0 auto",
  padding: "20px 0 calc(36px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
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
  margin: 0,
  fontSize: "clamp(34px, 7vw, 64px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.075em",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingBottom: "5px",
  textAlign: "center",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 750,
  maxWidth: "680px",
  textAlign: "center",
  ...safeTextStyle,
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "14px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minHeight: "82px",
  padding: "12px 8px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.12,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "center",
  ...safeTextStyle,
};

const toolsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "12px",
  padding: "14px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.82)), var(--historietas-surface-strong, rgba(12,7,23,0.95)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  marginBottom: "12px",
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
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "8px",
  minWidth: 0,
};

const filterButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
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
  margin: "0 0 12px",
  padding: "12px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
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
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(249,115,22,0.20)",
  background: "rgba(249,115,22,0.10)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
};

const reportCardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.9)), var(--historietas-surface-strong, rgba(12,7,23,0.97)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  minWidth: 0,
  overflow: "hidden",
};

const reportHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "10px",
  minWidth: 0,
};

const reportTitleWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const targetBadgeStyle: CSSProperties = {
  minHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const postTargetBadgeStyle: CSSProperties = {
  background: "rgba(124,58,237,0.20)",
  color: "#DDD6FE",
  border: "1px solid rgba(124,58,237,0.26)",
};

const commentTargetBadgeStyle: CSSProperties = {
  background: "rgba(249,115,22,0.14)",
  color: "#FDBA74",
  border: "1px solid rgba(249,115,22,0.22)",
};

const reportTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  ...safeTextStyle,
};

const reportDateStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
};

const statusPillStyle: CSSProperties = {
  minHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const reportBodyStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  minWidth: 0,
};

const contentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
  alignContent: "start",
};

const boxLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const reportedTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 800,
  minHeight: "42px",
  ...safeTextStyle,
};

const metaGridStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};

const metaItemStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 750,
  ...safeTextStyle,
};

const spoilerMetaItemStyle: CSSProperties = {
  ...metaItemStyle,
  color: "#FDBA74",
  padding: "4px 8px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.18)",
};

const reasonGridStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};

const reasonItemStyle: CSSProperties = {
  padding: "7px 9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 800,
  ...safeTextStyle,
};

const detailTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 750,
  ...safeTextStyle,
};

const mutedTextStyle: CSSProperties = {
  ...detailTextStyle,
  color: "var(--historietas-text-muted, #A1A1AA)",
};

const adminNoteStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  gridColumn: "1 / -1",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  outline: "none",
  borderRadius: "18px",
  background: "var(--historietas-input-bg, rgba(255,255,255,0.055))",
  color: "var(--historietas-input-text, var(--historietas-text-primary, #FFFFFF))",
  padding: "12px",
  boxSizing: "border-box",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 800,
  resize: "vertical",
  minHeight: "92px",
};

const reportActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const statusButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
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

const dangerButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(248,113,113,0.30)",
  background: "var(--historietas-danger-surface, rgba(248,113,113,0.12))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
};

const analysisMetaStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
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