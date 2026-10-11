import { criarSlugBase } from "../../../lib/utils";
import {
  BIO_MAX_LENGTH,
  SOBRE_BIO_MAX_LENGTH,
  avaliacaoDiarioVazia,
} from "../constants";
import type {
  ArquivoObraLocal,
  AutorPerfil,
  AvaliacaoDiarioPublica,
  CapituloLocal,
  ObraLocal,
  PerfilUsuarioRemoto,
  SupabaseCapituloRow,
  SupabaseObraRow,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import {
  normalizarNumeroPerfilAutor,
  normalizarUsernamePerfilAutor,
  obterTimestampData,
} from "./profile-formatters";
import { calcularProgressoLeitura } from "./work-normalizers";

export function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

export function pegarNumero(valor: unknown, fallback = 0) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

export function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

export function normalizarAvaliacaoDiarioPerfil(
  valor: unknown,
  estadoAnterior: AvaliacaoDiarioPublica = avaliacaoDiarioVazia,
): AvaliacaoDiarioPublica {
  const registro =
    valor && typeof valor === "object" && !Array.isArray(valor)
      ? (valor as Record<string, unknown>)
      : {};

  return {
    ...estadoAnterior,
    media: Math.max(0, Math.min(5, pegarNumero(registro.media, 0))),
    total: Math.max(0, Math.trunc(pegarNumero(registro.total, 0))),
    minhaNota: Math.max(
      0,
      Math.min(
        5,
        Math.round(
          pegarNumero(registro.minha_nota ?? registro.minhaNota, 0) * 2,
        ) / 2,
      ),
    ),
    carregado: true,
    salvando: false,
    visivel: pegarBooleano(registro.visivel, false),
    mostrar: pegarBooleano(
      registro.mostrar ?? registro.mostrar_avaliacao_diario,
      true,
    ),
    podeAvaliar: pegarBooleano(
      registro.pode_avaliar ?? registro.podeAvaliar,
      false,
    ),
  };
}

export function normalizarPerfilUsuarioSupabase(
  row: Record<string, unknown> | null,
  userIdFallback: string,
  nomeFallback: string,
): PerfilUsuarioRemoto {
  const userId =
    pegarTexto(row?.user_id) || pegarTexto(row?.id) || userIdFallback.trim();

  const nome =
    pegarTexto(row?.nome) ||
    pegarTexto(row?.nome_usuario) ||
    pegarTexto(row?.username) ||
    pegarTexto(row?.display_name) ||
    pegarTexto(row?.apelido) ||
    nomeFallback.trim() ||
    "Usuário";

  const username = normalizarUsernamePerfilAutor(pegarTexto(row?.username));

  const avatar =
    pegarTexto(row?.avatar_url) ||
    pegarTexto(row?.avatar) ||
    pegarTexto(row?.foto_url) ||
    pegarTexto(row?.imagem_url) ||
    pegarTexto(row?.photo_url);

  const bio =
    pegarTexto(row?.bio) ||
    pegarTexto(row?.sobre) ||
    pegarTexto(row?.descricao) ||
    "Perfil de leitor no Historietas.";

  const sobreBio =
    pegarTexto(row?.sobre_bio) ||
    pegarTexto(row?.sobreBio) ||
    pegarTexto(row?.sobre) ||
    pegarTexto(row?.descricao) ||
    bio;

  return {
    userId,
    nome: nome.slice(0, 80),
    username,
    avatar,
    bio: bio.slice(0, BIO_MAX_LENGTH),
    sobreBio: sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
    criadoEm: pegarTexto(row?.created_at ?? row?.criado_em),
  };
}

export function criarPerfilUsuarioRemotoComoAutor(
  perfilUsuario: PerfilUsuarioRemoto,
): AutorPerfil {
  return {
    autorId: perfilUsuario.userId,
    nome: perfilUsuario.nome,
    obras: [],
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: 0,
  };
}

function pegarTagsSupabase(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim()),
      )
      .map((tag) => tag.trim());

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}

function normalizarCategoriaArquivo(
  tipo: string,
): ArquivoObraLocal["categoria"] {
  const tipoNormalizado = tipo.toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (tipoNormalizado.includes("pdf") || tipoNormalizado.includes("document")) {
    return "documento";
  }

  if (
    tipoNormalizado.startsWith("text/") ||
    tipoNormalizado.includes("markdown")
  ) {
    return "texto";
  }

  return "outro";
}

function criarArquivoObraSupabase(
  row: SupabaseObraRow,
): ArquivoObraLocal | null {
  const conteudo = pegarTexto(
    row.arquivo_url ??
      row.arquivoUrl ??
      row.arquivo_conteudo ??
      row.arquivoObra,
  );

  if (!conteudo) {
    return null;
  }

  const tipo = pegarTexto(row.arquivo_tipo ?? row.arquivoTipo, "outro");

  return {
    nome: pegarTexto(row.arquivo_nome ?? row.arquivoNome, "arquivo-da-obra"),
    tipo,
    tamanho: pegarNumero(row.arquivo_tamanho ?? row.arquivoTamanho, 0),
    conteudo,
    categoria: normalizarCategoriaArquivo(tipo),
    criadoEm: pegarTexto(
      row.arquivo_criado_em ?? row.arquivoCriadoEm ?? row.created_at,
    ),
  };
}

export function normalizarObraSupabase(
  row: SupabaseObraRow,
  index: number,
): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autorId: pegarTexto(row.user_id ?? row.autor_id ?? row.autorId, ""),
    autor: pegarTexto(
      row.autor ?? row.nome_autor ?? row.autor_nome,
      "Autor não informado",
    ),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada",
    ),
    sinopse: pegarTexto(row.sinopse, "Nenhuma sinopse informada."),
    tags: pegarTagsSupabase(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    arquivoObra: criarArquivoObraSupabase(row),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    visualizacoes: normalizarNumeroPerfilAutor(
      row.visualizacoes ??
        row.views ??
        row.visualizacoes_total ??
        row.total_visualizacoes ??
        row.totalVisualizacoes,
    ),
    slug,
    link: `/obra/${slug}`,
  };
}

export function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  capituloIndex: number,
  obraIndex: number,
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(
      row.id,
      `capitulo-supabase-${obraIndex + 1}-${capituloIndex + 1}`,
    ),
    titulo: pegarTexto(row.titulo, `Capítulo ${capituloIndex + 1}`),
    texto: "",
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

export function mesclarObrasPorIdSlug(
  obrasBase: ObraLocal[],
  obrasNovas: ObraLocal[],
) {
  const mapa = new Map<string, ObraLocal>();

  [...obrasBase, ...obrasNovas].forEach((obra) => {
    const chave = obra.id || obra.slug || criarSlugBase(obra.titulo);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, obra);
      return;
    }

    mapa.set(chave, {
      ...existente,
      ...obra,
      capitulos:
        obra.capitulos.length > 0 ? obra.capitulos : existente.capitulos,
      arquivoObra: obra.arquivoObra || existente.arquivoObra,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      visualizacoes: Math.max(existente.visualizacoes, obra.visualizacoes),
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      ultimoCapituloLidoId:
        obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
    });
  });

  return Array.from(mapa.values());
}

export function aplicarInteracoesNasObras(
  obrasParaAtualizar: ObraLocal[],
  idsCapitulosCurtidos: Set<string>,
  idsCapitulosSalvos: Set<string>,
  comentariosPorCapitulo: Map<string, string>,
  progressoPorCapitulo: Map<string, string>,
  progressoCarregado: boolean,
  capitulosComMetricas: ReadonlySet<string>,
) {
  return obrasParaAtualizar.map((obra) => {
    let ultimoCapituloLidoId = progressoCarregado
      ? ""
      : obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = progressoCarregado ? "" : obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const lidoEmRemoto = progressoPorCapitulo.get(capitulo.id) || "";
      const progressoRemotoDisponivel =
        progressoCarregado && capitulosComMetricas.has(capitulo.id);
      const lido = progressoRemotoDisponivel
        ? Boolean(lidoEmRemoto)
        : Boolean(lidoEmRemoto) || capitulo.lido;
      const lidoEm = lido ? lidoEmRemoto || capitulo.lidoEm : "";

      if (lido && lidoEm) {
        const tempoAtual = obterTimestampData(lidoEm);
        const tempoAnterior = obterTimestampData(ultimaLeituraEm);

        if (tempoAtual >= tempoAnterior) {
          ultimoCapituloLidoId = capitulo.id;
          ultimaLeituraEm = lidoEm;
        }
      }

      return {
        ...capitulo,
        curtiu: capitulo.curtiu || idsCapitulosCurtidos.has(capitulo.id),
        salvo: capitulo.salvo || idsCapitulosSalvos.has(capitulo.id),
        comentario:
          comentariosPorCapitulo.get(capitulo.id) || capitulo.comentario,
        lido,
        lidoEm,
      };
    });

    return {
      ...obra,
      capitulos,
      ultimoCapituloLidoId,
      ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });
}

function somarContagensCapitulosPerfilAutor(
  obra: Pick<ObraLocal, "capitulos">,
  contagensPorCapitulo: Record<string, number>,
) {
  return obra.capitulos.reduce((total, capitulo) => {
    const capituloId = capitulo.id.trim();

    if (!capituloId) {
      return total;
    }

    return (
      total + normalizarNumeroPerfilAutor(contagensPorCapitulo[capituloId], 0)
    );
  }, 0);
}

export function obterTotalCurtidasObraPerfilAutor(
  obra: Pick<ObraLocal, "id" | "capitulos">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();
  const totalUsuariosUnicos = obraId
    ? normalizarNumeroPerfilAutor(totais.curtidasPorObra[obraId], 0)
    : 0;

  if (totalUsuariosUnicos > 0) {
    return totalUsuariosUnicos;
  }

  const totalCapitulos = somarContagensCapitulosPerfilAutor(
    obra,
    totais.curtidasPorCapitulo,
  );
  const totalLocal = obra.capitulos.filter(
    (capitulo) => capitulo.curtiu,
  ).length;

  return Math.max(totalCapitulos, totalLocal);
}

export function obterTotalComentariosObraPerfilAutor(
  obra: Pick<ObraLocal, "id" | "capitulos">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();
  const totalUsuariosUnicos = obraId
    ? normalizarNumeroPerfilAutor(totais.comentariosPorObra[obraId], 0)
    : 0;

  if (totalUsuariosUnicos > 0) {
    return totalUsuariosUnicos;
  }

  const totalCapitulos = somarContagensCapitulosPerfilAutor(
    obra,
    totais.comentariosPorCapitulo,
  );
  const totalLocal = obra.capitulos.filter((capitulo) =>
    capitulo.comentario.trim(),
  ).length;

  return Math.max(totalCapitulos, totalLocal);
}

export function obterTotalSalvosObraPerfilAutor(
  obra: Pick<ObraLocal, "id" | "capitulos">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();
  const totalUsuariosUnicos = obraId
    ? normalizarNumeroPerfilAutor(totais.salvosPorObra[obraId], 0)
    : 0;

  if (totalUsuariosUnicos > 0) {
    return totalUsuariosUnicos;
  }

  const totalCapitulos = somarContagensCapitulosPerfilAutor(
    obra,
    totais.salvosPorCapitulo,
  );
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.salvo).length;

  return Math.max(totalCapitulos, totalLocal);
}

export function obterTotalConcluidasObraPerfilAutor(
  obra: Pick<ObraLocal, "id">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();

  return obraId
    ? normalizarNumeroPerfilAutor(totais.concluidasPorObra[obraId], 0)
    : 0;
}
