import { supabase } from "../../../lib/supabase/client";

export type QuemPodeComentarDiario =
  | "todos"
  | "seguidores"
  | "seguindo"
  | "ninguem";
export type QuemPodeAvaliarDiario =
  | "todos"
  | "seguidores"
  | "seguindo"
  | "ninguem";
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
  quemPodeComentarDiario: QuemPodeComentarDiario;
  visibilidadeAvaliacaoDiario: VisibilidadeAbaPerfil;
  mostrarAvaliacaoDiario: boolean;
  permitirAvaliacaoDiario: boolean;
  quemPodeAvaliarDiario: QuemPodeAvaliarDiario;
};

const PRIVACIDADE_STORAGE_KEY = "historietas-privacidade";
const PRIVACIDADE_ATUALIZADA_EVENT =
  "historietas:privacidade-atualizada";

export const preferenciasPrivacidadePadrao: PreferenciasPrivacidadeHistorietas = {
  perfilPrivado: false,
  aprovarNovosSeguidores: false,
  visibilidadeObras: "publico",
  visibilidadeSobre: "publico",
  visibilidadeDiario: "publico",
  visibilidadeComunidade: "publico",
  visibilidadeBiblioteca: "somente_eu",
  visibilidadeAtividades: "seguidores",
  quemPodeComentarDiario: "seguidores",
  visibilidadeAvaliacaoDiario: "publico",
  mostrarAvaliacaoDiario: true,
  permitirAvaliacaoDiario: true,
  quemPodeAvaliarDiario: "seguidores",
};

function criarChavePrivacidadeUsuario(userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${PRIVACIDADE_STORAGE_KEY}:${userIdLimpo}` : "";
}

function normalizarBooleanoPrivacidade(valor: unknown, fallback: boolean) {
  return typeof valor === "boolean" ? valor : fallback;
}

function normalizarVisibilidadeAba(
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

function normalizarQuemPodeComentarDiario(
  valor: unknown,
): QuemPodeComentarDiario {
  return valor === "seguidores" ||
    valor === "seguindo" ||
    valor === "ninguem" ||
    valor === "todos"
    ? valor
    : preferenciasPrivacidadePadrao.quemPodeComentarDiario;
}

function normalizarQuemPodeAvaliarDiario(
  valor: unknown,
): QuemPodeAvaliarDiario {
  return valor === "seguidores" ||
    valor === "seguindo" ||
    valor === "ninguem" ||
    valor === "todos"
    ? valor
    : preferenciasPrivacidadePadrao.quemPodeAvaliarDiario;
}

function normalizarPreferenciasPrivacidade(
  valor: unknown,
): PreferenciasPrivacidadeHistorietas {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...preferenciasPrivacidadePadrao };
  }

  const registro = valor as Record<string, unknown>;
  const perfilPrivado = normalizarBooleanoPrivacidade(
    registro.perfilPrivado ?? registro.perfil_privado,
    preferenciasPrivacidadePadrao.perfilPrivado,
  );
  const mostrarObrasLegado = normalizarBooleanoPrivacidade(
    registro.mostrarObrasParaTodos ?? registro.mostrar_obras_para_todos,
    true,
  );
  const mostrarSobreLegado = normalizarBooleanoPrivacidade(
    registro.mostrarSobreParaTodos ?? registro.mostrar_sobre_para_todos,
    true,
  );
  const mostrarDiarioLegado = normalizarBooleanoPrivacidade(
    registro.mostrarDiarioNoPerfil ?? registro.mostrar_diario_perfil,
    true,
  );
  const mostrarAtividadesLegado = normalizarBooleanoPrivacidade(
    registro.mostrarAtividadesLeitura ?? registro.mostrar_atividades_leitura,
    true,
  );
  const mostrarAvaliacaoDiarioLegado = normalizarBooleanoPrivacidade(
    registro.mostrarAvaliacaoDiario ??
      registro.mostrar_avaliacao_diario,
    preferenciasPrivacidadePadrao.mostrarAvaliacaoDiario,
  );
  const permitirAvaliacaoDiarioLegado = normalizarBooleanoPrivacidade(
    registro.permitirAvaliacaoDiario ??
      registro.permitir_avaliacao_diario,
    preferenciasPrivacidadePadrao.permitirAvaliacaoDiario,
  );
  const visibilidadeAvaliacaoDiario = normalizarVisibilidadeAba(
    registro.visibilidadeAvaliacaoDiario ??
      registro.visibilidade_avaliacao_diario,
    mostrarAvaliacaoDiarioLegado ? "publico" : "somente_eu",
  );
  const quemPodeAvaliarDiarioNormalizado =
    normalizarQuemPodeAvaliarDiario(
      registro.quemPodeAvaliarDiario ??
        registro.quem_pode_avaliar_diario,
    );
  const quemPodeAvaliarDiario = permitirAvaliacaoDiarioLegado
    ? quemPodeAvaliarDiarioNormalizado
    : "ninguem";

  return {
    perfilPrivado,
    aprovarNovosSeguidores: normalizarBooleanoPrivacidade(
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
    quemPodeComentarDiario: normalizarQuemPodeComentarDiario(
      registro.quemPodeComentarDiario ??
        registro.quem_pode_comentar_diario,
    ),
    visibilidadeAvaliacaoDiario,
    mostrarAvaliacaoDiario:
      visibilidadeAvaliacaoDiario !== "somente_eu",
    permitirAvaliacaoDiario: quemPodeAvaliarDiario !== "ninguem",
    quemPodeAvaliarDiario,
  };
}

function carregarPreferenciasPrivacidadeLocal(
  userId: string,
): PreferenciasPrivacidadeHistorietas {
  if (typeof window === "undefined" || !userId.trim()) {
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

function salvarPreferenciasPrivacidadeLocal(
  preferencias: PreferenciasPrivacidadeHistorietas,
  userId: string,
) {
  if (typeof window === "undefined" || !userId.trim()) {
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
  opcoes: { usarFallbackLocal?: boolean; exigirConfirmacao?: boolean; execucaoEstaAtual?: () => boolean } = {},
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
    if (opcoes.exigirConfirmacao) {
      // Ao retornar à mesma conta, confirme depois de suas escritas em voo.
      await filasPrivacidade.get(userIdLimpo)?.catch(() => {});
      if (opcoes.execucaoEstaAtual && !opcoes.execucaoEstaAtual()) {
        throw new Error("Conta alterada.");
      }
    }
    let resultado = await supabase
      .from("preferencias_privacidade")
      .select(
        "perfil_privado,aprovar_novos_seguidores,visibilidade_obras,visibilidade_sobre,visibilidade_diario,visibilidade_comunidade,visibilidade_biblioteca,visibilidade_atividades,quem_pode_comentar_diario,visibilidade_avaliacao_diario,mostrar_avaliacao_diario,permitir_avaliacao_diario,quem_pode_avaliar_diario",
      )
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (resultado.error) {
      resultado = await supabase
        .from("preferencias_privacidade")
        .select(
          "perfil_privado,aprovar_novos_seguidores,visibilidade_obras,visibilidade_sobre,visibilidade_diario,visibilidade_comunidade,visibilidade_biblioteca,visibilidade_atividades,quem_pode_comentar_diario,mostrar_avaliacao_diario,permitir_avaliacao_diario,quem_pode_avaliar_diario",
        )
        .eq("user_id", userIdLimpo)
        .maybeSingle();
    }

    if (resultado.error) {
      if (opcoes.exigirConfirmacao) throw new Error(resultado.error.message);
      return fallback;
    }
    if (!resultado.data) {
      return opcoes.exigirConfirmacao ? { ...preferenciasPrivacidadePadrao } : fallback;
    }

    const preferencias = normalizarPreferenciasPrivacidade(resultado.data);

    if (usarFallbackLocal && (opcoes.execucaoEstaAtual?.() ?? true)) {
      salvarPreferenciasPrivacidadeLocal(preferencias, userIdLimpo);
    }

    return preferencias;
  } catch (error) {
    if (opcoes.exigirConfirmacao) throw error;
    return fallback;
  }
}

const filasPrivacidade = new Map<string, Promise<unknown>>();

export async function salvarPreferenciasPrivacidade(
  preferencias: PreferenciasPrivacidadeHistorietas,
  userId: string,
  opcoes: { execucaoEstaAtual?: () => boolean } = {},
) {
  const userIdLimpo = userId.trim();
  const preferenciasSeguras = normalizarPreferenciasPrivacidade(preferencias);

  if (!userIdLimpo) {
    return { ok: false, erro: "Usuário inválido." };
  }

  // Todas as gravações desta tela compartilham a ordem por conta.
  const anterior = filasPrivacidade.get(userIdLimpo) ?? Promise.resolve();
  const tarefa = anterior.catch(() => {}).then(async () => {
    if (opcoes.execucaoEstaAtual && !opcoes.execucaoEstaAtual()) {
      return { ok: false, erro: "Conta alterada." };
    }
    return persistirPrivacidadeConfirmada(preferenciasSeguras, userIdLimpo, opcoes);
  });
  filasPrivacidade.set(userIdLimpo, tarefa);
  try {
    return await tarefa;
  } finally {
    if (filasPrivacidade.get(userIdLimpo) === tarefa) filasPrivacidade.delete(userIdLimpo);
  }
}

async function persistirPrivacidadeConfirmada(
  preferenciasSeguras: PreferenciasPrivacidadeHistorietas,
  userIdLimpo: string,
  opcoes: { execucaoEstaAtual?: () => boolean },
) {
  const payloadLegado = {
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
    quem_pode_comentar_diario:
      preferenciasSeguras.quemPodeComentarDiario,
    mostrar_avaliacao_diario:
      preferenciasSeguras.mostrarAvaliacaoDiario,
    permitir_avaliacao_diario:
      preferenciasSeguras.permitirAvaliacaoDiario,
    quem_pode_avaliar_diario:
      preferenciasSeguras.quemPodeAvaliarDiario,
    atualizado_em: new Date().toISOString(),
  };

  try {
    let resultado = await supabase.from("preferencias_privacidade").upsert(
      {
        ...payloadLegado,
        visibilidade_avaliacao_diario:
          preferenciasSeguras.visibilidadeAvaliacaoDiario,
      },
      { onConflict: "user_id" },
    ).select().single();

    // Compatibilidade somente com a coluna ausente; falhas de rede/RLS não
    // autorizam uma segunda escrita nem a perda silenciosa de granularidade.
    if (resultado.error && ["PGRST204", "42703"].includes(resultado.error.code) &&
        resultado.error.message.includes("visibilidade_avaliacao_diario") &&
        ["publico", "somente_eu"].includes(preferenciasSeguras.visibilidadeAvaliacaoDiario) &&
        (opcoes.execucaoEstaAtual?.() ?? true)) {
      resultado = await supabase.from("preferencias_privacidade").upsert(
        payloadLegado,
        { onConflict: "user_id" },
      ).select().single();
    }

    if (resultado.error) {
      return { ok: false, erro: resultado.error.message };
    }

    if (!resultado.data || resultado.data.user_id !== userIdLimpo) {
      return { ok: false, erro: "Não foi possível confirmar a privacidade salva." };
    }
    const confirmadas = normalizarPreferenciasPrivacidade(resultado.data);
    if (opcoes.execucaoEstaAtual?.() ?? true) {
      salvarPreferenciasPrivacidadeLocal(confirmadas, userIdLimpo);
    }
    const ok = (Object.keys(preferenciasSeguras) as (keyof PreferenciasPrivacidadeHistorietas)[])
      .every(campo => preferenciasSeguras[campo] === confirmadas[campo]);
    return { ok, erro: ok ? "" : "O servidor não confirmou a alteração solicitada.", preferencias: confirmadas };
  } catch (error) {
    return {
      ok: false,
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a privacidade.",
    };
  }
}
