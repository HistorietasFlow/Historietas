import { criarSlugBase } from "../../../lib/utils";
import { BIO_MAX_LENGTH, SOBRE_BIO_MAX_LENGTH } from "../constants";
import type {
  ArquivoObraLocal,
  AutorPerfil,
  CapituloLocal,
  ObraLocal,
  ObraSalva,
  PerfilAutorSalvo,
  PerfisAutoresSalvos,
} from "../types";
import {
  formatarGeneroPerfilAutor,
  normalizarNomeAutor,
  normalizarNumeroPerfilAutor,
} from "./profile-formatters";

export function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

export function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  capituloIndex: number,
  obraIndex: number,
): CapituloLocal {
  return {
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
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

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
    nome: arquivo.nome.trim(),
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

export function normalizarObra(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex, obraIndex),
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter(
          (tag): tag is string =>
            typeof tag === "string" && Boolean(tag.trim()),
        )
        .map((tag) => tag.trim())
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
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.autor_id === "string" && obra.autor_id.trim()
            ? obra.autor_id.trim()
            : "",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
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
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
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
    visualizacoes: normalizarNumeroPerfilAutor(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes,
    ),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${obraIndex + 1}`,
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
                    : `obra-${obraIndex + 1}`,
                )
          }`,
  };
}

export function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada" &&
    obra.classificacaoIndicativa !== "Não informado"
  );
}

function normalizarUsuarioIdPerfilAutor(valor: string) {
  return valor.trim().toLowerCase();
}

export function obraPertenceAoUsuarioPerfilAutor(
  obra: ObraLocal,
  userId: string,
) {
  const userIdNormalizado = normalizarUsuarioIdPerfilAutor(userId);
  const autorIdNormalizado = normalizarUsuarioIdPerfilAutor(obra.autorId || "");

  return Boolean(userIdNormalizado && autorIdNormalizado === userIdNormalizado);
}

export function filtrarObrasLocaisDoUsuarioPerfilAutor(
  obrasLocais: ObraLocal[],
  userId: string,
) {
  const userIdNormalizado = normalizarUsuarioIdPerfilAutor(userId);

  if (!userIdNormalizado) {
    return [] as ObraLocal[];
  }

  return obrasLocais.filter((obra) =>
    obraPertenceAoUsuarioPerfilAutor(obra, userIdNormalizado),
  );
}

export function mesclarObrasLocalStoragePerfilAutor(
  obrasLocaisOriginais: ObraLocal[],
  obrasAtualizadasDoUsuario: ObraLocal[],
  userId: string,
) {
  const userIdNormalizado = normalizarUsuarioIdPerfilAutor(userId);

  if (!userIdNormalizado) {
    return obrasLocaisOriginais;
  }

  const obrasDeOutrasContas = obrasLocaisOriginais.filter(
    (obra) => !obraPertenceAoUsuarioPerfilAutor(obra, userIdNormalizado),
  );

  return [...obrasAtualizadasDoUsuario, ...obrasDeOutrasContas];
}

export function normalizarPerfisAutores(valor: unknown): PerfisAutoresSalvos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  const perfisValidos: PerfisAutoresSalvos = {};

  Object.entries(valor as Record<string, Partial<PerfilAutorSalvo>>).forEach(
    ([autor, perfil]) => {
      if (!autor.trim() || !perfil || typeof perfil !== "object") {
        return;
      }

      perfisValidos[normalizarNomeAutor(autor)] = {
        avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
        avatarNome:
          typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
        bio:
          typeof perfil.bio === "string"
            ? perfil.bio.slice(0, BIO_MAX_LENGTH)
            : "",
        sobreBio:
          typeof perfil.sobreBio === "string"
            ? perfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH)
            : "",
        mostrarDestaques: perfil.mostrarDestaques === true,
      };
    },
  );

  return perfisValidos;
}

export function criarBioAutor(perfil: AutorPerfil) {
  if (perfil.obras.length === 0) {
    return `${perfil.nome} participa da Historietas como leitor, com Diário, comunidade e atividades de leitura.`;
  }

  const generos = Array.from(
    new Set(
      perfil.obras
        .map((obra) => formatarGeneroPerfilAutor(obra.genero))
        .filter((genero) => genero && genero !== "Não informado"),
    ),
  );

  const generosTexto =
    generos.length > 0 ? generos.slice(0, 3).join(", ") : "histórias variadas";

  return `${perfil.nome} publica histórias na Historietas, com foco em ${generosTexto}.`;
}

export function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? obra.capitulos.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId,
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = obra.capitulos
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    obra.capitulos.find((capitulo) => !capitulo.lido) ||
    obra.capitulos[obra.capitulos.length - 1] ||
    null
  );
}
