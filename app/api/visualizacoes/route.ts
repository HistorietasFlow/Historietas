import { NextResponse, type NextRequest } from "next/server";
import {
  criarChaveProtecao,
  obterIpConfiavel,
} from "@/lib/server/protecaoAbuso";
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

const TAMANHO_MAXIMO_CORPO = 512;
const UUID_VALIDO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CorpoVisualizacao = {
  tipo?: unknown;
  conteudoId?: unknown;
};

function resposta(
  status: number,
  dados: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return NextResponse.json(dados, {
    status,
    headers: {
      "Cache-Control": "no-store",
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
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .startsWith("application/json");
}

async function lerCorpo(request: NextRequest) {
  const tamanhoDeclarado = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(tamanhoDeclarado) &&
    tamanhoDeclarado > TAMANHO_MAXIMO_CORPO
  ) {
    throw new RangeError("corpo_excedeu_limite");
  }

  const texto = await request.text();

  if (Buffer.byteLength(texto, "utf8") > TAMANHO_MAXIMO_CORPO) {
    throw new RangeError("corpo_excedeu_limite");
  }

  return JSON.parse(texto) as CorpoVisualizacao;
}

async function obterIdentificadorVisitante(request: NextRequest) {
  const supabaseServer = await criarSupabaseServerClient();

  try {
    const { data, error } = await supabaseServer.auth.getUser();

    if (!error && data.user?.id) {
      return `usuario:${data.user.id}`;
    }
  } catch {
    // Visitantes sem uma sessão válida continuam pelo identificador de rede.
  }

  const ip = obterIpConfiavel(request);

  return ip ? `rede:${ip}` : null;
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

  if (!supabaseAdminConfigurado || !supabaseServerConfigurado) {
    return resposta(503, {
      ok: false,
      codigo: "configuracao_servidor",
      mensagem: "O registro de visualizações está temporariamente indisponível.",
    });
  }

  let corpo: CorpoVisualizacao;

  try {
    corpo = await lerCorpo(request);
  } catch (error) {
    const corpoMuitoGrande = error instanceof RangeError;

    return resposta(corpoMuitoGrande ? 413 : 400, {
      ok: false,
      codigo: corpoMuitoGrande ? "corpo_muito_grande" : "requisicao_invalida",
      mensagem: "Solicitação inválida.",
    });
  }

  const tipo = corpo.tipo === "obra" || corpo.tipo === "capitulo"
    ? corpo.tipo
    : null;
  const conteudoId =
    typeof corpo.conteudoId === "string" ? corpo.conteudoId.trim() : "";

  if (!tipo || !UUID_VALIDO.test(conteudoId)) {
    return resposta(400, {
      ok: false,
      codigo: "conteudo_invalido",
      mensagem: "Conteúdo inválido.",
    });
  }

  try {
    const identificador = await obterIdentificadorVisitante(request);

    if (!identificador) {
      return resposta(202, { ok: true, registrada: false });
    }

    const chaveVisitante = criarChaveProtecao(
      "visualizacao_visitante",
      identificador,
    );
    const admin = criarSupabaseAdminClient();
    const nomeRpc = tipo === "obra"
      ? "registrar_visualizacao_obra"
      : "registrar_visualizacao_capitulo";
    const argumentos = tipo === "obra"
      ? { p_obra_id: conteudoId, p_chave_visitante: chaveVisitante }
      : { p_capitulo_id: conteudoId, p_chave_visitante: chaveVisitante };
    const { data, error } = await admin.rpc(nomeRpc, argumentos);

    if (error) {
      throw new Error(error.message);
    }

    const total = Number(data);

    if (!Number.isFinite(total) || total < 0) {
      throw new Error("O RPC de visualização retornou um total inválido.");
    }

    return resposta(200, {
      ok: true,
      registrada: true,
      total: Math.trunc(total),
    });
  } catch (error) {
    console.error("Não foi possível registrar a visualização:", error);

    return resposta(503, {
      ok: false,
      codigo: "registro_indisponivel",
      mensagem: "O registro de visualizações está temporariamente indisponível.",
    });
  }
}
