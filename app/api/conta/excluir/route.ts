import { createClient } from "@supabase/supabase-js";
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

const CONFIRMACAO_EXCLUSAO = "EXCLUIR";
const BUCKETS_USUARIO = ["avatars", "capas-obras", "arquivos-obras"] as const;

type CorpoExclusaoConta = {
  senha?: unknown;
  confirmacao?: unknown;
};

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
) {
  return NextResponse.json(
    {
      ok: false,
      codigo,
      mensagem,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
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

async function listarArquivosRecursivamente({
  bucket,
  pasta,
}: {
  bucket: string;
  pasta: string;
}) {
  const admin = criarSupabaseAdminClient();
  const caminhos: string[] = [];
  const limite = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(pasta, {
      limit: limite,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      if (/bucket not found/i.test(error.message)) {
        return caminhos;
      }

      throw error;
    }

    const itens = data || [];

    for (const item of itens) {
      const caminho = `${pasta}/${item.name}`.replace(/^\/+/, "");

      if (item.id) {
        caminhos.push(caminho);
      } else {
        caminhos.push(
          ...(await listarArquivosRecursivamente({
            bucket,
            pasta: caminho,
          })),
        );
      }
    }

    if (itens.length < limite) {
      break;
    }

    offset += limite;
  }

  return caminhos;
}

async function removerArquivosUsuario(userId: string) {
  const admin = criarSupabaseAdminClient();
  const avisos: string[] = [];

  for (const bucket of BUCKETS_USUARIO) {
    try {
      const caminhos = await listarArquivosRecursivamente({
        bucket,
        pasta: userId,
      });

      for (let indice = 0; indice < caminhos.length; indice += 1000) {
        const lote = caminhos.slice(indice, indice + 1000);
        const { error } = await admin.storage.from(bucket).remove(lote);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error(
        `A conta foi excluída, mas não foi possível limpar completamente o bucket ${bucket}:`,
        error,
      );
      avisos.push(bucket);
    }
  }

  return avisos;
}

export async function POST(request: NextRequest) {
  if (!origemPermitida(request)) {
    return respostaErro(403, "origem_invalida", "Origem da solicitação inválida.");
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
    corpo = (await request.json()) as CorpoExclusaoConta;
  } catch {
    return respostaErro(400, "requisicao_invalida", "Solicitação inválida.");
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
  const { data: dadosUsuario, error: erroUsuario } =
    await supabaseServer.auth.getUser();
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

  try {
    const clienteReautenticacao = criarClienteReautenticacao();
    const { data: reautenticacao, error: erroReautenticacao } =
      await clienteReautenticacao.auth.signInWithPassword({
        email,
        password: senha,
      });

    if (
      erroReautenticacao ||
      !reautenticacao.user ||
      reautenticacao.user.id !== usuario.id
    ) {
      return respostaErro(
        401,
        "senha_incorreta",
        "A senha atual está incorreta.",
      );
    }

    const admin = criarSupabaseAdminClient();
    const { error: erroExclusao } = await admin.auth.admin.deleteUser(
      usuario.id,
      false,
    );

    if (erroExclusao) {
      console.error("Não foi possível excluir a conta do Supabase Auth:", erroExclusao);

      return respostaErro(
        500,
        "exclusao_falhou",
        "Não foi possível excluir sua conta agora. Tente novamente ou envie uma solicitação pela página pública de exclusão.",
      );
    }

    const bucketsComFalha = await removerArquivosUsuario(usuario.id);

    try {
      await supabaseServer.auth.signOut();
    } catch (error) {
      console.warn("A conta foi excluída, mas a sessão não foi encerrada pelo servidor:", error);
    }

    return NextResponse.json(
      {
        ok: true,
        arquivosPendentes: bucketsComFalha.length > 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Erro inesperado ao excluir conta:", error);

    return respostaErro(
      500,
      "erro_inesperado",
      "Não foi possível excluir sua conta agora. Tente novamente.",
    );
  }
}
