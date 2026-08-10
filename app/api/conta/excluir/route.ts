import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
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
const LOCK_DURACAO_SEGUNDOS = 180;
const LIMITE_LISTAGEM_STORAGE = 1000;
const LIMITE_REMOCAO_STORAGE = 1000;
const BUCKETS_USUARIO = ["avatars", "capas-obras", "arquivos-obras"] as const;

type BucketUsuario = (typeof BUCKETS_USUARIO)[number];
type StatusOperacaoExclusao =
  | "solicitada"
  | "limpando_storage"
  | "storage_limpo"
  | "excluindo_auth"
  | "concluida"
  | "falhou";

type CorpoExclusaoConta = {
  senha?: unknown;
  confirmacao?: unknown;
};

type OperacaoExclusaoConta = {
  id: string;
  subject_user_id: string;
  status: StatusOperacaoExclusao;
  buckets_pendentes: string[];
  buckets_concluidos: string[];
  arquivos_removidos_por_bucket: Record<string, number>;
  tentativas_storage: number;
  tentativas_auth: number;
  ultimo_erro_codigo: string | null;
  ultimo_erro_mensagem: string | null;
  lock_token: string | null;
  lock_expira_em: string | null;
  storage_limpo_em: string | null;
  auth_excluido_em: string | null;
  concluida_em: string | null;
};

type FalhaBucket = {
  bucket: BucketUsuario;
  mensagem: string;
};

type ResultadoLimpezaStorage = {
  concluidos: BucketUsuario[];
  falhas: FalhaBucket[];
  removidosPorBucket: Record<string, number>;
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

function respostaSucesso(
  dados: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(
    {
      ok: true,
      ...dados,
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
    return false;
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

function mensagemErro(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Erro desconhecido.";
}

function codigoErro(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "erro_desconhecido";
}

function operacaoValida(data: unknown): data is OperacaoExclusaoConta {
  return Boolean(
    data &&
      typeof data === "object" &&
      "id" in data &&
      typeof data.id === "string" &&
      "subject_user_id" in data &&
      typeof data.subject_user_id === "string" &&
      "status" in data &&
      typeof data.status === "string",
  );
}

function normalizarOperacao(data: unknown) {
  const candidata = Array.isArray(data) ? data[0] : data;

  return operacaoValida(candidata) ? candidata : null;
}

function erroOperacaoEmAndamento(error: unknown) {
  const codigo = codigoErro(error);
  const mensagem = mensagemErro(error);

  return (
    codigo === "55P03" ||
    /operacao_exclusao_em_andamento/i.test(mensagem)
  );
}

function erroUsuarioAuthNaoEncontrado(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : null;
  const mensagem = mensagemErro(error);

  return (
    status === 404 ||
    /user not found|usu[aá]rio n[aã]o encontrado/i.test(mensagem)
  );
}

async function buscarOperacaoExistente(
  admin: SupabaseClient,
  userId: string,
) {
  const { data, error } = await admin
    .from("operacoes_exclusao_conta")
    .select("*")
    .eq("subject_user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizarOperacao(data);
}

async function reivindicarOperacao(
  admin: SupabaseClient,
  userId: string,
  lockToken: string,
) {
  const { data, error } = await admin.rpc(
    "reivindicar_operacao_exclusao_conta",
    {
      p_subject_user_id: userId,
      p_lock_token: lockToken,
      p_lock_duracao_segundos: LOCK_DURACAO_SEGUNDOS,
    },
  );

  if (error) {
    throw error;
  }

  const operacao = normalizarOperacao(data);

  if (!operacao) {
    throw new Error("O Supabase não retornou a operação de exclusão.");
  }

  return operacao;
}

async function renovarLock(
  admin: SupabaseClient,
  userId: string,
  lockToken: string,
) {
  return reivindicarOperacao(admin, userId, lockToken);
}

async function atualizarOperacao(
  admin: SupabaseClient,
  operacaoId: string,
  lockToken: string,
  valores: Record<string, unknown>,
) {
  const { data, error } = await admin
    .from("operacoes_exclusao_conta")
    .update(valores)
    .eq("id", operacaoId)
    .eq("lock_token", lockToken)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  const operacao = normalizarOperacao(data);

  if (!operacao) {
    throw new Error(
      "A operação de exclusão perdeu a trava ou não pôde ser atualizada.",
    );
  }

  return operacao;
}

async function registrarFalha(
  admin: SupabaseClient,
  operacao: OperacaoExclusaoConta,
  lockToken: string,
  codigo: string,
  mensagem: string,
  valoresExtras: Record<string, unknown> = {},
) {
  try {
    return await atualizarOperacao(admin, operacao.id, lockToken, {
      status: "falhou",
      ultimo_erro_codigo: codigo.slice(0, 100),
      ultimo_erro_mensagem: mensagem.slice(0, 4000),
      ...valoresExtras,
    });
  } catch (error) {
    console.error(
      "Não foi possível registrar a falha da exclusão de conta:",
      error,
    );
    return null;
  }
}

async function listarArquivosRecursivamente({
  admin,
  bucket,
  pasta,
  renovar,
}: {
  admin: SupabaseClient;
  bucket: BucketUsuario;
  pasta: string;
  renovar: () => Promise<unknown>;
}) {
  const caminhos: string[] = [];
  let offset = 0;

  while (true) {
    await renovar();

    const { data, error } = await admin.storage.from(bucket).list(pasta, {
      limit: LIMITE_LISTAGEM_STORAGE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      if (/bucket not found/i.test(error.message)) {
        console.warn(`Bucket ${bucket} não encontrado durante a exclusão.`);
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
            admin,
            bucket,
            pasta: caminho,
            renovar,
          })),
        );
      }
    }

    if (itens.length < LIMITE_LISTAGEM_STORAGE) {
      break;
    }

    offset += LIMITE_LISTAGEM_STORAGE;
  }

  return caminhos;
}

async function limparBucketUsuario({
  admin,
  bucket,
  userId,
  renovar,
}: {
  admin: SupabaseClient;
  bucket: BucketUsuario;
  userId: string;
  renovar: () => Promise<unknown>;
}) {
  const caminhos = await listarArquivosRecursivamente({
    admin,
    bucket,
    pasta: userId,
    renovar,
  });

  for (
    let indice = 0;
    indice < caminhos.length;
    indice += LIMITE_REMOCAO_STORAGE
  ) {
    await renovar();

    const lote = caminhos.slice(indice, indice + LIMITE_REMOCAO_STORAGE);
    const { error } = await admin.storage.from(bucket).remove(lote);

    if (error) {
      throw error;
    }
  }

  const restantes = await listarArquivosRecursivamente({
    admin,
    bucket,
    pasta: userId,
    renovar,
  });

  if (restantes.length > 0) {
    throw new Error(
      `O bucket ${bucket} ainda possui ${restantes.length} arquivo(s) da conta.`,
    );
  }

  return caminhos.length;
}

async function limparStorageUsuario({
  admin,
  userId,
  renovar,
  aoConcluirBucket,
}: {
  admin: SupabaseClient;
  userId: string;
  renovar: () => Promise<unknown>;
  aoConcluirBucket?: (
    bucket: BucketUsuario,
    removidos: number,
  ) => Promise<void>;
}): Promise<ResultadoLimpezaStorage> {
  const resultado: ResultadoLimpezaStorage = {
    concluidos: [],
    falhas: [],
    removidosPorBucket: {},
  };

  for (const bucket of BUCKETS_USUARIO) {
    try {
      const removidos = await limparBucketUsuario({
        admin,
        bucket,
        userId,
        renovar,
      });

      resultado.concluidos.push(bucket);
      resultado.removidosPorBucket[bucket] = removidos;

      if (aoConcluirBucket) {
        await aoConcluirBucket(bucket, removidos);
      }
    } catch (error) {
      const mensagem = mensagemErro(error);

      console.error(
        `Não foi possível limpar completamente o bucket ${bucket}:`,
        error,
      );

      resultado.falhas.push({ bucket, mensagem });
    }
  }

  return resultado;
}

async function excluirUsuarioAuth(
  admin: SupabaseClient,
  userId: string,
) {
  const { data: usuarioExistente, error: erroBusca } =
    await admin.auth.admin.getUserById(userId);

  if (erroBusca && !erroUsuarioAuthNaoEncontrado(erroBusca)) {
    throw erroBusca;
  }

  if (!usuarioExistente?.user) {
    return;
  }

  const { error: erroExclusao } = await admin.auth.admin.deleteUser(
    userId,
    false,
  );

  if (erroExclusao && !erroUsuarioAuthNaoEncontrado(erroExclusao)) {
    throw erroExclusao;
  }
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

  const admin = criarSupabaseAdminClient();
  const lockToken = randomUUID();
  let operacao: OperacaoExclusaoConta | null = null;
  let authExcluido = false;

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

    const existente = await buscarOperacaoExistente(admin, usuario.id);

    if (existente?.status === "concluida") {
      await encerrarSessaoComSeguranca(supabaseServer);

      return respostaSucesso({
        exclusaoConcluida: true,
        arquivosPendentes: false,
      });
    }

    try {
      operacao = await reivindicarOperacao(
        admin,
        usuario.id,
        lockToken,
      );
    } catch (error) {
      if (erroOperacaoEmAndamento(error)) {
        const atual = await buscarOperacaoExistente(admin, usuario.id);

        if (atual?.status === "concluida") {
          await encerrarSessaoComSeguranca(supabaseServer);

          return respostaSucesso({
            exclusaoConcluida: true,
            arquivosPendentes: false,
          });
        }

        return respostaErro(
          409,
          "exclusao_em_andamento",
          "A exclusão desta conta já está sendo processada. Aguarde alguns minutos.",
        );
      }

      throw error;
    }

    const renovar = async () => {
      operacao = await renovarLock(admin, usuario.id, lockToken);
      return operacao;
    };

    const precisaLimparStorage =
      operacao.status === "solicitada" ||
      operacao.status === "limpando_storage" ||
      (operacao.status === "falhou" && !operacao.storage_limpo_em);

    if (precisaLimparStorage) {
      operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
        status: "limpando_storage",
        buckets_pendentes: [...BUCKETS_USUARIO],
        buckets_concluidos: [],
        storage_limpo_em: null,
        tentativas_storage: (operacao.tentativas_storage || 0) + 1,
        ultimo_erro_codigo: null,
        ultimo_erro_mensagem: null,
        ultima_falha_em: null,
      });

      const contagensAcumuladas = {
        ...(operacao.arquivos_removidos_por_bucket || {}),
      };
      const concluidos: BucketUsuario[] = [];

      const resultadoInicial = await limparStorageUsuario({
        admin,
        userId: usuario.id,
        renovar,
        aoConcluirBucket: async (bucket, removidos) => {
          concluidos.push(bucket);
          contagensAcumuladas[bucket] =
            (contagensAcumuladas[bucket] || 0) + removidos;

          operacao = await atualizarOperacao(
            admin,
            operacao!.id,
            lockToken,
            {
              buckets_concluidos: [...concluidos],
              buckets_pendentes: BUCKETS_USUARIO.filter(
                (item) => !concluidos.includes(item),
              ),
              arquivos_removidos_por_bucket: contagensAcumuladas,
            },
          );
        },
      });

      if (resultadoInicial.falhas.length > 0) {
        const bucketsComFalha = resultadoInicial.falhas.map(
          ({ bucket }) => bucket,
        );
        const detalhes = resultadoInicial.falhas
          .map(({ bucket, mensagem }) => `${bucket}: ${mensagem}`)
          .join(" | ");

        await registrarFalha(
          admin,
          operacao,
          lockToken,
          "storage_incompleto",
          `Não foi possível limpar completamente o Storage. ${detalhes}`,
          {
            buckets_pendentes: bucketsComFalha,
            buckets_concluidos: resultadoInicial.concluidos,
          },
        );

        return respostaErro(
          503,
          "storage_incompleto",
          "Não foi possível remover todos os arquivos da conta. Nenhuma conta foi excluída. Tente novamente em alguns minutos.",
        );
      }

      operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
        status: "storage_limpo",
        buckets_pendentes: [],
        buckets_concluidos: [...BUCKETS_USUARIO],
        arquivos_removidos_por_bucket: contagensAcumuladas,
        ultimo_erro_codigo: null,
        ultimo_erro_mensagem: null,
      });
    }

    if (
      operacao.status === "storage_limpo" ||
      operacao.status === "excluindo_auth" ||
      (operacao.status === "falhou" && operacao.storage_limpo_em)
    ) {
      operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
        status: "excluindo_auth",
        tentativas_auth: (operacao.tentativas_auth || 0) + 1,
        ultimo_erro_codigo: null,
        ultimo_erro_mensagem: null,
        ultima_falha_em: null,
      });

      await renovar();
      await excluirUsuarioAuth(admin, usuario.id);
      authExcluido = true;

      operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
        auth_excluido_em: operacao.auth_excluido_em || new Date().toISOString(),
      });

      const resultadoFinal = await limparStorageUsuario({
        admin,
        userId: usuario.id,
        renovar,
      });
      const contagensFinais = {
        ...(operacao.arquivos_removidos_por_bucket || {}),
      };

      for (const [bucket, removidos] of Object.entries(
        resultadoFinal.removidosPorBucket,
      )) {
        contagensFinais[bucket] =
          (contagensFinais[bucket] || 0) + removidos;
      }

      if (resultadoFinal.falhas.length > 0) {
        const detalhes = resultadoFinal.falhas
          .map(({ bucket, mensagem }) => `${bucket}: ${mensagem}`)
          .join(" | ");

        await registrarFalha(
          admin,
          operacao,
          lockToken,
          "storage_final_incompleto",
          `A conta foi removida do Auth, mas a verificação final do Storage falhou. ${detalhes}`,
          {
            storage_limpo_em: null,
            buckets_pendentes: resultadoFinal.falhas.map(
              ({ bucket }) => bucket,
            ),
            buckets_concluidos: resultadoFinal.concluidos,
            auth_excluido_em:
              operacao.auth_excluido_em || new Date().toISOString(),
            arquivos_removidos_por_bucket: contagensFinais,
          },
        );

        await encerrarSessaoComSeguranca(supabaseServer);

        return respostaSucesso(
          {
            exclusaoConcluida: false,
            arquivosPendentes: true,
            acompanhamentoPendente: true,
          },
          202,
        );
      }

      operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
        status: "concluida",
        auth_excluido_em:
          operacao.auth_excluido_em || new Date().toISOString(),
        buckets_pendentes: [],
        buckets_concluidos: [...BUCKETS_USUARIO],
        arquivos_removidos_por_bucket: contagensFinais,
        ultimo_erro_codigo: null,
        ultimo_erro_mensagem: null,
      });
    }

    await encerrarSessaoComSeguranca(supabaseServer);

    return respostaSucesso({
      exclusaoConcluida: operacao.status === "concluida",
      arquivosPendentes: operacao.status !== "concluida",
    });
  } catch (error) {
    const mensagem = mensagemErro(error);

    console.error("Erro inesperado ao excluir conta:", error);

    if (operacao) {
      await registrarFalha(
        admin,
        operacao,
        lockToken,
        authExcluido
          ? "finalizacao_pos_auth_falhou"
          : codigoErro(error),
        authExcluido
          ? `O Auth já foi excluído, mas a finalização da operação falhou. ${mensagem}`
          : mensagem,
        authExcluido
          ? {
              auth_excluido_em:
                operacao.auth_excluido_em || new Date().toISOString(),
              storage_limpo_em: null,
              buckets_pendentes: [...BUCKETS_USUARIO],
              buckets_concluidos: [],
            }
          : {},
      );
    }

    if (authExcluido) {
      await encerrarSessaoComSeguranca(supabaseServer);

      return respostaSucesso(
        {
          exclusaoConcluida: false,
          arquivosPendentes: true,
          acompanhamentoPendente: true,
        },
        202,
      );
    }

    return respostaErro(
      500,
      "erro_inesperado",
      "Não foi possível excluir sua conta agora. Tente novamente.",
    );
  }
}