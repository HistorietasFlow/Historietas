import { NextResponse, type NextRequest } from "next/server";
import {
  criarSupabaseAdminClient,
  supabaseAdminConfigurado,
} from "@/lib/supabase/admin";
import {
  criarSupabaseServerClient,
  supabaseServerConfigurado,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_PERMITIDOS = new Set([
  "pendente",
  "verificando",
  "concluida",
  "recusada",
  "cancelada",
]);

type CorpoAtualizacao = {
  id?: unknown;
  status?: unknown;
  observacaoInterna?: unknown;
};

function resposta(status: number, dados: Record<string, unknown>) {
  return NextResponse.json(dados, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function origemPermitida(request: NextRequest) {
  const origem = request.headers.get("origin");

  if (!origem) {
    return true;
  }

  try {
    const hostEncaminhado = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const hostRecebido = request.headers.get("host")?.trim();
    const hostsPermitidos = new Set(
      [hostEncaminhado, hostRecebido, request.nextUrl.host].filter(
        (host): host is string => Boolean(host),
      ),
    );

    return hostsPermitidos.has(new URL(origem).host);
  } catch {
    return false;
  }
}

function valorVerdadeiro(valor: unknown) {
  if (valor === true) {
    return true;
  }

  if (typeof valor !== "string") {
    return false;
  }

  return ["true", "1", "yes"].includes(valor.trim().toLowerCase());
}

function usuarioEhAdministradorEstrito(
  appMetadata: Record<string, unknown> | null | undefined,
) {
  if (!appMetadata) {
    return false;
  }

  const camposCargo = [
    appMetadata.role,
    appMetadata.cargo,
    appMetadata.tipo_usuario,
  ];

  if (
    camposCargo.some(
      (valor) =>
        typeof valor === "string" &&
        valor.trim().toLowerCase() === "admin",
    )
  ) {
    return true;
  }

  if (
    valorVerdadeiro(appMetadata.admin) ||
    valorVerdadeiro(appMetadata.is_admin)
  ) {
    return true;
  }

  const roles = appMetadata.roles;

  if (Array.isArray(roles)) {
    return roles.some(
      (valor) =>
        typeof valor === "string" &&
        valor.trim().toLowerCase() === "admin",
    );
  }

  return false;
}

async function autorizarAdministrador() {
  if (!supabaseServerConfigurado || !supabaseAdminConfigurado) {
    return {
      erro: resposta(503, {
        ok: false,
        codigo: "configuracao_servidor",
        mensagem: "A área administrativa ainda não foi configurada no servidor.",
      }),
      admin: null,
    };
  }

  const supabaseServer = await criarSupabaseServerClient();
  const { data: dadosUsuario, error: erroUsuario } =
    await supabaseServer.auth.getUser();
  const usuario = dadosUsuario.user;

  if (erroUsuario || !usuario) {
    return {
      erro: resposta(401, {
        ok: false,
        codigo: "nao_autenticado",
        mensagem: "Entre na sua conta para acessar esta área.",
      }),
      admin: null,
    };
  }

  const { data: usuarioAdmin, error: erroAdmin } =
    await supabaseServer.rpc("usuario_e_admin");

  if (
    erroAdmin ||
    usuarioAdmin !== true ||
    !usuarioEhAdministradorEstrito(
      (usuario.app_metadata || {}) as Record<string, unknown>,
    )
  ) {
    return {
      erro: resposta(403, {
        ok: false,
        codigo: "acesso_negado",
        mensagem: "Apenas administradores podem acessar solicitações de exclusão.",
      }),
      admin: null,
    };
  }

  return {
    erro: null,
    admin: criarSupabaseAdminClient(),
  };
}

export async function GET() {
  const autorizacao = await autorizarAdministrador();

  if (autorizacao.erro || !autorizacao.admin) {
    return autorizacao.erro;
  }

  try {
    const { data, error } = await autorizacao.admin
      .from("solicitacoes_exclusao_conta")
      .select(
        "id,email,motivo,origem,status,user_agent,criada_em,atualizada_em,processada_em,observacao_interna",
      )
      .order("criada_em", { ascending: false })
      .limit(300);

    if (error) {
      throw error;
    }

    return resposta(200, {
      ok: true,
      solicitacoes: data || [],
    });
  } catch (error) {
    console.error(
      "Não foi possível carregar solicitações de exclusão de conta:",
      error,
    );

    return resposta(500, {
      ok: false,
      codigo: "carregamento_falhou",
      mensagem: "Não foi possível carregar as solicitações de exclusão.",
    });
  }
}

export async function PATCH(request: NextRequest) {
  if (!origemPermitida(request)) {
    return resposta(403, {
      ok: false,
      codigo: "origem_invalida",
      mensagem: "Origem da solicitação inválida.",
    });
  }

  const autorizacao = await autorizarAdministrador();

  if (autorizacao.erro || !autorizacao.admin) {
    return autorizacao.erro;
  }

  let corpo: CorpoAtualizacao;

  try {
    corpo = (await request.json()) as CorpoAtualizacao;
  } catch {
    return resposta(400, {
      ok: false,
      codigo: "requisicao_invalida",
      mensagem: "Solicitação inválida.",
    });
  }

  const id = typeof corpo.id === "string" ? corpo.id.trim() : "";
  const status =
    typeof corpo.status === "string" ? corpo.status.trim().toLowerCase() : "";
  const observacaoInterna =
    typeof corpo.observacaoInterna === "string"
      ? corpo.observacaoInterna.trim()
      : "";

  if (!id) {
    return resposta(400, {
      ok: false,
      codigo: "id_obrigatorio",
      mensagem: "Informe a solicitação que será atualizada.",
    });
  }

  if (!STATUS_PERMITIDOS.has(status)) {
    return resposta(400, {
      ok: false,
      codigo: "status_invalido",
      mensagem: "O status informado é inválido.",
    });
  }

  if (observacaoInterna.length > 4000) {
    return resposta(400, {
      ok: false,
      codigo: "observacao_muito_longa",
      mensagem: "A observação interna pode ter no máximo 4000 caracteres.",
    });
  }

  const agora = new Date().toISOString();
  const statusFinal =
    status === "concluida" ||
    status === "recusada" ||
    status === "cancelada";

  try {
    const { data, error } = await autorizacao.admin
      .from("solicitacoes_exclusao_conta")
      .update({
        status,
        observacao_interna: observacaoInterna || null,
        atualizada_em: agora,
        processada_em: statusFinal ? agora : null,
      })
      .eq("id", id)
      .select(
        "id,email,motivo,origem,status,user_agent,criada_em,atualizada_em,processada_em,observacao_interna",
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return resposta(404, {
        ok: false,
        codigo: "solicitacao_nao_encontrada",
        mensagem: "A solicitação não foi encontrada.",
      });
    }

    return resposta(200, {
      ok: true,
      solicitacao: data,
    });
  } catch (error) {
    console.error(
      "Não foi possível atualizar solicitação de exclusão de conta:",
      error,
    );

    return resposta(500, {
      ok: false,
      codigo: "atualizacao_falhou",
      mensagem: "Não foi possível atualizar a solicitação de exclusão.",
    });
  }
}