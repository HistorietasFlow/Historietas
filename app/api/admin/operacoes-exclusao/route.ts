import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  buscarOperacaoPorId,
  erroOperacaoEmAndamento,
  processarOperacaoExclusaoConta,
} from "@/lib/server/exclusaoConta";
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

type CorpoRecuperacao = { id?: unknown };

function resposta(status: number, dados: Record<string, unknown>) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function origemPermitida(request: NextRequest) {
  const origem = request.headers.get("origin");
  if (!origem) return false;

  try {
    const hostEncaminhado = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
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
  if (valor === true) return true;
  if (typeof valor !== "string") return false;
  return ["true", "1", "yes"].includes(valor.trim().toLowerCase());
}

function usuarioEhAdministradorEstrito(
  appMetadata: Record<string, unknown> | null | undefined,
) {
  if (!appMetadata) return false;

  const camposCargo = [appMetadata.role, appMetadata.cargo, appMetadata.tipo_usuario];
  if (
    camposCargo.some(
      (valor) => typeof valor === "string" && valor.trim().toLowerCase() === "admin",
    )
  ) {
    return true;
  }

  if (valorVerdadeiro(appMetadata.admin) || valorVerdadeiro(appMetadata.is_admin)) {
    return true;
  }

  const roles = appMetadata.roles;
  return Array.isArray(roles)
    ? roles.some(
        (valor) => typeof valor === "string" && valor.trim().toLowerCase() === "admin",
      )
    : false;
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
  const { data: dadosUsuario, error: erroUsuario } = await supabaseServer.auth.getUser();
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
        mensagem: "Apenas administradores podem recuperar exclusões de conta.",
      }),
      admin: null,
    };
  }

  return { erro: null, admin: criarSupabaseAdminClient() };
}

export async function POST(request: NextRequest) {
  if (!origemPermitida(request)) {
    return resposta(403, {
      ok: false,
      codigo: "origem_invalida",
      mensagem: "Origem da solicitação inválida.",
    });
  }

  const autorizacao = await autorizarAdministrador();
  if (autorizacao.erro || !autorizacao.admin) return autorizacao.erro;

  let corpo: CorpoRecuperacao;
  try {
    corpo = (await request.json()) as CorpoRecuperacao;
  } catch {
    return resposta(400, {
      ok: false,
      codigo: "requisicao_invalida",
      mensagem: "Solicitação inválida.",
    });
  }

  const id = typeof corpo.id === "string" ? corpo.id.trim() : "";
  if (!id) {
    return resposta(400, {
      ok: false,
      codigo: "id_obrigatorio",
      mensagem: "Informe a operação de exclusão que será recuperada.",
    });
  }

  try {
    const operacao = await buscarOperacaoPorId(autorizacao.admin, id);
    if (!operacao) {
      return resposta(404, {
        ok: false,
        codigo: "operacao_nao_encontrada",
        mensagem: "A operação de exclusão não foi encontrada.",
      });
    }

    if (operacao.status === "concluida") {
      return resposta(200, {
        ok: true,
        exclusaoConcluida: true,
        operacaoId: operacao.id,
      });
    }

    const recuperacaoPosAuth =
      operacao.status === "falhou" && Boolean(operacao.auth_excluido_em);
    const exclusaoAuthInterrompida = operacao.status === "excluindo_auth";

    if (!recuperacaoPosAuth && !exclusaoAuthInterrompida) {
      return resposta(409, {
        ok: false,
        codigo: "operacao_nao_recuperavel",
        mensagem:
          "Esta operação não está em um estado seguro para recuperação administrativa.",
        operacaoId: operacao.id,
        statusOperacao: operacao.status,
      });
    }

    let resultado;
    try {
      resultado = await processarOperacaoExclusaoConta({
        admin: autorizacao.admin,
        userId: operacao.subject_user_id,
        lockToken: randomUUID(),
      });
    } catch (error) {
      if (erroOperacaoEmAndamento(error)) {
        return resposta(409, {
          ok: false,
          codigo: "exclusao_em_andamento",
          mensagem: "Esta exclusão já está sendo processada. Aguarde o lock expirar ou o processamento terminar.",
        });
      }
      throw error;
    }

    if (resultado.operacao.id !== operacao.id) {
      console.error("A recuperação reivindicou uma operação diferente da solicitada.");
      return resposta(409, {
        ok: false,
        codigo: "operacao_divergente",
        mensagem: "A operação mudou durante a recuperação. Recarregue os dados antes de tentar novamente.",
      });
    }

    if (resultado.storageFinalPendente || resultado.operacao.status === "falhou") {
      return resposta(202, {
        ok: true,
        exclusaoConcluida: false,
        acompanhamentoPendente: true,
        operacaoId: resultado.operacao.id,
        statusOperacao: resultado.operacao.status,
      });
    }

    return resposta(200, {
      ok: true,
      exclusaoConcluida: resultado.operacao.status === "concluida",
      acompanhamentoPendente: resultado.operacao.status !== "concluida",
      operacaoId: resultado.operacao.id,
      statusOperacao: resultado.operacao.status,
    });
  } catch (error) {
    console.error("Não foi possível recuperar a exclusão de conta:", error);
    return resposta(500, {
      ok: false,
      codigo: "recuperacao_falhou",
      mensagem: "Não foi possível recuperar a exclusão de conta agora.",
    });
  }
}
