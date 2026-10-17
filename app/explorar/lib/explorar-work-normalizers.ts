import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import {
  normalizarAvisosConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";

export type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
};

export type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

export type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalFavoritos?: number;
  totalConcluidas?: number;
  slug: string;
  link: string;
};

export type SupabaseObraRow = {
  id: string;
  user_id: string;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  avisos_conteudo: string[] | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
  visualizacoes: number | null;


};

export type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;

  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export function normalizarContadorExplorar(valor: unknown) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return 0;
}

export function totalCurtidasObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(obra.totalCurtidas);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.curtiu).length;

  return Math.max(totalUsuariosUnicos, totalLocal);
}

export function totalComentariosObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(
    obra.totalComentarios
  );
  const totalLocal = obra.capitulos.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;

  return Math.max(totalUsuariosUnicos, totalLocal);
}

export function totalSalvosObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(obra.totalSalvos);
  const totalFavoritos = normalizarContadorExplorar(obra.totalFavoritos);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.salvo).length;

  return Math.max(totalUsuariosUnicos, totalFavoritos, totalLocal);
}

export function totalLidosObra(obra: ObraLocal) {
  const totalUsuariosUnicos = normalizarContadorExplorar(obra.totalLidos);
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.max(totalUsuariosUnicos, totalLocal);
}

export function obraTemAtividadeLeitura(obra: ObraLocal) {
  return obra.capitulos.some((capitulo) => capitulo.lido);
}

export function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}


export function dataCriacaoObra(obra: ObraLocal) {
  const data = new Date(obra.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function dataUltimoCapituloObraExplorar(obra: ObraLocal) {
  return obra.capitulos.reduce((tempoMaisRecente, capitulo) => {
    const tempoCapitulo = new Date(capitulo.criadoEm).getTime();

    return Number.isNaN(tempoCapitulo)
      ? tempoMaisRecente
      : Math.max(tempoMaisRecente, tempoCapitulo);
  }, dataCriacaoObra(obra));
}

export function pontuacaoRecomendacaoObraExplorar(obra: ObraLocal) {
  return (
    normalizarContadorExplorar(obra.visualizacoes) +
    totalCurtidasObra(obra) * 8 +
    totalComentariosObra(obra) * 5 +
    totalSalvosObra(obra) * 6 +
    totalLidosObra(obra) * 3 +
    obra.capitulos.length * 2
  );
}

export function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo: capitulo.titulo || "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado: capitulo.publicado !== false,
    totalCurtidas: normalizarContadorExplorar(capitulo.totalCurtidas),
    totalComentarios: normalizarContadorExplorar(capitulo.totalComentarios),
    totalSalvos: normalizarContadorExplorar(capitulo.totalSalvos),
    totalLidos: normalizarContadorExplorar(capitulo.totalLidos),
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

export function obraTemArquivoAnexadoExplorar(
  obra: Pick<ObraLocal, "arquivoObra">
) {
  return Boolean(normalizarArquivoObra(obra.arquivoObra));
}

export function obraTemConteudoPublicadoExplorar(
  obra: Pick<ObraLocal, "capitulos" | "arquivoObra">
) {
  return obra.capitulos.length > 0 || obraTemArquivoAnexadoExplorar(obra);
}

export function criarChavesBackupObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  slug: string
) {
  const chaves = new Set<string>();
  const id = typeof obra.id === "string" ? obra.id.trim() : "";
  const titulo = typeof obra.titulo === "string" ? obra.titulo.trim() : "";
  const link = typeof obra.link === "string" ? obra.link.trim() : "";

  if (id) {
    chaves.add(`id:${id}`);
  }

  if (slug) {
    chaves.add(`slug:${slug}`);
  }

  if (titulo) {
    chaves.add(`titulo:${normalizarTexto(titulo)}`);
  }

  if (link) {
    chaves.add(`link:${link}`);
  }

  return Array.from(chaves);
}

export function normalizarObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number,
  userId = "",
  obterArquivoObraComBackup: (
    obra: Partial<ObraLocal> & Record<string, unknown>,
    slug: string,
    userId?: string
  ) => ArquivoObraLocal | null
): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => {
          return typeof tag === "string" && Boolean(tag.trim());
        })
        .map((tag) => tag.trim())
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo,
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
            : typeof obra.autor_id === "string" && obra.autor_id.trim()
              ? obra.autor_id.trim()
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
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: obterArquivoObraComBackup(obra, slug, userId),
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
    visualizacoes: normalizarContadorExplorar(obra.visualizacoes),
    totalCurtidas: normalizarContadorExplorar(obra.totalCurtidas),
    totalComentarios: normalizarContadorExplorar(
      obra.totalComentarios ?? obra.comentarios ?? obra.total_comentarios
    ),
    totalSalvos: normalizarContadorExplorar(
      obra.totalSalvos ?? obra.salvos ?? obra.total_salvos
    ),
    totalLidos: normalizarContadorExplorar(
      obra.totalLidos ?? obra.lidos ?? obra.total_lidos
    ),
    totalFavoritos: normalizarContadorExplorar(obra.totalFavoritos),
    totalConcluidas: normalizarContadorExplorar(obra.totalConcluidas),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
  };
}

export function normalizarCategoriaArquivoSupabase(
  categoria: string | null
): ArquivoObraLocal["categoria"] {
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

export function normalizarObraSupabase(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos: CapituloLocal[] = capitulosSupabase.map(
    (capitulo, capituloIndex) => {
      const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

      return {
        id: capitulo.id,
        titulo:
          capitulo.titulo?.trim() ||
          capituloLocal?.titulo ||
          `Capítulo ${capituloIndex + 1}`,
        texto: "",
        curtiu: Boolean(capituloLocal?.curtiu),
        salvo: Boolean(capituloLocal?.salvo),
        comentario: capituloLocal?.comentario || "",
        criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
        lido: Boolean(capituloLocal?.lido),
        lidoEm: capituloLocal?.lidoEm || "",
        publicado: true,
        totalCurtidas: normalizarContadorExplorar(capituloLocal?.totalCurtidas),
        totalComentarios: normalizarContadorExplorar(capituloLocal?.totalComentarios),
        totalSalvos: normalizarContadorExplorar(capituloLocal?.totalSalvos),
        totalLidos: normalizarContadorExplorar(capituloLocal?.totalLidos),
      };
    }
  );

  const capitulosMesclados = capitulosRemotos;
  const tituloObra = obra.titulo?.trim() || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
        ? "image/*"
        : arquivoCategoria === "texto"
          ? "text/plain"
          : "");

  return {
    id: obra.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || "Autor não informado",
    autorId: obra.user_id?.trim() || "",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    avisosConteudo: normalizarAvisosConteudo18(
      obra.avisos_conteudo ?? obraLocal?.avisosConteudo,
      obra.classificacao_indicativa ?? obraLocal?.classificacaoIndicativa,
    ),
    sinopse:
      obra.sinopse?.trim() ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : ["sem tags"],
    capa: obra.capa_url?.trim() || "",
    capaNome: obra.capa_nome?.trim() || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || "",
        }
      : null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarContadorExplorar(
      obra.visualizacoes ?? obraLocal?.visualizacoes
    ),
    totalCurtidas: normalizarContadorExplorar(obraLocal?.totalCurtidas),
    totalComentarios: normalizarContadorExplorar(
      obraLocal?.totalComentarios
    ),
    totalSalvos: normalizarContadorExplorar(obraLocal?.totalSalvos),
    totalLidos: normalizarContadorExplorar(obraLocal?.totalLidos),
    totalFavoritos: normalizarContadorExplorar(obraLocal?.totalFavoritos),
    totalConcluidas: normalizarContadorExplorar(obraLocal?.totalConcluidas),
    slug: slugObra,
    link: `/obra/${slugObra}`,
  };
}

export function mesclarObrasSemDuplicar(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [];
  const chavesUsadas = new Set<string>();

  [...obrasSupabase, ...obrasLocais].forEach((obra) => {
    const slug = obra.slug || criarSlugBase(obra.titulo);
    const chaves = [obra.id, slug].filter((chave) => Boolean(chave.trim()));
    const jaExiste = chaves.some((chave) => chavesUsadas.has(chave));

    if (jaExiste) {
      return;
    }

    obrasMescladas.push(obra);
    chaves.forEach((chave) => chavesUsadas.add(chave));
  });

  return obrasMescladas;
}
