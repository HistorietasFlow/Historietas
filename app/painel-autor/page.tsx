"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
import type { CSSProperties } from "react";

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
  publicado?: boolean;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

type ArquivoStoragePainel = {
  bucket: "capas-obras" | "arquivos-obras";
  caminho: string;
};

type ObraStoragePainelRow = {
  id: string;
  capa_url: string | null;
  arquivo_url: string | null;
};

type ObraLocal = {
  id: string;
  autorId?: string;
  titulo: string;
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
  visualizacoes: number;
  slug: string;
  link: string;
  totalCurtidasPainel?: number;
  totalComentariosPainel?: number;
  totalSalvosPainel?: number;
  totalLidosPainel?: number;
};


type SupabaseObraRow = {
  id: string;
  user_id?: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  visualizacoes: number | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id?: string | null;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type ProfilePainelAutorRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  sobre_bio?: string | null;
};

type RegistroSupabaseGenerico = Record<string, unknown>;

type ObraComMetricas = ObraLocal & {
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalLidos: number;
  progressoLeitura: number;
  ultimoCapituloLido: CapituloLocal | null;
  pontuacao: number;
};


type FiltroPainel =
  | "todas"
  | "publicadas"
  | "rascunhos"
  | "sem-capitulos"
  | "favoritas"
  | "concluidas"
  | "em-leitura";

type OrdenacaoPainel =
  | "pontuacao"
  | "recentes"
  | "titulo"
  | "capitulos"
  | "progresso";

const FILTROS_PAINEL: { valor: FiltroPainel; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas as obras" },
  { valor: "publicadas", rotulo: "Publicadas" },
  { valor: "rascunhos", rotulo: "Rascunhos" },
  { valor: "sem-capitulos", rotulo: "Sem capítulos" },
  { valor: "favoritas", rotulo: "Na lista" },
  { valor: "concluidas", rotulo: "Concluídas" },
  { valor: "em-leitura", rotulo: "Em leitura" },
];

const ORDENACOES_PAINEL: { valor: OrdenacaoPainel; rotulo: string }[] = [
  { valor: "pontuacao", rotulo: "Melhor desempenho" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "titulo", rotulo: "Título" },
  { valor: "capitulos", rotulo: "Mais capítulos" },
  { valor: "progresso", rotulo: "Maior progresso" },
];



type PainelAutorTranslationEntry = {
  en: string;
  es: string;
};

const PAINEL_AUTOR_UI_TRANSLATIONS: Record<
  string,
  PainelAutorTranslationEntry
> = {
  "Todas as obras": { en: "All works", es: "Todas las obras" },
  "Publicadas": { en: "Published", es: "Publicadas" },
  "Rascunhos": { en: "Drafts", es: "Borradores" },
  "Sem capítulos": { en: "Without chapters", es: "Sin capítulos" },
  "Na lista": { en: "In the list", es: "En la lista" },
  "Concluídas": { en: "Completed", es: "Completadas" },
  "Em leitura": { en: "Currently reading", es: "En lectura" },
  "Melhor desempenho": { en: "Best performance", es: "Mejor rendimiento" },
  "Mais recentes": { en: "Most recent", es: "Más recientes" },
  "Título": { en: "Title", es: "Título" },
  "Mais capítulos": { en: "Most chapters", es: "Más capítulos" },
  "Maior progresso": { en: "Most progress", es: "Mayor progreso" },
  "Publicado": { en: "Published", es: "Publicado" },
  "Sem conteúdo": { en: "No content", es: "Sin contenido" },
  "Rascunho": { en: "Draft", es: "Borrador" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Não informada": { en: "Not provided", es: "No informada" },
  "Nenhuma sinopse informada.": { en: "No synopsis provided.", es: "No se proporcionó una sinopsis." },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Capítulo sem título": { en: "Untitled chapter", es: "Capítulo sin título" },
  "sem tags": { en: "no tags", es: "sin etiquetas" },
  "Arquivo da obra": { en: "Work file", es: "Archivo de la obra" },
  "Carregando": { en: "Loading", es: "Cargando" },
  "Carregando Painel do Autor": { en: "Loading Author Dashboard", es: "Cargando el Panel del Autor" },
  "Abrir painel do autor": { en: "Open author dashboard", es: "Abrir el panel del autor" },
  "Painel do autor": { en: "Author dashboard", es: "Panel del autor" },
  "Buscar obra...": { en: "Search works...", es: "Buscar obras..." },
  "Fechar busca": { en: "Close search", es: "Cerrar búsqueda" },
  "Abrir busca": { en: "Open search", es: "Abrir búsqueda" },
  "obra": { en: "work", es: "obra" },
  "obras": { en: "works", es: "obras" },
  "publicada": { en: "published", es: "publicada" },
  "publicadas": { en: "published", es: "publicadas" },
  "rascunho": { en: "draft", es: "borrador" },
  "rascunhos": { en: "drafts", es: "borradores" },
  "capítulo": { en: "chapter", es: "capítulo" },
  "capítulos": { en: "chapters", es: "capítulos" },
  "curtida": { en: "like", es: "me gusta" },
  "curtidas": { en: "likes", es: "me gusta" },
  "comentário": { en: "comment", es: "comentario" },
  "comentários": { en: "comments", es: "comentarios" },
  "salvo": { en: "saved", es: "guardado" },
  "salvos": { en: "saved", es: "guardados" },
  "arquivo": { en: "file", es: "archivo" },
  "arquivos": { en: "files", es: "archivos" },
  "Limpar filtros": { en: "Clear filters", es: "Limpiar filtros" },
  "MOSTRAR": { en: "SHOW", es: "MOSTRAR" },
  "ORDENAR": { en: "SORT", es: "ORDENAR" },
  "RESUMO": { en: "SUMMARY", es: "RESUMEN" },
  "Mostrar os 8 mini cards": { en: "Show the 8 summary cards", es: "Mostrar las 8 tarjetas de resumen" },
  "Não tem obra criada": { en: "No works have been created", es: "No hay obras creadas" },
  "Nenhuma obra encontrada": { en: "No works found", es: "No se encontraron obras" },
  "Ajuste a busca ou limpe os filtros para voltar a ver suas obras.": { en: "Adjust your search or clear the filters to see your works again.", es: "Ajusta la búsqueda o limpia los filtros para volver a ver tus obras." },
  "Por": { en: "By", es: "Por" },
  "Editar capítulo": { en: "Edit chapter", es: "Editar capítulo" },
  "Continuar leitura": { en: "Continue reading", es: "Continuar leyendo" },
  "Ler capítulo": { en: "Read chapter", es: "Leer capítulo" },
  "Editar obra": { en: "Edit work", es: "Editar obra" },
  "Adicionar capítulo": { en: "Add chapter", es: "Añadir capítulo" },
  "Ver arquivo": { en: "View file", es: "Ver archivo" },
  "Compartilhar": { en: "Share", es: "Compartir" },
  "Excluir": { en: "Delete", es: "Eliminar" },
  "Esta obra não possui arquivo disponível.": { en: "This work does not have an available file.", es: "Esta obra no tiene un archivo disponible." },
  "Não consegui criar um acesso temporário ao arquivo da obra.": { en: "I could not create temporary access to the work file.", es: "No se pudo crear un acceso temporal al archivo de la obra." },
  "Não consegui abrir o arquivo da obra agora.": { en: "I could not open the work file right now.", es: "No se pudo abrir el archivo de la obra en este momento." },
  "Você não tem permissão para excluir esta obra.": { en: "You do not have permission to delete this work.", es: "No tienes permiso para eliminar esta obra." },
  "A exclusão da obra não foi confirmada pelo banco de dados.": { en: "The database did not confirm that the work was deleted.", es: "La base de datos no confirmó la eliminación de la obra." },
  "Não consegui excluir a obra agora.": { en: "I could not delete the work right now.", es: "No se pudo eliminar la obra en este momento." },
  "Ação": { en: "Action", es: "Acción" },
  "Aventura": { en: "Adventure", es: "Aventura" },
  "Comédia": { en: "Comedy", es: "Comedia" },
  "Drama": { en: "Drama", es: "Drama" },
  "Fantasia": { en: "Fantasy", es: "Fantasía" },
  "Fantasia sombria": { en: "Dark fantasy", es: "Fantasía oscura" },
  "Ficção": { en: "Fiction", es: "Ficción" },
  "Mistério": { en: "Mystery", es: "Misterio" },
  "Romance": { en: "Romance", es: "Romance" },
  "Suspense": { en: "Thriller", es: "Suspenso" },
  "Terror": { en: "Horror", es: "Terror" },
  "Sobrenatural": { en: "Supernatural", es: "Sobrenatural" },
  "Histórico": { en: "Historical", es: "Histórico" },
  "Biografia": { en: "Biography", es: "Biografía" },
  "Sci-fi": { en: "Sci-fi", es: "Ciencia ficción" },
  "Webnovel": { en: "Web novel", es: "Novela web" },
  "Light novel": { en: "Light novel", es: "Novela ligera" },
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "HQ": { en: "Comic", es: "Cómic" },
  "Mangá": { en: "Manga", es: "Manga" },
  "Fanfic": { en: "Fanfiction", es: "Fanfic" },
  "Livre": { en: "All ages", es: "Todo público" },
};

function traduzirTextoPainelAutor(
  texto: string,
  idioma: HistorietasLanguage,
) {
  if (idioma === "pt-BR" || !texto) {
    return texto;
  }

  const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);
  const inicio = partes?.[1] || "";
  const conteudo = partes?.[2] || texto;
  const fim = partes?.[3] || "";
  const traducaoExata = PAINEL_AUTOR_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Abrir opções de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open options for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir opciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Ações de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Actions for ${correspondencia[1]}${fim}`
      : `${inicio}Acciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}${fim}`
      : `${inicio}Abrir ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Capítulo (\d+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Chapter ${correspondencia[1]}${fim}`
      : `${inicio}Capítulo ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(\d+) comentários$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} comments${fim}`
      : `${inicio}${correspondencia[1]} comentarios${fim}`;
  }

  correspondencia = /^(.+) no HISTORIETAS$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} on HISTORIETAS${fim}`
      : `${inicio}${correspondencia[1]} en HISTORIETAS${fim}`;
  }

  correspondencia = /^Confira a obra (.+) de (.+) no HISTORIETAS\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Check out ${correspondencia[1]} by ${correspondencia[2]} on HISTORIETAS.${fim}`
      : `${inicio}Descubre la obra ${correspondencia[1]} de ${correspondencia[2]} en HISTORIETAS.${fim}`;
  }

  correspondencia = /^Tem certeza que deseja excluir a obra "([\s\S]+)"\? Todos os capítulos e registros dessa obra serão removidos\. Essa ação não pode ser desfeita\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Are you sure you want to delete the work "${correspondencia[1]}"? All chapters and records for this work will be removed. This action cannot be undone.${fim}`
      : `${inicio}¿Seguro que quieres eliminar la obra "${correspondencia[1]}"? Se eliminarán todos los capítulos y registros de esta obra. Esta acción no se puede deshacer.${fim}`;
  }

  correspondencia = /^Não consegui confirmar sua permissão para excluir esta obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not confirm your permission to delete this work: ${correspondencia[1]}${fim}`
      : `${inicio}No se pudo confirmar tu permiso para eliminar esta obra: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Não consegui excluir os capítulos da obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not delete the work's chapters: ${correspondencia[1]}${fim}`
      : `${inicio}No se pudieron eliminar los capítulos de la obra: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Não consegui concluir a exclusão da obra: ([\s\S]+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}I could not finish deleting the work: ${correspondencia[1]}${fim}`
      : `${inicio}No se pudo completar la eliminación de la obra: ${correspondencia[1]}${fim}`;
  }

  return texto;
}

function PainelAutorLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const raiz = document.querySelector(
      "[data-historietas-painel-autor-root='true']",
    );

    if (!raiz) {
      return;
    }

    const raizPagina = raiz;

    type EstadoTraducaoPainelAutor = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoPainelAutor> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoPainelAutor>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return tag === "script" || tag === "style";
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (
        deveIgnorarElemento(elementoPai) ||
        elementoPai?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoPainelAutor(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributo(elemento: Element, atributo: string) {
      if (deveIgnorarElemento(elemento) || !elemento.hasAttribute(atributo)) {
        return;
      }

      const atual = elemento.getAttribute(atributo) || "";
      let mapaElemento = estadosAtributos.get(elemento);

      if (!mapaElemento) {
        mapaElemento = new Map();
        estadosAtributos.set(elemento, mapaElemento);
      }

      let estado = mapaElemento.get(atributo);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        mapaElemento.set(atributo, estado);
        atributosAlterados.push({ elemento, atributo });
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoPainelAutor(estado.original, language);
      estado.traduzido = proximo;

      if (atual !== proximo) {
        elemento.setAttribute(atributo, proximo);
      }
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (!(no instanceof Element) || deveIgnorarElemento(no)) {
        return;
      }

      atributosTraduziveis.forEach((atributo) => aplicarAtributo(no, atributo));

      const walker = document.createTreeWalker(
        no,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      let atual: Node | null = walker.nextNode();

      while (atual) {
        if (atual.nodeType === Node.TEXT_NODE) {
          aplicarTexto(atual as Text);
        } else if (atual instanceof Element && !deveIgnorarElemento(atual)) {
          atributosTraduziveis.forEach((atributo) =>
            aplicarAtributo(atual as Element, atributo),
          );
        }

        atual = walker.nextNode();
      }
    }

    function aplicarTudo() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        aplicarNo(raizPagina);
      } finally {
        aplicando = false;
      }
    }

    aplicarTudo();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (mutacao.type === "attributes" && mutacao.target instanceof Element) {
            if (
              mutacao.attributeName &&
              atributosTraduziveis.includes(mutacao.attributeName)
            ) {
              aplicarAtributo(mutacao.target, mutacao.attributeName);
            }

            return;
          }

          mutacao.addedNodes.forEach((no) => aplicarNo(no));
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(raizPagina, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.isConnected && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach((registro) => {
        const estado = estadosAtributos
          .get(registro.elemento)
          ?.get(registro.atributo);

        if (
          estado &&
          registro.elemento.isConnected &&
          registro.elemento.getAttribute(registro.atributo) === estado.traduzido
        ) {
          registro.elemento.setAttribute(registro.atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}

const STORAGE_KEY = "historietas-obras";
const PANEL_SUMMARY_STORAGE_KEY = "historietas-painel-resumo-visivel";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

function criarLoginHrefPainelAutor() {
  const params = new URLSearchParams({
    redirectTo: "/painel-autor",
  });

  return `/login?${params.toString()}`;
}

function criarHrefLeituraCapituloPainel(
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

function formatarGeneroPainelAutor(genero: string) {
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

function obterTimestamp(dataIso: string) {
  const timestamp = new Date(dataIso).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function calcularCurtidas(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function calcularComentarios(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function calcularSalvos(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.salvo).length;
}

function obterCapitulosPublicadosPainel(capitulos: CapituloLocal[]) {
  return capitulos.filter((capitulo) => capitulo.publicado !== false);
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  const capitulosPublicados = obterCapitulosPublicadosPainel(capitulos);

  if (capitulosPublicados.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulosPublicados.filter(
    (capitulo) => capitulo.lido
  ).length;

  return Math.round((capitulosLidos / capitulosPublicados.length) * 100);
}

function obraTemConteudoPainel(
  obra: Pick<ObraLocal, "capitulos" | "arquivoObra">
) {
  return obra.capitulos.length > 0 || Boolean(normalizarArquivoObra(obra.arquivoObra));
}

function obraPublicadaComConteudoPainel(
  obra: Pick<ObraLocal, "publicado" | "capitulos" | "arquivoObra">
) {
  const temCapituloPublicado = obra.capitulos.some(
    (capitulo) => capitulo.publicado !== false
  );

  return (
    obra.publicado &&
    (temCapituloPublicado || Boolean(normalizarArquivoObra(obra.arquivoObra)))
  );
}

function obraRascunhoOuSemConteudoPainel(
  obra: Pick<ObraLocal, "publicado" | "capitulos" | "arquivoObra">
) {
  return !obraPublicadaComConteudoPainel(obra);
}

function obterStatusPainelAutor(
  obra: Pick<ObraLocal, "publicado" | "capitulos" | "arquivoObra">
) {
  if (obraPublicadaComConteudoPainel(obra)) {
    return "Publicado";
  }

  return obra.publicado ? "Sem conteúdo" : "Rascunho";
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capitulosPublicados = obterCapitulosPublicadosPainel(obra.capitulos);
  const temCapituloLido = capitulosPublicados.some(
    (capitulo) => capitulo.lido
  );

  if (!temCapituloLido) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? capitulosPublicados.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = capitulosPublicados
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    capitulosPublicados.find((capitulo) => !capitulo.lido) ||
    capitulosPublicados[capitulosPublicados.length - 1] ||
    null
  );
}

function criarPainelCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return {
      ...coverStyle,
      background: "#04000A",
      backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...coverStyle,
    background: "#04000A",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarPainelCoverDesktopStyle(capa: string): CSSProperties {
  return {
    ...criarPainelCoverStyle(capa),
    minHeight: "240px",
    borderRadius: "20px",
  };
}

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

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


function obterCaminhoStoragePainel(
  bucket: "capas-obras" | "arquivos-obras",
  referencia: string
) {
  const referenciaLimpa = referencia.trim();

  if (!referenciaLimpa || referenciaLimpa.startsWith("data:")) {
    return "";
  }

  if (!/^https?:\/\//i.test(referenciaLimpa)) {
    return referenciaLimpa
      .replace(new RegExp(`^${bucket}/`), "")
      .replace(/^\/+/, "");
  }

  try {
    const url = new URL(referenciaLimpa);
    const prefixos = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];
    const prefixo = prefixos.find((valor) => url.pathname.includes(valor));

    if (!prefixo) {
      return "";
    }

    const indice = url.pathname.indexOf(prefixo);
    const caminhoCodificado = url.pathname.slice(indice + prefixo.length);

    return decodeURIComponent(caminhoCodificado).replace(/^\/+/, "");
  } catch {
    return "";
  }
}

function caminhoStoragePertenceAoUsuarioPainel(
  caminho: string,
  userId: string
) {
  const primeiraPasta = caminho.trim().split("/")[0] || "";

  return Boolean(
    primeiraPasta &&
      userId.trim() &&
      primeiraPasta.toLowerCase() === userId.trim().toLowerCase()
  );
}

async function criarUrlAssinadaArquivoObraPainel(referencia: string) {
  const referenciaLimpa = referencia.trim();

  if (!referenciaLimpa) {
    throw new Error("Esta obra não possui arquivo disponível.");
  }

  const caminho = obterCaminhoStoragePainel(
    "arquivos-obras",
    referenciaLimpa
  );

  if (!caminho) {
    return referenciaLimpa;
  }

  const { data, error } = await supabase.storage
    .from("arquivos-obras")
    .createSignedUrl(caminho, 60);

  if (error || !data?.signedUrl) {
    throw new Error(
      error?.message ||
        "Não consegui criar um acesso temporário ao arquivo da obra."
    );
  }

  return data.signedUrl;
}

async function removerArquivosStorageObraExcluidaPainel(
  arquivos: ArquivoStoragePainel[]
) {
  const arquivosUnicos = Array.from(
    new Map(
      arquivos
        .filter((arquivo) => Boolean(arquivo.caminho.trim()))
        .map((arquivo) => [
          `${arquivo.bucket}:${arquivo.caminho.trim()}`,
          {
            bucket: arquivo.bucket,
            caminho: arquivo.caminho.trim(),
          },
        ])
    ).values()
  );

  const resultados = await Promise.allSettled(
    arquivosUnicos.map(async (arquivo) => {
      const { error } = await supabase.storage
        .from(arquivo.bucket)
        .remove([arquivo.caminho]);

      if (error) {
        throw new Error(error.message);
      }
    })
  );

  resultados.forEach((resultado, index) => {
    if (resultado.status === "rejected") {
      console.warn(
        `Não consegui remover o arquivo de ${arquivosUnicos[index]?.bucket}:`,
        resultado.reason
      );
    }
  });
}

function obterChavesBackupArquivoPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo"> &
    Partial<Pick<ObraLocal, "link">>
) {
  return Array.from(
    new Set(
      [
        obra.id ? `id:${obra.id}` : "",
        obra.id || "",
        obra.slug ? `slug:${obra.slug}` : "",
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ]
        .map((chave) => chave.trim())
        .filter(Boolean)
    )
  );
}

function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (!userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([obraId, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (obraId.trim() && arquivoNormalizado) {
        backupNormalizado[obraId] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    salvarJsonStorageUsuarioPainel(FILE_BACKUP_STORAGE_KEY, userId, {});
    return {};
  }
}

function sincronizarBackupArquivosObras(obras: ObraLocal[], userId = "") {
  if (!userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        obterChavesBackupArquivoPainel(obra).forEach((chave) => {
          backupAtual[chave] = arquivoNormalizado;
        });
      }
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Se o backup falhar, o painel continua funcionando normalmente.
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupArquivoPainel(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}

function normalizarCapitulo(
  capitulo: CapituloSalvo,
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
        : `Capítulo ${capituloIndex + 1}`,
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado:
      typeof capitulo.publicado === "boolean" ? capitulo.publicado : undefined,
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
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
        ? obra.user_id.trim()
        : typeof obra.userId === "string" && obra.userId.trim()
        ? obra.userId.trim()
        : "",
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? obra.titulo
        : "Obra sem título",
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
    visualizacoes:
      typeof obra.visualizacoes === "number" &&
      Number.isFinite(obra.visualizacoes)
        ? Math.max(0, Math.round(obra.visualizacoes))
        : typeof obra.views === "number" && Number.isFinite(obra.views)
          ? Math.max(0, Math.round(obra.views))
          : typeof obra.total_visualizacoes === "number" &&
              Number.isFinite(obra.total_visualizacoes)
            ? Math.max(0, Math.round(obra.total_visualizacoes))
            : 0,
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
    totalCurtidasPainel:
      typeof obra.totalCurtidasPainel === "number" &&
      Number.isFinite(obra.totalCurtidasPainel)
        ? Math.max(0, Math.round(obra.totalCurtidasPainel))
        : undefined,
    totalComentariosPainel:
      typeof obra.totalComentariosPainel === "number" &&
      Number.isFinite(obra.totalComentariosPainel)
        ? Math.max(0, Math.round(obra.totalComentariosPainel))
        : undefined,
    totalSalvosPainel:
      typeof obra.totalSalvosPainel === "number" &&
      Number.isFinite(obra.totalSalvosPainel)
        ? Math.max(0, Math.round(obra.totalSalvosPainel))
        : undefined,
    totalLidosPainel:
      typeof obra.totalLidosPainel === "number" &&
      Number.isFinite(obra.totalLidosPainel)
        ? Math.max(0, Math.round(obra.totalLidosPainel))
        : undefined,
  };
}

function normalizarListaIds(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );
}

function criarStorageKeyUsuarioPainel(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : "";
}

function lerStorageUsuarioPainel(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioPainel(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioPainel(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioPainel(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; o painel continua com estado em memória.
  }
}

function carregarListaIdsPainel(chave: string, userId: string) {
  try {
    const listaUsuarioTexto = lerStorageUsuarioPainel(chave, userId);
    const listaUsuarioJson: unknown = listaUsuarioTexto
      ? JSON.parse(listaUsuarioTexto)
      : [];

    return normalizarListaIds(listaUsuarioJson);
  } catch {
    return [] as string[];
  }
}

function salvarListaIdsUsuarioPainel(
  chave: string,
  userId: string,
  listaUsuario: string[]
) {
  if (!userId.trim()) {
    return;
  }

  const listaUsuarioNormalizada = normalizarListaIds(listaUsuario);

  salvarJsonStorageUsuarioPainel(chave, userId, listaUsuarioNormalizada);
}

function obterIdentificadoresObraPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((valor) => valor.trim())
        .filter(Boolean)
    )
  );
}

function colecaoTemObraPainel(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const itens = new Set(
    colecao
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return obterIdentificadoresObraPainel(obra).some((identificador) =>
    itens.has(identificador)
  );
}


function removerObraDaColecaoPainel(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const identificadoresObra = new Set(obterIdentificadoresObraPainel(obra));

  return colecao.filter((id) => !identificadoresObra.has(id.trim()));
}

function lerListaIdsStoragePainel(chave: string, userId = "") {
  try {
    const listaTexto = lerStorageUsuarioPainel(chave, userId);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];

    return normalizarListaIds(listaJson);
  } catch {
    return [] as string[];
  }
}

function salvarColecaoAposExcluirPainel(
  chave: string,
  userId: string,
  listaUsuario: string[]
) {
  if (!userId.trim()) {
    return;
  }

  salvarJsonStorageUsuarioPainel(
    chave,
    userId,
    normalizarListaIds(listaUsuario)
  );
}

function limparReferenciasLocaisObraExcluidaPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo"> &
    Partial<Pick<ObraLocal, "link">>,
  userId: string
) {
  [FOLLOW_STORAGE_KEY, FAVORITES_STORAGE_KEY, COMPLETED_STORAGE_KEY].forEach(
    (chave) => {
      try {
        const listaUsuario = removerObraDaColecaoPainel(
          lerListaIdsStoragePainel(chave, userId),
          obra
        );

        salvarJsonStorageUsuarioPainel(chave, userId, listaUsuario);
      } catch {
        // A limpeza local não pode impedir a exclusão da obra.
      }
    }
  );

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obterChavesBackupArquivoPainel(obra).forEach((chave) => {
      delete backupAtual[chave];
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // O backup antigo não pode impedir a exclusão da obra.
  }
}

async function removerReferenciasSupabaseObraExcluidaPainel(
  userId: string,
  obraId: string,
  capituloIds: string[]
) {
  const usuarioId = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capitulosValidos = capituloIds.map((id) => id.trim()).filter(Boolean);

  if (!usuarioId || !obraIdLimpo) {
    return;
  }

  try {
    await Promise.allSettled([
      supabase.from("favoritos").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("concluidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("seguindo_obras").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_curtidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_avaliacoes").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("progresso_leitura").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("diario_atividades").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("comentarios_obras").delete().eq("obra_id", obraIdLimpo),
    ]);

    if (capitulosValidos.length > 0) {
      await Promise.allSettled([
        supabase.from("curtidas_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("salvos_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("comentarios_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
      ]);
    }
  } catch {
    // A exclusão principal da obra continua mesmo se a limpeza social falhar.
  }
}

function normalizarIdUsuarioPainel(valor: string) {
  return valor.trim().toLowerCase();
}

function obraPertenceAoUsuarioPainel(obra: Pick<ObraLocal, "autorId">, userId: string) {
  const autorIdObra = normalizarIdUsuarioPainel(obra.autorId || "");
  const usuarioId = normalizarIdUsuarioPainel(userId);

  return Boolean(usuarioId && autorIdObra && autorIdObra === usuarioId);
}

function filtrarObrasDoUsuarioPainel(obras: ObraLocal[], userId: string) {
  if (!userId.trim()) {
    return [] as ObraLocal[];
  }

  return obras.filter((obra) => obraPertenceAoUsuarioPainel(obra, userId));
}

function marcarObrasComDonoPainel(obras: ObraLocal[], userId: string) {
  const usuarioId = userId.trim();

  if (!usuarioId) {
    return [] as ObraLocal[];
  }

  return obras.map((obra) => ({
    ...obra,
    autorId: obra.autorId?.trim() || usuarioId,
  }));
}

function filtrarListaPorObrasDoUsuario(listaIds: string[], obrasUsuario: ObraLocal[]) {
  return listaIds.filter((id) => {
    const idLimpo = id.trim();

    return obrasUsuario.some((obra) =>
      obterIdentificadoresObraPainel(obra).includes(idLimpo)
    );
  });
}


function normalizarCategoriaArquivoSupabase(
  categoria: string | null,
  tipo: string | null
): ArquivoObraLocal["categoria"] {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  const tipoNormalizado = (tipo || "").toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (
    tipoNormalizado.includes("pdf") ||
    tipoNormalizado.includes("document") ||
    tipoNormalizado.includes("word")
  ) {
    return "documento";
  }

  if (tipoNormalizado.startsWith("text/") || tipoNormalizado.includes("markdown")) {
    return "texto";
  }

  return "outro";
}

function criarChaveInteracao(obraId: string, capituloId: string) {
  return `${obraId}::${capituloId}`;
}

function obterIdObraRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [
    registro.obra_id,
    registro.obraId,
    registro.id_obra,
    registro.obra,
  ];

  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string" ? valorEncontrado : "";
}

function obterIdCapituloRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [
    registro.capitulo_id,
    registro.capituloId,
    registro.id_capitulo,
    registro.capitulo,
  ];

  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string" ? valorEncontrado : "";
}

function obterTextoComentarioRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [registro.comentario, registro.texto, registro.conteudo];
  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string" ? valorEncontrado : "";
}

function obterIdUsuarioRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [
    registro.user_id,
    registro.usuario_id,
    registro.userId,
    registro.autor_id,
    registro.leitor_id,
  ];

  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string"
    ? valorEncontrado.trim().toLowerCase()
    : "";
}

function filtrarRegistrosPorUsuarioPainel(
  registros: RegistroSupabaseGenerico[],
  userId: string
) {
  const userIdLimpo = userId.trim().toLowerCase();

  if (!userIdLimpo) {
    return [] as RegistroSupabaseGenerico[];
  }

  return registros.filter(
    (registro) => obterIdUsuarioRegistro(registro) === userIdLimpo
  );
}

const CAMPOS_REGISTROS_PAINEL_AUTOR: Record<string, string> = {
  favoritos: "user_id,obra_id",
  concluidas: "user_id,obra_id",
  salvos_capitulos: "user_id,capitulo_id",
  curtidas_capitulos: "user_id,capitulo_id",
  comentarios_capitulos: "user_id,capitulo_id,comentario",
  comentarios_obras: "user_id,obra_id,comentario",
  progresso_leitura: "user_id,obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
  obra_curtidas: "user_id,obra_id",
  seguindo_obras: "user_id,obra_id",
};

const TABELAS_PAINEL_POR_CAPITULO = new Set([
  "salvos_capitulos",
  "curtidas_capitulos",
  "comentarios_capitulos",
]);

const TABELAS_PAINEL_POR_OBRA = new Set([
  "favoritos",
  "concluidas",
  "obra_curtidas",
  "seguindo_obras",
  "comentarios_obras",
]);

function obterCamposRegistrosPainelAutor(tabela: string) {
  return CAMPOS_REGISTROS_PAINEL_AUTOR[tabela] || "id";
}

async function carregarRegistrosObraSupabase(
  tabela: string,
  obraIds: string[],
  userId?: string,
  capituloIds: string[] = []
) {
  const deveBuscarPorObra = !TABELAS_PAINEL_POR_CAPITULO.has(tabela);
  const deveBuscarPorCapitulo = !TABELAS_PAINEL_POR_OBRA.has(tabela);

  if (
    (!deveBuscarPorObra || obraIds.length === 0) &&
    (!deveBuscarPorCapitulo || capituloIds.length === 0)
  ) {
    return [] as RegistroSupabaseGenerico[];
  }

  async function tentarPorObraId() {
    if (!deveBuscarPorObra || obraIds.length === 0) {
      return null as RegistroSupabaseGenerico[] | null;
    }

    let query = supabase
      .from(tabela)
      .select(obterCamposRegistrosPainelAutor(tabela))
      .in("obra_id", obraIds);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.limit(5000);

    if (error) {
      return null;
    }

    return Array.isArray(data) ? (data as unknown as RegistroSupabaseGenerico[]) : [];
  }

  async function tentarPorCapituloId() {
    if (!deveBuscarPorCapitulo || capituloIds.length === 0) {
      return null as RegistroSupabaseGenerico[] | null;
    }

    let query = supabase
      .from(tabela)
      .select(obterCamposRegistrosPainelAutor(tabela))
      .in("capitulo_id", capituloIds);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.limit(5000);

    if (error) {
      return null;
    }

    return Array.isArray(data) ? (data as unknown as RegistroSupabaseGenerico[]) : [];
  }

  try {
    const porObraId = await tentarPorObraId();

    if (porObraId) {
      return porObraId;
    }

    const porCapituloId = await tentarPorCapituloId();

    if (porCapituloId) {
      return porCapituloId;
    }

    return [];
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Painel do Autor:`, error);

    return [];
  }
}

function registroProgressoPainelEstaLido(
  registro: RegistroSupabaseGenerico
) {
  if (typeof registro.lido === "boolean") {
    return registro.lido;
  }

  if (typeof registro.lido === "string") {
    return registro.lido.trim().toLowerCase() === "true";
  }

  return true;
}

function obterDataProgressoPainel(registro: RegistroSupabaseGenerico) {
  const possiveisDatas = [
    registro.atualizado_em,
    registro.updated_at,
    registro.criado_em,
    registro.created_at,
  ];

  const data = possiveisDatas.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof data === "string" ? data.trim() : "";
}

function criarMapaProgressoLeituraPainel(
  registros: RegistroSupabaseGenerico[]
) {
  const progressoPorCapitulo = new Map<string, string>();

  registros.forEach((registro) => {
    if (!registroProgressoPainelEstaLido(registro)) {
      return;
    }

    const obraId = obterIdObraRegistro(registro);
    const capituloId = obterIdCapituloRegistro(registro);

    if (!capituloId) {
      return;
    }

    const lidoEm = obterDataProgressoPainel(registro);
    const chaveCompleta = obraId
      ? criarChaveInteracao(obraId, capituloId)
      : "";

    if (chaveCompleta && !progressoPorCapitulo.has(chaveCompleta)) {
      progressoPorCapitulo.set(chaveCompleta, lidoEm);
    }

    if (!progressoPorCapitulo.has(capituloId)) {
      progressoPorCapitulo.set(capituloId, lidoEm);
    }
  });

  return progressoPorCapitulo;
}

async function carregarProgressoUsuarioPainel(
  userId: string,
  obraIds: string[],
  capituloIds: string[]
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || (obraIds.length === 0 && capituloIds.length === 0)) {
    return {
      registros: [] as RegistroSupabaseGenerico[],
      carregado: Boolean(userIdLimpo),
    };
  }

  try {
    let query = supabase
      .from("progresso_leitura")
      .select(
        "user_id,obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em"
      )
      .eq("user_id", userIdLimpo);

    if (obraIds.length > 0) {
      query = query.in("obra_id", obraIds);
    } else {
      query = query.in("capitulo_id", capituloIds);
    }

    const { data, error } = await query
      .order("atualizado_em", { ascending: false })
      .limit(5000);

    if (error) {
      console.warn(
        "Não consegui carregar o progresso pessoal no Painel do Autor:",
        error.message
      );

      return {
        registros: [] as RegistroSupabaseGenerico[],
        carregado: false,
      };
    }

    return {
      registros: Array.isArray(data)
        ? (data as unknown as RegistroSupabaseGenerico[])
        : [],
      carregado: true,
    };
  } catch (error) {
    console.warn(
      "Não consegui acessar o progresso pessoal no Painel do Autor:",
      error
    );

    return {
      registros: [] as RegistroSupabaseGenerico[],
      carregado: false,
    };
  }
}

function criarSetObrasPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .map((registro) => obterIdObraRegistro(registro))
      .filter((obraId) => Boolean(obraId))
  );
}

function criarSetCapitulosPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .flatMap((registro) => {
        const obraId = obterIdObraRegistro(registro);
        const capituloId = obterIdCapituloRegistro(registro);

        if (!capituloId) {
          return [] as string[];
        }

        return obraId
          ? [criarChaveInteracao(obraId, capituloId), capituloId]
          : [capituloId];
      })
      .filter((chave) => Boolean(chave))
  );
}

function criarMapaComentariosPorRegistro(registros: RegistroSupabaseGenerico[]) {
  const mapa = new Map<string, string>();
  const contagem = new Map<string, number>();

  registros.forEach((registro) => {
    const obraId = obterIdObraRegistro(registro);
    const capituloId = obterIdCapituloRegistro(registro);

    if (!capituloId) {
      return;
    }

    const chave = obraId ? criarChaveInteracao(obraId, capituloId) : "";
    const comentario = obterTextoComentarioRegistro(registro);

    if (chave) {
      contagem.set(chave, (contagem.get(chave) || 0) + 1);
    }

    contagem.set(capituloId, (contagem.get(capituloId) || 0) + 1);

    if (chave && comentario && !mapa.has(chave)) {
      mapa.set(chave, comentario);
    }

    if (comentario && !mapa.has(capituloId)) {
      mapa.set(capituloId, comentario);
    }
  });

  contagem.forEach((total, chave) => {
    if (!mapa.has(chave) && total > 0) {
      mapa.set(chave, total === 1 ? "1 comentário" : `${total} comentários`);
    }
  });

  return mapa;
}

function registroPertenceAObraPainel(
  registro: RegistroSupabaseGenerico,
  obraId: string,
  capituloIds: Set<string>
) {
  const obraRegistro = obterIdObraRegistro(registro).trim();
  const capituloRegistro = obterIdCapituloRegistro(registro).trim();

  return (
    Boolean(obraId && obraRegistro === obraId) ||
    Boolean(capituloRegistro && capituloIds.has(capituloRegistro))
  );
}

function criarSetUsuariosRelacionadosObraPainel(
  registros: RegistroSupabaseGenerico[],
  obraId: string,
  capitulos: SupabaseCapituloRow[]
) {
  const obraIdLimpo = obraId.trim();
  const capituloIds = new Set(
    capitulos
      .map((capitulo) => capitulo.id.trim())
      .filter(Boolean)
  );
  const usuarios = new Set<string>();

  registros.forEach((registro, index) => {
    if (!registroPertenceAObraPainel(registro, obraIdLimpo, capituloIds)) {
      return;
    }

    const userId = obterIdUsuarioRegistro(registro);

    if (userId) {
      usuarios.add(userId);
      return;
    }

    const idRegistro =
      typeof registro.id === "string" && registro.id.trim()
        ? registro.id.trim()
        : "";
    const obraRegistro = obterIdObraRegistro(registro).trim();
    const capituloRegistro = obterIdCapituloRegistro(registro).trim();

    usuarios.add(
      `registro:${idRegistro || `${obraRegistro}:${capituloRegistro}:${index}`}`
    );
  });

  return usuarios;
}

function contarUsuariosUnicosRelacionadosObraPainel(
  fontes: RegistroSupabaseGenerico[][],
  obraId: string,
  capitulos: SupabaseCapituloRow[]
) {
  const usuarios = new Set<string>();

  fontes.forEach((registros) => {
    criarSetUsuariosRelacionadosObraPainel(
      registros,
      obraId,
      capitulos
    ).forEach((userId) => {
      usuarios.add(userId);
    });
  });

  return usuarios.size;
}

function converterObraSupabaseParaLocalPainel({
  obraBanco,
  capitulosBanco,
  obraLocal,
  capitulosSalvos,
  capitulosCurtidos,
  progressoPorCapitulo,
  progressoCarregado,
  comentariosCapitulos,
  index,
}: {
  obraBanco: SupabaseObraRow;
  capitulosBanco: SupabaseCapituloRow[];
  obraLocal?: ObraLocal;
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  progressoPorCapitulo: Map<string, string>;
  progressoCarregado: boolean;
  comentariosCapitulos: Map<string, string>;
  index: number;
}): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  let ultimoCapituloLidoId = progressoCarregado
    ? ""
    : obraLocal?.ultimoCapituloLidoId || "";
  let ultimaLeituraEm = progressoCarregado
    ? ""
    : obraLocal?.ultimaLeituraEm || "";

  function aplicarProgressoCapitulo(
    capitulo: CapituloLocal,
    obraId: string
  ): CapituloLocal {
    const chaveInteracao = criarChaveInteracao(obraId, capitulo.id);
    const temProgressoRemoto =
      progressoPorCapitulo.has(chaveInteracao) ||
      progressoPorCapitulo.has(capitulo.id);
    const lido = progressoCarregado
      ? temProgressoRemoto
      : capitulo.lido;
    const lidoEmRemoto =
      progressoPorCapitulo.get(chaveInteracao) ||
      progressoPorCapitulo.get(capitulo.id) ||
      "";
    const lidoEm = lido ? lidoEmRemoto || capitulo.lidoEm : "";

    if (lido) {
      const tempoAtual = obterTimestamp(lidoEm);
      const tempoUltimo = obterTimestamp(ultimaLeituraEm);

      if (!ultimoCapituloLidoId || tempoAtual >= tempoUltimo) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      ...capitulo,
      lido,
      lidoEm,
    };
  }

  const capitulosRemotos = capitulosBanco.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const chaveInteracao = criarChaveInteracao(obraBanco.id, capitulo.id);
    const comentarioSupabase =
      comentariosCapitulos.get(chaveInteracao) ||
      comentariosCapitulos.get(capitulo.id) ||
      "";

    return aplicarProgressoCapitulo(
      {
        id: capitulo.id,
        titulo:
          capitulo.titulo?.trim() ||
          capituloLocal?.titulo ||
          `Capítulo ${capituloIndex + 1}`,
        texto:
          typeof capitulo.texto === "string"
            ? capitulo.texto
            : capituloLocal?.texto || "",
        curtiu:
          Boolean(capituloLocal?.curtiu) ||
          capitulosCurtidos.has(chaveInteracao) ||
          capitulosCurtidos.has(capitulo.id),
        salvo:
          Boolean(capituloLocal?.salvo) ||
          capitulosSalvos.has(chaveInteracao) ||
          capitulosSalvos.has(capitulo.id),
        comentario: comentarioSupabase || capituloLocal?.comentario || "",
        criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
        lido: Boolean(capituloLocal?.lido),
        lidoEm: capituloLocal?.lidoEm || "",
        publicado: capitulo.publicado !== false,
      },
      obraBanco.id
    );
  });

  const idsRemotos = new Set(capitulosRemotos.map((capitulo) => capitulo.id));
  const capitulosApenasLocais = (obraLocal?.capitulos || [])
    .filter((capitulo) => !idsRemotos.has(capitulo.id))
    .map((capitulo) =>
      aplicarProgressoCapitulo(
        capitulo,
        obraBanco.id || obraLocal?.id || ""
      )
    );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];

  const tituloObra =
    obraBanco.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obraBanco.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obraBanco.arquivo_url?.trim() || "";

  return {
    id: obraBanco.id || obraLocal?.id || `obra-${index + 1}`,
    autorId: obraBanco.user_id?.trim() || obraLocal?.autorId || "",
    titulo: tituloObra,
    autor: obraBanco.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obraBanco.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraBanco.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraBanco.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraBanco.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraBanco.tags) && obraBanco.tags.length > 0
        ? obraBanco.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obraBanco.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraBanco.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obraBanco.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: obraBanco.arquivo_tipo?.trim() || obraLocal?.arquivoObra?.tipo || "",
          tamanho:
            typeof obraBanco.arquivo_tamanho === "number" &&
            Number.isFinite(obraBanco.arquivo_tamanho)
              ? obraBanco.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: normalizarCategoriaArquivoSupabase(
            obraBanco.arquivo_categoria,
            obraBanco.arquivo_tipo
          ),
          criadoEm: obraBanco.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obraBanco.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraBanco.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes:
      typeof obraBanco.visualizacoes === "number" &&
      Number.isFinite(obraBanco.visualizacoes)
        ? Math.max(0, Math.round(obraBanco.visualizacoes))
        : obraLocal?.visualizacoes || 0,
    slug: slugObra,
    link: obraBanco.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

function mesclarObrasPainelAutor(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [...obrasLocais];

  obrasSupabase.forEach((obraSupabase) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase = obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

      return obraLocal.id === obraSupabase.id || slugLocal === slugSupabase;
    });

    if (indiceExistente >= 0) {
      obrasMescladas[indiceExistente] = {
        ...obrasMescladas[indiceExistente],
        ...obraSupabase,
      };
      return;
    }

    obrasMescladas.unshift(obraSupabase);
  });

  return obrasMescladas;
}

function obterNomeProfilePainelAutor(profile: ProfilePainelAutorRow | null | undefined) {
  return typeof profile?.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

async function carregarProfilePainelAutor(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return null as ProfilePainelAutorRow | null;
  }

  try {
    const camposProfile = "id, user_id, nome, avatar_url, bio, sobre_bio";
    const { data: profilePorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select(camposProfile)
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroUserId && profilePorUserId) {
      return profilePorUserId as ProfilePainelAutorRow;
    }

    const { data: profilePorId, error: erroId } = await supabase
      .from("profiles")
      .select(camposProfile)
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroId && profilePorId) {
      return profilePorId as ProfilePainelAutorRow;
    }
  } catch {
    // O perfil público é uma camada social. O painel continua com os dados da obra.
  }

  return null;
}

function aplicarNomeProfileNasObrasPainel(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
  nomeProfile: string
) {
  const nomeLimpo = nomeProfile.trim();

  if (!nomeLimpo) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    if (!obraPertenceAoUsuarioPainel(obra, userId)) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeLimpo,
      autorId: obra.autorId || userId,
    };
  });
}

async function carregarPainelAutorSupabase(
  obrasLocais: ObraLocal[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[]
) {
  try {
    const { data: usuarioData } = await supabase.auth.getUser();
    const userId = usuarioData.user?.id || "";

    if (!userId) {
      return {
        obras: [],
        favoritas: [],
        concluidas: [],
      };
    }

    const profileAutor = await carregarProfilePainelAutor(userId);
    const nomeProfileAutor = obterNomeProfilePainelAutor(profileAutor);
    const obrasLocaisComDono = marcarObrasComDonoPainel(obrasLocais, userId);
    const obrasLocaisUsuario = aplicarNomeProfileNasObrasPainel(
      filtrarObrasDoUsuarioPainel(obrasLocaisComDono, userId),
      userId,
      nomeProfileAutor
    );
    const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
      obrasFavoritasLocais,
      obrasLocaisUsuario
    );
    const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
      obrasConcluidasLocais,
      obrasLocaisUsuario
    );

    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("user_id", userId)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn("Não consegui carregar obras no Painel do Autor:", erroObras.message);
      return {
        obras: obrasLocaisUsuario,
        favoritas: obrasFavoritasUsuario,
        concluidas: obrasConcluidasUsuario,
      };
    }

    const obrasSupabaseBanco = Array.isArray(obrasBanco)
      ? (obrasBanco as unknown as SupabaseObraRow[])
      : [];
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocaisUsuario,
        favoritas: obrasFavoritasUsuario,
        concluidas: obrasConcluidasUsuario,
      };
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
      .in("obra_id", obraIds)
      .eq("user_id", userId)
      .order("ordem", { ascending: true })
      .limit(600);

    if (erroCapitulos) {
      console.warn("Não consegui carregar capítulos no Painel do Autor:", erroCapitulos.message);
    }

    const capitulosSupabaseBanco = erroCapitulos
      ? []
      : Array.isArray(capitulosBanco)
      ? (capitulosBanco as unknown as SupabaseCapituloRow[])
      : [];

    const capituloIds = capitulosSupabaseBanco
      .map((capitulo) => capitulo.id)
      .filter(Boolean);

    const [
      favoritosBanco,
      concluidasBanco,
      favoritosObraBanco,
      salvosBanco,
      curtidasBanco,
      comentariosBanco,
      comentariosObrasBanco,
      progressoBanco,
      progressoUsuarioResultado,
      curtidasObraBanco,
      seguidoresObraBanco,
    ] = await Promise.all([
      carregarRegistrosObraSupabase("favoritos", obraIds, userId),
      carregarRegistrosObraSupabase("concluidas", obraIds, userId),
      carregarRegistrosObraSupabase("favoritos", obraIds),
      carregarRegistrosObraSupabase("salvos_capitulos", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("curtidas_capitulos", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("comentarios_capitulos", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("comentarios_obras", obraIds),
      carregarRegistrosObraSupabase("progresso_leitura", obraIds, undefined, capituloIds),
      carregarProgressoUsuarioPainel(userId, obraIds, capituloIds),
      carregarRegistrosObraSupabase("obra_curtidas", obraIds),
      carregarRegistrosObraSupabase("seguindo_obras", obraIds),
    ]);

    const favoritosSupabase = criarSetObrasPorRegistro(favoritosBanco);
    const concluidasSupabase = criarSetObrasPorRegistro(concluidasBanco);
    const salvosUsuarioBanco = filtrarRegistrosPorUsuarioPainel(
      salvosBanco,
      userId
    );
    const curtidasUsuarioBanco = filtrarRegistrosPorUsuarioPainel(
      curtidasBanco,
      userId
    );
    const comentariosUsuarioBanco = filtrarRegistrosPorUsuarioPainel(
      comentariosBanco,
      userId
    );
    const progressoUsuarioBanco = progressoUsuarioResultado.registros;
    const progressoCarregado = progressoUsuarioResultado.carregado;
    const progressoLidoBanco = progressoBanco.filter(
      registroProgressoPainelEstaLido
    );
    const capitulosSalvos = criarSetCapitulosPorRegistro(salvosUsuarioBanco);
    const capitulosCurtidos = criarSetCapitulosPorRegistro(
      curtidasUsuarioBanco
    );
    const progressoPorCapitulo = criarMapaProgressoLeituraPainel(
      progressoUsuarioBanco
    );
    const comentariosCapitulos = criarMapaComentariosPorRegistro(
      comentariosUsuarioBanco
    );

    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocaisUsuario.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      const obraNormalizada = converterObraSupabaseParaLocalPainel({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        progressoPorCapitulo,
        progressoCarregado,
        comentariosCapitulos,
        index,
      });

      const totalCurtidasUsuarios =
        contarUsuariosUnicosRelacionadosObraPainel(
          [curtidasBanco, curtidasObraBanco],
          obraBanco.id,
          capitulosDaObra
        );
      const totalComentariosUsuarios =
        contarUsuariosUnicosRelacionadosObraPainel(
          [comentariosBanco, comentariosObrasBanco],
          obraBanco.id,
          capitulosDaObra
        );
      const totalSalvosUsuarios =
        contarUsuariosUnicosRelacionadosObraPainel(
          [salvosBanco, seguidoresObraBanco, favoritosObraBanco],
          obraBanco.id,
          capitulosDaObra
        );
      const totalLeitoresUsuarios =
        contarUsuariosUnicosRelacionadosObraPainel(
          [progressoLidoBanco],
          obraBanco.id,
          capitulosDaObra
        );

      return {
        ...obraNormalizada,
        totalCurtidasPainel: totalCurtidasUsuarios,
        totalComentariosPainel: totalComentariosUsuarios,
        totalSalvosPainel: totalSalvosUsuarios,
        totalLidosPainel: totalLeitoresUsuarios,
      };
    });

    const obrasMescladasUsuario = aplicarNomeProfileNasObrasPainel(
      mesclarObrasPainelAutor(obrasLocaisUsuario, obrasSupabase).filter((obra) =>
        obraPertenceAoUsuarioPainel(obra, userId)
      ),
      userId,
      nomeProfileAutor
    );
    const idsObrasUsuario = new Set(obrasMescladasUsuario.map((obra) => obra.id));

    return {
      obras: obrasMescladasUsuario,
      favoritas: Array.from(
        new Set([...obrasFavoritasUsuario, ...Array.from(favoritosSupabase)])
      ).filter((id) => idsObrasUsuario.has(id)),
      concluidas: Array.from(
        new Set([...obrasConcluidasUsuario, ...Array.from(concluidasSupabase)])
      ).filter((id) => idsObrasUsuario.has(id)),
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Painel do Autor:", error);

    return {
      obras: obrasLocais,
      favoritas: normalizarListaIds(obrasFavoritasLocais),
      concluidas: normalizarListaIds(obrasConcluidasLocais),
    };
  }
}

function LoadingSpinner({ label = "Carregando" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={loadingPageStyle}
    >
      <span
        className="historietas-loading-spinner"
        style={loadingSpinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}

export default function PainelAutorPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();

  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaPainelAberta, setBuscaPainelAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPainel>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPainel>("pontuacao");
  const [isDesktop, setIsDesktop] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [verificandoUsuario, setVerificandoUsuario] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [mostrarFiltrosPainel, setMostrarFiltrosPainel] = useState(false);
  const [mostrarResumoPainel, setMostrarResumoPainel] = useState(true);

  const { pageThemeStyle } = useHistorietasTheme(pageStyle);


  useEffect(() => {
    function atualizarLayoutDesktop() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    atualizarLayoutDesktop();
    window.addEventListener("resize", atualizarLayoutDesktop);

    return () => {
      window.removeEventListener("resize", atualizarLayoutDesktop);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarUsuarioAtual() {
      try {
        const { data } = await supabase.auth.getUser();
        const usuario = data.user;

        if (!componenteAtivo) {
          return;
        }

        setUsuarioIdLogado(usuario?.id || "");
        setVerificandoUsuario(false);
      } catch {
        if (componenteAtivo) {
          setUsuarioIdLogado("");
          setVerificandoUsuario(false);
        }
      }
    }

    void carregarUsuarioAtual();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        if (!componenteAtivo) {
          return;
        }

        setUsuarioIdLogado(sessao?.user?.id || "");
        setVerificandoUsuario(false);
      }
    );

    return () => {
      componenteAtivo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!verificandoUsuario && !usuarioIdLogado) {
      router.replace(criarLoginHrefPainelAutor());
    }
  }, [router, usuarioIdLogado, verificandoUsuario]);

  useEffect(() => {
    if (!usuarioIdLogado) {
      return;
    }

    let mostrarResumoSalvo = true;

    try {
      const preferenciaSalva = lerStorageUsuarioPainel(
        PANEL_SUMMARY_STORAGE_KEY,
        usuarioIdLogado
      );

      mostrarResumoSalvo =
        preferenciaSalva === null
          ? true
          : JSON.parse(preferenciaSalva) !== false;
    } catch {
      mostrarResumoSalvo = true;
    }

    const aplicarPreferenciaTimer = window.setTimeout(() => {
      setMostrarResumoPainel(mostrarResumoSalvo);
    }, 0);

    return () => {
      window.clearTimeout(aplicarPreferenciaTimer);
    };
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!mostrarFiltrosPainel) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [mostrarFiltrosPainel]);


  useEffect(() => {
    if (verificandoUsuario || !usuarioIdLogado) {
      return;
    }

    let componenteAtivo = true;

    setCarregandoDados(true);

    async function carregarDadosPainelAutor() {
      try {
        const obrasSalvasTexto = lerStorageUsuarioPainel(
          STORAGE_KEY,
          usuarioIdLogado
        );
        const obrasSalvasJson: unknown = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? (obrasSalvasJson as ObraSalva[]).map((obra, obraIndex) =>
              restaurarArquivoObraComBackup(
                normalizarObra(obra, obraIndex),
                backupArquivosObras
              )
            )
          : [];
        const profileAutorPainel = await carregarProfilePainelAutor(usuarioIdLogado);
        const nomeProfileAutorPainel = obterNomeProfilePainelAutor(profileAutorPainel);
        const obrasNormalizadasComDono = marcarObrasComDonoPainel(
          obrasNormalizadas,
          usuarioIdLogado
        );
        const obrasUsuarioLogado = aplicarNomeProfileNasObrasPainel(
          filtrarObrasDoUsuarioPainel(obrasNormalizadasComDono, usuarioIdLogado),
          usuarioIdLogado,
          nomeProfileAutorPainel
        );

        const obrasFavoritasNormalizadas = carregarListaIdsPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasConcluidasNormalizadas = carregarListaIdsPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
          obrasFavoritasNormalizadas,
          obrasUsuarioLogado
        );
        const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
          obrasConcluidasNormalizadas,
          obrasUsuarioLogado
        );

        if (!componenteAtivo) {
          return;
        }

        setObras(obrasUsuarioLogado);
        setObrasFavoritas(obrasFavoritasUsuario);
        setObrasConcluidas(obrasConcluidasUsuario);

        const dadosSupabase = await carregarPainelAutorSupabase(
          obrasUsuarioLogado,
          obrasFavoritasUsuario,
          obrasConcluidasUsuario
        );

        if (!componenteAtivo) {
          return;
        }

        const obrasFinais = dadosSupabase.obras.map((obra, index) =>
          normalizarObra(obra as ObraSalva, index)
        );

        sincronizarBackupArquivosObras(obrasFinais, usuarioIdLogado);
        salvarJsonStorageUsuarioPainel(STORAGE_KEY, usuarioIdLogado, obrasFinais);
        salvarListaIdsUsuarioPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.favoritas
        );
        salvarListaIdsUsuarioPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.concluidas
        );

        setObras(obrasFinais);
        setObrasFavoritas(dadosSupabase.favoritas);
        setObrasConcluidas(dadosSupabase.concluidas);
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        console.warn("Não consegui atualizar o Painel do Autor:", error);
      } finally {
        if (componenteAtivo) {
          setCarregandoDados(false);
        }
      }
    }

    void carregarDadosPainelAutor();

    return () => {
      componenteAtivo = false;
    };
  }, [usuarioIdLogado, verificandoUsuario]);

  const obrasComMetricas = useMemo<ObraComMetricas[]>(() => {
    return obras
      .map((obra) => {
        const totalCurtidas =
          typeof obra.totalCurtidasPainel === "number"
            ? obra.totalCurtidasPainel
            : calcularCurtidas(obra);
        const totalComentarios =
          typeof obra.totalComentariosPainel === "number"
            ? obra.totalComentariosPainel
            : calcularComentarios(obra);
        const totalSalvos =
          typeof obra.totalSalvosPainel === "number"
            ? obra.totalSalvosPainel
            : calcularSalvos(obra);
        const totalLidos =
          typeof obra.totalLidosPainel === "number"
            ? obra.totalLidosPainel
            : 0;
        const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
        const ultimoCapituloLido = encontrarCapituloParaContinuar(obra);

        return {
          ...obra,
          totalCurtidas,
          totalComentarios,
          totalSalvos,
          totalLidos,
          progressoLeitura,
          ultimoCapituloLido,
          pontuacao:
            obterCapitulosPublicadosPainel(obra.capitulos).length * 2 +
            totalCurtidas * 5 +
            totalComentarios * 8 +
            totalSalvos * 4 +
            totalLidos * 3,
        };
      })
      .sort((obraA, obraB) => obraB.pontuacao - obraA.pontuacao);
  }, [obras]);

  const obrasFiltradas = useMemo<ObraComMetricas[]>(() => {
    const termoBusca = normalizarTexto(busca);

    return obrasComMetricas
      .filter((obra) => {
        const passaBusca = termoBusca
          ? normalizarTexto(
              [
                obra.titulo,
                obra.autor,
                obra.genero,
                formatarGeneroPainelAutor(obra.genero),
                obra.formato,
                obra.classificacaoIndicativa,
                obra.sinopse,
                obra.tags.join(" "),
                obra.capaNome,
                obra.arquivoObra?.nome || "",
                obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
              ].join(" ")
            ).includes(termoBusca)
          : true;

        const passaFiltro =
          filtro === "todas"
            ? true
            : filtro === "publicadas"
            ? obraPublicadaComConteudoPainel(obra)
            : filtro === "rascunhos"
            ? obraRascunhoOuSemConteudoPainel(obra)
            : filtro === "sem-capitulos"
            ? obra.capitulos.length === 0
            : filtro === "favoritas"
            ? colecaoTemObraPainel(obrasFavoritas, obra)
            : filtro === "concluidas"
            ? colecaoTemObraPainel(obrasConcluidas, obra)
            : obra.progressoLeitura > 0 && obra.progressoLeitura < 100;

        return passaBusca && passaFiltro;
      })
      .sort((obraA, obraB) => {
        if (ordenacao === "recentes") {
          return obterTimestamp(obraB.criadaEm) - obterTimestamp(obraA.criadaEm);
        }

        if (ordenacao === "titulo") {
          return obraA.titulo.localeCompare(obraB.titulo);
        }

        if (ordenacao === "capitulos") {
          return obraB.capitulos.length - obraA.capitulos.length;
        }

        if (ordenacao === "progresso") {
          return obraB.progressoLeitura - obraA.progressoLeitura;
        }

        return obraB.pontuacao - obraA.pontuacao;
      });
  }, [
    obrasComMetricas,
    busca,
    filtro,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasPublicadas = obrasComMetricas.filter((obra) =>
    obraPublicadaComConteudoPainel(obra)
  );
  const obrasRascunhos = obrasComMetricas.filter((obra) =>
    obraRascunhoOuSemConteudoPainel(obra)
  );

  const totalCapitulos = obrasComMetricas.reduce(
    (total, obra) => total + obra.capitulos.length,
    0
  );

  const totalCurtidas = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalCurtidas,
    0
  );

  const totalComentarios = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalComentarios,
    0
  );

  const totalSalvos = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalSalvos,
    0
  );

  const totalArquivos = obrasComMetricas.filter((obra) => obra.arquivoObra).length;

  const filtrosAtivos =
    Boolean(busca.trim()) || filtro !== "todas" || ordenacao !== "pontuacao";
  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("pontuacao");
  }

  function alternarResumoPainel() {
    setMostrarResumoPainel((mostrarAtual) => {
      const proximoValor = !mostrarAtual;

      salvarJsonStorageUsuarioPainel(
        PANEL_SUMMARY_STORAGE_KEY,
        usuarioIdLogado,
        proximoValor
      );

      return proximoValor;
    });
  }

  const usuarioLogado = Boolean(usuarioIdLogado);
  function copiarTextoComFallback(texto: string) {
    const campoTemporario = document.createElement("textarea");

    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.left = "-9999px";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();

    try {
      document.execCommand("copy");
    } catch {
      // O compartilhamento e a cópia permanecem silenciosos.
    } finally {
      document.body.removeChild(campoTemporario);
    }
  }

  async function abrirArquivoObra(obra: ObraLocal) {
    const referencia = obra.arquivoObra?.conteudo?.trim() || "";

    if (!referencia) {
      window.alert(
        traduzirTextoPainelAutor(
          "Esta obra não possui arquivo disponível.",
          language,
        ),
      );
      return;
    }

    try {
      const urlArquivo = await criarUrlAssinadaArquivoObraPainel(referencia);
      const linkArquivo = document.createElement("a");

      linkArquivo.href = urlArquivo;
      linkArquivo.target = "_blank";
      linkArquivo.rel = "noopener noreferrer";
      document.body.appendChild(linkArquivo);
      linkArquivo.click();
      linkArquivo.remove();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não consegui abrir o arquivo da obra agora.";

      console.warn("Não consegui abrir o arquivo da obra:", error);
      window.alert(traduzirTextoPainelAutor(mensagem, language));
    }
  }

  async function compartilharObra(obra: ObraLocal) {
    const href =
      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
    const linkAbsoluto = new URL(href, window.location.origin).toString();
    const dadosCompartilhamento: ShareData = {
      title: traduzirTextoPainelAutor(`${obra.titulo} no HISTORIETAS`, language),
      text: traduzirTextoPainelAutor(
        `Confira a obra ${obra.titulo} de ${obra.autor} no HISTORIETAS.`,
        language,
      ),
      url: linkAbsoluto,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(dadosCompartilhamento);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      if (
        window.isSecureContext &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(linkAbsoluto);
        return;
      }
    } catch {
      // Continua para o fallback silencioso abaixo.
    }

    copiarTextoComFallback(linkAbsoluto);
  }

  async function excluirObra(obraId: string, tituloObra: string) {
    const confirmar = window.confirm(
      traduzirTextoPainelAutor(
        `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos e registros dessa obra serão removidos. Essa ação não pode ser desfeita.`,
        language,
      ),
    );

    if (!confirmar) {
      return;
    }

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || usuarioIdLogado;

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefPainelAutor());
        return;
      }

      const obraExcluida = obras.find((obra) => obra.id === obraId) || {
        id: obraId,
        slug: criarSlugBase(tituloObra),
        titulo: tituloObra,
        link: `/obra/${criarSlugBase(tituloObra)}`,
        capa: "",
        arquivoObra: null,
        capitulos: [] as CapituloLocal[],
      };

      if (idObraSupabaseValido(obraId)) {
        const { data: obraAutorizada, error: erroAutorizacao } = await supabase
          .from("obras")
          .select("id,capa_url,arquivo_url")
          .eq("id", obraId)
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (erroAutorizacao) {
          throw new Error(
            `Não consegui confirmar sua permissão para excluir esta obra: ${erroAutorizacao.message}`
          );
        }

        if (!obraAutorizada?.id) {
          throw new Error("Você não tem permissão para excluir esta obra.");
        }

        const obraStorage =
          obraAutorizada as unknown as ObraStoragePainelRow;
        const caminhoCapa = obterCaminhoStoragePainel(
          "capas-obras",
          obraStorage.capa_url?.trim() || obraExcluida.capa || ""
        );
        const caminhoArquivoObra = obterCaminhoStoragePainel(
          "arquivos-obras",
          obraStorage.arquivo_url?.trim() ||
            obraExcluida.arquivoObra?.conteudo ||
            ""
        );
        const arquivosStorageParaRemover: ArquivoStoragePainel[] = [
          {
            bucket: "capas-obras",
            caminho: caminhoStoragePertenceAoUsuarioPainel(
              caminhoCapa,
              userId
            )
              ? caminhoCapa
              : "",
          },
          {
            bucket: "arquivos-obras",
            caminho: caminhoStoragePertenceAoUsuarioPainel(
              caminhoArquivoObra,
              userId
            )
              ? caminhoArquivoObra
              : "",
          },
        ];

        await removerReferenciasSupabaseObraExcluidaPainel(
          userId,
          obraId,
          obraExcluida.capitulos.map((capitulo) => capitulo.id)
        );

        const { error: erroCapitulos } = await supabase
          .from("capitulos")
          .delete()
          .eq("obra_id", obraId)
          .eq("user_id", userId);

        if (erroCapitulos) {
          throw new Error(
            `Não consegui excluir os capítulos da obra: ${erroCapitulos.message}`
          );
        }

        const { data: obraRemovida, error: erroObra } = await supabase
          .from("obras")
          .delete()
          .eq("id", obraId)
          .eq("user_id", userId)
          .select("id")
          .maybeSingle();

        if (erroObra) {
          throw new Error(
            `Não consegui concluir a exclusão da obra: ${erroObra.message}`
          );
        }

        if (!obraRemovida?.id) {
          throw new Error(
            "A exclusão da obra não foi confirmada pelo banco de dados."
          );
        }

        await removerArquivosStorageObraExcluidaPainel(
          arquivosStorageParaRemover
        );
      }

      const novasObras = obras.filter((obra) => obra.id !== obraId);
      const novasObrasFavoritas = removerObraDaColecaoPainel(
        obrasFavoritas,
        obraExcluida
      );
      const novasObrasConcluidas = removerObraDaColecaoPainel(
        obrasConcluidas,
        obraExcluida
      );

      limparReferenciasLocaisObraExcluidaPainel(obraExcluida, userId);
      salvarJsonStorageUsuarioPainel(STORAGE_KEY, userId, novasObras);
      salvarColecaoAposExcluirPainel(
        FAVORITES_STORAGE_KEY,
        userId,
        novasObrasFavoritas
      );
      salvarColecaoAposExcluirPainel(
        COMPLETED_STORAGE_KEY,
        userId,
        novasObrasConcluidas
      );

      setObras(novasObras);
      setObrasFavoritas(novasObrasFavoritas);
      setObrasConcluidas(novasObrasConcluidas);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não consegui excluir a obra agora.";

      console.warn("Não consegui excluir a obra no Estúdio:", error);
      window.alert(traduzirTextoPainelAutor(mensagem, language));
    }
  }

  if (verificandoUsuario || !usuarioLogado || carregandoDados) {
    return (
      <main data-historietas-painel-autor-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>
        <PainelAutorLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <LoadingSpinner label="Carregando Painel do Autor" />
      </main>
    );
  }


  return (
    <main data-historietas-painel-autor-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>
      <PainelAutorLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={topStyle}>
          <button
            type="button"
            onClick={() => setMostrarFiltrosPainel(true)}
            style={topFilterButtonStyle}
            aria-label="Abrir painel do autor"
          >
            <span>Painel do autor</span>
            <span style={topFilterIconStyle} aria-hidden="true">
              +
            </span>
          </button>

          {buscaPainelAberta ? (
            <>
              <label
                style={
                  isDesktop
                    ? desktopTopSearchShellStyle
                    : topSearchShellStyle
                }
              >
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar obra..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={topSearchInputStyle}
                  type="text"
                  autoFocus
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setBuscaPainelAberta(false);
                }}
                aria-label="Fechar busca"
                aria-expanded="true"
                style={topSearchButtonStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBuscaPainelAberta(true)}
              aria-label="Abrir busca"
              aria-expanded="false"
              style={topSearchButtonStyle}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="10.85"
                  cy="10.85"
                  r="6.65"
                  stroke="currentColor"
                  strokeWidth="2.15"
                />
                <path
                  d="M16.05 16.05L20.25 20.25"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </header>

        <section style={isDesktop ? desktopStudioControlsStyle : studioControlsStyle}>
          {mostrarResumoPainel && (
            <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasComMetricas.length}</strong>
            <span style={statLabelStyle}>
              {obrasComMetricas.length === 1 ? "obra" : "obras"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasPublicadas.length}</strong>
            <span style={statLabelStyle}>
              {obrasPublicadas.length === 1 ? "publicada" : "publicadas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasRascunhos.length}</strong>
            <span style={statLabelStyle}>
              {obrasRascunhos.length === 1 ? "rascunho" : "rascunhos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCapitulos}</strong>
            <span style={statLabelStyle}>
              {totalCapitulos === 1 ? "capítulo" : "capítulos"}
            </span>
          </div>


          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCurtidas}</strong>
            <span style={statLabelStyle}>
              {totalCurtidas === 1 ? "curtida" : "curtidas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalComentarios}</strong>
            <span style={statLabelStyle}>
              {totalComentarios === 1 ? "comentário" : "comentários"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalSalvos}</strong>
            <span style={statLabelStyle}>
              {totalSalvos === 1 ? "salvo" : "salvos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalArquivos}</strong>
            <span style={statLabelStyle}>
              {totalArquivos === 1 ? "arquivo" : "arquivos"}
            </span>
          </div>
            </section>
          )}

          {filtrosAtivos && (
            <button type="button" onClick={limparFiltros} style={studioClearButtonStyle}>
              Limpar filtros
            </button>
          )}
        </section>

        {mostrarFiltrosPainel && (
          <div
            style={filterSheetOverlayStyle}
            onClick={() => setMostrarFiltrosPainel(false)}
          >
            <section
              style={isDesktop ? desktopFilterSheetStyle : filterSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label="Painel do autor"
            >
              <span style={filterSheetHandleStyle} aria-hidden="true" />

              <h2 style={filterSheetTitleStyle}>Painel do autor</h2>

              <div style={filterSheetContentStyle}>
                <p style={filterSheetSectionLabelStyle}>MOSTRAR</p>

                {FILTROS_PAINEL.map((opcao) => {
                  const ativo = filtro === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setFiltro(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      >
                        {ativo ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>ORDENAR</p>

                {ORDENACOES_PAINEL.map((opcao) => {
                  const ativo = ordenacao === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setOrdenacao(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      >
                        {ativo ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>RESUMO</p>

                <button
                  type="button"
                  onClick={alternarResumoPainel}
                  style={criarFilterSheetOptionStyle(mostrarResumoPainel)}
                  aria-pressed={mostrarResumoPainel}
                >
                  <span>Mostrar os 8 mini cards</span>
                  <span
                    style={criarFilterSheetRadioStyle(mostrarResumoPainel)}
                    aria-hidden="true"
                  >
                    {mostrarResumoPainel ? "✓" : ""}
                  </span>
                </button>

                {filtrosAtivos && (
                  <>
                    <span style={filterSheetClearDividerStyle} aria-hidden="true" />

                    <button type="button" onClick={limparFiltros} style={filterSheetClearStyle}>
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {obrasComMetricas.length === 0 ? (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Não tem obra criada
          </p>
        ) : obrasFiltradas.length === 0 ? (
          <section style={emptyMiniBoxStyle}>
            <strong style={emptyMiniTitleStyle}>Nenhuma obra encontrada</strong>
            <span style={emptyMiniTextStyle}>
              Ajuste a busca ou limpe os filtros para voltar a ver suas obras.
            </span>
            <button type="button" onClick={limparFiltros} style={emptyMiniButtonStyle}>
              Limpar filtros
            </button>
          </section>
        ) : (
          <PainelSecao
            obras={obrasFiltradas}
            obrasFavoritas={obrasFavoritas}
            obrasConcluidas={obrasConcluidas}
            isDesktop={isDesktop}
            onAbrirArquivo={abrirArquivoObra}
            onCompartilhar={compartilharObra}
            onExcluirObra={excluirObra}
          />
        )}
      </section>
    </main>
  );
}

function criarPerfilAutorHref(autor: string, autorId?: string, userId?: string) {
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";
  const userIdLimpo = userId?.trim() || autorIdLimpo;
  const params = new URLSearchParams();

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function PainelSecao({
  obras,
  obrasFavoritas,
  obrasConcluidas,
  isDesktop,
  onAbrirArquivo,
  onCompartilhar,
  onExcluirObra,
}: {
  obras: ObraComMetricas[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  isDesktop: boolean;
  onAbrirArquivo: (obra: ObraLocal) => void | Promise<void>;
  onCompartilhar: (obra: ObraLocal) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
}) {
  if (obras.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div style={isDesktop ? desktopWorksGridStyle : worksGridStyle}>
        {obras.map((obra) => (
          <ObraPainelCard
            key={obra.id}
            obra={obra}
            favoritada={colecaoTemObraPainel(obrasFavoritas, obra)}
            concluida={colecaoTemObraPainel(obrasConcluidas, obra)}
            isDesktop={isDesktop}
            onAbrirArquivo={onAbrirArquivo}
            onCompartilhar={onCompartilhar}
            onExcluirObra={onExcluirObra}
          />
        ))}
      </div>
    </section>
  );
}

function ObraPainelCard({
  obra,
  favoritada,
  concluida,
  isDesktop,
  onAbrirArquivo,
  onCompartilhar,
  onExcluirObra,
}: {
  obra: ObraComMetricas;
  favoritada: boolean;
  concluida: boolean;
  isDesktop: boolean;
  onAbrirArquivo: (obra: ObraLocal) => void | Promise<void>;
  onCompartilhar: (obra: ObraLocal) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
}) {
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const slugObraPainel = obra.slug?.trim() || criarSlugBase(obra.titulo);
  const linkObraPainel = obra.link?.trim();
  const obraHref = linkObraPainel || `/obra/${encodeURIComponent(slugObraPainel)}`;
  const editarHref = `/editar-obra?obraId=${obra.id}`;
  const capituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
  const capitulosPublicados = obterCapitulosPublicadosPainel(obra.capitulos);
  const capituloParaContinuar = obra.ultimoCapituloLido;
  const capituloParaLer =
    capituloParaContinuar || capitulosPublicados[0] || null;
  const capituloParaEditar = obra.capitulos[0] || null;
  const editarCapituloHref = capituloParaEditar
    ? `/editar-capitulo?obraId=${obra.id}&capituloId=${capituloParaEditar.id}`
    : `/editar-capitulo?obraId=${obra.id}`;
  const indiceCapituloParaLer = capituloParaLer
    ? obra.capitulos.findIndex((capitulo) => capitulo.id === capituloParaLer.id)
    : -1;
  const numeroCapituloParaLer = indiceCapituloParaLer >= 0 ? indiceCapituloParaLer + 1 : 1;
  const leituraCapituloHref = capituloParaLer
    ? criarHrefLeituraCapituloPainel(obra, capituloParaLer, numeroCapituloParaLer)
    : "";
  const perfilAutorHref = criarPerfilAutorHref(obra.autor, obra.autorId, obra.autorId);
  const visualizacoesPainel = Math.max(0, obra.visualizacoes);
  const statusTexto = obterStatusPainelAutor(obra);
  const obraComStatusPublicado = obraPublicadaComConteudoPainel(obra);
  const obraTemCapitulos = obra.capitulos.length > 0;
  const indicadorPrimarioIcone = obraTemCapitulos ? "📚" : obra.arquivoObra ? "📄" : "📚";
  const indicadorPrimarioValor = obraTemCapitulos ? obra.capitulos.length : obra.arquivoObra ? 1 : 0;

  useEffect(() => {
    if (!acoesAbertas || typeof document === "undefined") {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [acoesAbertas]);

  return (
    <>
      <article style={isDesktop ? desktopWorkCardStyle : workCardStyle}>
        <Link
          href={obraHref}
          style={coverLinkStyle}
          aria-label={`Abrir ${obra.titulo}`}
        >
          <div
            style={
              isDesktop
                ? criarPainelCoverDesktopStyle(obra.capa)
                : criarPainelCoverStyle(obra.capa)
            }
          >
            <div style={coverGlowStyle} />

            <div style={statusRowStyle}>
              <span style={obraComStatusPublicado ? publishedStatusStyle : draftStatusStyle}>
                {statusTexto}
              </span>

            </div>

            <div style={isDesktop ? desktopWorkContentStyle : workContentStyle}>
              <h3 style={workTitleStyle}>{obra.titulo}</h3>

              <span style={workMetaLineStyle}>
                <span>👁 {visualizacoesPainel}</span>
                <span>
                  <span style={workCardHeartMetaStyle}>❤️</span>{" "}
                  {obra.totalCurtidas}
                </span>
                <span>
                  <span style={workCardCommentMetaStyle}>💬</span>{" "}
                  {obra.totalComentarios}
                </span>
                <span>
                  {indicadorPrimarioIcone} {indicadorPrimarioValor}
                </span>
              </span>
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setAcoesAbertas(true)}
          style={workCardDotsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
          aria-expanded={acoesAbertas}
        >
          ⋮
        </button>
      </article>

      {acoesAbertas && (
        <div
          style={workActionSheetOverlayStyle}
          role="presentation"
          onClick={() => setAcoesAbertas(false)}
        >
          <section
            style={workActionSheetStyle}
            role="dialog"
            aria-label={`Ações de ${obra.titulo}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={workActionSheetHandleStyle} aria-hidden="true" />

            <div style={workActionSheetHeaderStyle}>
              <div style={workActionSheetTextBlockStyle}>
                <strong style={workActionSheetTitleStyle}>{obra.titulo}</strong>

                <Link
                  href={perfilAutorHref}
                  onClick={() => setAcoesAbertas(false)}
                  style={authorStyle}
                >
                  Por {obra.autor}
                </Link>


              </div>
            </div>

            <div style={isDesktop ? desktopSheetStatsRowStyle : sheetStatsRowStyle}>
              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>👁</span>
                <span style={sheetStatValueStyle}>{visualizacoesPainel}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatHeartIconStyle}>❤️</span>
                <span style={sheetStatValueStyle}>{obra.totalCurtidas}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>💬</span>
                <span style={sheetStatValueStyle}>{obra.totalComentarios}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>🔖</span>
                <span style={sheetStatValueStyle}>{obra.totalSalvos}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>{indicadorPrimarioIcone}</span>
                <span style={sheetStatValueStyle}>{indicadorPrimarioValor}</span>
              </span>
            </div>

            <div style={isDesktop ? desktopCardActionsGridStyle : actionsGridStyle}>
              <Link
                href={editarCapituloHref}
                onClick={() => setAcoesAbertas(false)}
                style={openButtonStyle}
              >
                Editar capítulo
              </Link>

              {capituloParaLer && (
                <Link
                  href={leituraCapituloHref}
                  onClick={() => setAcoesAbertas(false)}
                  style={readButtonStyle}
                >
                  {capituloParaContinuar ? "Continuar leitura" : "Ler capítulo"}
                </Link>
              )}

              <Link
                href={editarHref}
                onClick={() => setAcoesAbertas(false)}
                style={editButtonStyle}
              >
                Editar obra
              </Link>

              <Link
                href={capituloHref}
                onClick={() => setAcoesAbertas(false)}
                style={chapterButtonStyle}
              >
                Adicionar capítulo
              </Link>


              {obra.arquivoObra && (
                <button
                  type="button"
                  onClick={() => {
                    setAcoesAbertas(false);
                    void onAbrirArquivo(obra);
                  }}
                  style={fileButtonStyle}
                >
                  Ver arquivo
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  void onCompartilhar(obra);
                  setAcoesAbertas(false);
                }}
                style={shareButtonStyle}
              >
                Compartilhar
              </button>

              <button
                type="button"
                onClick={() => {
                  setAcoesAbertas(false);
                  void onExcluirObra(obra.id, obra.titulo);
                }}
                style={deleteButtonStyle}
              >
                Excluir
              </button>
            </div>

          </section>
        </div>
      )}
    </>
  );
}

const painelAutorPageCss = `
  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }

  html {
    --historietas-painel-bg: #070212;
    --historietas-painel-bg-deep: #04000A;
    --historietas-painel-surface: #08030F;
    --historietas-painel-card-bg: rgba(4, 0, 10, 0.72);
    --historietas-painel-status-bg: rgba(8,5,13,0.52);
    --historietas-painel-heart-meta: #EF4444;
    --historietas-painel-heart-icon: #F43F5E;
    --historietas-painel-success: #86EFAC;
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-painel-bg: #000000;
    --historietas-painel-bg-deep: #000000;
    --historietas-painel-surface: #050505;
    --historietas-painel-card-bg: #050505;
    --historietas-painel-status-bg: rgba(255,255,255,0.08);
    --historietas-painel-heart-meta: #FFFFFF;
    --historietas-painel-heart-icon: #FFFFFF;
    --historietas-painel-success: #FFFFFF;
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="foco"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] nav a[href="/painel"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: var(--historietas-bottom-nav-active-text, #FFFFFF) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] nav a[href="/painel"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-active-icon-text, #FFFFFF) !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: var(--historietas-input-placeholder, rgba(212,212,216,0.68)) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: var(--historietas-input-text, #FFFFFF) !important;
  }

  html[data-historietas-tema-visual="foco"] button,
  html[data-historietas-tema-visual="foco"] a {
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] button:disabled {
    opacity: 0.62 !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const themeGradient = "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)";

const loadingPageStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-painel-bg, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "10px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const topFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "none",
  flex: "0 0 auto",
  whiteSpace: "nowrap",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const topFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const topSearchButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const topSearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  width: "auto",
  minWidth: "110px",
  maxWidth: "none",
  height: "36px",
  marginLeft: "0",
  marginRight: "-4px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};

const desktopTopSearchShellStyle: CSSProperties = {
  ...topSearchShellStyle,
  flex: "1 1 auto",
  width: "auto",
  maxWidth: "520px",
};

const topSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};

const statsBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  marginTop: "0",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  flex: "1 1 calc(25% - 5px)",
  borderRadius: "12px",
  background: "var(--historietas-painel-card-bg, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  padding: "6px 4px",
  display: "grid",
  gap: "2px",
  alignContent: "center",
  justifyItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "43px",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7px",
  lineHeight: 1.15,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const studioControlsStyle: CSSProperties = {
  marginTop: "8px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const studioClearButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.055)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const filterSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  background: "rgba(0,0,0,0.62)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

const filterSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-painel-bg, #070212)",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  WebkitOverflowScrolling: "touch",
  color: "#FFFFFF",
};

const desktopFilterSheetStyle: CSSProperties = {
  ...filterSheetStyle,
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  borderRadius: "24px",
  margin: 0,
  paddingBottom: "18px",
};

const filterSheetHandleStyle: CSSProperties = {
  display: "block",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

const filterSheetTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const filterSheetContentStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const filterSheetSectionLabelStyle: CSSProperties = {
  display: "block",
  margin: 0,
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

function criarFilterSheetOptionStyle(ativo: boolean): CSSProperties {
  return {
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
    minHeight: "44px",
    border: "none",
    background: "transparent",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "0 30px",
    boxSizing: "border-box",
    fontSize: "18px",
    lineHeight: 1,
    fontWeight: ativo ? 900 : 650,
    letterSpacing: "-0.035em",
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
    ...safeTextStyle,
  };
}

function criarFilterSheetRadioStyle(ativo: boolean): CSSProperties {
  return {
    width: "23px",
    height: "23px",
    borderRadius: "999px",
    border: ativo
      ? "2px solid #FFFFFF"
      : "2.5px solid rgba(161,161,170,0.72)",
    background: ativo ? "#FFFFFF" : "transparent",
    color: ativo ? "#111111" : "transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    flex: "0 0 auto",
    fontSize: "15px",
    lineHeight: 1,
    fontWeight: 900,
  };
}

const filterSheetClearDividerStyle: CSSProperties = {
  display: "none",
};

const filterSheetClearStyle: CSSProperties = {
  appearance: "none",
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  margin: "12px 30px 14px",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: "5px",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};


const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};


const worksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "10px",
  rowGap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const workCardStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  position: "relative",
  border: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
  color: "#FFFFFF",
};

const coverLinkStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  textDecoration: "none",
  textDecorationLine: "none",
  color: "#FFFFFF",
  border: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  minHeight: "208px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-painel-surface, #08030F)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-painel-surface, #08030F) 0%, var(--historietas-painel-bg-deep, #04000A) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "0",
  outline: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const coverGlowStyle: CSSProperties = {
  display: "none",
};

const workContentStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2,
  display: "grid",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  padding: "28px 42px 9px 10px",
  boxSizing: "border-box",
  color: "#FFFFFF",
};

const statusRowStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  right: "8px",
  zIndex: 2,
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  alignItems: "center",
  minWidth: 0,
  pointerEvents: "none",
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "18px",
  maxWidth: "100%",
  padding: "0 6px",
  borderRadius: "999px",
  background: "var(--historietas-painel-status-bg, rgba(8,5,13,0.52))",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "0.01em",
  textTransform: "none",
  textShadow: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const draftStatusStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "var(--historietas-painel-status-bg, rgba(8,5,13,0.52))",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
};


const panelTinyInfoStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 850,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const workTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1.06,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textShadow: "none",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  color: "rgba(255,255,255,0.76)",
  textDecoration: "none",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 850,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const workMetaLineStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1.18,
  fontWeight: 850,
  letterSpacing: "-0.01em",
  textShadow: "none",
  overflow: "hidden",
  whiteSpace: "nowrap",
  minWidth: 0,
};

const workCardHeartMetaStyle: CSSProperties = {
  color: "var(--historietas-painel-heart-meta, #EF4444)",
  fontWeight: 950,
};

const workCardCommentMetaStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 950,
};

const sheetStatsRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  padding: "8px 22px 14px",
};

const sheetStatInlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  color: "#FFFFFF",
};

const sheetStatIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  ...safeTextStyle,
};

const sheetStatHeartIconStyle: CSSProperties = {
  ...sheetStatIconStyle,
  color: "var(--historietas-painel-heart-icon, #F43F5E)",
};

const sheetStatValueStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  overflow: "hidden",
};

const openButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "16px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  padding: "0 30px",
  fontSize: "18px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const readButtonStyle: CSSProperties = {
  ...openButtonStyle,
  fontWeight: 900,
};


const editButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

const chapterButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

const fileButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

const shareButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

const deleteButtonStyle: CSSProperties = {
  ...openButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

const workCardDotsButtonStyle: CSSProperties = {
  position: "absolute",
  right: "8px",
  bottom: "8px",
  zIndex: 4,
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  textShadow: "none",
};

const workActionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const workActionSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 190px)",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-painel-bg, #070212)",
  border: "none",
  borderBottom: "0",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  display: "grid",
  gap: 0,
  boxSizing: "border-box",
  touchAction: "none",
};

const workActionSheetHandleStyle: CSSProperties = {
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  justifySelf: "center",
  margin: "0 auto 12px",
};

const workActionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  padding: "0 24px 10px",
  boxSizing: "border-box",
  borderBottom: "none",
};

const workActionSheetTextBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  width: "100%",
};

const workActionSheetTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  fontWeight: 950,
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const workActionSheetMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "24px 0 36px",
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "0",
};

const desktopStudioControlsStyle: CSSProperties = {
  ...studioControlsStyle,
  width: "min(860px, 100%)",
  margin: "10px auto 0",
  gap: "8px",
};


const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "12px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  marginBottom: "8px",
};

const desktopWorksGridStyle: CSSProperties = {
  ...worksGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  columnGap: "14px",
  rowGap: "18px",
};

const desktopWorkCardStyle: CSSProperties = {
  ...workCardStyle,
};

const desktopWorkContentStyle: CSSProperties = {
  ...workContentStyle,
  padding: "28px 42px 9px 10px",
};

const desktopSheetStatsRowStyle: CSSProperties = {
  ...sheetStatsRowStyle,
  padding: "10px 22px 16px",
  gap: "14px",
};

const desktopCardActionsGridStyle: CSSProperties = {
  ...actionsGridStyle,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "24px",
  background: "var(--historietas-painel-card-bg, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "22px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const emptyMiniBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "20px",
  background: "var(--historietas-painel-card-bg, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  fontWeight: 800,
  lineHeight: 1.6,
  display: "grid",
  gap: "10px",
  minWidth: 0,
  boxShadow: "none",
};

const emptyMiniTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const emptyMiniTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 750,
  ...safeTextStyle,
};

const emptyMiniButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "34px",
  padding: "0 14px",
  borderRadius: "999px",
  background: themeGradient,
  border: "0",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "28px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.7,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};