import { criarSlugBase, idObraSupabaseValido } from "../../../../lib/utils";

export type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

export type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

type ArquivoObraNormalizado = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

export function normalizarArquivoObra(valor: unknown): ArquivoObraNormalizado | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraNormalizado>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  let categoria: ArquivoObraNormalizado["categoria"] = "outro";

  if (
    arquivo.categoria === "texto" ||
    arquivo.categoria === "documento" ||
    arquivo.categoria === "imagem" ||
    arquivo.categoria === "outro"
  ) {
    categoria = arquivo.categoria;
  }

  return {
    nome: arquivo.nome,
    tipo: typeof arquivo.tipo === "string" ? arquivo.tipo : "",
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria,
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

export function decodificarCaminhoArquivoObra(caminho: string) {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
}

export function normalizarCaminhoStorageArquivoObra(caminho: string) {
  const caminhoSemBusca = caminho.split("?")[0]?.split("#")[0] || "";
  const caminhoDecodificado = decodificarCaminhoArquivoObra(caminhoSemBusca)
    .replace(/^\/+/, "")
    .trim();
  const prefixos = [
    "storage/v1/object/sign/arquivos-obras/",
    "storage/v1/object/public/arquivos-obras/",
    "storage/v1/object/authenticated/arquivos-obras/",
    "storage/v1/object/arquivos-obras/",
    "arquivos-obras/",
  ];

  let caminhoObjeto = caminhoDecodificado;

  for (const prefixo of prefixos) {
    const indicePrefixo = caminhoDecodificado.indexOf(prefixo);

    if (indicePrefixo >= 0) {
      caminhoObjeto = caminhoDecodificado.slice(
        indicePrefixo + prefixo.length
      );
      break;
    }
  }

  const caminhoLimpo = caminhoObjeto.replace(/^\/+/, "").trim();
  const pastaProprietario = caminhoLimpo.split("/")[0] || "";

  return idObraSupabaseValido(pastaProprietario) ? caminhoLimpo : "";
}

export function obterCaminhoStorageArquivoObra(conteudo: string) {
  const valor = conteudo.trim();

  if (!valor || /^(?:data|blob):/i.test(valor)) {
    return "";
  }

  try {
    const url = new URL(valor);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return normalizarCaminhoStorageArquivoObra(url.pathname);
  } catch {
    return normalizarCaminhoStorageArquivoObra(valor);
  }
}

export function normalizarCategoriaArquivoSupabase(categoria: string | null) {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}

export function obterChavesBackupObra(obra: {
  id: string;
  slug: string;
  titulo: string;
}) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo)].filter((chave) =>
        Boolean(chave.trim())
      )
    )
  );
}
