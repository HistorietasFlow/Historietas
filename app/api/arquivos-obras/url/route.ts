import { NextResponse, type NextRequest } from "next/server";
import {
  consumirLimiteRequisicao,
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

const BUCKET_ARQUIVOS_OBRAS = "arquivos-obras";
const DURACAO_URL_SEGUNDOS = 10 * 60;
const TAMANHO_MAXIMO_CORPO = 256;
const CLASSIFICACOES_PUBLICAS = new Set([
  "Livre",
  "10+",
  "12+",
  "14+",
  "16+",
]);
const UUID_VALIDO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CorpoUrlArquivoObra = {
  obraId?: unknown;
};

type ObraArquivoRow = {
  id: string;
  user_id: string;
  publicado: boolean;
  classificacao_indicativa: string;
  arquivo_url: string;
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

  return JSON.parse(texto) as CorpoUrlArquivoObra;
}

function decodificarCaminho(caminho: string) {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return "";
  }
}

function obterCaminhoArquivoObra(referencia: string, proprietarioId: string) {
  const referenciaLimpa = referencia.trim();

  if (!referenciaLimpa || referenciaLimpa.length > 2048) {
    return "";
  }

  let caminhoCodificado = referenciaLimpa.split("?")[0]?.split("#")[0] || "";

  if (/^https?:\/\//i.test(referenciaLimpa)) {
    try {
      const url = new URL(referenciaLimpa);
      const prefixos = [
        `/storage/v1/object/public/${BUCKET_ARQUIVOS_OBRAS}/`,
        `/storage/v1/object/sign/${BUCKET_ARQUIVOS_OBRAS}/`,
        `/storage/v1/object/authenticated/${BUCKET_ARQUIVOS_OBRAS}/`,
        `/storage/v1/object/${BUCKET_ARQUIVOS_OBRAS}/`,
      ];
      const prefixo = prefixos.find((item) => url.pathname.includes(item));

      if (!prefixo) {
        return "";
      }

      caminhoCodificado = url.pathname.slice(
        url.pathname.indexOf(prefixo) + prefixo.length,
      );
    } catch {
      return "";
    }
  } else {
    caminhoCodificado = caminhoCodificado
      .replace(new RegExp(`^${BUCKET_ARQUIVOS_OBRAS}/`), "")
      .replace(/^\/+/, "");
  }

  const caminho = decodificarCaminho(caminhoCodificado)
    .replace(/^\/+/, "")
    .trim();
  const partes = caminho.split("/");

  if (
    !caminho ||
    caminho.length > 1024 ||
    partes.length < 2 ||
    partes.some(
      (parte) =>
        !parte ||
        parte === "." ||
        parte === ".." ||
        parte.includes("\\") ||
        /[\u0000-\u001f\u007f]/.test(parte),
    ) ||
    partes[0]?.toLowerCase() !== proprietarioId.trim().toLowerCase()
  ) {
    return "";
  }

  return caminho;
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
      mensagem: "O arquivo está temporariamente indisponível.",
    });
  }

  let corpo: CorpoUrlArquivoObra;

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

  const obraId = typeof corpo.obraId === "string" ? corpo.obraId.trim() : "";

  if (!UUID_VALIDO.test(obraId)) {
    return resposta(400, {
      ok: false,
      codigo: "obra_invalida",
      mensagem: "Obra inválida.",
    });
  }

  const supabaseServer = await criarSupabaseServerClient();
  let usuarioId = "";

  try {
    const { data, error } = await supabaseServer.auth.getUser();

    if (!error && data.user?.id) {
      usuarioId = data.user.id;
    }
  } catch {
    // Visitantes públicos continuam pelo identificador de rede.
  }

  const ip = obterIpConfiavel(request);
  const identificadores = [
    ...(ip
      ? [
          {
            escopo: "arquivo_obra_rede",
            identificador: ip,
            limite: 60,
          },
        ]
      : []),
    ...(usuarioId
      ? [
          {
            escopo: "arquivo_obra_usuario",
            identificador: usuarioId,
            limite: 30,
          },
        ]
      : []),
  ];

  if (identificadores.length === 0) {
    return resposta(503, {
      ok: false,
      codigo: "identidade_indisponivel",
      mensagem: "Não foi possível validar o acesso ao arquivo agora.",
    });
  }

  const admin = criarSupabaseAdminClient();
  let restante = Number.MAX_SAFE_INTEGER;

  try {
    for (const identificador of identificadores) {
      const limite = await consumirLimiteRequisicao({
        admin,
        escopo: identificador.escopo,
        identificador: identificador.identificador,
        limite: identificador.limite,
        janelaSegundos: 5 * 60,
        bloqueioSegundos: 15 * 60,
      });

      restante = Math.min(restante, limite.restante);

      if (!limite.permitido) {
        const tentarNovamente = Math.max(
          1,
          limite.tentarNovamenteSegundos,
        );

        return resposta(
          429,
          {
            ok: false,
            codigo: "muitas_tentativas",
            mensagem: "Muitos acessos ao arquivo. Aguarde e tente novamente.",
          },
          { "Retry-After": String(tentarNovamente) },
        );
      }
    }
  } catch (error) {
    console.error("Não foi possível consultar o limitador de arquivos:", error);

    return resposta(503, {
      ok: false,
      codigo: "protecao_indisponivel",
      mensagem: "Não foi possível validar a segurança do download agora.",
    });
  }

  const { data: linhasObra, error } = await admin.rpc(
    "obter_arquivo_obra_para_assinatura",
    { p_obra_id: obraId },
  );

  if (error) {
    console.error("Não foi possível consultar o arquivo da obra:", error);

    return resposta(503, {
      ok: false,
      codigo: "consulta_indisponivel",
      mensagem: "O arquivo está temporariamente indisponível.",
    });
  }

  const data = Array.isArray(linhasObra)
    ? (linhasObra[0] as ObraArquivoRow | undefined)
    : undefined;

  if (
    !data ||
    (usuarioId !== data.user_id &&
      (!data.publicado ||
        !CLASSIFICACOES_PUBLICAS.has(data.classificacao_indicativa)))
  ) {
    return resposta(404, {
      ok: false,
      codigo: "arquivo_nao_encontrado",
      mensagem: "Arquivo não encontrado.",
    });
  }

  const caminho = obterCaminhoArquivoObra(data.arquivo_url, data.user_id);

  if (!caminho) {
    return resposta(404, {
      ok: false,
      codigo: "arquivo_nao_encontrado",
      mensagem: "Arquivo não encontrado.",
    });
  }

  const { data: assinatura, error: erroAssinatura } = await admin.storage
    .from(BUCKET_ARQUIVOS_OBRAS)
    .createSignedUrl(caminho, DURACAO_URL_SEGUNDOS);
  const url = assinatura?.signedUrl?.trim() || "";

  if (erroAssinatura || !url) {
    console.error("Não foi possível assinar o arquivo da obra:", erroAssinatura);

    return resposta(503, {
      ok: false,
      codigo: "assinatura_indisponivel",
      mensagem: "O arquivo está temporariamente indisponível.",
    });
  }

  return resposta(
    200,
    {
      ok: true,
      url,
      expiraEmSegundos: DURACAO_URL_SEGUNDOS,
    },
    {
      "X-RateLimit-Remaining": String(Math.max(0, restante)),
    },
  );
}
