import { NextResponse, type NextRequest } from "next/server";
import {
  consumirLimiteRequisicao,
  obterIpConfiavel,
} from "@/lib/server/protecaoAbuso";
import {
  criarSupabaseAdminClient,
  supabaseAdminConfigurado,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TAMANHO_MAXIMO_CORPO = 8_192;

type CorpoSolicitacao = {
  email?: unknown;
  motivo?: unknown;
  confirmacao?: unknown;
  website?: unknown;
};

function resposta(
  status: number,
  corpo: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function origemPermitida(request: NextRequest) {
  const origem = request.headers.get("origin");

  if (!origem) {
    return false;
  }

  try {
    const origemRecebida = new URL(origem).origin;
    const hostEncaminhado = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const protocoloEncaminhado = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const hostRecebido = request.headers.get("host")?.trim();
    const origensPermitidas = new Set([request.nextUrl.origin]);

    if (
      hostEncaminhado &&
      (protocoloEncaminhado === "https" || protocoloEncaminhado === "http")
    ) {
      origensPermitidas.add(`${protocoloEncaminhado}://${hostEncaminhado}`);
    }

    if (hostRecebido) {
      origensPermitidas.add(`${request.nextUrl.protocol}//${hostRecebido}`);
    }

    return origensPermitidas.has(origemRecebida);
  } catch {
    return false;
  }
}

function requisicaoJson(request: NextRequest) {
  const tipoConteudo = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();

  return tipoConteudo === "application/json";
}

async function lerCorpo(request: NextRequest) {
  const tamanhoDeclarado = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(tamanhoDeclarado) &&
    tamanhoDeclarado > TAMANHO_MAXIMO_CORPO
  ) {
    throw new RangeError("corpo_excedeu_limite");
  }

  const leitor = request.body?.getReader();

  if (!leitor) {
    throw new SyntaxError("corpo_ausente");
  }

  const decodificador = new TextDecoder("utf-8", { fatal: true });
  let tamanhoRecebido = 0;
  let texto = "";

  try {
    while (true) {
      const { done, value } = await leitor.read();

      if (done) {
        break;
      }

      tamanhoRecebido += value.byteLength;

      if (tamanhoRecebido > TAMANHO_MAXIMO_CORPO) {
        throw new RangeError("corpo_excedeu_limite");
      }

      texto += decodificador.decode(value, { stream: true });
    }

    texto += decodificador.decode();
  } catch (error) {
    try {
      await leitor.cancel();
    } catch {
      // A leitura já pode ter sido encerrada pelo runtime.
    }

    throw error;
  } finally {
    leitor.releaseLock();
  }

  const valor: unknown = JSON.parse(texto);

  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    throw new SyntaxError("corpo_invalido");
  }

  return valor as CorpoSolicitacao;
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

  if (!requisicaoJson(request)) {
    return resposta(415, {
      ok: false,
      codigo: "tipo_conteudo_invalido",
      mensagem: "Envie a solicitação em JSON.",
    });
  }

  if (!supabaseAdminConfigurado) {
    return resposta(503, {
      ok: false,
      codigo: "configuracao_servidor",
      mensagem: "O formulário de exclusão ainda não foi configurado.",
    });
  }

  const ip = obterIpConfiavel(request);

  if (!ip) {
    return resposta(503, {
      ok: false,
      codigo: "identidade_indisponivel",
      mensagem: "Não foi possível validar a segurança da solicitação agora.",
    });
  }

  const admin = criarSupabaseAdminClient();

  try {
    const limiteRede = await consumirLimiteRequisicao({
      admin,
      escopo: "solicitacao_exclusao_rede",
      identificador: ip,
      limite: 10,
      janelaSegundos: 15 * 60,
      bloqueioSegundos: 60 * 60,
    });

    if (!limiteRede.permitido) {
      const tentarNovamente = Math.max(
        1,
        limiteRede.tentarNovamenteSegundos,
      );

      return resposta(
        429,
        {
          ok: false,
          codigo: "muitas_tentativas",
          mensagem: "Muitas solicitações. Aguarde antes de tentar novamente.",
        },
        { "Retry-After": String(tentarNovamente) },
      );
    }
  } catch (error) {
    console.error("Não foi possível consultar o limitador da solicitação:", error);

    return resposta(503, {
      ok: false,
      codigo: "protecao_indisponivel",
      mensagem: "Não foi possível validar a segurança da solicitação agora.",
    });
  }

  let corpo: CorpoSolicitacao;

  try {
    corpo = await lerCorpo(request);
  } catch (error) {
    const corpoMuitoGrande = error instanceof RangeError;

    return resposta(corpoMuitoGrande ? 413 : 400, {
      ok: false,
      codigo: corpoMuitoGrande ? "corpo_muito_grande" : "requisicao_invalida",
      mensagem: corpoMuitoGrande
        ? "A solicitação excede o tamanho permitido."
        : "Solicitação inválida.",
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
    const limiteEmail = await consumirLimiteRequisicao({
      admin,
      escopo: "solicitacao_exclusao_email",
      identificador: email,
      limite: 3,
      janelaSegundos: 24 * 60 * 60,
      bloqueioSegundos: 24 * 60 * 60,
    });

    if (!limiteEmail.permitido) {
      const tentarNovamente = Math.max(
        1,
        limiteEmail.tentarNovamenteSegundos,
      );

      return resposta(
        429,
        {
          ok: false,
          codigo: "muitas_tentativas",
          mensagem: "Muitas solicitações. Aguarde antes de tentar novamente.",
        },
        { "Retry-After": String(tentarNovamente) },
      );
    }
  } catch (error) {
    console.error("Não foi possível consultar o limite por e-mail:", error);

    return resposta(503, {
      ok: false,
      codigo: "protecao_indisponivel",
      mensagem: "Não foi possível validar a segurança da solicitação agora.",
    });
  }

  try {
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
