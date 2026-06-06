"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autorId: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
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
  slug: string;
  link: string;
};

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

type AutorPerfil = {
  autorId: string;
  nome: string;
  obras: ObraLocal[];
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalPublicadas: number;
};

type FiltroObrasAutor = "todas" | "publicadas" | "rascunhos" | "sem-capitulos";
type OrdenacaoObrasAutor = "recentes" | "titulo" | "capitulos" | "curtidas";

const STORAGE_KEY = "historietas-obras";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const BIO_MAX_LENGTH = 160;

type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function criarChaveAutorPerfil(autorId: string, nomeAutor: string) {
  return autorId.trim().toLowerCase() || normalizarNomeAutor(nomeAutor);
}

function criarLoginHrefPerfilAutor() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/perfil-autor";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/perfil-autor";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefLeituraCapituloPerfilAutor(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: Pick<CapituloLocal, "id">,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function formatarGeneroPerfilAutor(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

function obterTimestampData(dataIso: string) {
  const data = new Date(dataIso).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  capituloIndex: number,
  obraIndex: number
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

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
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

function normalizarObra(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex, obraIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter(
          (tag): tag is string => typeof tag === "string" && Boolean(tag.trim())
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

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada" &&
    obra.classificacaoIndicativa !== "Não informado"
  );
}

function normalizarPerfisAutores(valor: unknown): PerfisAutoresSalvos {
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
      };
    }
  );

  return perfisValidos;
}

function carregarPerfisAutores(): PerfisAutoresSalvos {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const dados = localStorage.getItem(AUTHOR_PROFILE_STORAGE_KEY);
    const perfis = dados ? JSON.parse(dados) : {};
    const perfisNormalizados = normalizarPerfisAutores(perfis);

    localStorage.setItem(
      AUTHOR_PROFILE_STORAGE_KEY,
      JSON.stringify(perfisNormalizados)
    );

    return perfisNormalizados;
  } catch {
    localStorage.setItem(AUTHOR_PROFILE_STORAGE_KEY, JSON.stringify({}));
    return {};
  }
}

function criarBioAutor(perfil: AutorPerfil) {
  const generos = Array.from(
    new Set(
      perfil.obras
        .map((obra) => formatarGeneroPerfilAutor(obra.genero))
        .filter((genero) => genero && genero !== "Não informado")
    )
  );

  const generosTexto =
    generos.length > 0 ? generos.slice(0, 3).join(", ") : "histórias variadas";

  return `${perfil.nome} publica histórias na Historietas, com foco em ${generosTexto}.`;
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : null;

  if (capituloRegistrado) {
    return capituloRegistrado;
  }

  return obra.capitulos.find((capitulo) => !capitulo.lido) || obra.capitulos[0];
}

function criarCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverStyle;
  }

  return {
    ...coverStyle,
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.24) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarCoverStyleDesktop(capa: string): CSSProperties {
  return {
    ...criarCoverStyle(capa),
    minHeight: "180px",
    borderRadius: "20px",
  };
}


type SupabaseObraRow = Record<string, unknown>;
type SupabaseCapituloRow = Record<string, unknown>;

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarNumero(valor: unknown, fallback = 0) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function pegarTagsSupabase(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
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

function normalizarCategoriaArquivo(tipo: string): ArquivoObraLocal["categoria"] {
  const tipoNormalizado = tipo.toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (tipoNormalizado.includes("pdf") || tipoNormalizado.includes("document")) {
    return "documento";
  }

  if (tipoNormalizado.startsWith("text/") || tipoNormalizado.includes("markdown")) {
    return "texto";
  }

  return "outro";
}

function criarArquivoObraSupabase(row: SupabaseObraRow): ArquivoObraLocal | null {
  const conteudo = pegarTexto(
    row.arquivo_url ?? row.arquivoUrl ?? row.arquivo_conteudo ?? row.arquivoObra
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
    criadoEm: pegarTexto(row.arquivo_criado_em ?? row.arquivoCriadoEm ?? row.created_at),
  };
}

function normalizarObraSupabase(row: SupabaseObraRow, index: number): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autorId: pegarTexto(row.user_id ?? row.autor_id ?? row.autorId, ""),
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada"
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
    slug,
    link: `/obra/${slug}`,
  };
}

function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  capituloIndex: number,
  obraIndex: number
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(row.id, `capitulo-supabase-${obraIndex + 1}-${capituloIndex + 1}`),
    titulo: pegarTexto(row.titulo, `Capítulo ${capituloIndex + 1}`),
    texto: pegarTexto(row.texto ?? row.conteudo, ""),
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

function mesclarObrasPorIdSlug(obrasBase: ObraLocal[], obrasNovas: ObraLocal[]) {
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
      capitulos: obra.capitulos.length > 0 ? obra.capitulos : existente.capitulos,
      arquivoObra: obra.arquivoObra || existente.arquivoObra,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      ultimoCapituloLidoId: obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
    });
  });

  return Array.from(mapa.values());
}

function aplicarInteracoesNasObras(
  obrasParaAtualizar: ObraLocal[],
  idsCapitulosCurtidos: Set<string>,
  idsCapitulosSalvos: Set<string>,
  comentariosPorCapitulo: Map<string, string>,
  progressoPorCapitulo: Map<string, string>
) {
  return obrasParaAtualizar.map((obra) => {
    let ultimoCapituloLidoId = obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const lidoEm = progressoPorCapitulo.get(capitulo.id) || capitulo.lidoEm;
      const lido = Boolean(lidoEm) || capitulo.lido;

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
        comentario: comentariosPorCapitulo.get(capitulo.id) || capitulo.comentario,
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

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as SupabaseObraRow, index)
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", idsObras)
        .order("ordem", { ascending: true });

      if (Array.isArray(capitulosData)) {
        const capitulosPorObra = new Map<string, CapituloLocal[]>();

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as SupabaseCapituloRow,
            index,
            index
          );

          if (!capituloNormalizado.obraId) {
            return;
          }

          const capitulosAtuais = capitulosPorObra.get(capituloNormalizado.obraId) || [];
          const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
          void _obraId;

          capitulosPorObra.set(capituloNormalizado.obraId, [
            ...capitulosAtuais,
            capituloSemObraId,
          ]);
        });

        return obrasSupabase.map((obra) => {
          const capitulos = capitulosPorObra.get(obra.id) || [];

          return {
            ...obra,
            capitulos,
            progressoLeitura: calcularProgressoLeitura(capitulos),
          };
        });
      }
    } catch {
      // Se capítulos falhar, a página continua mostrando as obras.
    }

    return obrasSupabase;
  } catch {
    return [];
  }
}

async function carregarIdsTabelaUsuario(
  tabela: string,
  colunaId: string,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunaId)
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro[colunaId]);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

async function carregarAutoresSeguidosSupabase(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("seguindo_autores")
      .select("autor")
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const autores: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const autor = normalizarNomeAutor(pegarTexto(registro.autor));

      if (autor) {
        autores.push(autor);
      }
    });

    return autores;
  } catch {
    return [];
  }
}

async function carregarInteracoesCapitulosSupabase(userId: string) {
  const curtidas = new Set(await carregarIdsTabelaUsuario("curtidas_capitulos", "capitulo_id", userId));
  const salvos = new Set(await carregarIdsTabelaUsuario("salvos_capitulos", "capitulo_id", userId));
  const comentarios = new Map<string, string>();
  const progresso = new Map<string, string>();

  try {
    const { data } = await supabase
      .from("comentarios_capitulos")
      .select("capitulo_id, comentario, texto")
      .eq("user_id", userId);

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const registro = item as Record<string, unknown>;
        const capituloId = pegarTexto(registro.capitulo_id);
        const texto = pegarTexto(registro.comentario ?? registro.texto);

        if (capituloId && texto) {
          comentarios.set(capituloId, texto);
        }
      });
    }
  } catch {
    // Comentários continuam apenas localmente se houver erro.
  }

  try {
    const { data } = await supabase
      .from("progresso_leitura")
      .select("*")
      .eq("user_id", userId);

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const registro = item as Record<string, unknown>;
        const capituloId = pegarTexto(registro.capitulo_id);
        const lidoEm = pegarTexto(registro.lido_em ?? registro.updated_at ?? registro.created_at);

        if (capituloId && lidoEm) {
          progresso.set(capituloId, lidoEm);
        }
      });
    }
  } catch {
    // Progresso continua apenas localmente se houver erro.
  }

  return { curtidas, salvos, comentarios, progresso };
}

async function carregarEstadoUsuarioSupabase() {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [favoritas, concluidas, autoresSeguidos, interacoes] = await Promise.all([
      carregarIdsTabelaUsuario("favoritos", "obra_id", userId),
      carregarIdsTabelaUsuario("concluidas", "obra_id", userId),
      carregarAutoresSeguidosSupabase(userId),
      carregarInteracoesCapitulosSupabase(userId),
    ]);

    return {
      userId,
      favoritas,
      concluidas,
      autoresSeguidos,
      interacoes,
    };
  } catch {
    return null;
  }
}

async function sincronizarTabelaUsuario(
  tabela: string,
  colunaId: string,
  idValor: string,
  ativo: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !idValor) {
      return;
    }

    if (ativo) {
      await supabase.from(tabela).upsert(
        {
          user_id: userId,
          [colunaId]: idValor,
        },
        { onConflict: `user_id,${colunaId}` }
      );
      return;
    }

    await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq(colunaId, idValor);
  } catch {
    // A ação local permanece funcionando se o Supabase falhar.
  }
}

async function sincronizarAutorSeguidoSupabase(autor: string, ativo: boolean) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !autor) {
      return;
    }

    if (ativo) {
      await supabase.from("seguindo_autores").upsert(
        {
          user_id: userId,
          autor,
        },
        { onConflict: "user_id,autor" }
      );
      return;
    }

    await supabase
      .from("seguindo_autores")
      .delete()
      .eq("user_id", userId)
      .eq("autor", autor);
  } catch {
    // A ação local permanece funcionando se o Supabase falhar.
  }
}

export default function PerfilAutorPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [autorSelecionado, setAutorSelecionado] = useState("");
  const [autorIdSelecionado, setAutorIdSelecionado] = useState("");
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [perfisAutoresSalvos, setPerfisAutoresSalvos] =
    useState<PerfisAutoresSalvos>({});
  const [avatarErro, setAvatarErro] = useState("");
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [podeEditarPerfil, setPodeEditarPerfil] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [buscaObras, setBuscaObras] = useState("");
  const [filtroObras, setFiltroObras] = useState<FiltroObrasAutor>("todas");
  const [ordenacaoObras, setOrdenacaoObras] =
    useState<OrdenacaoObrasAutor>("recentes");

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    function atualizarTelaDesktop() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    atualizarTelaDesktop();
    window.addEventListener("resize", atualizarTelaDesktop);

    return () => {
      window.removeEventListener("resize", atualizarTelaDesktop);
    };
  }, []);


  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPerfilAutor() {
      const params = new URLSearchParams(window.location.search);
      const autorParam = params.get("autor") || "";
      const autorIdParam =
        params.get("autorId") || params.get("id") || params.get("userId") || "";
      const modoEdicaoPerfil =
        params.get("editar") === "1" ||
        params.get("modo") === "editar" ||
        params.get("dono") === "1";

      setAutorSelecionado(autorParam.trim());
      setAutorIdSelecionado(autorIdParam.trim());
      setPodeEditarPerfil(modoEdicaoPerfil);

      let obrasNormalizadas: ObraLocal[] = [];
      let autoresSeguidosNormalizados: string[] = [];
      let obrasFavoritasNormalizadas: string[] = [];
      let obrasConcluidasNormalizadas: string[] = [];

      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        obrasNormalizadas = Array.isArray(obrasSalvasJson)
          ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
              normalizarObra(obra, index)
            )
          : [];

        const autoresSeguidosTexto = localStorage.getItem(
          AUTHOR_FOLLOW_STORAGE_KEY
        );
        const autoresSeguidosJson = autoresSeguidosTexto
          ? JSON.parse(autoresSeguidosTexto)
          : [];

        autoresSeguidosNormalizados = Array.isArray(autoresSeguidosJson)
          ? autoresSeguidosJson
              .filter(
                (autor): autor is string =>
                  typeof autor === "string" && Boolean(autor.trim())
              )
              .map((autor) => normalizarNomeAutor(autor))
          : [];

        const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const obrasFavoritasJson = obrasFavoritasTexto
          ? JSON.parse(obrasFavoritasTexto)
          : [];

        obrasFavoritasNormalizadas = Array.isArray(obrasFavoritasJson)
          ? obrasFavoritasJson.filter(
              (id): id is string => typeof id === "string" && Boolean(id.trim())
            )
          : [];

        const obrasConcluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
        const obrasConcluidasJson = obrasConcluidasTexto
          ? JSON.parse(obrasConcluidasTexto)
          : [];

        obrasConcluidasNormalizadas = Array.isArray(obrasConcluidasJson)
          ? obrasConcluidasJson.filter(
              (id): id is string => typeof id === "string" && Boolean(id.trim())
            )
          : [];
      } catch {
        obrasNormalizadas = [];
        autoresSeguidosNormalizados = [];
        obrasFavoritasNormalizadas = [];
        obrasConcluidasNormalizadas = [];
      }

      const obrasSupabase = await carregarObrasPublicadasSupabase();
      const estadoUsuarioSupabase = await carregarEstadoUsuarioSupabase();

      let obrasMescladas = mesclarObrasPorIdSlug(obrasNormalizadas, obrasSupabase);

      if (estadoUsuarioSupabase) {
        obrasFavoritasNormalizadas = Array.from(
          new Set([...obrasFavoritasNormalizadas, ...estadoUsuarioSupabase.favoritas])
        );
        obrasConcluidasNormalizadas = Array.from(
          new Set([...obrasConcluidasNormalizadas, ...estadoUsuarioSupabase.concluidas])
        );
        autoresSeguidosNormalizados = Array.from(
          new Set([
            ...autoresSeguidosNormalizados,
            ...estadoUsuarioSupabase.autoresSeguidos,
          ])
        );

        obrasMescladas = aplicarInteracoesNasObras(
          obrasMescladas,
          estadoUsuarioSupabase.interacoes.curtidas,
          estadoUsuarioSupabase.interacoes.salvos,
          estadoUsuarioSupabase.interacoes.comentarios,
          estadoUsuarioSupabase.interacoes.progresso
        );
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasMescladas));
        localStorage.setItem(
          AUTHOR_FOLLOW_STORAGE_KEY,
          JSON.stringify(autoresSeguidosNormalizados)
        );
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(obrasFavoritasNormalizadas)
        );
        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(obrasConcluidasNormalizadas)
        );
      } catch {
        // Se o navegador bloquear localStorage, a página ainda usa o estado em memória.
      }

      if (!componenteAtivo) {
        return;
      }

      setObras(obrasMescladas);
      setAutoresSeguidos(autoresSeguidosNormalizados);
      setObrasFavoritas(obrasFavoritasNormalizadas);
      setObrasConcluidas(obrasConcluidasNormalizadas);
      setPerfisAutoresSalvos(carregarPerfisAutores());
      setCarregando(false);
    }

    void carregarPerfilAutor();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const perfisAutores = useMemo<AutorPerfil[]>(() => {
    const mapa = new Map<string, { autorId: string; nome: string; obras: ObraLocal[] }>();

    obras.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const autorId = obra.autorId.trim();
      const chaveAutor = criarChaveAutorPerfil(autorId, nomeAutor);
      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          autorId: autorExistente.autorId || autorId,
          obras: [...autorExistente.obras, obra],
        });
        return;
      }

      mapa.set(chaveAutor, {
        autorId,
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.values())
      .map((grupoAutor) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0
        );

        const totalCurtidas = obrasDoAutor.reduce((total, obra) => {
          return (
            total + obra.capitulos.filter((capitulo) => capitulo.curtiu).length
          );
        }, 0);

        const totalComentarios = obrasDoAutor.reduce((total, obra) => {
          return (
            total +
            obra.capitulos.filter((capitulo) => capitulo.comentario.trim())
              .length
          );
        }, 0);

        return {
          autorId: grupoAutor.autorId,
          nome: grupoAutor.nome,
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalCurtidas,
          totalComentarios,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
  }, [obras]);

  const perfilAtual = useMemo(() => {
    if (!autorSelecionado && !autorIdSelecionado) {
      return null;
    }

    const autorIdNormalizado = autorIdSelecionado.trim().toLowerCase();

    if (autorIdNormalizado) {
      const perfilPorId = perfisAutores.find(
        (perfil) => perfil.autorId.trim().toLowerCase() === autorIdNormalizado
      );

      if (perfilPorId) {
        return perfilPorId;
      }
    }

    const autorNormalizado = normalizarNomeAutor(autorSelecionado);

    return (
      perfisAutores.find(
        (perfil) => normalizarNomeAutor(perfil.nome) === autorNormalizado
      ) || null
    );
  }, [perfisAutores, autorSelecionado, autorIdSelecionado]);

  const autorNaoEncontrado = Boolean(
    (autorSelecionado || autorIdSelecionado) && !perfilAtual
  );

  const perfilParaMostrar = autorSelecionado || autorIdSelecionado
    ? perfilAtual
    : perfisAutores[0] || null;

  const autorChavePerfil = perfilParaMostrar
    ? criarChaveAutorPerfil(perfilParaMostrar.autorId, perfilParaMostrar.nome)
    : "";
  const autorNormalizadoParaSeguir = perfilParaMostrar
    ? normalizarNomeAutor(perfilParaMostrar.nome)
    : "";

  const seguindoAutor = Boolean(
    autorChavePerfil &&
      (autoresSeguidos.includes(autorChavePerfil) ||
        autoresSeguidos.includes(autorNormalizadoParaSeguir))
  );

  const seguidoresTotal = seguindoAutor ? 1 : 0;
  const obrasFavoritasPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.filter((obra) => obrasFavoritas.includes(obra.id)).length
    : 0;
  const obrasConcluidasPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.filter((obra) => obrasConcluidas.includes(obra.id)).length
    : 0;
  const perfilSalvoAutor = autorChavePerfil
    ? perfisAutoresSalvos[autorChavePerfil] ||
      perfisAutoresSalvos[autorNormalizadoParaSeguir] || {
        avatar: "",
        avatarNome: "",
        bio: "",
      }
    : {
        avatar: "",
        avatarNome: "",
        bio: "",
      };
  const bioPadraoAutor = perfilParaMostrar ? criarBioAutor(perfilParaMostrar) : "";
  const bioAutor = perfilSalvoAutor.bio.trim() || bioPadraoAutor;
  const avatarAutor = perfilSalvoAutor.avatar;
  const caracteresRestantesBio = BIO_MAX_LENGTH - perfilSalvoAutor.bio.length;
  const termoBuscaObras = normalizarTexto(buscaObras);

  const obrasDoPerfilFiltradas = useMemo(() => {
    if (!perfilParaMostrar) {
      return [];
    }

    const filtradas = perfilParaMostrar.obras.filter((obra) => {
      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          formatarGeneroPerfilAutor(obra.genero),
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          obra.tags.join(" "),
          obra.capaNome,
          obra.arquivoObra?.nome || "",
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBuscaObras
        ? textoBusca.includes(termoBuscaObras)
        : true;

      const passaFiltro =
        filtroObras === "todas"
          ? true
          : filtroObras === "publicadas"
            ? obra.publicado
            : filtroObras === "rascunhos"
              ? !obra.publicado
              : obra.capitulos.length === 0;

      return passaBusca && passaFiltro;
    });

    return filtradas.sort((obraA, obraB) => {
      if (ordenacaoObras === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacaoObras === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      if (ordenacaoObras === "curtidas") {
        return (
          obraB.capitulos.filter((capitulo) => capitulo.curtiu).length -
          obraA.capitulos.filter((capitulo) => capitulo.curtiu).length
        );
      }

      return (
        obterTimestampData(obraB.criadaEm) - obterTimestampData(obraA.criadaEm)
      );
    });
  }, [perfilParaMostrar, termoBuscaObras, filtroObras, ordenacaoObras]);

  const filtrosObrasAtivos = Boolean(
    buscaObras.trim() || filtroObras !== "todas" || ordenacaoObras !== "recentes"
  );

  const containerAtualStyle = isDesktop ? desktopContainerStyle : containerStyle;
  const heroAtualStyle = isDesktop ? desktopHeroBoxStyle : heroBoxStyle;
  const authorTopRowAtualStyle = isDesktop
    ? desktopAuthorTopRowStyle
    : authorTopRowStyle;
  const avatarButtonAtualStyle = isDesktop
    ? desktopAvatarButtonStyle
    : avatarButtonStyle;
  const avatarDisplayAtualStyle = isDesktop
    ? desktopAvatarDisplayStyle
    : avatarDisplayStyle;
  const titleAtualStyle = isDesktop ? desktopTitleStyle : titleStyle;
  const descriptionAtualStyle = isDesktop
    ? desktopDescriptionStyle
    : descriptionStyle;
  const sectionHeaderAtualStyle = isDesktop
    ? desktopSectionHeaderStyle
    : sectionHeaderStyle;
  const filterBoxAtualStyle = isDesktop ? desktopFilterBoxStyle : filterBoxStyle;
  const filterGridAtualStyle = isDesktop
    ? desktopFilterGridStyle
    : filterGridStyle;
  const clearFilterButtonAtualStyle = isDesktop
    ? desktopClearFilterButtonStyle
    : clearFilterButtonStyle;
  const worksGridAtualStyle = isDesktop ? desktopWorksGridStyle : worksGridStyle;
  const workCardAtualStyle = isDesktop ? desktopWorkCardStyle : workCardStyle;
  const workContentAtualStyle = isDesktop
    ? desktopWorkContentStyle
    : workContentStyle;
  const workTitleAtualStyle = isDesktop ? desktopWorkTitleStyle : workTitleStyle;
  const workTextAtualStyle = isDesktop ? desktopWorkTextStyle : workTextStyle;
  const workActionsGridAtualStyle = isDesktop
    ? desktopWorkActionsGridStyle
    : workActionsGridStyle;
  const avatarActionsAtualStyle = isDesktop
    ? desktopAvatarActionsStyle
    : avatarActionsStyle;
  const avatarSmallButtonAtualStyle = isDesktop
    ? desktopAvatarSmallButtonStyle
    : avatarSmallButtonStyle;
  const avatarRemoveButtonAtualStyle = isDesktop
    ? desktopAvatarRemoveButtonStyle
    : avatarRemoveButtonStyle;
  const bioTextareaAtualStyle = isDesktop
    ? desktopBioTextareaStyle
    : bioTextareaStyle;
  const comunidadeAutorBusca = encodeURIComponent(perfilParaMostrar?.nome || "");
  const comunidadeAutorHref = comunidadeAutorBusca
    ? `/comunidade?busca=${comunidadeAutorBusca}`
    : "/comunidade";
  const comunidadeAutorTeoriasHref = comunidadeAutorBusca
    ? `${comunidadeAutorHref}&tipo=Teoria`
    : "/comunidade?tipo=Teoria";
  const comunidadeAutorReviewsHref = comunidadeAutorBusca
    ? `${comunidadeAutorHref}&tipo=Review`
    : "/comunidade?tipo=Review";

  async function usuarioEstaLogado() {
    try {
      const { data } = await supabase.auth.getUser();

      return Boolean(data.user);
    } catch {
      return false;
    }
  }

  function avisarLoginNecessario(mensagem: string) {
    setMensagemAcao(mensagem);
    router.push(criarLoginHrefPerfilAutor());
  }

  function limparFiltrosObras() {
    setBuscaObras("");
    setFiltroObras("todas");
    setOrdenacaoObras("recentes");
  }

  function salvarPerfilAutor(novoPerfil: PerfilAutorSalvo) {
    if (!autorChavePerfil) {
      return;
    }

    const novosPerfis = {
      ...perfisAutoresSalvos,
      [autorChavePerfil]: {
        avatar: novoPerfil.avatar,
        avatarNome: novoPerfil.avatarNome,
        bio: novoPerfil.bio.slice(0, BIO_MAX_LENGTH),
      },
    };

    localStorage.setItem(AUTHOR_PROFILE_STORAGE_KEY, JSON.stringify(novosPerfis));
    setPerfisAutoresSalvos(novosPerfis);
  }

  function atualizarBioAutor(novaBio: string) {
    salvarPerfilAutor({
      avatar: perfilSalvoAutor.avatar,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: novaBio.slice(0, BIO_MAX_LENGTH),
    });
  }

  function selecionarAvatarAutor(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setAvatarErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setAvatarErro("Escolha uma imagem válida.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > AVATAR_MAX_SIZE) {
      setAvatarErro("A imagem precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setAvatarErro("Não consegui carregar essa imagem.");
        return;
      }

      salvarPerfilAutor({
        avatar: resultado,
        avatarNome: arquivo.name,
        bio: perfilSalvoAutor.bio,
      });
    };

    leitor.onerror = () => {
      setAvatarErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerAvatarAutor() {
    salvarPerfilAutor({
      avatar: "",
      avatarNome: "",
      bio: perfilSalvoAutor.bio,
    });

    setAvatarErro("");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  async function alternarSeguirAutor() {
    if (!perfilParaMostrar) {
      return;
    }

    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para seguir autores.");
      return;
    }

    const autorNormalizado = normalizarNomeAutor(perfilParaMostrar.nome);
    const autorChaveSeguir = criarChaveAutorPerfil(
      perfilParaMostrar.autorId,
      perfilParaMostrar.nome
    );
    const proximoEstadoSeguindo = !seguindoAutor;
    const autoresSeguidosSemAutorAtual = autoresSeguidos.filter((autor) => {
      return autor !== autorChaveSeguir && autor !== autorNormalizado;
    });

    const novosAutoresSeguidos = proximoEstadoSeguindo
      ? Array.from(new Set([...autoresSeguidosSemAutorAtual, autorChaveSeguir]))
      : autoresSeguidosSemAutorAtual;

    localStorage.setItem(
      AUTHOR_FOLLOW_STORAGE_KEY,
      JSON.stringify(novosAutoresSeguidos)
    );

    setAutoresSeguidos(novosAutoresSeguidos);
    void sincronizarAutorSeguidoSupabase(autorNormalizado, proximoEstadoSeguindo);
  }

  async function alternarFavoritoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para adicionar obras à lista.");
      return;
    }

    const proximoEstadoFavorito = !obrasFavoritas.includes(obraId);

    const novasObrasFavoritas = proximoEstadoFavorito
      ? Array.from(new Set([...obrasFavoritas, obraId]))
      : obrasFavoritas.filter((id) => id !== obraId);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
    void sincronizarTabelaUsuario("favoritos", "obra_id", obraId, proximoEstadoFavorito);
  }

  async function alternarConcluidoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para concluir obras.");
      return;
    }

    const proximoEstadoConcluido = !obrasConcluidas.includes(obraId);

    const novasObrasConcluidas = proximoEstadoConcluido
      ? Array.from(new Set([...obrasConcluidas, obraId]))
      : obrasConcluidas.filter((id) => id !== obraId);

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
    void sincronizarTabelaUsuario("concluidas", "obra_id", obraId, proximoEstadoConcluido);
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{historietasThemeCss}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (autorNaoEncontrado) {
    return (
      <main style={pageThemeStyle}>
        <style>{historietasThemeCss}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
        <section style={containerStyle}>
          <header style={topStyle}>
            <Link href="/" style={logoStyle}>
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>
          </header>

          <section style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Autor não encontrado</h1>

            <p style={emptyTextStyle}>
              Não encontrei nenhuma obra para o autor{" "}
              <strong style={safeTextStyle}>{autorSelecionado || autorIdSelecionado}</strong>.
            </p>

            <Link href="/explorar" style={emptyButtonStyle}>
              Ir para Explorar
            </Link>
          </section>
        </section>
      </main>
    );
  }

  if (!perfilParaMostrar) {
    return (
      <main style={pageThemeStyle}>
        <style>{historietasThemeCss}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
        <section style={containerStyle}>
          <header style={topStyle}>
            <Link href="/" style={logoStyle}>
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>
          </header>

          <section style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Nenhum autor encontrado</h1>

            <p style={emptyTextStyle}>
              Publique uma obra primeiro. Depois o perfil do autor aparecerá aqui.
            </p>

            <Link href="/publicar" style={emptyButtonStyle}>
              Criar obra
            </Link>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{historietasThemeCss}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={containerAtualStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle}>
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <button
            type="button"
            onClick={() => void alternarSeguirAutor()}
            style={seguindoAutor ? headerFollowingButtonStyle : headerFollowButtonStyle}
          >
            {seguindoAutor ? "Seguindo" : "Seguir autor"}
          </button>
        </header>

        {mensagemAcao && <span style={actionMessageStyle}>{mensagemAcao}</span>}

        <section style={heroAtualStyle}>
          <div style={authorTopRowAtualStyle}>
            {podeEditarPerfil ? (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                style={avatarButtonAtualStyle}
                aria-label="Trocar imagem do autor"
              >
                {avatarAutor ? (
                  <img
                    src={avatarAutor}
                    alt={`Imagem de ${perfilParaMostrar.nome}`}
                    style={avatarImageStyle}
                  />
                ) : (
                  <span>{perfilParaMostrar.nome.charAt(0)}</span>
                )}
              </button>
            ) : (
              <div style={avatarDisplayAtualStyle}>
                {avatarAutor ? (
                  <img
                    src={avatarAutor}
                    alt={`Imagem de ${perfilParaMostrar.nome}`}
                    style={avatarImageStyle}
                  />
                ) : (
                  <span>{perfilParaMostrar.nome.charAt(0)}</span>
                )}
              </div>
            )}

            <div style={authorTextBlockStyle}>
              <h1 className="historietas-theme-title" style={titleAtualStyle}>{perfilParaMostrar.nome}</h1>

              <p style={descriptionAtualStyle}>{bioAutor}</p>
            </div>
          </div>

          {podeEditarPerfil && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={selecionarAvatarAutor}
                style={hiddenInputStyle}
              />

              <div style={avatarActionsAtualStyle}>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={avatarSmallButtonAtualStyle}
                >
                  {avatarAutor ? "Trocar imagem" : "Colocar imagem"}
                </button>

                {avatarAutor && (
                  <button
                    type="button"
                    onClick={removerAvatarAutor}
                    style={avatarRemoveButtonAtualStyle}
                  >
                    Remover
                  </button>
                )}
              </div>

              {avatarErro && <span style={avatarErrorStyle}>{avatarErro}</span>}

              <textarea
                value={perfilSalvoAutor.bio}
                onChange={(event) => atualizarBioAutor(event.target.value)}
                placeholder={bioPadraoAutor}
                maxLength={BIO_MAX_LENGTH}
                style={bioTextareaAtualStyle}
              />

              <span style={bioCounterStyle}>
                {caracteresRestantesBio} caracteres
              </span>
            </>
          )}
</section>

        <section
          style={
            isDesktop
              ? desktopAuthorCommunityBoxStyle
              : authorCommunityBoxStyle
          }
        >
          <span style={miniTitleStyle}>COMUNIDADE DO AUTOR</span>

          <div
            style={
              isDesktop
                ? desktopAuthorCommunityGridStyle
                : authorCommunityGridStyle
            }
          >
            <Link href={comunidadeAutorHref} style={authorCommunityCardStyle}>
              <strong style={authorCommunityCardNumberStyle}>0</strong>
              <span style={authorCommunityCardTitleStyle}>POSTS</span>
            </Link>

            <Link
              href={comunidadeAutorTeoriasHref}
              style={authorCommunityCardStyle}
            >
              <strong style={authorCommunityCardNumberStyle}>0</strong>
              <span style={authorCommunityCardTitleStyle}>TEORIAS</span>
            </Link>

            <Link
              href={comunidadeAutorReviewsHref}
              style={authorCommunityCardStyle}
            >
              <strong style={authorCommunityCardNumberStyle}>0</strong>
              <span style={authorCommunityCardTitleStyle}>REVIEWS</span>
            </Link>
          </div>

          <div style={authorCommunityDividerStyle} />

          <div
            style={
              isDesktop
                ? desktopAuthorCommunityStatsGridStyle
                : authorCommunityStatsGridStyle
            }
          >
            <div style={authorCommunityCardStyle}>
              <strong style={authorCommunityStatNumberStyle}>
                {perfilParaMostrar.obras.length}
              </strong>
              <span style={authorCommunityStatTextStyle}>obras</span>
            </div>

            <div style={authorCommunityCardStyle}>
              <strong style={authorCommunityStatNumberStyle}>
                {perfilParaMostrar.totalCapitulos}
              </strong>
              <span style={authorCommunityStatTextStyle}>capítulos</span>
            </div>

            <div style={authorCommunityCardStyle}>
              <strong style={authorCommunityStatNumberStyle}>{seguidoresTotal}</strong>
              <span style={authorCommunityStatTextStyle}>seguidores</span>
            </div>

            <div style={authorCommunityCardStyle}>
              <strong style={authorCommunityStatNumberStyle}>
                {perfilParaMostrar.totalCurtidas}
              </strong>
              <span style={authorCommunityStatTextStyle}>curtidas</span>
            </div>

            <div style={authorCommunityCardStyle}>
              <strong style={authorCommunityStatNumberStyle}>
                {perfilParaMostrar.totalComentarios}
              </strong>
              <span style={authorCommunityStatTextStyle}>comentários</span>
            </div>

            <div style={authorCommunityCardStyle}>
              <strong style={authorCommunityStatNumberStyle}>{obrasConcluidasPerfil}</strong>
              <span style={authorCommunityStatTextStyle}>concluídas</span>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderAtualStyle}>
            <h2 style={sectionTitleStyle}>Obras do autor</h2>

            <p style={sectionFilterTextStyle}>
              {obrasDoPerfilFiltradas.length} de {perfilParaMostrar.obras.length}{" "}
              {perfilParaMostrar.obras.length === 1 ? "obra" : "obras"} • {obrasFavoritasPerfil} na lista • {obrasConcluidasPerfil} concluídas
            </p>
          </div>

          <section style={filterBoxAtualStyle}>
            <input
              value={buscaObras}
              onChange={(event) => setBuscaObras(event.target.value)}
              placeholder="Buscar obra..."
              style={filterInputStyle}
              type="text"
            />

            <div style={filterGridAtualStyle}>
              <select
                value={filtroObras}
                onChange={(event) =>
                  setFiltroObras(event.target.value as FiltroObrasAutor)
                }
                style={filterSelectStyle}
              >
                <option value="todas">Todas</option>
                <option value="publicadas">Publicadas</option>
                <option value="rascunhos">Rascunhos</option>
                <option value="sem-capitulos">Sem capítulos</option>
              </select>

              <select
                value={ordenacaoObras}
                onChange={(event) =>
                  setOrdenacaoObras(event.target.value as OrdenacaoObrasAutor)
                }
                style={filterSelectStyle}
              >
                <option value="recentes">Mais recentes</option>
                <option value="titulo">Título</option>
                <option value="capitulos">Mais capítulos</option>
                <option value="curtidas">Mais curtidas</option>
              </select>
            </div>

            {filtrosObrasAtivos && (
              <button
                type="button"
                onClick={limparFiltrosObras}
                style={clearFilterButtonAtualStyle}
              >
                Limpar filtros
              </button>
            )}
          </section>

          {obrasDoPerfilFiltradas.length === 0 ? (
            <div style={emptyMiniBoxStyle}>
              Nenhuma obra encontrada com esses filtros.
            </div>
          ) : (
            <div style={worksGridAtualStyle}>
              {obrasDoPerfilFiltradas.map((obra) => {
                const obraHref = `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                const ultimoCapitulo =
                  encontrarCapituloParaContinuar(obra) ||
                  obra.capitulos[obra.capitulos.length - 1] ||
                  null;
                const numeroUltimoCapitulo = ultimoCapitulo
                  ? obra.capitulos.findIndex(
                      (capitulo) => capitulo.id === ultimoCapitulo.id
                    ) + 1
                  : 0;
                const capituloHref = ultimoCapitulo
                  ? criarHrefLeituraCapituloPerfilAutor(
                      obra,
                      ultimoCapitulo,
                      numeroUltimoCapitulo || 1
                    )
                  : "";
                const obraFavorita = obrasFavoritas.includes(obra.id);
                const obraConcluida = obrasConcluidas.includes(obra.id);
                const totalCurtidas = obra.capitulos.filter(
                  (capitulo) => capitulo.curtiu
                ).length;
                const totalComentarios = obra.capitulos.filter((capitulo) =>
                  capitulo.comentario.trim()
                ).length;

                return (
                  <article key={obra.id} style={workCardAtualStyle}>
                    <Link href={obraHref} style={coverLinkStyle}>
                      <div style={isDesktop ? criarCoverStyleDesktop(obra.capa) : criarCoverStyle(obra.capa)}>
                        <div style={coverBottomStyle}>
                          <strong style={coverNumberStyle}>
                            {obra.capitulos.length}
                          </strong>

                          <span style={coverLabelStyle}>
                            {obra.capitulos.length === 1
                              ? "capítulo"
                              : "capítulos"}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div style={workContentAtualStyle}>
                      <div style={statusRowStyle}>
                        <span
                          style={
                            obra.publicado
                              ? publishedStatusStyle
                              : draftStatusStyle
                          }
                        >
                          {obra.publicado ? "Publicado" : "Rascunho"}
                        </span>

                        <span style={formatBadgeStyle}>{obra.formato}</span>

                        <span style={genreBadgeStyle}>
                          {formatarGeneroPerfilAutor(obra.genero)}
                        </span>

                        {mostrarClassificacao(obra) && (
                          <span style={classificationBadgeStyle}>
                            {obra.classificacaoIndicativa}
                          </span>
                        )}

                        {obraFavorita && (
                          <span style={favoriteBadgeStyle}>Na lista</span>
                        )}

                        {obraConcluida && (
                          <span style={completedBadgeStyle}>Concluída</span>
                        )}
                      </div>

                      <h3 style={workTitleAtualStyle}>{obra.titulo}</h3>

                      <p style={workTextAtualStyle}>{obra.sinopse}</p>

                      <div style={workStatsStyle}>
                        <span>{obra.capitulos.length} capítulos</span>
                        <span>♥ {totalCurtidas}</span>
                        <span>💬 {totalComentarios}</span>
                        <span>{obra.progressoLeitura}% lido</span>
                      </div>

                      {obra.capitulos.length > 0 && (
                        <div style={workProgressBoxStyle}>
                          <div style={workProgressTrackStyle}>
                            <div
                              style={{
                                ...workProgressFillStyle,
                                width: `${obra.progressoLeitura}%`,
                              }}
                            />
                          </div>

                          <span style={workProgressTextStyle}>
                            Progresso de leitura
                          </span>
                        </div>
                      )}

                      <div style={workActionsGridAtualStyle}>
                        <Link href={obraHref} style={openButtonStyle}>
                          Abrir obra
                        </Link>

                        {ultimoCapitulo && (
                          <Link href={capituloHref} style={readButtonStyle}>
                            Ler capítulo
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => void alternarFavoritoObra(obra.id)}
                          style={
                            obraFavorita
                              ? smallButtonActiveStyle
                              : smallButtonStyle
                          }
                        >
                          {obraFavorita ? "Na lista" : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void alternarConcluidoObra(obra.id)}
                          style={
                            obraConcluida
                              ? smallButtonActiveStyle
                              : smallButtonStyle
                          }
                        >
                          {obraConcluida ? "Concluída" : "Concluir"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.94)) 42%, transparent 100%), radial-gradient(ellipse 72% 82% at 18% 44%, var(--historietas-glow-primary, rgba(124,58,237,0.24)) 0%, transparent 76%), radial-gradient(ellipse 48% 62% at 88% 32%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 78%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "16px",
  minWidth: 0,
};


const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(139,92,246,0.24))",
};



const headerFollowButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "none",
  flex: "0 0 auto",
  ...safeTextStyle,
};

const headerFollowingButtonStyle: CSSProperties = {
  ...headerFollowButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};



const heroBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "12px 14px",
  borderRadius: "22px",
  background:
    "radial-gradient(circle at 14% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)), transparent 34%), linear-gradient(135deg, var(--historietas-surface, rgba(12,7,23,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const authorTopRowStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "1fr",
  alignItems: "center",
  justifyItems: "center",
  gap: "6px",
  minHeight: "70px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const authorTextBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "2px",
  alignContent: "center",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  textAlign: "center",
};


const avatarBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: "50%",
  transform: "translateY(-50%)",
  width: "74px",
  maxWidth: "74px",
  height: "74px",
  borderRadius: "22px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
  overflow: "hidden",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const avatarButtonStyle: CSSProperties = {
  ...avatarBaseStyle,
  cursor: "pointer",
};

const avatarDisplayStyle: CSSProperties = {
  ...avatarBaseStyle,
  cursor: "default",
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const avatarActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const avatarSmallButtonStyle: CSSProperties = {
  flex: "1 1 118px",
  minHeight: "28px",
  maxWidth: "100%",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const avatarRemoveButtonStyle: CSSProperties = {
  ...avatarSmallButtonStyle,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.12)",
  color: "#FCA5A5",
};

const avatarErrorStyle: CSSProperties = {
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 800,
  ...safeTextStyle,
};

const actionMessageStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.22)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const bioTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "64px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "10px 11px",
  outline: "none",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const bioCounterStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "right",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: "0 auto",
  fontSize: "clamp(34px, 8.8vw, 46px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  paddingBottom: "5px",
  overflow: "visible",
  textAlign: "center",
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  width: "min(260px, 100%)",
  maxWidth: "260px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "center",
  ...safeTextStyle,
};





const statsBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minHeight: "64px",
  borderRadius: "16px",
  padding: "7px 4px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.052))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: 0,
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const authorCommunityGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

const authorCommunityStatsGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

const authorCommunityDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  margin: "2px 0",
  background:
    "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent) 50%, transparent 100%)",
};

const authorCommunityCardStyle: CSSProperties = {
  minHeight: "54px",
  padding: "7px 4px",
  borderRadius: "15px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const authorCommunityCardNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityCardTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityCardTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  lineHeight: 1.1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityStatNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityStatTextStyle: CSSProperties = {
  ...authorCommunityCardTextStyle,
  fontSize: "9.5px",
};

const authorsBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "grid",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const authorsListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const authorButtonStyle: CSSProperties = {
  flex: "1 1 132px",
  minHeight: "34px",
  maxWidth: "100%",
  padding: "0 11px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const activeAuthorButtonStyle: CSSProperties = {
  ...authorButtonStyle,
  background: "var(--historietas-secondary, #7C3AED)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 50%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  marginBottom: "12px",
  minWidth: 0,
  textAlign: "center",
};

const miniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  marginBottom: "4px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "32px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const sectionFilterTextStyle: CSSProperties = {
  margin: "6px auto 0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 800,
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const filterInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const filterSelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, #3F3F46)",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  textAlignLast: "center",
  boxSizing: "border-box",
  minWidth: 0,
};

const clearFilterButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const worksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const workCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(86px, 102px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "10px",
  padding: "10px",
  borderRadius: "22px",
  background: "var(--historietas-surface, rgba(18,12,30,0.86))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const coverLinkStyle: CSSProperties = {
  display: "flex",
  alignSelf: "stretch",
  height: "100%",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "132px",
  borderRadius: "17px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 38%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 58%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const genreBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 6px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "8px",
  fontWeight: 950,
  ...safeTextStyle,
};

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "10px",
  right: "10px",
  bottom: "10px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "37px",
  lineHeight: 0.85,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};

const coverLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "right",
  ...safeTextStyle,
};

const workContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 6px",
  borderRadius: "999px",
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "8px",
  fontWeight: 950,
  ...safeTextStyle,
};

const draftStatusStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const formatBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #E4E4E7)",
};

const classificationBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
};

const favoriteBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 25%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const completedBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
};

const workTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const workTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const workStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const workProgressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const workProgressTrackStyle: CSSProperties = {
  height: "6px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.10)",
};

const workProgressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const workProgressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  ...safeTextStyle,
};

const workActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(108px, 1fr))",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const openButtonStyle: CSSProperties = {
  minHeight: "32px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readButtonStyle: CSSProperties = {
  ...openButtonStyle,
  background: "var(--historietas-secondary, #7C3AED)",
};

const smallButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const smallButtonActiveStyle: CSSProperties = {
  ...smallButtonStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 48px))",
  padding: "24px 0 64px",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  padding: "16px 22px",
  borderRadius: "26px",
};

const desktopAuthorTopRowStyle: CSSProperties = {
  ...authorTopRowStyle,
  minHeight: "106px",
};

const desktopAvatarBaseStyle: CSSProperties = {
  ...avatarBaseStyle,
  width: "120px",
  maxWidth: "120px",
  height: "120px",
  borderRadius: "32px",
  fontSize: "54px",
};

const desktopAvatarButtonStyle: CSSProperties = {
  ...desktopAvatarBaseStyle,
  cursor: "pointer",
};

const desktopAvatarDisplayStyle: CSSProperties = {
  ...desktopAvatarBaseStyle,
  cursor: "default",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(50px, 5.4vw, 74px)",
  lineHeight: 1.16,
  letterSpacing: "-0.07em",
  paddingBottom: "10px",
  overflow: "visible",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "15px",
  lineHeight: 1.58,
  width: "min(520px, 100%)",
  maxWidth: "520px",
  display: "block",
  WebkitLineClamp: "unset",
  overflow: "visible",
};

const desktopAvatarActionsStyle: CSSProperties = {
  ...avatarActionsStyle,
  maxWidth: "420px",
};

const desktopAvatarSmallButtonStyle: CSSProperties = {
  ...avatarSmallButtonStyle,
  flex: "0 0 auto",
  minWidth: "150px",
  minHeight: "34px",
  fontSize: "11px",
};

const desktopAvatarRemoveButtonStyle: CSSProperties = {
  ...desktopAvatarSmallButtonStyle,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.12)",
  color: "#FCA5A5",
};

const desktopBioTextareaStyle: CSSProperties = {
  ...bioTextareaStyle,
  minHeight: "92px",
  fontSize: "13px",
  lineHeight: 1.55,
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const desktopStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "82px",
  padding: "12px",
  borderRadius: "18px",
};

const desktopAuthorCommunityBoxStyle: CSSProperties = {
  ...authorCommunityBoxStyle,
  marginTop: "14px",
  gap: "9px",
};

const desktopAuthorCommunityGridStyle: CSSProperties = {
  ...authorCommunityGridStyle,
  gap: "8px",
};

const desktopAuthorCommunityStatsGridStyle: CSSProperties = {
  ...authorCommunityStatsGridStyle,
  gap: "8px",
};

const desktopAuthorsBoxStyle: CSSProperties = {
  ...authorsBoxStyle,
  padding: "16px",
  borderRadius: "24px",
};

const desktopAuthorsListStyle: CSSProperties = {
  ...authorsListStyle,
  alignItems: "center",
};

const desktopAuthorButtonStyle: CSSProperties = {
  ...authorButtonStyle,
  flex: "0 1 auto",
  minWidth: "150px",
  maxWidth: "260px",
};

const desktopActiveAuthorButtonStyle: CSSProperties = {
  ...desktopAuthorButtonStyle,
  background: "var(--historietas-secondary, #7C3AED)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 50%, transparent)",
  color: "#FFFFFF",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  marginBottom: "14px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  gridTemplateColumns: "minmax(280px, 1fr) minmax(360px, 0.9fr) auto",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
};

const desktopFilterGridStyle: CSSProperties = {
  ...filterGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const desktopClearFilterButtonStyle: CSSProperties = {
  ...clearFilterButtonStyle,
  width: "auto",
  minWidth: "150px",
};

const desktopWorksGridStyle: CSSProperties = {
  ...worksGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  alignItems: "stretch",
};

const desktopWorkCardStyle: CSSProperties = {
  ...workCardStyle,
  gridTemplateColumns: "minmax(126px, 146px) minmax(0, 1fr)",
  gap: "14px",
  padding: "12px",
  borderRadius: "24px",
  background: "var(--historietas-surface, rgba(18,12,30,0.88))",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const desktopWorkContentStyle: CSSProperties = {
  ...workContentStyle,
  gap: "9px",
};

const desktopWorkTitleStyle: CSSProperties = {
  ...workTitleStyle,
  fontSize: "26px",
  lineHeight: 1.12,
};

const desktopWorkTextStyle: CSSProperties = {
  ...workTextStyle,
  fontSize: "12px",
  lineHeight: 1.5,
  WebkitLineClamp: 2,
};

const desktopWorkActionsGridStyle: CSSProperties = {
  ...workActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "20px",
  borderRadius: "24px",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  padding: "22px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 700,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const emptyMiniBoxStyle: CSSProperties = {
  borderRadius: "20px",
  padding: "16px",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};