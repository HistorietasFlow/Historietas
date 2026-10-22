import { LIMITES_BYTES_STORAGE } from "../../../lib/storageUploads";

export const STORAGE_KEY = "historietas-obras";
export const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
export const TAMANHO_MAXIMO_CAPA = LIMITES_BYTES_STORAGE["capas-obras"];
export const TAMANHO_MAXIMO_ARQUIVO_TEXTO = 900 * 1024;
export const TAMANHO_MAXIMO_ARQUIVO_OBRA =
  LIMITES_BYTES_STORAGE["arquivos-obras"];
export const EXTENSOES_IMAGEM_ACEITAS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
] as const;
export const TIPOS_MIME_IMAGEM_ACEITOS = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
export const TIPOS_MIME_TEXTO_ACEITOS = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);
export const TIPOS_MIME_PDF_ACEITOS = new Set(["application/pdf"]);

export const OUTRO_FORMATO_VALUE = "__outro_formato__";
export const OUTRO_GENERO_VALUE = "__outro_genero__";
export const OUTRA_TAG_VALUE = "__outra_tag__";
export const LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO = 14;
export const LIMITE_CARACTERES_TAG_PERSONALIZADA = 10;

export const LIMITE_TAGS_OBRA = 1;
export const OPCOES_FORMATO_OBRA = [
  "Webnovel",
  "Light novel",
  "Romance",
  "Conto",
  "Poesia",
  "HQ",
  "Mangá",
  "Fanfic",
] as const;

export const OPCOES_GENERO_OBRA = [
  "Fantasia",
  "Terror",
  "Ficção",
  "Romance",
  "Drama",
  "Ação",
  "Mistério",
  "Suspense",
  "Aventura",
  "Comédia",
] as const;

export const OPCOES_TAGS_OBRA = [
  "Sombria",
  "Psicológico",
  "Sci-fi",
  "Cyberpunk",
  "Espacial",
  "Isekai",
  "Distopia",
  "Apocalipse",
  "Escolar",
  "Máfia",
  "Investigação",
  "Religioso",
  "Mitologia",
  "Folclore",
  "Vampiro",
  "Lobisomem",
  "Zumbi",
  "Super-herói",
  "Magia",
  "Guerra",
  "Família",
  "Amizade",
  "Traição",
  "Vingança",
  "Sobrevivência",
] as const;

export const CLASSIFICACOES_INDICATIVAS_OBRA = [
  "Livre",
  "10+",
  "12+",
  "14+",
  "16+",
  "18+",
] as const;
