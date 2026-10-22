import { normalizarAvisosConteudo18 } from "../../../lib/historietasAdultContent";
import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { calcularProgressoLeitura } from "./publicar-work-utils";
import type {
  ArquivoObraLocal,
  CapituloLocal,
  ObraLocal,
  ObraSalva,
} from "./publicar-models";

export function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  let categoria: ArquivoObraLocal["categoria"] = "outro";

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

export function normalizarObraSalva(
  obra: ObraSalva,
  obraIndex: number
): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) => ({
        ...capitulo,
        id:
          typeof capitulo.id === "string" && capitulo.id.trim()
            ? capitulo.id
            : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
        titulo:
          typeof capitulo.titulo === "string" && capitulo.titulo.trim()
            ? capitulo.titulo
            : "Capítulo sem título",
        texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
        curtiu: Boolean(capitulo.curtiu),
        salvo: Boolean(capitulo.salvo),
        comentario:
          typeof capitulo.comentario === "string" ? capitulo.comentario : "",
        criadoEm:
          typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
        lido: Boolean(capitulo.lido),
        lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
      }))
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? obra.titulo
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
        ? obra.user_id.trim()
        : typeof obra.userId === "string" && obra.userId.trim()
        ? obra.userId.trim()
        : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    avisosConteudo: normalizarAvisosConteudo18(
      obra.avisosConteudo,
      obra.classificacaoIndicativa,
    ),
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: Array.isArray(obra.tags)
      ? obra.tags.filter((tag): tag is string => typeof tag === "string")
      : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    visualizacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalSalvos: 0,
    totalLidos: 0,
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${obraIndex + 1}`
          ),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(
                  typeof obra.titulo === "string" && obra.titulo.trim()
                    ? obra.titulo
                    : `obra-${obraIndex + 1}`
                )
          }`,
  };
}

export function ehDataUrl(valor: string) {
  return valor.startsWith("data:");
}

export function prepararObraParaLocalStorage(obra: ObraLocal): ObraLocal {
  return {
    ...obra,
    capa: ehDataUrl(obra.capa) ? "" : obra.capa,
    arquivoObra: obra.arquivoObra
      ? {
          ...obra.arquivoObra,
          conteudo: ehDataUrl(obra.arquivoObra.conteudo)
            ? ""
            : obra.arquivoObra.conteudo,
        }
      : null,
  };
}

export function obterAutorIdObraPublicar(obra: Pick<ObraLocal, "autorId">) {
  return typeof obra.autorId === "string" ? obra.autorId.trim() : "";
}

export function obraPertenceAoUsuarioPublicar(
  obra: Pick<ObraLocal, "autorId">,
  userId: string,
) {
  const userIdLimpo = userId.trim();

  return Boolean(userIdLimpo && obterAutorIdObraPublicar(obra) === userIdLimpo);
}

export function obterChavesBackupArquivoPublicar(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "link">,
) {
  return Array.from(
    new Set(
      [
        `id:${obra.id}`,
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ].filter((chave) => Boolean(chave.trim())),
    ),
  );
}
