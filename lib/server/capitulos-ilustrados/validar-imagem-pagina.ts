import "server-only";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import sharp from "sharp";

export const LIMITES_IMAGEM_PAGINA = Object.freeze({
  bytes: 2 * 1024 * 1024,
  largura: 2048,
  altura: 4096,
  pixels: 8_000_000,
});

type CodigoErroImagem = "arquivo_vazio" | "arquivo_grande" | "formato_invalido" |
  "imagem_animada" | "dimensoes_invalidas" | "imagem_invalida" | "validacao_ocupada";

export class ErroImagemPagina extends Error {
  readonly codigo: CodigoErroImagem;

  constructor(codigo: CodigoErroImagem) {
    super(`Não foi possível validar a página: ${codigo}.`);
    this.name = "ErroImagemPagina";
    this.codigo = codigo;
  }
}

type Formato = "jpeg" | "png" | "webp";
const formatos = {
  jpeg: { mimeType: "image/jpeg", extensao: "jpg" },
  png: { mimeType: "image/png", extensao: "png" },
  webp: { mimeType: "image/webp", extensao: "webp" },
} as const;

// Limite por instância do módulo, sem fila ilimitada nem configuração global
// do Sharp. Não substitui autenticação/rate limit da futura fronteira HTTP.
let validacoesAtivas = 0;
const MAX_VALIDACOES_ATIVAS = 2;

function invalida(): never {
  throw new ErroImagemPagina("imagem_invalida");
}

function conferirPng(bytes: Buffer) {
  let offset = 8;
  // O limite de pixels não limita zTXt/iTXt/iCCP: impedir bombas em metadados
  // comprimidos antes de entregá-los ao decoder nativo. Orçamento agregado.
  let metadadosRestantes = 1024 * 1024;
  function fimNulo(inicio: number, fim: number) {
    const indice = bytes.indexOf(0, inicio);
    if (indice < inicio || indice >= fim) invalida();
    return indice;
  }
  while (offset + 12 <= bytes.length) {
    const tamanho = bytes.readUInt32BE(offset);
    if (tamanho > bytes.length - offset - 12) invalida();
    const tipo = bytes.toString("ascii", offset + 4, offset + 8);
    // libvips pode ler APNG como PNG estático; metadata().pages não basta.
    if (["acTL", "fcTL", "fdAT"].includes(tipo)) throw new ErroImagemPagina("imagem_animada");
    if (["zTXt", "iTXt", "iCCP"].includes(tipo)) {
      const inicio = offset + 8;
      const fim = inicio + tamanho;
      const nomeFim = fimNulo(inicio, fim);
      if (nomeFim === inicio || nomeFim - inicio > 79) invalida();
      let comprimido = true;
      let textoInicio = nomeFim + 2;
      if (tipo === "iTXt") {
        const flag = bytes[nomeFim + 1];
        if (flag !== 0 && flag !== 1) invalida();
        comprimido = flag === 1;
        if (bytes[nomeFim + 2] !== 0) invalida();
        const idiomaFim = fimNulo(nomeFim + 3, fim);
        textoInicio = fimNulo(idiomaFim + 1, fim) + 1;
      } else if (bytes[nomeFim + 1] !== 0) invalida();
      if (textoInicio > fim) invalida();
      if (comprimido) {
        if (metadadosRestantes < 1) invalida();
        metadadosRestantes -= inflateSync(bytes.subarray(textoInicio, fim),
          { maxOutputLength: metadadosRestantes }).length;
      }
    }
    offset += tamanho + 12;
    if (tipo === "IEND") {
      if (tamanho !== 0 || offset !== bytes.length) invalida();
      return;
    }
  }
  invalida();
}

function conferirWebp(bytes: Buffer) {
  if (bytes.readUInt32LE(4) !== bytes.length - 8) invalida();
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const tipo = bytes.toString("ascii", offset, offset + 4);
    const tamanho = bytes.readUInt32LE(offset + 4);
    const fim = offset + 8 + tamanho + (tamanho % 2);
    if (fim > bytes.length) invalida();
    if (tipo === "ANIM" || tipo === "ANMF" ||
      (tipo === "VP8X" && tamanho > 0 && (bytes[offset + 8] & 2) !== 0)) {
      throw new ErroImagemPagina("imagem_animada");
    }
    offset = fim;
  }
  if (offset !== bytes.length) invalida();
}

function conferirJpeg(bytes: Buffer) {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) invalida();
    while (bytes[offset] === 0xff) offset++;
    const marcador = bytes[offset++];
    if (marcador === 0xd9) {
      if (offset !== bytes.length) invalida();
      return;
    }
    if (marcador === 0x01) continue;
    if (marcador === 0xd8 || offset + 2 > bytes.length) invalida();
    const tamanho = bytes.readUInt16BE(offset);
    if (tamanho < 2 || tamanho > bytes.length - offset) invalida();
    // MPO contém múltiplas imagens, mesmo se o decoder expuser só a primeira.
    if (marcador === 0xe2 && tamanho >= 6 && bytes.toString("ascii", offset + 2, offset + 6) === "MPF\0") {
      throw new ErroImagemPagina("imagem_animada");
    }
    offset += tamanho;
    if (marcador === 0xda) {
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) { offset++; continue; }
        const proximo = bytes[offset + 1];
        if (proximo === 0 || (proximo >= 0xd0 && proximo <= 0xd7)) { offset += 2; continue; }
        break;
      }
    }
  }
  invalida();
}

function identificarFormato(bytes: Buffer): Formato {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    conferirPng(bytes);
    return "png";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    conferirWebp(bytes);
    return "webp";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    conferirJpeg(bytes);
    return "jpeg";
  }
  throw new ErroImagemPagina("formato_invalido");
}

function conferirDimensoes(largura: number, altura: number) {
  if (!Number.isInteger(largura) || !Number.isInteger(altura) || largura < 1 || altura < 1 ||
    largura > LIMITES_IMAGEM_PAGINA.largura || altura > LIMITES_IMAGEM_PAGINA.altura ||
    largura * altura > LIMITES_IMAGEM_PAGINA.pixels) {
    throw new ErroImagemPagina("dimensoes_invalidas");
  }
}

/** Validação binária isolada: NÃO autoriza upload, reserva quota ou finaliza capítulos.
 * A futura operação deve autenticar, validar propriedade e limitar o corpo antes
 * de chamar este módulo, e persistir somente os bytes canônicos retornados aqui.
 */
export async function validarImagemPagina(entrada: Uint8Array) {
  if (!(entrada instanceof Uint8Array)) throw new ErroImagemPagina("formato_invalido");
  if (entrada.byteLength === 0) throw new ErroImagemPagina("arquivo_vazio");
  if (entrada.byteLength > LIMITES_IMAGEM_PAGINA.bytes) throw new ErroImagemPagina("arquivo_grande");
  if (validacoesAtivas >= MAX_VALIDACOES_ATIVAS) throw new ErroImagemPagina("validacao_ocupada");
  validacoesAtivas++;
  try {
    // Copia antes do primeiro await: alterações no buffer do chamador não podem
    // trocar o arquivo entre leitura do cabeçalho, decode e hash.
    const bytes = Buffer.from(entrada);
    const formato = identificarFormato(bytes);
    const imagem = sharp(bytes, { failOn: "warning", limitInputPixels: LIMITES_IMAGEM_PAGINA.pixels,
      limitInputChannels: 4, unlimited: false, sequentialRead: true }).timeout({ seconds: 5 });
    try {
      const metadados = await imagem.metadata();
      if (metadados.format !== formato) invalida();
      if ((metadados.pages ?? 1) !== 1 || metadados.delay?.length) throw new ErroImagemPagina("imagem_animada");
      conferirDimensoes(metadados.width ?? 0, metadados.height ?? 0);
      if ([5, 6, 7, 8].includes(metadados.orientation ?? 1)) {
        conferirDimensoes(metadados.height ?? 0, metadados.width ?? 0);
      }
      const orientada = imagem.autoOrient();
      if (formato === "jpeg") orientada.jpeg({ quality: 100, chromaSubsampling: "4:4:4" });
      else if (formato === "webp") orientada.webp({ lossless: true });
      else orientada.png();
      // Re-encode força a decodificação dos pixels (metadata() sozinho não faz
      // isso), aplica orientação e remove EXIF/XMP/ICC e dados extras do arquivo.
      const { data, info } = await orientada.toBuffer({ resolveWithObject: true });
      conferirDimensoes(info.width, info.height);
      if (data.length > LIMITES_IMAGEM_PAGINA.bytes) throw new ErroImagemPagina("arquivo_grande");
      return Object.freeze({
        ...formatos[formato], largura: info.width, altura: info.height,
        tamanhoBytes: data.length, sha256: createHash("sha256").update(data).digest("hex"),
        copiarBytes: () => Buffer.from(data),
      });
    } finally {
      imagem.destroy();
    }
  } catch (erro) {
    if (erro instanceof ErroImagemPagina) throw erro;
    throw new ErroImagemPagina("imagem_invalida");
  } finally {
    validacoesAtivas--;
  }
}
