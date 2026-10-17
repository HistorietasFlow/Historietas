"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
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
import { criarSlugBase, formatarData, idObraSupabaseValido } from "../../lib/utils";
import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import { useLerCapituloDesktopMode } from "./hooks/use-ler-capitulo-desktop-mode";
import { focusBottomNavigationCss } from "./lib/ler-capitulo-focus-bottom-navigation-css";
import { leitorPageCss } from "./lib/ler-capitulo-page-css";
import {
  obterAutorIdSeguro,
  salvarCurtidaComentarioCapituloLocal,
  salvarObrasPreservandoContas,
} from "./lib/ler-capitulo-local-storage";
import { FONT_SCALE_VALUES } from "./lib/ler-capitulo-reading-preferences";
import {
  carregarPerfilComentarioLeitor,
  obterTextoRegistroLeitor,
  type PerfilComentarioLeitor,
} from "./lib/ler-capitulo-comments-read-loader";
import {
  calcularProgressoLeitura,
  normalizarObra,
  type CapituloLocal,
  type ObraLocal,
} from "./lib/ler-capitulo-work-normalization";
import { useLerCapituloInitialLoad } from "./hooks/use-ler-capitulo-initial-load";
import { useLerCapituloSessionPreferences } from "./hooks/use-ler-capitulo-session-preferences";
import { useLerCapituloInteractionData, type MetricasCapituloLeitor } from "./hooks/use-ler-capitulo-interaction-data";
import { useLerCapituloViewRegistration, useLerCapituloEntryActivity } from "./hooks/use-ler-capitulo-entry-lifecycle";
import { incrementarVisualizacaoCapituloSupabase, salvarProgressoLeituraSupabase, salvarRegistroCapituloSupabase } from "./lib/ler-capitulo-interaction-persistence";
import { metricasCapituloVazias, criarMetricasCapituloLocais, carregarMetricasCapituloSupabase, formatarContadorCapituloLeitor } from "./lib/ler-capitulo-metrics";
import { criarAcoesComentariosCapitulo } from "./lib/ler-capitulo-comment-actions";
import { criarAcoesInteracoesCapitulo } from "./lib/ler-capitulo-interaction-actions";
import { criarAcaoProgressoLeituraCapitulo } from "./lib/ler-capitulo-reading-progress-action";
import {
  focusPageStyle,
  fixedReadingProgressOuterStyle,
  fixedReadingProgressInnerStyle,
  containerStyle,
  chapterTextStyle,
  desktopContainerStyle,
  desktopChapterTextStyle,
} from "./lib/ler-capitulo-layout-styles";

type AlvoDenunciaLeitor = {
  alvoTipo: "capitulo" | "comentario_capitulo";
  alvoId: string;
  alvoTitulo: string;
};


type TipoNotificacaoInteracaoCapitulo =
  | "curtida-capitulo"
  | "comentario-capitulo"
  | "curtida-comentario-capitulo";

const FONT_SCALE_LEGACY_VALUES: Record<TamanhoFonte, 1 | 3 | 5 | 7 | 10> = {
  1: 1,
  2: 3,
  3: 5,
  4: 7,
  5: 10,
};

const TABELA_COMENTARIOS_CAPITULOS_CURTIDAS = "comentarios_capitulos_curtidas";

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

  useLerCapituloSessionPreferences({
    usuarioIdLogado,
    tamanhoFonte,
    mostrarLinhaProgresso,
    preferenciasCarregadas,
    setUsuarioIdLogado,
    setPerfilComentarioLeitor,
    setTamanhoFonte,
    setMostrarLinhaProgresso,
    setPreferenciasCarregadas,
  });

  useLerCapituloInitialLoad({
    setObraId,
    setCapituloId,
    setObras,
    setCarregando,
  });

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capituloAtual = useMemo(() => {
    return (
      obraAtual?.capitulos.find((capitulo) => capitulo.id === capituloId) ||
      null
    );
  }, [obraAtual, capituloId]);

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


  useLerCapituloInteractionData({
    capituloAtual,
    comentariosCapitulo,
    usuarioIdLogado,
    comentariosCapituloCarregadoIdRef,
    curtidaCapituloSalvandoRef,
    salvoCapituloSalvandoRef,
    setComentariosCapitulo,
    setComentariosCarregando,
    setMetricasCapitulo,
    metricasCapituloVazias,
    criarMetricasCapituloLocais,
    carregarMetricasCapituloSupabase,
    atualizarCapitulo,
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
  });

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

  useLerCapituloViewRegistration({
    capituloAtual,
    statusAcesso18,
    visualizacaoCapituloRegistradaRef,
    setMetricasCapitulo,
    incrementarVisualizacaoCapituloSupabase,
  });

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

  useLerCapituloEntryActivity({
    usuarioIdLogado,
    obraAtual,
    capituloAtual,
    numeroCapitulo,
    statusAcesso18,
    atividadeDiarioRegistradaRef,
    marcarNotificacaoCapituloComoLidaSupabase,
    registrarAtividadeDiarioLeitor,
  });

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

  // A fábrica apenas cria callbacks; as refs são lidas quando as ações são executadas.
  // eslint-disable-next-line react-hooks/refs
  const { alternarCurtida, alternarSalvo } = criarAcoesInteracoesCapitulo({
    obraAtual,
    capituloAtual,
    usuarioIdLogado,
    numeroCapitulo,
    metricasCapitulo,
    curtidaCapituloSalvandoRef,
    salvoCapituloSalvandoRef,
    exigirLogin,
    obterUsuarioLogadoIdAtual,
    atualizarCapitulo,
    salvarRegistroCapituloSupabase,
    recarregarMetricasCapituloAtual,
    carregarPerfilComentarioLeitor,
    registrarNotificacaoInteracaoCapituloSupabase,
    criarHrefLeituraCapituloLeitor,
    registrarAtividadeDiarioLeitor,
    setCurtidaCapituloSalvando,
    setSalvoCapituloSalvando,
    setMensagemAcao,
    setMetricasCapitulo,
  });

  // A fábrica apenas cria o callback; a ref é lida quando a ação é executada.
  // eslint-disable-next-line react-hooks/refs
  const { alternarLido } = criarAcaoProgressoLeituraCapitulo({
    obraAtual,
    capituloAtual,
    obras,
    usuarioIdLogado,
    numeroCapitulo,
    lidoCapituloSalvandoRef,
    exigirLogin,
    obterUsuarioLogadoIdAtual,
    normalizarObra,
    calcularProgressoLeitura,
    salvarObras,
    salvarProgressoLeituraSupabase,
    marcarNotificacaoCapituloComoLidaSupabase,
    registrarAtividadeDiarioLeitor,
    setLidoCapituloSalvando,
    setMensagemAcao,
  });

  const {
    enviarComentarioCapitulo,
    removerComentarioCapitulo,
    alternarCurtidaComentarioCapitulo,
    // A fábrica apenas cria callbacks; as refs são lidas quando as ações são executadas.
    // eslint-disable-next-line react-hooks/refs
  } = criarAcoesComentariosCapitulo({
    supabase,
    obraId,
    capituloId,
    obraAtual,
    capituloAtual,
    comentariosCapitulo,
    router,
    iniciarAcaoComentariosCapitulo,
    finalizarAcaoComentariosCapitulo,
    obterUsuarioLogadoIdAtual,
    criarLoginHrefLeitor,
    criarHrefLeituraCapituloLeitor,
    carregarPerfilComentarioLeitor,
    salvarComentarioCapituloSupabase,
    obterTextoRegistroLeitor,
    registrarNotificacaoInteracaoCapituloSupabase,
    salvarCurtidaComentarioCapituloLocal,
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
    atualizarCapitulo,
    setComentarioStatus,
    setMensagemAcao,
    setPerfilComentarioLeitor,
    setComentarioDigitado,
    setComentariosCapitulo,
    setMetricasCapitulo,
    setMostrarComentario,
  });


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
