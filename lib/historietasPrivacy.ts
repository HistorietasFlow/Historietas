"use client";

import { supabase } from "./supabase/client";

export type QuemPodeComentarDiario = "todos" | "seguidores" | "ninguem";

export type VisibilidadeAbaPerfil =
  | "publico"
  | "seguidores"
  | "seguindo"
  | "somente_eu";

export type PreferenciasPrivacidadeHistorietas = {
  perfilPrivado: boolean;
  aprovarNovosSeguidores: boolean;
  visibilidadeObras: VisibilidadeAbaPerfil;
  visibilidadeSobre: VisibilidadeAbaPerfil;
  visibilidadeDiario: VisibilidadeAbaPerfil;
  visibilidadeComunidade: VisibilidadeAbaPerfil;
  visibilidadeBiblioteca: VisibilidadeAbaPerfil;
  visibilidadeAtividades: VisibilidadeAbaPerfil;
  anotacoesPrivadasPorPadrao: boolean;
  quemPodeComentarDiario: QuemPodeComentarDiario;
};

export type PermissoesAbasPerfil = {
  obras: boolean;
  sobre: boolean;
  diario: boolean;
  comunidade: boolean;
  biblioteca: boolean;
  atividades: boolean;
};

export type EstadoRelacionamentoPerfil =
  | "proprio_perfil"
  | "seguindo"
  | "solicitado"
  | "nenhum";

export type ResultadoAcaoPrivacidade = {
  ok: boolean;
  erro: string;
};

export type ResultadoRelacionamentoPerfil = ResultadoAcaoPrivacidade & {
  estado: EstadoRelacionamentoPerfil;
};

export type EstadoBloqueioPerfil = {
  bloqueadoPorMim: boolean;
  bloqueadoPeloPerfil: boolean;
  existeBloqueio: boolean;
};

export type ResultadoBloqueioPerfil = ResultadoAcaoPrivacidade & {
  estado: EstadoBloqueioPerfil;
};

export const PRIVACIDADE_STORAGE_KEY = "historietas-privacidade";
export const PRIVACIDADE_ATUALIZADA_EVENT =
  "historietas:privacidade-atualizada";
export const BLOQUEIO_USUARIO_ATUALIZADO_EVENT =
  "historietas:bloqueio-usuario-atualizado";

export const preferenciasPrivacidadePadrao: PreferenciasPrivacidadeHistorietas = {
  perfilPrivado: false,
  aprovarNovosSeguidores: false,
  visibilidadeObras: "publico",
  visibilidadeSobre: "publico",
  visibilidadeDiario: "publico",
  visibilidadeComunidade: "publico",
  visibilidadeBiblioteca: "somente_eu",
  visibilidadeAtividades: "seguidores",
  anotacoesPrivadasPorPadrao: true,
  quemPodeComentarDiario: "todos",
};

const permissoesAbasPerfilPadrao: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: false,
  atividades: false,
};

const estadoBloqueioPerfilPadrao: EstadoBloqueioPerfil = {
  bloqueadoPorMim: false,
  bloqueadoPeloPerfil: false,
  existeBloqueio: false,
};

function criarChavePrivacidadeUsuario(userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo
    ? `${PRIVACIDADE_STORAGE_KEY}:${userIdLimpo}`
    : PRIVACIDADE_STORAGE_KEY;
}

function normalizarBooleano(valor: unknown, fallback: boolean) {
  return typeof valor === "boolean" ? valor : fallback;
}

export function normalizarVisibilidadeAba(
  valor: unknown,
  fallback: VisibilidadeAbaPerfil,
): VisibilidadeAbaPerfil {
  return valor === "publico" ||
    valor === "seguidores" ||
    valor === "seguindo" ||
    valor === "somente_eu"
    ? valor
    : fallback;
}

function normalizarQuemPodeComentar(
  valor: unknown,
): QuemPodeComentarDiario {
  return valor === "seguidores" || valor === "ninguem" || valor === "todos"
    ? valor
    : preferenciasPrivacidadePadrao.quemPodeComentarDiario;
}

function normalizarEstadoRelacionamento(
  valor: unknown,
): EstadoRelacionamentoPerfil {
  return valor === "proprio_perfil" ||
    valor === "seguindo" ||
    valor === "solicitado" ||
    valor === "nenhum"
    ? valor
    : "nenhum";
}

function normalizarEstadoBloqueioPerfil(
  valor: unknown,
): EstadoBloqueioPerfil {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...estadoBloqueioPerfilPadrao };
  }

  const registro = valor as Record<string, unknown>;
  const bloqueadoPorMim = normalizarBooleano(
    registro.bloqueadoPorMim ?? registro.bloqueado_por_mim,
    false,
  );
  const bloqueadoPeloPerfil = normalizarBooleano(
    registro.bloqueadoPeloPerfil ?? registro.bloqueado_pelo_perfil,
    false,
  );

  return {
    bloqueadoPorMim,
    bloqueadoPeloPerfil,
    existeBloqueio: normalizarBooleano(
      registro.existeBloqueio ?? registro.existe_bloqueio,
      bloqueadoPorMim || bloqueadoPeloPerfil,
    ),
  };
}

function obterMensagemErro(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const mensagem = (error as { message?: unknown }).message;

    if (typeof mensagem === "string" && mensagem.trim()) {
      return mensagem;
    }
  }

  return fallback;
}

const acoesRelacionamentoEmAndamento = new Map<
  string,
  Promise<ResultadoRelacionamentoPerfil>
>();

const acoesBloqueioEmAndamento = new Map<
  string,
  Promise<ResultadoBloqueioPerfil>
>();

function executarAcaoRelacionamentoUnica(
  perfilUserId: string,
  acao: () => Promise<ResultadoRelacionamentoPerfil>,
) {
  const chave = perfilUserId.trim();
  const acaoExistente = acoesRelacionamentoEmAndamento.get(chave);

  if (acaoExistente) {
    return acaoExistente;
  }

  const novaAcao = acao().finally(() => {
    if (acoesRelacionamentoEmAndamento.get(chave) === novaAcao) {
      acoesRelacionamentoEmAndamento.delete(chave);
    }
  });

  acoesRelacionamentoEmAndamento.set(chave, novaAcao);
  return novaAcao;
}

function executarAcaoBloqueioUnica(
  perfilUserId: string,
  acao: () => Promise<ResultadoBloqueioPerfil>,
) {
  const chave = perfilUserId.trim();
  const acaoExistente = acoesBloqueioEmAndamento.get(chave);

  if (acaoExistente) {
    return acaoExistente;
  }

  const novaAcao = acao().finally(() => {
    if (acoesBloqueioEmAndamento.get(chave) === novaAcao) {
      acoesBloqueioEmAndamento.delete(chave);
    }
  });

  acoesBloqueioEmAndamento.set(chave, novaAcao);
  return novaAcao;
}

async function obterUsuarioAtualIdRelacionamento() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return "";
    }

    return data.user?.id?.trim() || "";
  } catch {
    return "";
  }
}

async function removerSolicitacoesPendentesRelacionamento(
  solicitanteId: string,
  destinatarioId: string,
) {
  const solicitanteIdLimpo = solicitanteId.trim();
  const destinatarioIdLimpo = destinatarioId.trim();

  if (!solicitanteIdLimpo || !destinatarioIdLimpo) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("solicitacoes_seguidores")
      .delete()
      .eq("solicitante_id", solicitanteIdLimpo)
      .eq("destinatario_id", destinatarioIdLimpo);

    return !error;
  } catch {
    return false;
  }
}

async function manterSomenteSolicitacaoMaisRecente(
  solicitanteId: string,
  destinatarioId: string,
) {
  const solicitanteIdLimpo = solicitanteId.trim();
  const destinatarioIdLimpo = destinatarioId.trim();

  if (!solicitanteIdLimpo || !destinatarioIdLimpo) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from("solicitacoes_seguidores")
      .select("id,criado_em")
      .eq("solicitante_id", solicitanteIdLimpo)
      .eq("destinatario_id", destinatarioIdLimpo)
      .order("criado_em", { ascending: false })
      .limit(50);

    if (error || !Array.isArray(data) || data.length <= 1) {
      return;
    }

    const idsDuplicados = data
      .slice(1)
      .map((item) => (typeof item.id === "string" ? item.id.trim() : ""))
      .filter(Boolean);

    if (idsDuplicados.length === 0) {
      return;
    }

    await supabase
      .from("solicitacoes_seguidores")
      .delete()
      .in("id", idsDuplicados);
  } catch {
    // A proteção definitiva contra duplicidade também será feita no SQL.
  }
}

function avisarRelacionamentoPerfilAtualizado(
  perfilUserId: string,
  estado: EstadoRelacionamentoPerfil,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("historietas:relacionamento-perfil-atualizado", {
      detail: {
        perfilUserId: perfilUserId.trim(),
        estado,
      },
    }),
  );
}

function avisarBloqueioUsuarioAtualizado(
  perfilUserId: string,
  estado: EstadoBloqueioPerfil,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(BLOQUEIO_USUARIO_ATUALIZADO_EVENT, {
      detail: {
        perfilUserId: perfilUserId.trim(),
        estado,
      },
    }),
  );
}

function criarPermissoesPublicas(
  preferencias: PreferenciasPrivacidadeHistorietas,
): PermissoesAbasPerfil {
  return {
    obras: preferencias.visibilidadeObras === "publico",
    sobre: preferencias.visibilidadeSobre === "publico",
    diario: preferencias.visibilidadeDiario === "publico",
    comunidade: preferencias.visibilidadeComunidade === "publico",
    biblioteca: preferencias.visibilidadeBiblioteca === "publico",
    atividades: preferencias.visibilidadeAtividades === "publico",
  };
}

function normalizarPermissoesAbasPerfil(
  valor: unknown,
  fallback: PermissoesAbasPerfil,
): PermissoesAbasPerfil {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...fallback };
  }

  const registro = valor as Record<string, unknown>;

  return {
    obras: normalizarBooleano(registro.obras, fallback.obras),
    sobre: normalizarBooleano(registro.sobre, fallback.sobre),
    diario: normalizarBooleano(registro.diario, fallback.diario),
    comunidade: normalizarBooleano(
      registro.comunidade,
      fallback.comunidade,
    ),
    biblioteca: normalizarBooleano(
      registro.biblioteca,
      fallback.biblioteca,
    ),
    atividades: normalizarBooleano(
      registro.atividades,
      fallback.atividades,
    ),
  };
}

export function normalizarPreferenciasPrivacidade(
  valor: unknown,
): PreferenciasPrivacidadeHistorietas {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...preferenciasPrivacidadePadrao };
  }

  const registro = valor as Record<string, unknown>;
  const perfilPrivado = normalizarBooleano(
    registro.perfilPrivado ?? registro.perfil_privado,
    preferenciasPrivacidadePadrao.perfilPrivado,
  );
  const mostrarObrasLegado = normalizarBooleano(
    registro.mostrarObrasParaTodos ?? registro.mostrar_obras_para_todos,
    true,
  );
  const mostrarSobreLegado = normalizarBooleano(
    registro.mostrarSobreParaTodos ?? registro.mostrar_sobre_para_todos,
    true,
  );
  const mostrarDiarioLegado = normalizarBooleano(
    registro.mostrarDiarioNoPerfil ?? registro.mostrar_diario_perfil,
    true,
  );
  const mostrarAtividadesLegado = normalizarBooleano(
    registro.mostrarAtividadesLeitura ?? registro.mostrar_atividades_leitura,
    true,
  );

  return {
    perfilPrivado,
    aprovarNovosSeguidores: normalizarBooleano(
      registro.aprovarNovosSeguidores ?? registro.aprovar_novos_seguidores,
      preferenciasPrivacidadePadrao.aprovarNovosSeguidores,
    ),
    visibilidadeObras: normalizarVisibilidadeAba(
      registro.visibilidadeObras ?? registro.visibilidade_obras,
      mostrarObrasLegado ? "publico" : "seguidores",
    ),
    visibilidadeSobre: normalizarVisibilidadeAba(
      registro.visibilidadeSobre ?? registro.visibilidade_sobre,
      mostrarSobreLegado ? "publico" : "seguidores",
    ),
    visibilidadeDiario: normalizarVisibilidadeAba(
      registro.visibilidadeDiario ?? registro.visibilidade_diario,
      mostrarDiarioLegado
        ? perfilPrivado
          ? "seguidores"
          : "publico"
        : "somente_eu",
    ),
    visibilidadeComunidade: normalizarVisibilidadeAba(
      registro.visibilidadeComunidade ?? registro.visibilidade_comunidade,
      perfilPrivado ? "seguidores" : "publico",
    ),
    visibilidadeBiblioteca: normalizarVisibilidadeAba(
      registro.visibilidadeBiblioteca ?? registro.visibilidade_biblioteca,
      perfilPrivado ? "seguidores" : "somente_eu",
    ),
    visibilidadeAtividades: normalizarVisibilidadeAba(
      registro.visibilidadeAtividades ?? registro.visibilidade_atividades,
      mostrarAtividadesLegado
        ? perfilPrivado
          ? "seguidores"
          : "publico"
        : "somente_eu",
    ),
    anotacoesPrivadasPorPadrao: normalizarBooleano(
      registro.anotacoesPrivadasPorPadrao ??
        registro.anotacoes_privadas_padrao,
      preferenciasPrivacidadePadrao.anotacoesPrivadasPorPadrao,
    ),
    quemPodeComentarDiario: normalizarQuemPodeComentar(
      registro.quemPodeComentarDiario ??
        registro.quem_pode_comentar_diario,
    ),
  };
}

export function carregarPreferenciasPrivacidadeLocal(
  userId: string,
): PreferenciasPrivacidadeHistorietas {
  if (typeof window === "undefined") {
    return { ...preferenciasPrivacidadePadrao };
  }

  try {
    const texto = localStorage.getItem(criarChavePrivacidadeUsuario(userId));

    return texto
      ? normalizarPreferenciasPrivacidade(JSON.parse(texto))
      : { ...preferenciasPrivacidadePadrao };
  } catch {
    return { ...preferenciasPrivacidadePadrao };
  }
}

export function salvarPreferenciasPrivacidadeLocal(
  preferencias: PreferenciasPrivacidadeHistorietas,
  userId: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const preferenciasSeguras = normalizarPreferenciasPrivacidade(preferencias);

    localStorage.setItem(
      criarChavePrivacidadeUsuario(userId),
      JSON.stringify(preferenciasSeguras),
    );

    window.dispatchEvent(
      new CustomEvent(PRIVACIDADE_ATUALIZADA_EVENT, {
        detail: { userId: userId.trim() },
      }),
    );
  } catch {
    // O Supabase continua sendo a fonte principal quando disponível.
  }
}

export async function carregarPreferenciasPrivacidade(
  userId: string,
  opcoes: { usarFallbackLocal?: boolean } = {},
): Promise<PreferenciasPrivacidadeHistorietas> {
  const userIdLimpo = userId.trim();
  const usarFallbackLocal = opcoes.usarFallbackLocal !== false;

  const fallback = usarFallbackLocal
    ? carregarPreferenciasPrivacidadeLocal(userIdLimpo)
    : { ...preferenciasPrivacidadePadrao };

  if (!userIdLimpo) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from("preferencias_privacidade")
      .select(
        "perfil_privado,aprovar_novos_seguidores,visibilidade_obras,visibilidade_sobre,visibilidade_diario,visibilidade_comunidade,visibilidade_biblioteca,visibilidade_atividades,anotacoes_privadas_padrao,quem_pode_comentar_diario",
      )
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (error || !data) {
      return fallback;
    }

    const preferencias = normalizarPreferenciasPrivacidade(data);

    if (usarFallbackLocal) {
      salvarPreferenciasPrivacidadeLocal(preferencias, userIdLimpo);
    }

    return preferencias;
  } catch {
    return fallback;
  }
}

export async function salvarPreferenciasPrivacidade(
  preferencias: PreferenciasPrivacidadeHistorietas,
  userId: string,
): Promise<ResultadoAcaoPrivacidade> {
  const userIdLimpo = userId.trim();
  const preferenciasSeguras = normalizarPreferenciasPrivacidade(preferencias);

  salvarPreferenciasPrivacidadeLocal(preferenciasSeguras, userIdLimpo);

  if (!userIdLimpo) {
    return { ok: false, erro: "Usuário inválido." };
  }

  try {
    const { error } = await supabase
      .from("preferencias_privacidade")
      .upsert(
        {
          user_id: userIdLimpo,
          perfil_privado: preferenciasSeguras.perfilPrivado,
          aprovar_novos_seguidores:
            preferenciasSeguras.aprovarNovosSeguidores,
          visibilidade_obras: preferenciasSeguras.visibilidadeObras,
          visibilidade_sobre: preferenciasSeguras.visibilidadeSobre,
          visibilidade_diario: preferenciasSeguras.visibilidadeDiario,
          visibilidade_comunidade: preferenciasSeguras.visibilidadeComunidade,
          visibilidade_biblioteca: preferenciasSeguras.visibilidadeBiblioteca,
          visibilidade_atividades: preferenciasSeguras.visibilidadeAtividades,
          anotacoes_privadas_padrao:
            preferenciasSeguras.anotacoesPrivadasPorPadrao,
          quem_pode_comentar_diario:
            preferenciasSeguras.quemPodeComentarDiario,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      return { ok: false, erro: error.message };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro: obterMensagemErro(
        error,
        "Não foi possível salvar a privacidade.",
      ),
    };
  }
}

export async function usuarioPodeVerPerfil(
  perfilUserId: string,
): Promise<boolean> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc("usuario_pode_ver_perfil", {
      p_user_id: perfilUserIdLimpo,
    });

    return !error && data === true;
  } catch {
    return false;
  }
}

export async function usuarioPodeVerAbaPerfil(
  perfilUserId: string,
  visibilidade: VisibilidadeAbaPerfil,
): Promise<boolean> {
  const perfilUserIdLimpo = perfilUserId.trim();
  const visibilidadeSegura = normalizarVisibilidadeAba(
    visibilidade,
    "somente_eu",
  );

  if (!perfilUserIdLimpo) {
    return false;
  }

  if (visibilidadeSegura === "publico") {
    return true;
  }

  try {
    const { data, error } = await supabase.rpc(
      "usuario_pode_ver_aba_perfil",
      {
        p_user_id: perfilUserIdLimpo,
        p_visibilidade: visibilidadeSegura,
      },
    );

    return !error && data === true;
  } catch {
    return false;
  }
}

export async function carregarPermissoesAbasPerfil(
  perfilUserId: string,
  preferencias: PreferenciasPrivacidadeHistorietas =
    preferenciasPrivacidadePadrao,
): Promise<PermissoesAbasPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();
  const preferenciasSeguras = normalizarPreferenciasPrivacidade(preferencias);
  const fallback = criarPermissoesPublicas(preferenciasSeguras);

  if (!perfilUserIdLimpo) {
    return { ...permissoesAbasPerfilPadrao, ...fallback };
  }

  try {
    const { data, error } = await supabase.rpc(
      "carregar_permissoes_abas_perfil",
      { p_user_id: perfilUserIdLimpo },
    );

    if (error) {
      return fallback;
    }

    return normalizarPermissoesAbasPerfil(data, fallback);
  } catch {
    return fallback;
  }
}

export async function carregarEstadoRelacionamentoPerfil(
  perfilUserId: string,
  usuarioAtualId: string,
): Promise<EstadoRelacionamentoPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();
  const usuarioAtualIdLimpo = usuarioAtualId.trim();

  if (!perfilUserIdLimpo || !usuarioAtualIdLimpo) {
    return "nenhum";
  }

  if (perfilUserIdLimpo === usuarioAtualIdLimpo) {
    return "proprio_perfil";
  }

  try {
    const [
      { data: seguindoData, error: seguindoError },
      { data: solicitacaoData, error: solicitacaoError },
    ] = await Promise.all([
      supabase
        .from("seguindo_usuarios")
        .select("seguido_id")
        .eq("seguidor_id", usuarioAtualIdLimpo)
        .eq("seguido_id", perfilUserIdLimpo)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("solicitacoes_seguidores")
        .select("id")
        .eq("solicitante_id", usuarioAtualIdLimpo)
        .eq("destinatario_id", perfilUserIdLimpo)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!seguindoError && seguindoData) {
      return "seguindo";
    }

    if (!solicitacaoError && solicitacaoData) {
      return "solicitado";
    }

    return "nenhum";
  } catch {
    return "nenhum";
  }
}

export async function solicitarOuSeguirUsuario(
  perfilUserId: string,
): Promise<ResultadoRelacionamentoPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return { ok: false, estado: "nenhum", erro: "Usuário inválido." };
  }

  return executarAcaoRelacionamentoUnica(perfilUserIdLimpo, async () => {
    try {
      const usuarioAtualId = await obterUsuarioAtualIdRelacionamento();

      if (usuarioAtualId === perfilUserIdLimpo) {
        return {
          ok: false,
          estado: "proprio_perfil",
          erro: "Você não pode seguir o próprio perfil.",
        };
      }

      if (usuarioAtualId) {
        const estadoAtual = await carregarEstadoRelacionamentoPerfil(
          perfilUserIdLimpo,
          usuarioAtualId,
        );

        if (estadoAtual === "seguindo" || estadoAtual === "solicitado") {
          return { ok: true, estado: estadoAtual, erro: "" };
        }
      }

      const { data, error } = await supabase.rpc(
        "solicitar_ou_seguir_usuario",
        { p_seguido_id: perfilUserIdLimpo },
      );

      if (error) {
        return { ok: false, estado: "nenhum", erro: error.message };
      }

      const estado = normalizarEstadoRelacionamento(data);

      if (estado === "solicitado" && usuarioAtualId) {
        await manterSomenteSolicitacaoMaisRecente(
          usuarioAtualId,
          perfilUserIdLimpo,
        );
      } else if (estado === "seguindo" && usuarioAtualId) {
        await removerSolicitacoesPendentesRelacionamento(
          usuarioAtualId,
          perfilUserIdLimpo,
        );
      }

      if (estado !== "nenhum") {
        avisarRelacionamentoPerfilAtualizado(perfilUserIdLimpo, estado);
      }

      return {
        ok: estado !== "nenhum",
        estado,
        erro:
          estado === "nenhum" ? "Não foi possível seguir este usuário." : "",
      };
    } catch (error) {
      return {
        ok: false,
        estado: "nenhum",
        erro: obterMensagemErro(
          error,
          "Não foi possível seguir este usuário.",
        ),
      };
    }
  });
}

export async function cancelarSolicitacaoSeguidor(
  perfilUserId: string,
): Promise<ResultadoRelacionamentoPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return { ok: false, estado: "solicitado", erro: "Usuário inválido." };
  }

  return executarAcaoRelacionamentoUnica(perfilUserIdLimpo, async () => {
    try {
      const usuarioAtualId = await obterUsuarioAtualIdRelacionamento();
      const { data, error } = await supabase.rpc(
        "cancelar_solicitacao_seguidor",
        { p_seguido_id: perfilUserIdLimpo },
      );

      if (error) {
        return {
          ok: false,
          estado: "solicitado",
          erro: error.message,
        };
      }

      if (usuarioAtualId) {
        await removerSolicitacoesPendentesRelacionamento(
          usuarioAtualId,
          perfilUserIdLimpo,
        );

        const estadoAtual = await carregarEstadoRelacionamentoPerfil(
          perfilUserIdLimpo,
          usuarioAtualId,
        );

        if (estadoAtual === "solicitado") {
          return {
            ok: false,
            estado: "solicitado",
            erro: "A solicitação ainda aparece como pendente.",
          };
        }

        const estadoFinal =
          estadoAtual === "seguindo" ? "seguindo" : "nenhum";
        avisarRelacionamentoPerfilAtualizado(
          perfilUserIdLimpo,
          estadoFinal,
        );

        return { ok: true, estado: estadoFinal, erro: "" };
      }

      if (data !== true) {
        return {
          ok: false,
          estado: "solicitado",
          erro: "Não foi possível cancelar a solicitação.",
        };
      }

      avisarRelacionamentoPerfilAtualizado(perfilUserIdLimpo, "nenhum");
      return { ok: true, estado: "nenhum", erro: "" };
    } catch (error) {
      return {
        ok: false,
        estado: "solicitado",
        erro: obterMensagemErro(
          error,
          "Não foi possível cancelar a solicitação.",
        ),
      };
    }
  });
}

export async function deixarDeSeguirUsuario(
  perfilUserId: string,
): Promise<ResultadoRelacionamentoPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return { ok: false, estado: "seguindo", erro: "Usuário inválido." };
  }

  return executarAcaoRelacionamentoUnica(perfilUserIdLimpo, async () => {
    try {
      const usuarioAtualId = await obterUsuarioAtualIdRelacionamento();
      const { data, error } = await supabase.rpc("deixar_de_seguir_usuario", {
        p_seguido_id: perfilUserIdLimpo,
      });

      if (error || data !== true) {
        return {
          ok: false,
          estado: "seguindo",
          erro: error?.message || "Não foi possível deixar de seguir.",
        };
      }

      if (usuarioAtualId) {
        await removerSolicitacoesPendentesRelacionamento(
          usuarioAtualId,
          perfilUserIdLimpo,
        );
      }

      avisarRelacionamentoPerfilAtualizado(perfilUserIdLimpo, "nenhum");
      return { ok: true, estado: "nenhum", erro: "" };
    } catch (error) {
      return {
        ok: false,
        estado: "seguindo",
        erro: obterMensagemErro(error, "Não foi possível deixar de seguir."),
      };
    }
  });
}


export async function carregarEstadoBloqueioPerfil(
  perfilUserId: string,
): Promise<EstadoBloqueioPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return { ...estadoBloqueioPerfilPadrao };
  }

  try {
    const usuarioAtualId = await obterUsuarioAtualIdRelacionamento();

    if (!usuarioAtualId || usuarioAtualId === perfilUserIdLimpo) {
      return { ...estadoBloqueioPerfilPadrao };
    }

    const { data, error } = await supabase.rpc(
      "carregar_estado_bloqueio_usuario",
      { p_outro_user_id: perfilUserIdLimpo },
    );

    if (error) {
      return { ...estadoBloqueioPerfilPadrao };
    }

    return normalizarEstadoBloqueioPerfil(data);
  } catch {
    return { ...estadoBloqueioPerfilPadrao };
  }
}

export async function bloquearUsuario(
  perfilUserId: string,
): Promise<ResultadoBloqueioPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return {
      ok: false,
      estado: { ...estadoBloqueioPerfilPadrao },
      erro: "Usuário inválido.",
    };
  }

  return executarAcaoBloqueioUnica(perfilUserIdLimpo, async () => {
    try {
      const usuarioAtualId = await obterUsuarioAtualIdRelacionamento();

      if (!usuarioAtualId) {
        return {
          ok: false,
          estado: { ...estadoBloqueioPerfilPadrao },
          erro: "Entre na sua conta para bloquear este usuário.",
        };
      }

      if (usuarioAtualId === perfilUserIdLimpo) {
        return {
          ok: false,
          estado: { ...estadoBloqueioPerfilPadrao },
          erro: "Você não pode bloquear o próprio perfil.",
        };
      }

      const { data, error } = await supabase.rpc("bloquear_usuario", {
        p_bloqueado_id: perfilUserIdLimpo,
      });

      if (error || data !== true) {
        return {
          ok: false,
          estado: { ...estadoBloqueioPerfilPadrao },
          erro: error?.message || "Não foi possível bloquear este usuário.",
        };
      }

      const estado: EstadoBloqueioPerfil = {
        bloqueadoPorMim: true,
        bloqueadoPeloPerfil: false,
        existeBloqueio: true,
      };

      avisarBloqueioUsuarioAtualizado(perfilUserIdLimpo, estado);
      avisarRelacionamentoPerfilAtualizado(perfilUserIdLimpo, "nenhum");

      return { ok: true, estado, erro: "" };
    } catch (error) {
      return {
        ok: false,
        estado: { ...estadoBloqueioPerfilPadrao },
        erro: obterMensagemErro(
          error,
          "Não foi possível bloquear este usuário.",
        ),
      };
    }
  });
}

export async function desbloquearUsuario(
  perfilUserId: string,
): Promise<ResultadoBloqueioPerfil> {
  const perfilUserIdLimpo = perfilUserId.trim();

  if (!perfilUserIdLimpo) {
    return {
      ok: false,
      estado: { ...estadoBloqueioPerfilPadrao },
      erro: "Usuário inválido.",
    };
  }

  return executarAcaoBloqueioUnica(perfilUserIdLimpo, async () => {
    try {
      const usuarioAtualId = await obterUsuarioAtualIdRelacionamento();

      if (!usuarioAtualId) {
        return {
          ok: false,
          estado: { ...estadoBloqueioPerfilPadrao },
          erro: "Entre na sua conta para desbloquear este usuário.",
        };
      }

      const { data, error } = await supabase.rpc("desbloquear_usuario", {
        p_bloqueado_id: perfilUserIdLimpo,
      });

      if (error || data !== true) {
        return {
          ok: false,
          estado: {
            bloqueadoPorMim: true,
            bloqueadoPeloPerfil: false,
            existeBloqueio: true,
          },
          erro: error?.message || "Não foi possível desbloquear este usuário.",
        };
      }

      const estado = await carregarEstadoBloqueioPerfil(perfilUserIdLimpo);
      avisarBloqueioUsuarioAtualizado(perfilUserIdLimpo, estado);

      return { ok: true, estado, erro: "" };
    } catch (error) {
      return {
        ok: false,
        estado: {
          bloqueadoPorMim: true,
          bloqueadoPeloPerfil: false,
          existeBloqueio: true,
        },
        erro: obterMensagemErro(
          error,
          "Não foi possível desbloquear este usuário.",
        ),
      };
    }
  });
}

export async function usuariosPossuemBloqueio(
  perfilUserId: string,
): Promise<boolean> {
  const estado = await carregarEstadoBloqueioPerfil(perfilUserId);
  return estado.existeBloqueio;
}