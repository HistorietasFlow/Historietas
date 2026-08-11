import { type SupabaseClient } from "@supabase/supabase-js";

const LOCK_DURACAO_SEGUNDOS = 180;
const LIMITE_LISTAGEM_STORAGE = 1000;
const LIMITE_REMOCAO_STORAGE = 1000;
export const BUCKETS_USUARIO = ["avatars", "capas-obras", "arquivos-obras"] as const;

type BucketUsuario = (typeof BUCKETS_USUARIO)[number];
export type StatusOperacaoExclusao =
  | "solicitada"
  | "limpando_storage"
  | "storage_limpo"
  | "excluindo_auth"
  | "concluida"
  | "falhou";

export type OperacaoExclusaoConta = {
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

type FalhaBucket = { bucket: BucketUsuario; mensagem: string };
type ResultadoLimpezaStorage = {
  concluidos: BucketUsuario[];
  falhas: FalhaBucket[];
  removidosPorBucket: Record<string, number>;
};

export type ResultadoProcessamentoExclusao = {
  operacao: OperacaoExclusaoConta;
  authExcluido: boolean;
  storageFinalPendente: boolean;
};

export function mensagemErro(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Erro desconhecido.";
}

export function codigoErro(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "erro_desconhecido";
}

function operacaoValida(data: unknown): data is OperacaoExclusaoConta {
  return Boolean(
    data && typeof data === "object" &&
    "id" in data && typeof data.id === "string" &&
    "subject_user_id" in data && typeof data.subject_user_id === "string" &&
    "status" in data && typeof data.status === "string",
  );
}

function normalizarOperacao(data: unknown) {
  const candidata = Array.isArray(data) ? data[0] : data;
  return operacaoValida(candidata) ? candidata : null;
}

export function erroOperacaoEmAndamento(error: unknown) {
  const codigo = codigoErro(error);
  const mensagem = mensagemErro(error);
  return codigo === "55P03" || /operacao_exclusao_em_andamento/i.test(mensagem);
}

function erroUsuarioAuthNaoEncontrado(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error && typeof error.status === "number" ? error.status : null;
  const mensagem = mensagemErro(error);
  return status === 404 || /user not found|usu[aá]rio n[aã]o encontrado/i.test(mensagem);
}

export async function buscarOperacaoExistente(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from("operacoes_exclusao_conta")
    .select("*")
    .eq("subject_user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return normalizarOperacao(data);
}

export async function buscarOperacaoPorId(admin: SupabaseClient, operacaoId: string) {
  const { data, error } = await admin
    .from("operacoes_exclusao_conta")
    .select("*")
    .eq("id", operacaoId)
    .maybeSingle();
  if (error) throw error;
  return normalizarOperacao(data);
}

async function reivindicarOperacao(admin: SupabaseClient, userId: string, lockToken: string) {
  const { data, error } = await admin.rpc("reivindicar_operacao_exclusao_conta", {
    p_subject_user_id: userId,
    p_lock_token: lockToken,
    p_lock_duracao_segundos: LOCK_DURACAO_SEGUNDOS,
  });
  if (error) throw error;
  const operacao = normalizarOperacao(data);
  if (!operacao) throw new Error("O Supabase não retornou a operação de exclusão.");
  return operacao;
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
  if (error) throw error;
  const operacao = normalizarOperacao(data);
  if (!operacao) throw new Error("A operação de exclusão perdeu a trava ou não pôde ser atualizada.");
  return operacao;
}

export async function registrarFalha(
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
    console.error("Não foi possível registrar a falha da exclusão de conta:", error);
    return null;
  }
}

async function listarArquivosRecursivamente({ admin, bucket, pasta, renovar }: {
  admin: SupabaseClient; bucket: BucketUsuario; pasta: string; renovar: () => Promise<unknown>;
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
      if (item.id) caminhos.push(caminho);
      else caminhos.push(...(await listarArquivosRecursivamente({ admin, bucket, pasta: caminho, renovar })));
    }
    if (itens.length < LIMITE_LISTAGEM_STORAGE) break;
    offset += LIMITE_LISTAGEM_STORAGE;
  }
  return caminhos;
}

async function limparBucketUsuario({ admin, bucket, userId, renovar }: {
  admin: SupabaseClient; bucket: BucketUsuario; userId: string; renovar: () => Promise<unknown>;
}) {
  const caminhos = await listarArquivosRecursivamente({ admin, bucket, pasta: userId, renovar });
  for (let indice = 0; indice < caminhos.length; indice += LIMITE_REMOCAO_STORAGE) {
    await renovar();
    const { error } = await admin.storage.from(bucket).remove(caminhos.slice(indice, indice + LIMITE_REMOCAO_STORAGE));
    if (error) throw error;
  }
  const restantes = await listarArquivosRecursivamente({ admin, bucket, pasta: userId, renovar });
  if (restantes.length > 0) {
    throw new Error(`O bucket ${bucket} ainda possui ${restantes.length} arquivo(s) da conta.`);
  }
  return caminhos.length;
}

async function limparStorageUsuario({ admin, userId, renovar, aoConcluirBucket }: {
  admin: SupabaseClient;
  userId: string;
  renovar: () => Promise<unknown>;
  aoConcluirBucket?: (bucket: BucketUsuario, removidos: number) => Promise<void>;
}): Promise<ResultadoLimpezaStorage> {
  const resultado: ResultadoLimpezaStorage = { concluidos: [], falhas: [], removidosPorBucket: {} };
  for (const bucket of BUCKETS_USUARIO) {
    try {
      const removidos = await limparBucketUsuario({ admin, bucket, userId, renovar });
      resultado.concluidos.push(bucket);
      resultado.removidosPorBucket[bucket] = removidos;
      if (aoConcluirBucket) await aoConcluirBucket(bucket, removidos);
    } catch (error) {
      const mensagem = mensagemErro(error);
      console.error(`Não foi possível limpar completamente o bucket ${bucket}:`, error);
      resultado.falhas.push({ bucket, mensagem });
    }
  }
  return resultado;
}

async function excluirUsuarioAuth(admin: SupabaseClient, userId: string) {
  const { data: usuarioExistente, error: erroBusca } = await admin.auth.admin.getUserById(userId);
  if (erroBusca && !erroUsuarioAuthNaoEncontrado(erroBusca)) throw erroBusca;
  if (!usuarioExistente?.user) return;
  const { error: erroExclusao } = await admin.auth.admin.deleteUser(userId, false);
  if (erroExclusao && !erroUsuarioAuthNaoEncontrado(erroExclusao)) throw erroExclusao;
}

export async function processarOperacaoExclusaoConta({ admin, userId, lockToken }: {
  admin: SupabaseClient; userId: string; lockToken: string;
}): Promise<ResultadoProcessamentoExclusao> {
  let operacao = await reivindicarOperacao(admin, userId, lockToken);
  let authExcluido = Boolean(operacao.auth_excluido_em);

  try {
  const renovar = async () => {
    operacao = await reivindicarOperacao(admin, userId, lockToken);
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

    const contagensAcumuladas = { ...(operacao.arquivos_removidos_por_bucket || {}) };
    const concluidos: BucketUsuario[] = [];
    const resultadoInicial = await limparStorageUsuario({
      admin,
      userId,
      renovar,
      aoConcluirBucket: async (bucket, removidos) => {
        concluidos.push(bucket);
        contagensAcumuladas[bucket] = (contagensAcumuladas[bucket] || 0) + removidos;
        operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
          buckets_concluidos: [...concluidos],
          buckets_pendentes: BUCKETS_USUARIO.filter((item) => !concluidos.includes(item)),
          arquivos_removidos_por_bucket: contagensAcumuladas,
        });
      },
    });

    if (resultadoInicial.falhas.length > 0) {
      const detalhes = resultadoInicial.falhas.map(({ bucket, mensagem }) => `${bucket}: ${mensagem}`).join(" | ");
      const falha = await registrarFalha(admin, operacao, lockToken, "storage_incompleto", `Não foi possível limpar completamente o Storage. ${detalhes}`, {
        buckets_pendentes: resultadoInicial.falhas.map(({ bucket }) => bucket),
        buckets_concluidos: resultadoInicial.concluidos,
      });
      return { operacao: falha || operacao, authExcluido, storageFinalPendente: false };
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
    await excluirUsuarioAuth(admin, userId);
    authExcluido = true;
    operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
      auth_excluido_em: operacao.auth_excluido_em || new Date().toISOString(),
    });

    const resultadoFinal = await limparStorageUsuario({ admin, userId, renovar });
    const contagensFinais = { ...(operacao.arquivos_removidos_por_bucket || {}) };
    for (const [bucket, removidos] of Object.entries(resultadoFinal.removidosPorBucket)) {
      contagensFinais[bucket] = (contagensFinais[bucket] || 0) + removidos;
    }

    if (resultadoFinal.falhas.length > 0) {
      const detalhes = resultadoFinal.falhas.map(({ bucket, mensagem }) => `${bucket}: ${mensagem}`).join(" | ");
      const falha = await registrarFalha(admin, operacao, lockToken, "storage_final_incompleto", `A conta foi removida do Auth, mas a verificação final do Storage falhou. ${detalhes}`, {
        storage_limpo_em: null,
        buckets_pendentes: resultadoFinal.falhas.map(({ bucket }) => bucket),
        buckets_concluidos: resultadoFinal.concluidos,
        auth_excluido_em: operacao.auth_excluido_em || new Date().toISOString(),
        arquivos_removidos_por_bucket: contagensFinais,
      });
      return { operacao: falha || operacao, authExcluido, storageFinalPendente: true };
    }

    operacao = await atualizarOperacao(admin, operacao.id, lockToken, {
      status: "concluida",
      auth_excluido_em: operacao.auth_excluido_em || new Date().toISOString(),
      buckets_pendentes: [],
      buckets_concluidos: [...BUCKETS_USUARIO],
      arquivos_removidos_por_bucket: contagensFinais,
      ultimo_erro_codigo: null,
      ultimo_erro_mensagem: null,
    });
  }

  return { operacao, authExcluido, storageFinalPendente: false };
  } catch (error) {
    const mensagem = mensagemErro(error);
    const falha = await registrarFalha(
      admin,
      operacao,
      lockToken,
      authExcluido ? "finalizacao_pos_auth_falhou" : codigoErro(error),
      authExcluido
        ? `O Auth já foi excluído, mas a finalização da operação falhou. ${mensagem}`
        : mensagem,
      authExcluido
        ? {
            auth_excluido_em: operacao.auth_excluido_em || new Date().toISOString(),
            storage_limpo_em: null,
            buckets_pendentes: [...BUCKETS_USUARIO],
            buckets_concluidos: [],
          }
        : {},
    );

    if (authExcluido) {
      return {
        operacao: falha || operacao,
        authExcluido: true,
        storageFinalPendente: true,
      };
    }

    throw error;
  }
}
