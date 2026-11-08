import "server-only";

type ImagemCanonica = {
  mimeType: string; largura: number; altura: number; tamanhoBytes: number; sha256: string;
};
type Reserva = { usuarioId: string; mimeType: string; expiraEm: string; versaoEsperada: number };
type Identidade = { usuarioId: string };
export type DadosReserva = { reservaId: string; capituloId: string; versaoEsperada: number };
export type DependenciasPrevalidacao = {
  autenticar(token: string): Promise<Identidade | null>;
  limitar(token: string): Promise<{ permitido: boolean; tentarNovamenteSegundos: number }>;
  conferir(token: string, dados: DadosReserva): Promise<Reserva>;
  validar(bytes: Uint8Array): Promise<ImagemCanonica>;
};

export class ErroPrevalidacao extends Error {
  readonly status: number;
  readonly codigo: string;
  constructor(status: number, codigo: string) {
    super(codigo);
    this.status = status;
    this.codigo = codigo;
  }
}

const MAX_BYTES = 2 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let recepcoesAtivas = 0;

function resposta(status: number, dados: Record<string, unknown>, headers = {}) {
  return Response.json(dados, { status, headers: {
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers,
  } });
}

async function lerImagem(request: Request) {
  if (request.signal.aborted) throw new ErroPrevalidacao(408, "recepcao_interrompida");
  const reader = request.body?.getReader();
  if (!reader) throw new ErroPrevalidacao(400, "arquivo_ausente");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let interromper: () => void = () => undefined;
  const interrompida = new Promise<never>((_, reject) => {
    interromper = () => reject(new ErroPrevalidacao(408, "recepcao_interrompida"));
    request.signal.addEventListener("abort", interromper, { once: true });
    timer = setTimeout(interromper, 10_000);
  });
  const bytes = Buffer.alloc(MAX_BYTES);
  let total = 0;
  let partes = 0;
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), interrompida]);
      if (done) break;
      if (!(value instanceof Uint8Array) || ++partes > 4096 || total + value.byteLength > MAX_BYTES) {
        throw new ErroPrevalidacao(413, "arquivo_grande");
      }
      bytes.set(value, total);
      total += value.byteLength;
    }
    if (total === 0) throw new ErroPrevalidacao(400, "arquivo_ausente");
    return bytes.subarray(0, total);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", interromper);
    // Nao aguardar cancel() controlavel pelo emissor; liberar mesmo em timeout.
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Recepcao SEM persistencia. Nao aceita cliente Storage nem credenciais admin.
 * Um resultado valido nao e um token/autorizacao de upload ou prova reutilizavel.
 */
export function criarRecepcaoPrevalidacao(deps: DependenciasPrevalidacao) {
  return async function POST(request: Request) {
    const token = /^Bearer ([^\s]{1,8192})$/.exec(request.headers.get("authorization") || "")?.[1];
    if (!token) return resposta(401, { erro: "autenticacao_necessaria" });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return resposta(403, { erro: "origem_invalida" });
    if (request.headers.get("content-type")?.toLowerCase() !== "application/octet-stream") {
      return resposta(415, { erro: "envie_bytes_sem_multipart" });
    }
    const reservaId = request.headers.get("x-reserva-id") || "";
    const capituloId = request.headers.get("x-capitulo-id") || "";
    const versao = request.headers.get("x-versao-esperada") || "";
    if (!UUID.test(reservaId) || !UUID.test(capituloId) || !/^\d{1,16}$/.test(versao) || !Number.isSafeInteger(Number(versao))) {
      return resposta(400, { erro: "reserva_invalida" });
    }
    const declarados = request.headers.get("content-length");
    if (declarados !== null && (!/^\d{1,10}$/.test(declarados) || Number(declarados) > MAX_BYTES)) {
      return resposta(413, { erro: "arquivo_grande" });
    }
    if (recepcoesAtivas >= 2) return resposta(503, { erro: "recepcao_ocupada" }, { "Retry-After": "1" });
    recepcoesAtivas++;
    try {
      const identidade = await deps.autenticar(token);
      if (!identidade) throw new ErroPrevalidacao(401, "autenticacao_necessaria");
      const limite = await deps.limitar(token);
      if (!limite.permitido) return resposta(429, { erro: "limite_de_prevalidacoes" }, {
        "Retry-After": String(limite.tentarNovamenteSegundos),
      });
      const dados = { reservaId, capituloId, versaoEsperada: Number(versao) };
      const conferir = async () => {
        const reserva = await deps.conferir(token, dados);
        if (reserva.usuarioId !== identidade.usuarioId || reserva.versaoEsperada !== dados.versaoEsperada) {
          throw new ErroPrevalidacao(409, "identidade_ou_versao_alterada");
        }
        return reserva;
      };
      const reserva = await conferir(); // Antes de aceitar corpo ou executar decoder.
      const canonica = await deps.validar(await lerImagem(request));
      if (canonica.mimeType !== reserva.mimeType) throw new ErroPrevalidacao(422, "formato_diferente_da_reserva");
      const atual = await deps.autenticar(token);
      if (!atual || atual.usuarioId !== identidade.usuarioId) throw new ErroPrevalidacao(401, "sessao_alterada");
      const final = await conferir(); // Detecta logout, exclusao, release e versao durante decode.
      if (final.mimeType !== reserva.mimeType || final.expiraEm !== reserva.expiraEm) {
        throw new ErroPrevalidacao(409, "reserva_alterada");
      }
      return resposta(200, { estado: "validado_sem_upload", uploadHabilitado: false,
        mimeType: canonica.mimeType, largura: canonica.largura, altura: canonica.altura,
        tamanhoBytes: canonica.tamanhoBytes, sha256: canonica.sha256 });
    } catch (erro) {
      if (erro instanceof ErroPrevalidacao) return resposta(erro.status, { erro: erro.codigo });
      return resposta(503, { erro: "prevalidacao_indisponivel" });
    } finally {
      recepcoesAtivas--;
    }
  };
}
