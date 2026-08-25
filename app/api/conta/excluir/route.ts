import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  buscarOperacaoExistente,
  erroOperacaoEmAndamento,
  processarOperacaoExclusaoConta,
} from "@/lib/server/exclusaoConta";
import { consumirLimiteRequisicao } from "@/lib/server/protecaoAbuso";
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

const CONFIRMACAO_EXCLUSAO = "EXCLUIR";
const TAMANHO_MAXIMO_CORPO = 2_048;

type CorpoExclusaoConta = {
  senha?: unknown;
  confirmacao?: unknown;
};

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { ok: false, codigo, mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store", ...headers },
    },
  );
}

function respostaSucesso(dados: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { ok: true, ...dados },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function origemPermitida(request: NextRequest) {
  const origem = request.headers.get("origin");
  if (!origem) return false;

  try {
    const origemRecebida = new URL(origem).origin;
    const hostEncaminhado = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
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

  return JSON.parse(texto) as CorpoExclusaoConta;
}

function criarClienteReautenticacao() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase público não configurado.");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

async function encerrarSessaoComSeguranca(
  supabaseServer: Awaited<ReturnType<typeof criarSupabaseServerClient>>,
) {
  try {
    await supabaseServer.auth.signOut();
  } catch (error) {
    console.warn(
      "A conta foi excluída, mas a sessão não foi encerrada pelo servidor:",
      error,
    );
  }
}

async function descartarSessaoReautenticacao(
  cliente: ReturnType<typeof criarClienteReautenticacao>,
) {
  try {
    await cliente.auth.signOut({ scope: "local" });
  } catch (error) {
    console.warn("Não foi possível descartar a sessão de reautenticação:", error);
  }
}

export async function POST(request: NextRequest) {
  if (!origemPermitida(request)) {
    return respostaErro(403, "origem_invalida", "Origem da solicitação inválida.");
  }

  if (!requisicaoJson(request)) {
    return respostaErro(
      415,
      "tipo_conteudo_invalido",
      "Envie a solicitação em JSON.",
    );
  }

  if (!supabaseServerConfigurado || !supabaseAdminConfigurado) {
    return respostaErro(
      503,
      "configuracao_servidor",
      "A exclusão de conta ainda não foi configurada no servidor.",
    );
  }

  let corpo: CorpoExclusaoConta;
  try {
    corpo = await lerCorpo(request);
  } catch (error) {
    return respostaErro(
      error instanceof RangeError ? 413 : 400,
      error instanceof RangeError ? "corpo_muito_grande" : "requisicao_invalida",
      "Solicitação inválida.",
    );
  }

  const senha = typeof corpo.senha === "string" ? corpo.senha : "";
  const confirmacao =
    typeof corpo.confirmacao === "string"
      ? corpo.confirmacao.trim().toUpperCase()
      : "";

  if (!senha || senha.length > 500) {
    return respostaErro(400, "senha_obrigatoria", "Digite sua senha atual.");
  }

  if (confirmacao !== CONFIRMACAO_EXCLUSAO) {
    return respostaErro(
      400,
      "confirmacao_invalida",
      `Digite ${CONFIRMACAO_EXCLUSAO} para confirmar.`,
    );
  }

  const supabaseServer = await criarSupabaseServerClient();
  const { data: dadosUsuario, error: erroUsuario } = await supabaseServer.auth.getUser();
  const usuario = dadosUsuario.user;

  if (erroUsuario || !usuario) {
    return respostaErro(
      401,
      "conta_nao_autenticada",
      "Sua sessão expirou. Entre novamente e tente de novo.",
    );
  }

  const email = usuario.email?.trim().toLowerCase() || "";
  if (!email) {
    return respostaErro(
      400,
      "email_indisponivel",
      "Não foi possível confirmar o e-mail desta conta.",
    );
  }

  const admin = criarSupabaseAdminClient();
  const lockToken = randomUUID();

  try {
    let limiteExclusao;

    try {
      limiteExclusao = await consumirLimiteRequisicao({
        admin,
        escopo: "exclusao_conta",
        identificador: usuario.id,
        limite: 5,
        janelaSegundos: 15 * 60,
        bloqueioSegundos: 30 * 60,
      });
    } catch (error) {
      console.error("Não foi possível consultar o limitador da exclusão:", error);

      return respostaErro(
        503,
        "protecao_indisponivel",
        "Não foi possível validar a segurança da operação agora. Tente novamente.",
      );
    }

    if (!limiteExclusao.permitido) {
      const tentarNovamente = Math.max(
        1,
        limiteExclusao.tentarNovamenteSegundos,
      );

      return respostaErro(
        429,
        "muitas_tentativas",
        "Muitas tentativas de confirmação. Aguarde antes de tentar novamente.",
        { "Retry-After": String(tentarNovamente) },
      );
    }

    const clienteReautenticacao = criarClienteReautenticacao();
    const { data: reautenticacao, error: erroReautenticacao } =
      await clienteReautenticacao.auth.signInWithPassword({
        email,
        password: senha,
      });

    if (reautenticacao.session) {
      await descartarSessaoReautenticacao(clienteReautenticacao);
    }

    if (
      erroReautenticacao ||
      !reautenticacao.user ||
      !reautenticacao.session ||
      reautenticacao.user.id !== usuario.id
    ) {
      return respostaErro(401, "senha_incorreta", "A senha atual está incorreta.");
    }

    const existente = await buscarOperacaoExistente(admin, usuario.id);
    if (existente?.status === "concluida") {
      await encerrarSessaoComSeguranca(supabaseServer);
      return respostaSucesso({ exclusaoConcluida: true, arquivosPendentes: false });
    }

    let resultado;
    try {
      resultado = await processarOperacaoExclusaoConta({
        admin,
        userId: usuario.id,
        lockToken,
      });
    } catch (error) {
      if (erroOperacaoEmAndamento(error)) {
        const atual = await buscarOperacaoExistente(admin, usuario.id);
        if (atual?.status === "concluida") {
          await encerrarSessaoComSeguranca(supabaseServer);
          return respostaSucesso({ exclusaoConcluida: true, arquivosPendentes: false });
        }
        return respostaErro(
          409,
          "exclusao_em_andamento",
          "A exclusão desta conta já está sendo processada. Aguarde alguns minutos.",
        );
      }
      throw error;
    }

    if (resultado.authExcluido) {
      await encerrarSessaoComSeguranca(supabaseServer);
    }

    if (resultado.storageFinalPendente) {
      return respostaSucesso(
        {
          exclusaoConcluida: false,
          arquivosPendentes: true,
          acompanhamentoPendente: true,
        },
        202,
      );
    }

    if (resultado.operacao.status === "falhou") {
      return respostaErro(
        503,
        "storage_incompleto",
        "Não foi possível remover todos os arquivos da conta. Nenhuma conta foi excluída. Tente novamente em alguns minutos.",
      );
    }

    await encerrarSessaoComSeguranca(supabaseServer);
    return respostaSucesso({
      exclusaoConcluida: resultado.operacao.status === "concluida",
      arquivosPendentes: resultado.operacao.status !== "concluida",
    });
  } catch (error) {
    console.error("Erro inesperado ao excluir conta:", error);
    return respostaErro(
      500,
      "erro_inesperado",
      "Não foi possível excluir sua conta agora. Tente novamente.",
    );
  }
}
