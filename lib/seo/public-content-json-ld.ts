import { SITE_URL } from "../seo";

type DadosComunsJsonLd = {
  hrefCanonico: string;
  nome: string;
  descricao?: string | null;
  autor?: string | null;
  imagem?: string | null;
};

type DadosCapituloJsonLd = DadosComunsJsonLd & {
  posicao: number;
  obra: {
    hrefCanonico: string;
    nome: string;
  };
};

function normalizarTexto(valor: string | null | undefined) {
  return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";
}

function limitarDescricao(valor: string | null | undefined) {
  const texto = normalizarTexto(valor);

  if (texto.length <= 160) {
    return texto;
  }

  return `${texto.slice(0, 159).trim()}…`;
}

function criarUrlAbsoluta(valor: string) {
  try {
    const url = new URL(valor, SITE_URL);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function criarPropriedadesOpcionais({
  descricao,
  autor,
  imagem,
}: Pick<DadosComunsJsonLd, "descricao" | "autor" | "imagem">) {
  const description = limitarDescricao(descricao);
  const nomeAutor = normalizarTexto(autor);
  const imagemNormalizada = normalizarTexto(imagem);
  const image = imagemNormalizada
    ? criarUrlAbsoluta(imagemNormalizada)
    : "";

  return {
    ...(description ? { description } : {}),
    ...(nomeAutor
      ? {
          author: {
            "@type": "Person",
            name: nomeAutor,
          },
        }
      : {}),
    ...(image ? { image } : {}),
  };
}

export function criarJsonLdObraPublica({
  hrefCanonico,
  nome,
  descricao,
  autor,
  imagem,
}: DadosComunsJsonLd) {
  const url = criarUrlAbsoluta(hrefCanonico);
  const name = normalizarTexto(nome);

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": url,
    url,
    ...(name ? { name } : {}),
    ...criarPropriedadesOpcionais({ descricao, autor, imagem }),
  };
}

export function criarJsonLdCapituloPublico({
  hrefCanonico,
  nome,
  descricao,
  autor,
  imagem,
  posicao,
  obra,
}: DadosCapituloJsonLd) {
  const url = criarUrlAbsoluta(hrefCanonico);
  const urlObra = criarUrlAbsoluta(obra.hrefCanonico);

  return {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "@id": url,
    url,
    name: normalizarTexto(nome),
    position: posicao,
    ...criarPropriedadesOpcionais({ descricao, autor, imagem }),
    isPartOf: {
      "@type": "CreativeWork",
      "@id": urlObra,
      url: urlObra,
      name: normalizarTexto(obra.nome),
    },
  };
}

export function serializarJsonLdSeguro(valor: unknown) {
  return (JSON.stringify(valor) || "null")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
