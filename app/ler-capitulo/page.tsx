"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { LerCapituloLanguageBridge } from "./components/ler-capitulo-language-bridge";
import { LoadingSpinner } from "./components/ler-capitulo-loading-spinner";
import ComentariosCapituloSheet, { type ComentarioCapituloPublico, type ComentariosCapituloPost } from "./components/ler-capitulo-comments-sheet";
import LerCapituloReaderContent, { type TamanhoFonte } from "./components/ler-capitulo-reader-content";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import DenunciaModal from "../../components/DenunciaModal";
import AdultContentGate from "../../components/AdultContentGate";
import { historietasThemeCss } from "../../lib/historietasTheme";
import { criarSlugBase, formatarData, idObraSupabaseValido, obterNumeroSeguro } from "../../lib/utils";
import { carregarMetricasConteudos } from "../../lib/metricas";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../lib/supabase/paginacao.mjs";
import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import { useLerCapituloDesktopMode } from "./hooks/use-ler-capitulo-desktop-mode";
import { focusBottomNavigationCss } from "./lib/ler-capitulo-focus-bottom-navigation-css";
import { leitorPageCss } from "./lib/ler-capitulo-page-css";
import {
  carregarComentariosCapituloSupabase,
  carregarPerfilComentarioLeitor,
  obterTextoRegistroLeitor,
  type PerfilComentarioLeitor,
} from "./lib/ler-capitulo-comments-read-loader";
import {
  calcularProgressoLeitura,
  mesclarObraSupabaseComLocal,
  normalizarObra,
  type CapituloLocal,
  type CapituloSupabaseRow,
  type ObraLocal,
} from "./lib/ler-capitulo-work-normalization";
import {
  focusPageStyle,
  fixedReadingProgressOuterStyle,
  fixedReadingProgressInnerStyle,
  containerStyle,
  chapterTextStyle,
  desktopContainerStyle,
  desktopChapterTextStyle,
} from "./lib/ler-capitulo-layout-styles";

type RegistroComentarioCapitulo = {
  capitulo_id?: unknown;
  comentario?: unknown;
};

type AlvoDenunciaLeitor = {
  alvoTipo: "capitulo" | "comentario_capitulo";
  alvoId: string;
  alvoTitulo: string;
};


type TipoNotificacaoInteracaoCapitulo =
  | "curtida-capitulo"
  | "comentario-capitulo"
  | "curtida-comentario-capitulo";

type PreferenciasLeitura = {
  tamanhoFonte: TamanhoFonte;
  mostrarLinhaProgresso: boolean;
  versaoTamanhoFonte: 2;
};

type MetricasCapituloLeitor = {
  totalVisualizacoes: number;
  totalCurtidas: number;
  totalSalvos: number;
  totalComentarios: number;
  curtiu: boolean;
  salvo: boolean;
  carregado: boolean;
};





const metricasCapituloVazias: MetricasCapituloLeitor = {
  totalVisualizacoes: 0,
  totalCurtidas: 0,
  totalSalvos: 0,
  totalComentarios: 0,
  curtiu: false,
  salvo: false,
  carregado: false,
};

const FONT_SCALE_VALUES: TamanhoFonte[] = [1, 2, 3, 4, 5];
const FONT_SCALE_LEGACY_VALUES: Record<TamanhoFonte, 1 | 3 | 5 | 7 | 10> = {
  1: 1,
  2: 3,
  3: 5,
  4: 7,
  5: 10,
};

const STORAGE_KEY = "historietas-obras";
const READER_PREFERENCES_STORAGE_KEY = "historietas-preferencias-leitura";
const TABELA_COMENTARIOS_CAPITULOS_CURTIDAS = "comentarios_capitulos_curtidas";
const CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY = "historietas-comentarios-capitulos-curtidas";

function criarStorageKeyUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioLeitor(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioLeitor(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioLeitor(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a leitura continua com estado em memória.
  }
}

function carregarCurtidasComentariosCapitulosLocais(
  userId: string
): Record<string, boolean> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const texto = lerStorageUsuarioLeitor(
      CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = texto ? JSON.parse(texto) : {};

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(json as Record<string, unknown>).filter(
        (entrada): entrada is [string, boolean] =>
          typeof entrada[0] === "string" && typeof entrada[1] === "boolean"
      )
    );
  } catch {
    return {};
  }
}

function salvarCurtidaComentarioCapituloLocal(
  userId: string,
  comentarioId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const comentarioIdLimpo = comentarioId.trim();

  if (!userIdLimpo || !comentarioIdLimpo) {
    return;
  }

  const curtidasLocais = carregarCurtidasComentariosCapitulosLocais(userIdLimpo);

  salvarJsonStorageUsuarioLeitor(
    CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY,
    userIdLimpo,
    {
      ...curtidasLocais,
      [comentarioIdLimpo]: ativo,
    }
  );
}

function aplicarCurtidasComentariosCapitulosLocais(
  comentarios: ComentarioCapituloPublico[],
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return comentarios;
  }

  const curtidasLocais = carregarCurtidasComentariosCapitulosLocais(userIdLimpo);

  return comentarios.map((comentario) => {
    const estadoLocal = curtidasLocais[comentario.id];

    if (estadoLocal === true) {
      return {
        ...comentario,
        curtidas: Array.from(new Set([...comentario.curtidas, userIdLimpo])),
      };
    }

    if (estadoLocal === false) {
      return {
        ...comentario,
        curtidas: comentario.curtidas.filter(
          (curtidaId) => curtidaId !== userIdLimpo
        ),
      };
    }

    return comentario;
  });
}

async function marcarNotificacaoCapituloComoLidaSupabase(
  userId: string,
  obraId: string,
  capituloId: string
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capituloIdLimpo = capituloId.trim();

  if (!userIdLimpo || !obraIdLimpo || !capituloIdLimpo) {
    return;
  }

  try {
    await supabase
      .from("notificacoes")
      .update({
        lida: true,
      })
      .eq("user_id", userIdLimpo)
      .eq("obra_id", obraIdLimpo)
      .eq("capitulo_id", capituloIdLimpo);
  } catch {
    // A leitura continua mesmo se a notificação remota não atualizar.
  }
}

async function registrarNotificacaoInteracaoCapituloSupabase({
  tipo,
  obra,
  capitulo,
  comentarioId,
  titulo,
  mensagem,
  link,
}: {
  tipo: TipoNotificacaoInteracaoCapitulo;
  obra: ObraLocal | null;
  capitulo: CapituloLocal | null;
  comentarioId?: string;
  titulo: string;
  mensagem: string;
  link: string;
}) {
  const obraId = obra?.id?.trim() || "";
  const capituloId = capitulo?.id?.trim() || "";
  // O RPC exige um UUID mesmo para curtidas de capítulo. Nesse tipo de evento,
  // o banco ignora p_comentario_id, então o capítulo serve como UUID neutro.
  const comentarioIdRpc = comentarioId?.trim() || capituloId;
  const tituloLimpo = titulo.trim();
  const mensagemLimpa = mensagem.trim();
  const linkLimpo = link.trim();

  if (!idObraSupabaseValido(obraId) || !idObraSupabaseValido(capituloId)) {
    return false;
  }

  try {
    const { error } = await supabase.rpc(
      "criar_notificacao_interacao_capitulo",
      {
        p_capitulo_id: capituloId,
        p_comentario_id: comentarioIdRpc,
        p_tipo: tipo,
        p_titulo: tituloLimpo,
        p_mensagem: mensagemLimpa,
        p_link: linkLimpo || (obra ? criarHrefLeituraCapituloLeitor(obra, capituloId) : "/notificacoes"),
      }
    );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui criar notificação da interação do capítulo:", error);
    return false;
  }
}

function criarLoginHrefLeitor(obraId?: string, capituloId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const capituloIdLimpo = capituloId?.trim() || "";
  const paramsLeitor = new URLSearchParams();

  if (obraIdLimpo) {
    paramsLeitor.set("obraId", obraIdLimpo);
  }

  if (capituloIdLimpo) {
    paramsLeitor.set("capituloId", capituloIdLimpo);
  }

  const queryLeitor = paramsLeitor.toString();
  const redirectTo = queryLeitor ? `/ler-capitulo?${queryLeitor}` : "/ler-capitulo";
  const paramsLogin = new URLSearchParams({
    redirectTo,
  });

  return `/login?${paramsLogin.toString()}`;
}

function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function normalizarTamanhoFonte(
  valor: unknown,
  versaoAtual = false
): TamanhoFonte {
  const numero = Number(valor);

  if (
    versaoAtual &&
    FONT_SCALE_VALUES.includes(numero as TamanhoFonte)
  ) {
    return numero as TamanhoFonte;
  }

  if (!Number.isFinite(numero)) {
    return 3;
  }

  if (numero <= 1) {
    return 1;
  }

  if (numero <= 3) {
    return 2;
  }

  if (numero <= 5) {
    return 3;
  }

  if (numero <= 8) {
    return 4;
  }

  return 5;
}

function carregarPreferenciasLeitura(userId = ""): PreferenciasLeitura {
  if (typeof window === "undefined" || !userId.trim()) {
    return {
      tamanhoFonte: 3,
      mostrarLinhaProgresso: false,
      versaoTamanhoFonte: 2,
    };
  }

  try {
    const preferenciasTexto = lerStorageUsuarioLeitor(
      READER_PREFERENCES_STORAGE_KEY,
      userId
    );
    const preferenciasJson: unknown = preferenciasTexto
      ? JSON.parse(preferenciasTexto)
      : null;

    if (
      !preferenciasJson ||
      typeof preferenciasJson !== "object" ||
      Array.isArray(preferenciasJson)
    ) {
      return {
        tamanhoFonte: 3,
        mostrarLinhaProgresso: false,
        versaoTamanhoFonte: 2,
      };
    }

    const preferencias = preferenciasJson as Partial<PreferenciasLeitura>;

    return {
      tamanhoFonte: normalizarTamanhoFonte(
        preferencias.tamanhoFonte,
        preferencias.versaoTamanhoFonte === 2
      ),
      mostrarLinhaProgresso: Boolean(preferencias.mostrarLinhaProgresso),
      versaoTamanhoFonte: 2,
    };
  } catch {
    return {
      tamanhoFonte: 3,
      mostrarLinhaProgresso: false,
      versaoTamanhoFonte: 2,
    };
  }
}

function salvarPreferenciasLeitura(
  preferencias: PreferenciasLeitura,
  userId = ""
) {
  salvarJsonStorageUsuarioLeitor(
    READER_PREFERENCES_STORAGE_KEY,
    userId,
    preferencias
  );
}

function criarTextoLeituraStyle(tamanhoFonte: TamanhoFonte): CSSProperties {
  const tamanhoLegado = FONT_SCALE_LEGACY_VALUES[tamanhoFonte];
  const fontSize = 12 + tamanhoLegado;
  const lineHeight =
    tamanhoLegado <= 3 ? 1.78 : tamanhoLegado <= 7 ? 1.9 : 1.98;

  return {
    ...chapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}

function criarTextoLeituraDesktopStyle(tamanhoFonte: TamanhoFonte): CSSProperties {
  const tamanhoLegado = FONT_SCALE_LEGACY_VALUES[tamanhoFonte];
  const fontSize = 14 + tamanhoLegado;
  const lineHeight =
    tamanhoLegado <= 3 ? 1.82 : tamanhoLegado <= 7 ? 1.94 : 2.02;

  return {
    ...desktopChapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}

function criarHrefLeituraCapituloLeitor(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado" | "capitulos">,
  capituloId: string
) {
  const indiceCapitulo = obra.capitulos.findIndex(
    (capitulo) => capitulo.id === capituloId
  );
  const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;
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
  )}&capituloId=${encodeURIComponent(capituloId)}`;
}

async function incrementarVisualizacaoCapituloSupabase(
  capituloId: string
): Promise<number | null> {
  const capituloIdLimpo = capituloId.trim();

  if (!idObraSupabaseValido(capituloIdLimpo)) {
    return null;
  }

  try {
    const response = await fetch("/api/visualizacoes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "capitulo",
        conteudoId: capituloIdLimpo,
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; total?: unknown }
      | null;

    if (!response.ok || !data?.ok || typeof data.total !== "number") {
      return null;
    }

    return Math.max(0, obterNumeroSeguro(data.total, 0));
  } catch {
    // A leitura continua mesmo se a contagem remota falhar.
    return null;
  }
}

function carregarObrasLocaisNormalizadas(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraLocal[];
  }

  const obrasSalvasTexto = lerStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo);
  const obrasSalvasJson: unknown = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo, obrasNormalizadas);

  return obrasNormalizadas;
}

function obterAutorIdSeguro(obra: Pick<ObraLocal, "autorId">) {
  return typeof obra.autorId === "string" ? obra.autorId.trim() : "";
}

function usuarioPodeAbrirObraNoLeitor(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdSeguro(obra);

  return obra.publicado || !autorId || Boolean(userId && autorId === userId);
}

function usuarioPodePersistirObraNoStorage(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdSeguro(obra);

  return !autorId || Boolean(userId && autorId === userId);
}

function salvarObrasPreservandoContas(
  obrasAtualizadas: ObraLocal[],
  userId: string
) {
  try {
    const userIdLimpo = userId.trim();

    if (!userIdLimpo) {
      return;
    }

    const obrasAtuais = carregarObrasLocaisNormalizadas(userIdLimpo);
    const obrasAtualizadasPorId = new Map(
      obrasAtualizadas.map((obra, index) => [
        obra.id,
        normalizarObra(obra, index),
      ])
    );
    const idsPersistidos = new Set<string>();

    const obrasMescladas = obrasAtuais.map((obraAtual, index) => {
      const obraNormalizada = normalizarObra(obraAtual, index);
      const obraAtualizada = obrasAtualizadasPorId.get(obraNormalizada.id);

      idsPersistidos.add(obraNormalizada.id);

      if (!obraAtualizada) {
        return obraNormalizada;
      }

      return usuarioPodePersistirObraNoStorage(obraAtualizada, userIdLimpo)
        ? obraAtualizada
        : obraNormalizada;
    });

    obrasAtualizadas.forEach((obra, index) => {
      const obraNormalizada = normalizarObra(obra, index);

      if (
        idsPersistidos.has(obraNormalizada.id) ||
        !usuarioPodePersistirObraNoStorage(obraNormalizada, userIdLimpo)
      ) {
        return;
      }

      obrasMescladas.unshift(obraNormalizada);
      idsPersistidos.add(obraNormalizada.id);
    });

    salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo, obrasMescladas);
  } catch {
    // A leitura deve continuar mesmo se o armazenamento local estiver indisponível.
  }
}

async function carregarObraSupabase(
  obraId: string,
  obraLocal?: ObraLocal | null,
  userId = ""
) {
  const { data: obraSupabase, error: erroObra } = await supabase
    .from("obras")
    .select(
      "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
    )
    .eq("id", obraId)
    .limit(1)
    .maybeSingle();

  if (erroObra || !obraSupabase) {
    return null;
  }

  const obraBanco = obraSupabase;
  const autorId = obraBanco.user_id?.trim() || "";
  const usuarioEhDono = Boolean(userId && autorId === userId);

  if (!obraBanco.publicado && !usuarioEhDono) {
    return null;
  }

  let capitulosSupabase: CapituloSupabaseRow[] = [];

  try {
    capitulosSupabase = await carregarTodasPaginasSupabase<CapituloSupabaseRow>({
      nomeColecao: "capítulos da leitura",
      buscarPagina: async (inicio, fim) => {
        let query = supabase
          .from("capitulos")
          .select("id,obra_id,user_id,titulo,texto,ordem,publicado,visualizacoes,criado_em,atualizado_em")
          .eq("obra_id", obraId);

        if (!usuarioEhDono) {
          query = query.eq("publicado", true);
        }

        return query
          .order("ordem", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim);
      },
    });
  } catch {
    capitulosSupabase = [];
  }

  return mesclarObraSupabaseComLocal(
    obraBanco,
    capitulosSupabase,
    obraLocal,
    usuarioEhDono
  );
}

async function aplicarInteracoesCapitulosSupabase(
  obra: ObraLocal,
  userId: string
): Promise<ObraLocal> {
  const capituloIds = obra.capitulos.map((capitulo) => capitulo.id).filter(Boolean);

  if (capituloIds.length === 0) {
    return obra;
  }

  const [metricas, comentariosResposta] = await Promise.all([
    carregarMetricasConteudos({
      obraIds: [obra.id],
      capituloIds,
    }),
    carregarTodasPaginasPorLotesSupabase<RegistroComentarioCapitulo, string>({
      nomeColecao: "comentários do leitor nos capítulos",
      itens: capituloIds,
      buscarPaginaLote: async (capituloIdsLote, inicio, fim) =>
        supabase
          .from("comentarios_capitulos")
          .select("id,capitulo_id,comentario,atualizado_em")
          .eq("user_id", userId)
          .in("capitulo_id", capituloIdsLote)
          .order("atualizado_em", { ascending: false })
          .order("id", { ascending: false })
          .range(inicio, fim),
    }).catch(() => [] as RegistroComentarioCapitulo[]),
  ]);
  const comentarios = new Map<string, string>();

  if (Array.isArray(comentariosResposta)) {
    comentariosResposta.forEach((item: unknown) => {
      const registro = item as RegistroComentarioCapitulo;

      if (
        typeof registro.capitulo_id === "string" &&
        typeof registro.comentario === "string"
      ) {
        comentarios.set(registro.capitulo_id, registro.comentario);
      }
    });
  }

  const progressoCarregado = metricas.carregado;
  let ultimoCapituloLidoId = "";
  let ultimaLeituraEm = "";

  const capitulos = obra.capitulos.map((capitulo) => {
    const metrica = metricas.capitulos.get(capitulo.id);
    const progressoRemotoDisponivel =
      progressoCarregado && Boolean(metrica);
    const lidoRemoto = progressoRemotoDisponivel
      ? Boolean(metrica?.usuario.leu)
      : capitulo.lido;
    const lidoEmRemoto = metrica?.usuario.lidoEm || "";
    const lidoEm = progressoRemotoDisponivel
      ? lidoRemoto
        ? lidoEmRemoto || capitulo.lidoEm
        : ""
      : capitulo.lidoEm;

    if (lidoRemoto) {
      const tempoAtual = new Date(lidoEm).getTime();
      const tempoUltimo = new Date(ultimaLeituraEm).getTime();

      if (
        !ultimoCapituloLidoId ||
        (Number.isFinite(tempoAtual) ? tempoAtual : 0) >=
          (Number.isFinite(tempoUltimo) ? tempoUltimo : 0)
      ) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      ...capitulo,
      curtiu: capitulo.curtiu || Boolean(metrica?.usuario.curtiu),
      salvo: capitulo.salvo || Boolean(metrica?.usuario.salvou),
      comentario: comentarios.has(capitulo.id)
        ? comentarios.get(capitulo.id) || ""
        : capitulo.comentario,
      lido: lidoRemoto,
      lidoEm,
    };
  });

  return {
    ...obra,
    capitulos,
    ultimoCapituloLidoId: progressoCarregado
      ? ultimoCapituloLidoId
      : obra.ultimoCapituloLidoId,
    ultimaLeituraEm: progressoCarregado
      ? ultimaLeituraEm
      : obra.ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulos),
  };
}

async function salvarProgressoLeituraSupabase(
  obra: ObraLocal,
  capituloId: string,
  lido: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();

    if (
      !userId ||
      !idObraSupabaseValido(obra.id) ||
      !capituloIdLimpo
    ) {
      return false;
    }

    if (!lido) {
      const { error: erroDelete } = await supabase
        .from("progresso_leitura")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obra.id)
        .eq("capitulo_id", capituloIdLimpo);

      if (erroDelete) {
        throw erroDelete;
      }

      return true;
    }

    const payload = {
      user_id: userId,
      obra_id: obra.id,
      capitulo_id: capituloIdLimpo,
      progresso: calcularProgressoLeitura(obra.capitulos),
      lido: true,
      atualizado_em: new Date().toISOString(),
    };

    const { error: erroUpsert } = await supabase
      .from("progresso_leitura")
      .upsert(payload, {
        onConflict: "user_id,obra_id,capitulo_id",
      });

    if (erroUpsert) {
      throw erroUpsert;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui salvar progresso de leitura no Supabase:", error);
    return false;
  }
}

type TipoAtividadeDiarioLeitor =
  | "comecou_ler"
  | "leu_capitulo"
  | "concluiu_obra"
  | "favoritou_obra"
  | "salvou_obra";

type VisibilidadeDiarioLeitor = "publico" | "parcial" | "privado";

async function registrarAtividadeDiarioLeitor({
  userId,
  tipo,
  obra,
  capituloId,
  visibilidade,
  texto,
  metadata = {},
}: {
  userId: string;
  tipo: TipoAtividadeDiarioLeitor;
  obra: ObraLocal;
  capituloId?: string;
  visibilidade: VisibilidadeDiarioLeitor;
  texto?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!userId || !idObraSupabaseValido(obra.id)) {
    return false;
  }

  const capituloIdSeguro =
    capituloId && idObraSupabaseValido(capituloId) ? capituloId : null;

  try {
    const { error } = await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obra.id,
      capitulo_id: capituloIdSeguro,
      texto: texto?.trim() || null,
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        obra_slug: obra.slug,
        autor: obra.autor,
        capitulo_id_original: capituloId || "",
        ...metadata,
      },
    });

    return !error;
  } catch {
    // O Diário é camada social. A leitura nunca deve travar se o log falhar.
    return false;
  }
}


async function salvarRegistroCapituloSupabase(
  tabela: "curtidas_capitulos" | "salvos_capitulos",
  capituloId: string,
  ativo: boolean
) {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";

    if (!userId || !capituloId.trim()) {
      return false;
    }

    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("capitulo_id", capituloId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return true;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloId,
    };

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }

    return true;
  } catch (error) {
    console.warn(`Não consegui salvar registro em ${tabela}:`, error);
    return false;
  }
}


function criarMetricasCapituloLocais(
  capitulo: CapituloLocal | null,
  totalComentarios = 0
): MetricasCapituloLeitor {
  if (!capitulo) {
    return metricasCapituloVazias;
  }

  return {
    totalVisualizacoes: Math.max(0, capitulo.visualizacoes || 0),
    totalCurtidas: capitulo.curtiu ? 1 : 0,
    totalSalvos: capitulo.salvo ? 1 : 0,
    totalComentarios,
    curtiu: capitulo.curtiu,
    salvo: capitulo.salvo,
    carregado: false,
  };
}

async function carregarMetricasCapituloSupabase(
  capitulo: CapituloLocal,
  totalComentariosFallback: number
): Promise<MetricasCapituloLeitor> {
  const capituloId = capitulo.id.trim();

  if (!capituloId) {
    return criarMetricasCapituloLocais(capitulo, totalComentariosFallback);
  }

  const contrato = await carregarMetricasConteudos({
    capituloIds: [capituloId],
  });
  const metrica = contrato.capitulos.get(capituloId);

  if (!contrato.carregado || !metrica) {
    return {
      ...criarMetricasCapituloLocais(capitulo, totalComentariosFallback),
      carregado: true,
    };
  }

  return {
    totalVisualizacoes: metrica.visualizacoes,
    totalCurtidas: metrica.interacoes.curtidas,
    totalSalvos: metrica.interacoes.salvos,
    totalComentarios: Math.max(
      metrica.interacoes.comentarios,
      totalComentariosFallback
    ),
    curtiu: metrica.usuario.curtiu,
    salvo: metrica.usuario.salvou,
    carregado: true,
  };
}

function formatarContadorCapituloLeitor(valor: number) {
  return Math.max(0, Math.round(valor)).toLocaleString("pt-BR");
}

async function salvarComentarioCapituloSupabase(
  capituloId: string,
  comentario: string,
  comentarioPaiId = ""
): Promise<Record<string, unknown> | null> {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();
    const comentarioLimpo = comentario.trim();
    const comentarioPaiIdLimpo = comentarioPaiId.trim();
    const agora = new Date().toISOString();

    if (!userId || !capituloIdLimpo || !comentarioLimpo) {
      return null;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloIdLimpo,
      comentario: comentarioLimpo.slice(0, 420),
    };
    const payloadComResposta = {
      ...payloadBase,
      comentario_pai_id: comentarioPaiIdLimpo || null,
    };

    const { data: comentarioComAtualizacao, error: erroComAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert({
          ...payloadComResposta,
          atualizado_em: agora,
        })
        .select(
          "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em"
        )
        .single();

    if (!erroComAtualizacao && comentarioComAtualizacao) {
      return comentarioComAtualizacao as Record<string, unknown>;
    }

    const { data: comentarioSemAtualizacao, error: erroSemAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert(payloadComResposta)
        .select("id,user_id,comentario,comentario_pai_id,criado_em")
        .single();

    if (!erroSemAtualizacao && comentarioSemAtualizacao) {
      return comentarioSemAtualizacao as Record<string, unknown>;
    }

    if (comentarioPaiIdLimpo) {
      throw erroSemAtualizacao || erroComAtualizacao;
    }

    const { data: comentarioLegado, error: erroLegado } = await supabase
      .from("comentarios_capitulos")
      .insert(payloadBase)
      .select("id,user_id,comentario,criado_em")
      .single();

    if (!erroLegado && comentarioLegado) {
      return comentarioLegado as Record<string, unknown>;
    }

    throw erroLegado || erroSemAtualizacao || erroComAtualizacao;
  } catch (error) {
    console.warn("Não consegui salvar comentário do capítulo no Supabase:", error);
    return null;
  }
}


function obterIdsComentarioCapituloComRespostas(
  comentarios: ComentarioCapituloPublico[],
  comentarioId: string
) {
  const ids = new Set<string>([comentarioId]);
  let encontrouNovos = true;

  while (encontrouNovos) {
    encontrouNovos = false;

    comentarios.forEach((comentario) => {
      if (
        comentario.comentarioPaiId &&
        ids.has(comentario.comentarioPaiId) &&
        !ids.has(comentario.id)
      ) {
        ids.add(comentario.id);
        encontrouNovos = true;
      }
    });
  }

  return ids;
}



export default function LerCapituloPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [, setComentarioDigitado] = useState("");
  const [comentarioStatus, setComentarioStatus] = useState("");
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<AlvoDenunciaLeitor | null>(null);
  const [comentariosCapitulo, setComentariosCapitulo] = useState<ComentarioCapituloPublico[]>([]);
  const [metricasCapitulo, setMetricasCapitulo] =
    useState<MetricasCapituloLeitor>(metricasCapituloVazias);
  const [curtidaCapituloSalvando, setCurtidaCapituloSalvando] = useState(false);
  const [salvoCapituloSalvando, setSalvoCapituloSalvando] = useState(false);
  const [lidoCapituloSalvando, setLidoCapituloSalvando] = useState(false);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const comentariosCapituloCarregadoIdRef = useRef("");
  const [perfilComentarioLeitor, setPerfilComentarioLeitor] =
    useState<PerfilComentarioLeitor>({
      userId: "",
      nome: "Usuário",
      avatar: "",
    });
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [tamanhoFonte, setTamanhoFonte] = useState<TamanhoFonte>(3);
  const [mostrarAjustes, setMostrarAjustes] = useState(false);
  const [mostrarLinhaProgresso, setMostrarLinhaProgresso] = useState(false);
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [progressoRolagem, setProgressoRolagem] = useState(0);
  const isDesktop = useLerCapituloDesktopMode();
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);
  const [controleAcesso18, setControleAcesso18] = useState<{
    obraId: string;
    status: "verificando" | "permitido" | "bloqueado";
  }>({ obraId: "", status: "verificando" });
  const visualizacaoCapituloRegistradaRef = useRef("");
  const atividadeDiarioRegistradaRef = useRef("");
  const curtidaCapituloSalvandoRef = useRef(false);
  const salvoCapituloSalvandoRef = useRef(false);
  const lidoCapituloSalvandoRef = useRef(false);
  const acoesComentariosCapituloRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (!mostrarComentario) {
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
  }, [mostrarComentario]);

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (!cancelado) {
          setUsuarioIdLogado(data.user?.id || "");
        }
      } catch {
        if (!cancelado) {
          setUsuarioIdLogado("");
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelado) {
        setUsuarioIdLogado(session?.user?.id || "");
      }
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);



  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilComentario() {
      if (!usuarioIdLogado) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilComentarioLeitor({
              userId: "",
              nome: "Usuário",
              avatar: "",
            });
          }
        }, 0);
        return;
      }

      const perfil = await carregarPerfilComentarioLeitor(usuarioIdLogado);

      if (!cancelado) {
        setPerfilComentarioLeitor(perfil);
      }
    }

    void carregarPerfilComentario();

    return () => {
      cancelado = true;
    };
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!usuarioIdLogado.trim()) {
      return;
    }

    const carregarPreferenciasTimer = window.setTimeout(() => {
      const preferencias = carregarPreferenciasLeitura(usuarioIdLogado);

      setTamanhoFonte(preferencias.tamanhoFonte);
      setMostrarLinhaProgresso(preferencias.mostrarLinhaProgresso);
      setPreferenciasCarregadas(true);
    }, 0);

    return () => {
      window.clearTimeout(carregarPreferenciasTimer);
    };
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!preferenciasCarregadas) {
      return;
    }

    salvarPreferenciasLeitura(
      {
        tamanhoFonte,
        mostrarLinhaProgresso,
        versaoTamanhoFonte: 2,
      },
      usuarioIdLogado
    );
  }, [preferenciasCarregadas, tamanhoFonte, mostrarLinhaProgresso, usuarioIdLogado]);

  useEffect(() => {
    let cancelado = false;

    async function carregarDados() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";
      const capituloIdParam = params.get("capituloId") || "";

      window.setTimeout(() => {
        if (!cancelado) {
          setObraId(obraIdParam);
          setCapituloId(capituloIdParam);
        }
      }, 0);

      try {
        const { data: dadosUsuario } = await supabase.auth.getUser();
        const userId = dadosUsuario.user?.id || "";
        const obrasLocaisTodas = carregarObrasLocaisNormalizadas(userId);
        const obrasLocais = obrasLocaisTodas
          .filter((obra) => usuarioPodeAbrirObraNoLeitor(obra, userId))
          .map((obra) => {
            const autorId = obterAutorIdSeguro(obra);
            const usuarioEhDono = Boolean(userId && autorId === userId);

            if (usuarioEhDono) {
              return obra;
            }

            return {
              ...obra,
              capitulos: obra.capitulos.filter(
                (capitulo) => capitulo.publicado !== false
              ),
            };
          });
        let obrasAtualizadas = obrasLocais;

        if (obraIdParam) {
          const obraLocal =
            obrasLocais.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(
            obraIdParam,
            obraLocal,
            userId
          );

          if (obraSupabase && usuarioPodeAbrirObraNoLeitor(obraSupabase, userId)) {
            obrasAtualizadas = [
              obraSupabase,
              ...obrasLocais.filter((obra) => obra.id !== obraSupabase.id),
            ];
          } else if (
            idObraSupabaseValido(obraIdParam) &&
            !Boolean(obraLocal && userId && obterAutorIdSeguro(obraLocal) === userId)
          ) {
            obrasAtualizadas = obrasLocais.filter((obra) => obra.id !== obraIdParam);
          }
        }

        if (dadosUsuario.user) {
          const obraParaInteracoes = obrasAtualizadas.find(
            (obra) => obra.id === obraIdParam
          );

          if (obraParaInteracoes) {
            const obraComInteracoes = await aplicarInteracoesCapitulosSupabase(
              obraParaInteracoes,
              dadosUsuario.user.id
            );

            obrasAtualizadas = [
              obraComInteracoes,
              ...obrasAtualizadas.filter(
                (obra) => obra.id !== obraComInteracoes.id
              ),
            ];
          }
        }

        salvarObrasPreservandoContas(obrasAtualizadas, userId);

        if (!cancelado) {
          setObras(obrasAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      cancelado = true;
    };
  }, []);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capituloAtual = useMemo(() => {
    return (
      obraAtual?.capitulos.find((capitulo) => capitulo.id === capituloId) ||
      null
    );
  }, [obraAtual, capituloId]);
  const atualizarCapituloPorMetricas = useEffectEvent(
    (dados: Partial<CapituloLocal>) => atualizarCapitulo(dados),
  );

  const statusAcesso18 =
    obraAtual && controleAcesso18.obraId === obraAtual.id
      ? controleAcesso18.status
      : "verificando";

  useEffect(() => {
    const atualizarAcessoTimer = window.setTimeout(() => {
      if (!obraAtual) {
        setControleAcesso18({ obraId: "", status: "verificando" });
        return;
      }

      const proximoStatus = !ehClassificacao18(
        obraAtual.classificacaoIndicativa,
      )
        ? "permitido"
        : acessoConteudo18Confirmado()
          ? "permitido"
          : "bloqueado";

      setControleAcesso18((controleAtual) => {
        if (
          controleAtual.obraId === obraAtual.id &&
          controleAtual.status === proximoStatus
        ) {
          return controleAtual;
        }

        return { obraId: obraAtual.id, status: proximoStatus };
      });
    }, 0);

    return () => {
      window.clearTimeout(atualizarAcessoTimer);
    };
  }, [obraAtual]);


  useEffect(() => {
    let cancelado = false;

    async function carregarComentariosCapitulo() {
      if (!capituloAtual?.id) {
        window.setTimeout(() => {
          if (!cancelado) {
            setComentariosCapitulo([]);
            setComentariosCarregando(false);
          }
        }, 0);
        return;
      }

      const deveExibirCarregamentoInicial =
        comentariosCapituloCarregadoIdRef.current !== capituloAtual.id;

      if (deveExibirCarregamentoInicial) {
        setComentariosCarregando(true);
      }

      const comentarios = await carregarComentariosCapituloSupabase(
        capituloAtual.id,
        usuarioIdLogado,
        {
          aplicarCurtidasComentariosCapitulosLocais,
          TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
        },
      );

      if (!cancelado) {
        comentariosCapituloCarregadoIdRef.current = capituloAtual.id;
        setComentariosCapitulo(comentarios);
        setComentariosCarregando(false);
      }
    }

    void carregarComentariosCapitulo();

    return () => {
      cancelado = true;
    };
  }, [capituloAtual?.id, usuarioIdLogado]);

  useEffect(() => {
    let cancelado = false;

    async function carregarMetricasCapituloAtual() {
      if (
        curtidaCapituloSalvandoRef.current ||
        salvoCapituloSalvandoRef.current
      ) {
        return;
      }

      if (!capituloAtual) {
        setMetricasCapitulo(metricasCapituloVazias);
        return;
      }

      const metricasLocais = criarMetricasCapituloLocais(
        capituloAtual,
        comentariosCapitulo.length
      );

      setMetricasCapitulo(metricasLocais);

      const metricasReais = await carregarMetricasCapituloSupabase(
        capituloAtual,
        comentariosCapitulo.length
      );

      if (cancelado) {
        return;
      }

      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasReais,
        totalVisualizacoes: Math.max(
          metricasAtuais.totalVisualizacoes,
          metricasReais.totalVisualizacoes
        ),
      }));

      if (
        metricasReais.curtiu !== capituloAtual.curtiu ||
        metricasReais.salvo !== capituloAtual.salvo
      ) {
        atualizarCapituloPorMetricas({
          curtiu: metricasReais.curtiu,
          salvo: metricasReais.salvo,
        });
      }
    }

    void carregarMetricasCapituloAtual();

    return () => {
      cancelado = true;
    };
  }, [
    capituloAtual,
    comentariosCapitulo.length,
    usuarioIdLogado,
  ]);

  const indiceCapitulo = useMemo(() => {
    if (!obraAtual || !capituloAtual) {
      return -1;
    }

    return obraAtual.capitulos.findIndex(
      (capitulo) => capitulo.id === capituloAtual.id
    );
  }, [obraAtual, capituloAtual]);

  const numeroCapitulo = indiceCapitulo >= 0 ? indiceCapitulo + 1 : 1;

  const capituloAnterior = useMemo(() => {
    if (!obraAtual || indiceCapitulo <= 0) {
      return null;
    }

    return obraAtual.capitulos[indiceCapitulo - 1];
  }, [obraAtual, indiceCapitulo]);

  const proximoCapitulo = useMemo(() => {
    if (!obraAtual || indiceCapitulo < 0) {
      return null;
    }

    return obraAtual.capitulos[indiceCapitulo + 1] || null;
  }, [obraAtual, indiceCapitulo]);

  const totalPalavras = capituloAtual ? contarPalavras(capituloAtual.texto) : 0;
  const postComentariosCapitulo: ComentariosCapituloPost | null = capituloAtual
    ? {
        id: capituloAtual.id,
        comentarios: comentariosCapitulo,
      }
    : null;

  useEffect(() => {
    if (
      statusAcesso18 !== "permitido" ||
      !capituloAtual ||
      !idObraSupabaseValido(capituloAtual.id)
    ) {
      return;
    }

    const capituloIdAtual = capituloAtual.id;

    if (visualizacaoCapituloRegistradaRef.current === capituloIdAtual) {
      return;
    }

    visualizacaoCapituloRegistradaRef.current = capituloIdAtual;

    async function registrarVisualizacaoCapituloAtual() {
      const totalVisualizacoes =
        await incrementarVisualizacaoCapituloSupabase(capituloIdAtual);

      if (totalVisualizacoes === null) {
        return;
      }

      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalVisualizacoes: Math.max(
          metricasAtuais.totalVisualizacoes,
          totalVisualizacoes
        ),
      }));
    }

    void registrarVisualizacaoCapituloAtual();
  }, [capituloAtual, statusAcesso18]);

  useEffect(() => {
    const atualizarComentarioTimer = window.setTimeout(() => {
      setComentarioDigitado(capituloAtual?.comentario || "");
      setComentarioStatus("");
      setMensagemAcao("");
      setMostrarComentario(false);
    }, 0);

    return () => {
      window.clearTimeout(atualizarComentarioTimer);
    };
  }, [capituloAtual?.id, capituloAtual?.comentario, usuarioIdLogado]);

  useEffect(() => {
    function atualizarProgressoRolagem() {
      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;

      if (alturaTotal <= 0) {
        setProgressoRolagem(0);
        return;
      }

      const progressoAtual = Math.round((window.scrollY / alturaTotal) * 100);
      setProgressoRolagem(Math.min(100, Math.max(0, progressoAtual)));
    }

    const atualizarProgressoTimer = window.setTimeout(
      atualizarProgressoRolagem,
      0
    );

    window.addEventListener("scroll", atualizarProgressoRolagem);
    window.addEventListener("resize", atualizarProgressoRolagem);

    return () => {
      window.clearTimeout(atualizarProgressoTimer);
      window.removeEventListener("scroll", atualizarProgressoRolagem);
      window.removeEventListener("resize", atualizarProgressoRolagem);
    };
  }, [capituloAtual?.id]);

  useEffect(() => {
    if (
      statusAcesso18 !== "permitido" ||
      !usuarioIdLogado ||
      !obraAtual ||
      !capituloAtual
    ) {
      return;
    }

    const chaveAtividade = `${usuarioIdLogado}:${obraAtual.id}:${capituloAtual.id}`;

    if (atividadeDiarioRegistradaRef.current === chaveAtividade) {
      return;
    }

    atividadeDiarioRegistradaRef.current = chaveAtividade;

    void marcarNotificacaoCapituloComoLidaSupabase(
      usuarioIdLogado,
      obraAtual.id,
      capituloAtual.id
    );

    const obraJaIniciada =
      obraAtual.progressoLeitura > 0 ||
      Boolean(obraAtual.ultimoCapituloLidoId) ||
      obraAtual.capitulos.some((capitulo) => capitulo.lido);

    if (obraJaIniciada) {
      return;
    }

    void registrarAtividadeDiarioLeitor({
      userId: usuarioIdLogado,
      tipo: "comecou_ler",
      obra: obraAtual,
      capituloId: capituloAtual.id,
      visibilidade: "publico",
      texto: `Começou a ler ${obraAtual.titulo}`,
      metadata: {
        capitulo_titulo: capituloAtual.titulo,
        capitulo_numero: numeroCapitulo,
        progresso_obra: obraAtual.progressoLeitura,
        origem: "abertura_capitulo",
      },
    });
  }, [usuarioIdLogado, obraAtual, capituloAtual, numeroCapitulo, statusAcesso18]);

  async function obterUsuarioLogadoIdAtual() {
    if (usuarioIdLogado) {
      return usuarioIdLogado;
    }

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";

      setUsuarioIdLogado(userId);

      return userId;
    } catch {
      setUsuarioIdLogado("");
      return "";
    }
  }

  async function exigirLogin(mensagem: string) {
    const userId = await obterUsuarioLogadoIdAtual();

    if (userId) {
      setMensagemAcao("");
      return true;
    }

    setMensagemAcao(mensagem);
    router.push(criarLoginHrefLeitor(obraId, capituloId));
    return false;
  }

  async function recarregarMetricasCapituloAtual() {
    if (!capituloAtual) {
      setMetricasCapitulo(metricasCapituloVazias);
      return;
    }

    const metricas = await carregarMetricasCapituloSupabase(
      capituloAtual,
      comentariosCapitulo.length
    );

    setMetricasCapitulo(metricas);

    if (
      metricas.curtiu !== capituloAtual.curtiu ||
      metricas.salvo !== capituloAtual.salvo
    ) {
      atualizarCapitulo({
        curtiu: metricas.curtiu,
        salvo: metricas.salvo,
      });
    }
  }

  async function alternarComentarioVisivel() {
    setComentarioStatus("");
    setMostrarComentario((valorAtual) => !valorAtual);
  }

  function fecharComentariosCapitulo() {
    setMostrarComentario(false);
  }

  function iniciarAcaoComentariosCapitulo(chave: string) {
    if (acoesComentariosCapituloRef.current.has(chave)) {
      return false;
    }

    acoesComentariosCapituloRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComentariosCapitulo(chave: string) {
    acoesComentariosCapituloRef.current.delete(chave);
  }


  function salvarObras(novasObras: ObraLocal[]) {
    const obrasNormalizadas = novasObras.map((obra, index) =>
      normalizarObra(obra, index)
    );

    salvarObrasPreservandoContas(obrasNormalizadas, usuarioIdLogado);
    setObras(obrasNormalizadas);
  }

  function atualizarCapitulo(dados: Partial<CapituloLocal>) {
    if (!obraAtual || !capituloAtual) {
      return;
    }

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraAtual.id) {
        return obraNormalizada;
      }

      const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) => {
        if (capitulo.id !== capituloAtual.id) {
          return capitulo;
        }

        return {
          ...capitulo,
          ...dados,
        };
      });

      return {
        ...obraNormalizada,
        capitulos: capitulosAtualizados,
        progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
      };
    });

    salvarObras(novasObras);
  }

  async function alternarCurtida() {
    if (!capituloAtual || curtidaCapituloSalvandoRef.current) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para curtir este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const estadoAnteriorCurtida = metricasCapitulo.curtiu;
    const totalAnteriorCurtidas = metricasCapitulo.totalCurtidas;
    const novoStatusCurtida = !estadoAnteriorCurtida;

    curtidaCapituloSalvandoRef.current = true;
    setCurtidaCapituloSalvando(true);
    setMensagemAcao("");

    atualizarCapitulo({
      curtiu: novoStatusCurtida,
    });
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      curtiu: novoStatusCurtida,
      totalCurtidas: Math.max(
        0,
        metricasAtuais.totalCurtidas + (novoStatusCurtida ? 1 : -1)
      ),
      carregado: true,
    }));

    try {
      const curtidaSalva = await salvarRegistroCapituloSupabase(
        "curtidas_capitulos",
        capituloAtual.id,
        novoStatusCurtida
      );

      if (!curtidaSalva) {
        atualizarCapitulo({
          curtiu: estadoAnteriorCurtida,
        });
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          curtiu: estadoAnteriorCurtida,
          totalCurtidas: totalAnteriorCurtidas,
          carregado: true,
        }));
        setMensagemAcao("Não foi possível atualizar a curtida agora.");
        return;
      }

      await recarregarMetricasCapituloAtual();
      setMensagemAcao("");

      if (novoStatusCurtida && obraAtual) {
        const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

        void registrarNotificacaoInteracaoCapituloSupabase({
          tipo: "curtida-capitulo",
          obra: obraAtual,
          capitulo: capituloAtual,
          titulo: "Nova curtida no capítulo",
          mensagem: `${perfilAtual.nome || "Um leitor"} curtiu ${capituloAtual.titulo}.`,
          link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
        });
      }
    } finally {
      curtidaCapituloSalvandoRef.current = false;
      setCurtidaCapituloSalvando(false);
    }
  }

  async function alternarSalvo() {
    if (!capituloAtual || salvoCapituloSalvandoRef.current) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para salvar este capítulo."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const estadoAnteriorSalvo = metricasCapitulo.salvo;
    const totalAnteriorSalvos = metricasCapitulo.totalSalvos;
    const novoStatusSalvo = !estadoAnteriorSalvo;

    salvoCapituloSalvandoRef.current = true;
    setSalvoCapituloSalvando(true);
    setMensagemAcao("");

    atualizarCapitulo({
      salvo: novoStatusSalvo,
    });
    setMetricasCapitulo((metricasAtuais) => ({
      ...metricasAtuais,
      salvo: novoStatusSalvo,
      totalSalvos: Math.max(
        0,
        metricasAtuais.totalSalvos + (novoStatusSalvo ? 1 : -1)
      ),
      carregado: true,
    }));

    try {
      const salvoSincronizado = await salvarRegistroCapituloSupabase(
        "salvos_capitulos",
        capituloAtual.id,
        novoStatusSalvo
      );

      if (!salvoSincronizado) {
        atualizarCapitulo({
          salvo: estadoAnteriorSalvo,
        });
        setMetricasCapitulo((metricasAtuais) => ({
          ...metricasAtuais,
          salvo: estadoAnteriorSalvo,
          totalSalvos: totalAnteriorSalvos,
          carregado: true,
        }));
        setMensagemAcao("Não foi possível atualizar o capítulo salvo agora.");
        return;
      }

      await recarregarMetricasCapituloAtual();
      setMensagemAcao("");

      if (novoStatusSalvo && obraAtual) {
        void registrarAtividadeDiarioLeitor({
          userId: userIdAtual,
          tipo: "salvou_obra",
          obra: obraAtual,
          capituloId: capituloAtual.id,
          visibilidade: "publico",
          texto: `Salvou ${capituloAtual.titulo}`,
          metadata: {
            capitulo_titulo: capituloAtual.titulo,
            capitulo_numero: numeroCapitulo,
            origem: "salvar_capitulo",
          },
        });
      }
    } finally {
      salvoCapituloSalvandoRef.current = false;
      setSalvoCapituloSalvando(false);
    }
  }

  async function alternarLido() {
    if (
      !obraAtual ||
      !capituloAtual ||
      lidoCapituloSalvandoRef.current
    ) {
      return;
    }

    if (!(await exigirLogin("Entre na sua conta para marcar este capítulo como lido."))) {
      return;
    }

    const userIdAtual = usuarioIdLogado || (await obterUsuarioLogadoIdAtual());

    if (!userIdAtual) {
      return;
    }

    const obrasAnteriores = obras;
    const novoStatusLido = !capituloAtual.lido;
    const novaDataLeitura = novoStatusLido ? new Date().toISOString() : "";
    let obraAtualizadaParaSupabase: ObraLocal | null = null;

    lidoCapituloSalvandoRef.current = true;
    setLidoCapituloSalvando(true);
    setMensagemAcao("");

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraAtual.id) {
        return obraNormalizada;
      }

      const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) =>
        capitulo.id === capituloAtual.id
          ? {
              ...capitulo,
              lido: novoStatusLido,
              lidoEm: novaDataLeitura,
            }
          : capitulo
      );

      const outroUltimoCapituloLido = [...capitulosAtualizados]
        .reverse()
        .find((capitulo) => capitulo.lido) || null;
      const ultimoCapituloLido = novoStatusLido
        ? capitulosAtualizados.find(
            (capitulo) => capitulo.id === capituloAtual.id
          ) || null
        : outroUltimoCapituloLido;

      obraAtualizadaParaSupabase = {
        ...obraNormalizada,
        capitulos: capitulosAtualizados,
        ultimoCapituloLidoId: ultimoCapituloLido?.id || "",
        ultimaLeituraEm: ultimoCapituloLido?.lidoEm || "",
        progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
      };

      return obraAtualizadaParaSupabase;
    });

    const obraAtualizada = obraAtualizadaParaSupabase as ObraLocal | null;

    if (!obraAtualizada) {
      lidoCapituloSalvandoRef.current = false;
      setLidoCapituloSalvando(false);
      return;
    }

    salvarObras(novasObras);

    try {
      const progressoSincronizado = await salvarProgressoLeituraSupabase(
        obraAtualizada,
        capituloAtual.id,
        novoStatusLido
      );

      if (!progressoSincronizado) {
        salvarObras(obrasAnteriores);
        setMensagemAcao("Não foi possível atualizar o status de leitura agora.");
        return;
      }

      setMensagemAcao("");

      if (novoStatusLido) {
        void marcarNotificacaoCapituloComoLidaSupabase(
          userIdAtual,
          obraAtual.id,
          capituloAtual.id
        );

        void registrarAtividadeDiarioLeitor({
          userId: userIdAtual,
          tipo: "leu_capitulo",
          obra: obraAtualizada,
          capituloId: capituloAtual.id,
          visibilidade: "publico",
          texto: `Leu ${capituloAtual.titulo}`,
          metadata: {
            capitulo_titulo: capituloAtual.titulo,
            capitulo_numero: numeroCapitulo,
            progresso_obra: obraAtualizada.progressoLeitura,
            origem: "botao_lido",
          },
        });
      }
    } finally {
      lidoCapituloSalvandoRef.current = false;
      setLidoCapituloSalvando(false);
    }
  }

  async function enviarComentarioCapitulo(
    postId: string,
    textoRecebido: string,
    comentarioPaiId = ""
  ) {
    const chaveAcao = `enviar-comentario-capitulo:${postId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return false;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para comentar este capítulo.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return false;
      }

      const textoLimpo = textoRecebido.trim();

      if (!textoLimpo) {
        setComentarioStatus("Escreva um comentário antes de enviar.");
        return false;
      }

      const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);
      setPerfilComentarioLeitor(perfilAtual);

      const comentarioPaiIdLimpo = comentarioPaiId.trim();
      const comentarioSalvo = await salvarComentarioCapituloSupabase(
        postId,
        textoLimpo,
        comentarioPaiIdLimpo
      );
      const agora = new Date().toISOString();
      const comentarioId = obterTextoRegistroLeitor(comentarioSalvo, "id");

      if (!comentarioId) {
        setComentarioStatus(
          comentarioPaiIdLimpo
            ? "Não foi possível enviar a resposta agora."
            : "Não foi possível enviar o comentário agora."
        );
        return false;
      }

      const criadoEm =
        obterTextoRegistroLeitor(comentarioSalvo, "atualizado_em") ||
        obterTextoRegistroLeitor(comentarioSalvo, "criado_em") ||
        agora;
      const novoComentario: ComentarioCapituloPublico = {
        id: comentarioId,
        userId: userIdAtual,
        nome: perfilAtual.nome || "Usuário",
        avatar: perfilAtual.avatar,
        texto: textoLimpo.slice(0, 420),
        criadoEm,
        comentarioPaiId:
          obterTextoRegistroLeitor(comentarioSalvo, "comentario_pai_id") ||
          comentarioPaiIdLimpo,
        meuComentario: true,
        curtidas: [],
      };

      atualizarCapitulo({
        comentario: textoLimpo,
      });
      setComentarioDigitado(textoLimpo);
      setComentariosCapitulo((comentariosAtuais) => [
        novoComentario,
        ...comentariosAtuais,
      ]);
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: metricasAtuais.totalComentarios + 1,
        carregado: true,
      }));
      setMostrarComentario(true);

      if (obraAtual && capituloAtual) {
        void registrarNotificacaoInteracaoCapituloSupabase({
          tipo: "comentario-capitulo",
          obra: obraAtual,
          capitulo: capituloAtual,
          comentarioId,
          titulo: "Novo comentário no capítulo",
          mensagem: `${perfilAtual.nome || "Um leitor"} comentou em ${capituloAtual.titulo}: ${textoLimpo.slice(0, 120)}`,
          link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
        });
      }

      return true;
    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
  }


  async function removerComentarioCapitulo(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario-capitulo:${comentarioId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para apagar seu comentário.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const comentarioAtual = comentariosCapitulo.find(
        (comentario) => comentario.id === comentarioId
      );

      if (!comentarioAtual || comentarioAtual.userId !== userIdAtual) {
        setComentarioStatus("Você só pode remover seus próprios comentários.");
        return;
      }

      const idsParaRemover = obterIdsComentarioCapituloComRespostas(
        comentariosCapitulo,
        comentarioId
      );
      const { error } = await supabase
        .from("comentarios_capitulos")
        .delete()
        .eq("id", comentarioId)
        .eq("user_id", userIdAtual);

      if (error) {
        setComentarioStatus("Não foi possível remover o comentário agora.");
        return;
      }

      if (!comentarioAtual.comentarioPaiId) {
        atualizarCapitulo({
          comentario: "",
        });
        setComentarioDigitado("");
      }

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.filter(
          (comentario) => !idsParaRemover.has(comentario.id)
        )
      );
      setMetricasCapitulo((metricasAtuais) => ({
        ...metricasAtuais,
        totalComentarios: Math.max(
          0,
          metricasAtuais.totalComentarios - idsParaRemover.size
        ),
        carregado: true,
      }));
      void postId;
    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
  }

  async function alternarCurtidaComentarioCapitulo(
    postId: string,
    comentarioId: string
  ) {
    const chaveAcao = `curtir-comentario-capitulo:${comentarioId}`;

    if (!iniciarAcaoComentariosCapitulo(chaveAcao)) {
      return;
    }

    setComentarioStatus("");

    try {
      const userIdAtual = await obterUsuarioLogadoIdAtual();

      if (!userIdAtual) {
        setMensagemAcao("Entre na sua conta para curtir comentários.");
        router.push(criarLoginHrefLeitor(obraId, capituloId));
        return;
      }

      const comentarioAtual = comentariosCapitulo.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(userIdAtual));

      setComentariosCapitulo((comentariosAtuais) =>
        comentariosAtuais.map((comentario) => {
          if (comentario.id !== comentarioId) {
            return comentario;
          }

          return {
            ...comentario,
            curtidas: jaCurtiu
              ? comentario.curtidas.filter((curtidaId) => curtidaId !== userIdAtual)
              : Array.from(new Set([...comentario.curtidas, userIdAtual])),
          };
        })
      );
      salvarCurtidaComentarioCapituloLocal(userIdAtual, comentarioId, !jaCurtiu);

      try {
        const { error: erroLimparCurtida } = await supabase
          .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", userIdAtual);

        if (erroLimparCurtida) {
          throw erroLimparCurtida;
        }

        if (!jaCurtiu) {
          const { error: erroInserirCurtida } = await supabase
            .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
            .insert({
              comentario_id: comentarioId,
              usuario_id: userIdAtual,
            });

          if (erroInserirCurtida) {
            throw erroInserirCurtida;
          }

          if (obraAtual && capituloAtual && comentarioAtual) {
            const perfilAtual = await carregarPerfilComentarioLeitor(userIdAtual);

            void registrarNotificacaoInteracaoCapituloSupabase({
              tipo: "curtida-comentario-capitulo",
              obra: obraAtual,
              capitulo: capituloAtual,
              comentarioId,
              titulo: "Nova curtida no comentário",
              mensagem: `${perfilAtual.nome || "Um leitor"} curtiu seu comentário em ${capituloAtual.titulo}.`,
              link: criarHrefLeituraCapituloLeitor(obraAtual, capituloAtual.id),
            });
          }
        }
      } catch (error) {
        setComentariosCapitulo((comentariosAtuais) =>
          comentariosAtuais.map((comentario) => {
            if (comentario.id !== comentarioId) {
              return comentario;
            }

            return {
              ...comentario,
              curtidas: jaCurtiu
                ? Array.from(new Set([...comentario.curtidas, userIdAtual]))
                : comentario.curtidas.filter(
                    (curtidaId) => curtidaId !== userIdAtual
                  ),
            };
          })
        );
        salvarCurtidaComentarioCapituloLocal(
          userIdAtual,
          comentarioId,
          jaCurtiu
        );
        setComentarioStatus(
          "Não foi possível atualizar a curtida do comentário agora."
        );
        console.warn("Não consegui sincronizar a curtida do comentário:", error);
      }

      void postId;
    } finally {
      finalizarAcaoComentariosCapitulo(chaveAcao);
    }
  }


  async function abrirDenunciaCapituloAtual() {
    const userIdAtual = await obterUsuarioLogadoIdAtual();

    if (!userIdAtual) {
      setMensagemAcao("Entre na sua conta para denunciar este capítulo.");
      router.push(criarLoginHrefLeitor(obraId, capituloId));
      return;
    }

    if (!capituloAtual) {
      return;
    }

    setMostrarAjustes(false);
    setDenunciaAlvo({
      alvoTipo: "capitulo",
      alvoId: capituloAtual.id,
      alvoTitulo: capituloAtual.titulo,
    });
  }

  async function denunciarComentarioCapitulo(comentarioId: string) {
    const userIdAtual = await obterUsuarioLogadoIdAtual();

    if (!userIdAtual) {
      setMensagemAcao("Entre na sua conta para denunciar comentários.");
      router.push(criarLoginHrefLeitor(obraId, capituloId));
      return;
    }

    const comentario = comentariosCapitulo.find(
      (item) => item.id === comentarioId
    );

    setComentarioStatus("");
    setDenunciaAlvo({
      alvoTipo: "comentario_capitulo",
      alvoId: comentarioId,
      alvoTitulo: comentario
        ? `Comentário de ${comentario.nome}`
        : "Comentário de capítulo",
    });
  }


  function trocarCapitulo(novoCapituloId: string) {
    if (!obraAtual) {
      return;
    }

    setCapituloId(novoCapituloId);

    window.history.pushState(
      null,
      "",
      criarHrefLeituraCapituloLeitor(obraAtual, novoCapituloId)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (carregando) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LerCapituloLanguageBridge />
        <LoadingSpinner label="Carregando capítulo" />
      </main>
    );
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle}>
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LerCapituloLanguageBridge />
        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Capítulo não encontrado
          </p>
        </section>
      </main>
    );
  }

  if (
    ehClassificacao18(obraAtual.classificacaoIndicativa) &&
    statusAcesso18 === "verificando"
  ) {
    return (
      <main data-historietas-ler-capitulo-root="true" style={focusPageStyle} aria-busy="true">
        <style>{`${historietasThemeCss}${leitorPageCss}`}</style>
        <LoadingSpinner label="Verificando acesso" />
      </main>
    );
  }

  if (
    ehClassificacao18(obraAtual.classificacaoIndicativa) &&
    statusAcesso18 === "bloqueado"
  ) {
    return (
      <AdultContentGate
        titulo={obraAtual.titulo}
        avisos={obraAtual.avisosConteudo}
        language={language}
        onConfirmar={() =>
          setControleAcesso18({ obraId: obraAtual.id, status: "permitido" })
        }
        onVoltar={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.replace("/explorar");
          }
        }}
      />
    );
  }

  const voltarHref = `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
  const statusLeituraTexto = capituloAtual.lido
    ? capituloAtual.lidoEm
      ? `Lido em ${formatarData(capituloAtual.lidoEm)}`
      : "Lido"
    : "Leitura em andamento";

  return (
    <main data-historietas-ler-capitulo-root="true" style={focusPageStyle}>
      {mostrarLinhaProgresso && (
        <div style={fixedReadingProgressOuterStyle}>
          <div
            style={{
              ...fixedReadingProgressInnerStyle,
              width: `${progressoRolagem}%`,
            }}
          />
        </div>
      )}

      <style>{`${historietasThemeCss}${leitorPageCss}`}</style>

      <LerCapituloLanguageBridge />
      <style>{focusBottomNavigationCss}</style>

      <LerCapituloReaderContent
        obraAtual={obraAtual}
        capituloAtual={capituloAtual}
        isDesktop={isDesktop}
        mostrarAjustes={mostrarAjustes}
        setMostrarAjustes={setMostrarAjustes}
        language={language}
        metricasCapitulo={metricasCapitulo}
        tamanhoFonte={tamanhoFonte}
        setTamanhoFonte={setTamanhoFonte}
        mostrarLinhaProgresso={mostrarLinhaProgresso}
        setMostrarLinhaProgresso={setMostrarLinhaProgresso}
        usuarioIdLogado={usuarioIdLogado}
        obterAutorIdSeguro={obterAutorIdSeguro}
        statusLeituraTexto={statusLeituraTexto}
        totalPalavras={totalPalavras}
        trocarCapitulo={trocarCapitulo}
        abrirDenunciaCapituloAtual={abrirDenunciaCapituloAtual}
        criarTextoLeituraDesktopStyle={criarTextoLeituraDesktopStyle}
        criarTextoLeituraStyle={criarTextoLeituraStyle}
        curtidaCapituloSalvando={curtidaCapituloSalvando}
        alternarCurtida={alternarCurtida}
        salvoCapituloSalvando={salvoCapituloSalvando}
        alternarSalvo={alternarSalvo}
        alternarComentarioVisivel={alternarComentarioVisivel}
        mostrarComentario={mostrarComentario}
        lidoCapituloSalvando={lidoCapituloSalvando}
        alternarLido={alternarLido}
        mensagemAcao={mensagemAcao}
        capituloAnterior={capituloAnterior}
        proximoCapitulo={proximoCapitulo}
        voltarHref={voltarHref}
        formatarContadorCapituloLeitor={formatarContadorCapituloLeitor}
        FONT_SCALE_VALUES={FONT_SCALE_VALUES}
      />

      <ComentariosCapituloSheet
        key={mostrarComentario ? postComentariosCapitulo?.id || "comentarios-fechados" : "comentarios-fechados"}
        post={mostrarComentario ? postComentariosCapitulo : null}
        podeComentar={Boolean(usuarioIdLogado)}
        usuarioId={usuarioIdLogado}
        usuarioNome={perfilComentarioLeitor.nome}
        usuarioAvatar={perfilComentarioLeitor.avatar}
        erroInteracao={comentarioStatus}
        carregando={comentariosCarregando}
        isDesktop={isDesktop}
        onFechar={fecharComentariosCapitulo}
        onEnviar={enviarComentarioCapitulo}
        onCurtirComentario={alternarCurtidaComentarioCapitulo}
        onRemoverComentario={removerComentarioCapitulo}
        onDenunciarComentario={denunciarComentarioCapitulo}
      />

      <DenunciaModal
        aberto={Boolean(denunciaAlvo)}
        alvoTipo={denunciaAlvo?.alvoTipo || "capitulo"}
        alvoId={denunciaAlvo?.alvoId || ""}
        alvoTitulo={denunciaAlvo?.alvoTitulo || ""}
        onFechar={() => setDenunciaAlvo(null)}
      />

    </main>
  );
}
