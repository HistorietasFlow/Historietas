import { NextResponse, type NextRequest } from "next/server";
import {
  criarSupabaseAdminClient,
  supabaseAdminConfigurado,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CorpoSolicitacao = {
  email?: unknown;
  motivo?: unknown;
  confirmacao?: unknown;
  website?: unknown;
};

function resposta(status: number, corpo: Record<string, unknown>) {
  return NextResponse.json(corpo, {
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
    return new URL(origem).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function POST(request: NextRequest) {
  if (!origemPermitida(request)) {
    return resposta(403, {
      ok: false,
      codigo: "origem_invalida",
      mensagem: "Origem da solicitação inválida.",
    });
  }

  if (!supabaseAdminConfigurado) {
    return resposta(503, {
      ok: false,
      codigo: "configuracao_servidor",
      mensagem: "O formulário de exclusão ainda não foi configurado.",
    });
  }

  let corpo: CorpoSolicitacao;

  try {
    corpo = (await request.json()) as CorpoSolicitacao;
  } catch {
    return resposta(400, {
      ok: false,
      codigo: "requisicao_invalida",
      mensagem: "Solicitação inválida.",
    });
  }

  const website = typeof corpo.website === "string" ? corpo.website.trim() : "";

  if (website) {
    return resposta(200, { ok: true });
  }

  const email =
    typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const motivo =
    typeof corpo.motivo === "string" ? corpo.motivo.trim().slice(0, 1000) : "";
  const confirmacao = corpo.confirmacao === true;

  if (!emailValido(email)) {
    return resposta(400, {
      ok: false,
      codigo: "email_invalido",
      mensagem: "Digite um endereço de e-mail válido.",
    });
  }

  if (!confirmacao) {
    return resposta(400, {
      ok: false,
      codigo: "confirmacao_obrigatoria",
      mensagem: "Confirme que deseja solicitar a exclusão da conta.",
    });
  }

  try {
    const admin = criarSupabaseAdminClient();
    const { error } = await admin.from("solicitacoes_exclusao_conta").insert({
      email,
      motivo: motivo || null,
      origem: "pagina_publica",
      status: "pendente",
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    });

    if (error && error.code !== "23505") {
      console.error("Não foi possível registrar solicitação de exclusão:", error);

      return resposta(500, {
        ok: false,
        codigo: "registro_falhou",
        mensagem: "Não foi possível registrar sua solicitação agora.",
      });
    }

    return resposta(200, { ok: true });
  } catch (error) {
    console.error("Erro inesperado ao solicitar exclusão:", error);

    return resposta(500, {
      ok: false,
      codigo: "erro_inesperado",
      mensagem: "Não foi possível registrar sua solicitação agora.",
    });
  }
}
