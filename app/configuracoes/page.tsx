"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { LoadingSpinner } from "./components/configuracoes-loading-spinner";
import { ConfiguracoesActionToast } from "./components/configuracoes-action-toast";
import { ConfiguracoesBlockedUsersPanel } from "./components/configuracoes-blocked-users-panel";
import { ConfiguracoesPageHeader } from "./components/configuracoes-page-header";
import { ConfiguracoesProfileCard } from "./components/configuracoes-profile-card";
import { ConfiguracoesSearch } from "./components/configuracoes-search";
import { SvgIcon } from "./components/configuracoes-svg-icon";
import { Toggle } from "./components/configuracoes-toggle";
import {
  SettingsInput,
  SettingsRow,
  SettingsSection,
  SectionTitle,
  ValorLinha,
} from "./components/configuracoes-settings-primitives";
import { useConfiguracoesActionMessage } from "./hooks/use-configuracoes-action-message";
import { configuracoesPageCss } from "./lib/configuracoes-page-css";
import {
  ALIASES_BUSCA_CONFIGURACOES,
  normalizarTextoBuscaConfiguracoes,
  textoIdioma,
} from "./lib/configuracoes-search-utils";
import {
  safeTextStyle,
  sectionStyle,
} from "./lib/configuracoes-settings-primitives-styles";
import { containerStyle } from "./lib/configuracoes-shell-styles";
import {
  idUsuarioSupabaseValido,
  metadataTemAdminConfiguracoes,
  normalizarUsernameConfiguracoes,
  pegarTexto,
} from "./lib/configuracoes-account-utils";
import type { AppMetadataAdminConfiguracoes } from "./lib/configuracoes-account-utils";
import { copiarTextoConfiguracoes } from "./lib/configuracoes-copy-utils";
import {
  carregarPreferenciasPrivacidade,
  preferenciasPrivacidadePadrao,
  salvarPreferenciasPrivacidade,
} from "./lib/configuracoes-privacy-preferences";
import type {
  PreferenciasPrivacidadeHistorietas,
  QuemPodeAvaliarDiario,
  QuemPodeComentarDiario,
  VisibilidadeAbaPerfil,
} from "./lib/configuracoes-privacy-preferences";
import { criarLoginHrefConfiguracoes } from "./lib/configuracoes-route-utils";
import {
  CHAVES_RESUMO,
  CONFIG_STORAGE_KEY,
  CONFIGURACOES_ATUALIZADAS_EVENT,
} from "./lib/configuracoes-account-storage-constants";
import {
  criarResumoLocal,
  lerStorageUsuarioConfiguracoes,
  salvarJsonStorageUsuarioConfiguracoes,
} from "./lib/configuracoes-local-summary-utils";
import { preferenciasPadrao, resumoPadrao } from "./lib/configuracoes-account-models";
import type {
  PerfilConfiguracoesSupabase,
  PreferenciasConta,
  ResumoLocal,
  ResultadoContagemResumoSupabase,
  TabelaResumoSupabase,
  UsuarioBloqueadoConfiguracoes,
  UsuarioBloqueadoConfiguracoesRpcRow,
  UsuarioConfiguracoes,
} from "./lib/configuracoes-account-models";
import {
  traduzirErroSenhaConfiguracoes,
  traduzirErroUsernameConfiguracoes,
} from "./lib/configuracoes-error-messages";
import { normalizarPerfilConfiguracoesSupabase } from "./lib/configuracoes-profile-utils";

async function contarRegistrosResumoSupabase({
  tabela,
  userId,
}: {
  tabela: TabelaResumoSupabase;
  userId: string;
}): Promise<ResultadoContagemResumoSupabase> {
  try {
    const consultas = {
      obras: () =>
        supabase
          .from("obras")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      favoritos: () =>
        supabase
          .from("favoritos")
          .select("obra_id", { count: "exact", head: true })
          .eq("user_id", userId),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select("obra_id", { count: "exact", head: true })
          .eq("user_id", userId),
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select("obra_id", { count: "exact", head: true })
          .eq("user_id", userId),
      seguindo_usuarios: () =>
        supabase
          .from("seguindo_usuarios")
          .select("id", { count: "exact", head: true })
          .eq("seguidor_id", userId),
    } satisfies Record<TabelaResumoSupabase, () => PromiseLike<unknown>>;

    const { count, error } = await consultas[tabela]();

    if (error) {
      console.warn(
        `Não consegui contar ${tabela} no resumo da conta:`,
        error.message,
      );
      return { ok: false, total: 0 };
    }

    return {
      ok: true,
      total:
        typeof count === "number" && Number.isFinite(count)
          ? Math.max(0, Math.trunc(count))
          : 0,
    };
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no resumo da conta:`, error);
    return { ok: false, total: 0 };
  }
}

async function carregarResumoContaSupabase(
  userId: string,
): Promise<ResumoLocal> {
  const userIdLimpo = userId.trim();
  const fallbackLocal = criarResumoLocal(userIdLimpo);

  if (!idUsuarioSupabaseValido(userIdLimpo)) {
    return fallbackLocal;
  }

  const [
    obras,
    favoritas,
    concluidas,
    seguindoObras,
    seguindoAutores,
  ] = await Promise.all([
    contarRegistrosResumoSupabase({
      tabela: "obras",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "favoritos",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "concluidas",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "seguindo_obras",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "seguindo_usuarios",
      userId: userIdLimpo,
    }),
  ]);

  return {
    ...fallbackLocal,
    obras: obras.ok ? obras.total : fallbackLocal.obras,
    favoritas: favoritas.ok ? favoritas.total : fallbackLocal.favoritas,
    concluidas: concluidas.ok ? concluidas.total : fallbackLocal.concluidas,
    seguindoObras: seguindoObras.ok
      ? seguindoObras.total
      : fallbackLocal.seguindoObras,
    seguindoAutores: seguindoAutores.ok
      ? seguindoAutores.total
      : fallbackLocal.seguindoAutores,
  };
}

function carregarPreferencias(userId = ""): PreferenciasConta {
  try {
    const texto = lerStorageUsuarioConfiguracoes(CONFIG_STORAGE_KEY, userId);
    const json: unknown = texto ? JSON.parse(texto) : null;

    if (!json || typeof json !== "object") {
      return {
        ...preferenciasPadrao,
      };
    }

    const preferencias = json as Partial<PreferenciasConta>;

    return {
      nomeExibicao:
        typeof preferencias.nomeExibicao === "string"
          ? preferencias.nomeExibicao
          : "",
      username:
        typeof preferencias.username === "string"
          ? normalizarUsernameConfiguracoes(preferencias.username)
          : "",
      emailContato:
        typeof preferencias.emailContato === "string"
          ? preferencias.emailContato
          : "",
      receberAvisos:
        typeof preferencias.receberAvisos === "boolean"
          ? preferencias.receberAvisos
          : true,
    };
  } catch {
    return {
      ...preferenciasPadrao,
    };
  }
}

function salvarPreferencias(preferencias: PreferenciasConta, userId = "") {
  const userIdLimpo = userId.trim();

  salvarJsonStorageUsuarioConfiguracoes(
    CONFIG_STORAGE_KEY,
    userIdLimpo,
    preferencias,
  );

  if (typeof window !== "undefined" && userIdLimpo) {
    window.dispatchEvent(
      new CustomEvent(CONFIGURACOES_ATUALIZADAS_EVENT, {
        detail: { userId: userIdLimpo },
      }),
    );
  }
}

function criarBackupLocal(userId = "") {
  const userIdLimpo = userId.trim();
  const backup: Record<string, unknown> = {};

  if (!userIdLimpo) {
    backup.exportadoEm = new Date().toISOString();
    backup.projeto = "Historietas";
    backup.userId = "";

    return JSON.stringify(backup, null, 2);
  }

  CHAVES_RESUMO.forEach((chave) => {
    try {
      const valor = lerStorageUsuarioConfiguracoes(chave, userIdLimpo);
      backup[chave] = valor ? JSON.parse(valor) : null;
    } catch {
      backup[chave] = null;
    }
  });

  backup[CONFIG_STORAGE_KEY] = carregarPreferencias(userIdLimpo);
  backup.exportadoEm = new Date().toISOString();
  backup.projeto = "Historietas";
  backup.userId = userIdLimpo;

  return JSON.stringify(backup, null, 2);
}

async function listarUsuariosBloqueadosConfiguracoes(): Promise<
  UsuarioBloqueadoConfiguracoes[]
> {
  const { data, error } = await supabase.rpc(
    "listar_usuarios_bloqueados",
    { p_limite: 100 },
  );

  if (error) {
    throw error;
  }

  return (data || []).map(
    (item: UsuarioBloqueadoConfiguracoesRpcRow) => ({
      userId: pegarTexto(item.user_id),
      nome: pegarTexto(item.nome, "Usuário"),
      username: normalizarUsernameConfiguracoes(
        pegarTexto(item.username),
      ),
      avatar: pegarTexto(item.avatar_url),
      bloqueadoEm: pegarTexto(item.bloqueado_em),
    }),
  ).filter((item: UsuarioBloqueadoConfiguracoes) => idUsuarioSupabaseValido(item.userId));
}

async function carregarPerfilConfiguracoesSupabase(
  userId: string,
): Promise<PerfilConfiguracoesSupabase | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return null;
  }

  try {
    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (
      !erroUserId &&
      perfilPorUserId &&
      typeof perfilPorUserId === "object" &&
      !Array.isArray(perfilPorUserId)
    ) {
      return normalizarPerfilConfiguracoesSupabase(
        perfilPorUserId as Record<string, unknown>,
      );
    }

    const { data: perfilPorId, error: erroId } = await supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (
      erroId ||
      !perfilPorId ||
      typeof perfilPorId !== "object" ||
      Array.isArray(perfilPorId)
    ) {
      return null;
    }

    return normalizarPerfilConfiguracoesSupabase(
      perfilPorId as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}

async function salvarPerfilConfiguracoesSupabase({
  userId,
  nome,
  username,
}: {
  userId: string;
  nome: string;
  username: string;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "Usuário inválido." };
  }

  const usernameLimpo = normalizarUsernameConfiguracoes(username);
  const nomeLimpo = nome.trim() || "Usuário";
  const atualizadoEm = new Date().toISOString();

  try {
    let perfilId = "";
    let erroBusca = "";

    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (erroUserId) {
      erroBusca = erroUserId.message;
    } else if (perfilPorUserId && typeof perfilPorUserId === "object") {
      perfilId = pegarTexto(
        (perfilPorUserId as Record<string, unknown>).id,
      );
    }

    if (!perfilId) {
      const { data: perfilPorId, error: erroId } = await supabase
        .from("profiles")
        .select("id,user_id")
        .eq("id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      if (erroId) {
        erroBusca = erroBusca || erroId.message;
      } else if (perfilPorId && typeof perfilPorId === "object") {
        perfilId = pegarTexto((perfilPorId as Record<string, unknown>).id);
      }
    }

    const payloadAtualizacao = {
      nome: nomeLimpo,
      username: usernameLimpo || null,
      atualizado_em: atualizadoEm,
    };

    if (perfilId) {
      const { data: perfilAtualizado, error } = await supabase
        .from("profiles")
        .update(payloadAtualizacao)
        .eq("id", perfilId)
        .select("id")
        .maybeSingle();

      if (error) {
        return { ok: false, erro: error.message };
      }

      if (!perfilAtualizado) {
        return {
          ok: false,
          erro: "A atualização do perfil não foi confirmada.",
        };
      }

      return { ok: true, erro: "" };
    }

    if (erroBusca) {
      return { ok: false, erro: erroBusca };
    }

    const { data: perfilCriado, error } = await supabase
      .from("profiles")
      .insert({
        id: userIdLimpo,
        user_id: userIdLimpo,
        tipo: "leitor",
        avatar_url: "",
        bio: "",
        sobre_bio: "",
        ...payloadAtualizacao,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, erro: error.message };
    }

    if (!perfilCriado) {
      return {
        ok: false,
        erro: "A criação do perfil não foi confirmada.",
      };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioConfiguracoes | null>(null);
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [privacidade, setPrivacidade] =
    useState<PreferenciasPrivacidadeHistorietas>(
      preferenciasPrivacidadePadrao,
    );
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [erroUsername, setErroUsername] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [adminLiberado, setAdminLiberado] = useState(false);
  const [mostrarUsuariosBloqueados, setMostrarUsuariosBloqueados] =
    useState(false);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState<
    UsuarioBloqueadoConfiguracoes[]
  >([]);
  const [carregandoUsuariosBloqueados, setCarregandoUsuariosBloqueados] =
    useState(false);
  const [desbloqueandoUsuarioId, setDesbloqueandoUsuarioId] =
    useState("");
  const [erroUsuariosBloqueados, setErroUsuariosBloqueados] =
    useState("");
  const [mostrarSeguranca, setMostrarSeguranca] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [senhaAlterada, setSenhaAlterada] = useState(false);
  const [mostrarExclusaoConta, setMostrarExclusaoConta] = useState(false);
  const [senhaExclusaoConta, setSenhaExclusaoConta] = useState("");
  const [confirmacaoExclusaoConta, setConfirmacaoExclusaoConta] = useState("");
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusaoConta, setErroExclusaoConta] = useState("");
  const {
    mensagemAcao,
    setMensagemAcao,
    mostrarMensagemAcao,
  } = useConfiguracoesActionMessage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();
  const { language } = useHistorietasLanguage();

  const usuarioIdLogado = usuario?.id || "";

  function t(portugues: string, ingles: string, espanhol: string) {
    return textoIdioma(language, portugues, ingles, espanhol);
  }

  useEffect(() => {
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          router.replace(criarLoginHrefConfiguracoes());
          return;
        }

        const perfilRemoto = await carregarPerfilConfiguracoesSupabase(data.user.id);
        const nome =
          pegarTexto(perfilRemoto?.nome) ||
          pegarTexto(data.user.user_metadata?.nome) ||
          pegarTexto(data.user.user_metadata?.name) ||
          pegarTexto(data.user.email) ||
          "Usuário";
        const username =
          perfilRemoto?.username ||
          normalizarUsernameConfiguracoes(
            pegarTexto(data.user.user_metadata?.username),
          );

        const usuarioCarregado: UsuarioConfiguracoes = {
          id: data.user.id,
          nome,
          username,
          email: data.user.email || "",
        };
        const preferenciasCarregadas = carregarPreferencias(usuarioCarregado.id);
        const [
          privacidadeCarregada,
          resumoCarregado,
          usuariosBloqueadosCarregados,
        ] = await Promise.all([
          carregarPreferenciasPrivacidade(usuarioCarregado.id, {
            usarFallbackLocal: true,
          }),
          carregarResumoContaSupabase(usuarioCarregado.id),
          listarUsuariosBloqueadosConfiguracoes().catch(() => []),
        ]);

        setUsuario(usuarioCarregado);
        setPrivacidade(privacidadeCarregada);
        setUsuariosBloqueados(usuariosBloqueadosCarregados);
        setPreferencias({
          ...preferenciasCarregadas,
          nomeExibicao:
            perfilRemoto?.nome ||
            preferenciasCarregadas.nomeExibicao ||
            usuarioCarregado.nome,
          username:
            perfilRemoto?.username ||
            preferenciasCarregadas.username ||
            usuarioCarregado.username,
          emailContato:
            preferenciasCarregadas.emailContato || usuarioCarregado.email,
        });
        setResumo(resumoCarregado);
        setVerificandoAcesso(false);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefConfiguracoes());
        }
      }
    }

    verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router]);


  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    let cancelado = false;

    async function verificarAdmin() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        const user = data.user || null;

        if (!user || userError) {
          if (!cancelado) {
            setAdminLiberado(false);
          }

          return;
        }

        const adminPeloToken = metadataTemAdminConfiguracoes(
          user.app_metadata as AppMetadataAdminConfiguracoes | null | undefined,
        );
        const { data: adminLiberadoResposta, error } = await supabase.rpc(
          "usuario_e_admin",
        );

        if (!cancelado) {
          setAdminLiberado(
            error ? adminPeloToken : adminLiberadoResposta === true,
          );
        }
      } catch {
        if (!cancelado) {
          setAdminLiberado(false);
        }
      }
    }

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAdminLiberado(false);
        return;
      }

      void verificarAdmin();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, [verificandoAcesso]);

  useEffect(() => {
    if (!mostrarSeguranca || typeof document === "undefined") {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !salvandoSenha) {
        setMostrarSeguranca(false);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarNovaSenha("");
        setErroSenha("");
        setSenhaAlterada(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [mostrarSeguranca, salvandoSenha]);

  const buscaNormalizada = normalizarTextoBuscaConfiguracoes(busca);

  function deveMostrar(...termos: string[]) {
    if (!buscaNormalizada) {
      return true;
    }

    const termosExpandidos = termos.flatMap((termo) => {
      const termoNormalizado = normalizarTextoBuscaConfiguracoes(termo);
      const aliases = ALIASES_BUSCA_CONFIGURACOES[termoNormalizado] || [];

      return [termoNormalizado, ...aliases];
    });

    return termosExpandidos
      .map(normalizarTextoBuscaConfiguracoes)
      .join(" ")
      .includes(buscaNormalizada);
  }

  const totalBiblioteca = useMemo(
    () => resumo.favoritas + resumo.concluidas + resumo.seguindoObras,
    [resumo.concluidas, resumo.favoritas, resumo.seguindoObras],
  );

  function atualizarPreferencia<K extends keyof PreferenciasConta>(
    campo: K,
    valor: PreferenciasConta[K],
  ) {
    setPreferencias((preferenciasAtuais) => ({
      ...preferenciasAtuais,
      [campo]: valor,
    }));
  }

  function alternarReceberAvisos() {
    const preferenciasAtualizadas: PreferenciasConta = {
      ...preferencias,
      receberAvisos: !preferencias.receberAvisos,
    };

    setPreferencias(preferenciasAtualizadas);

    if (usuarioIdLogado) {
      salvarPreferencias(preferenciasAtualizadas, usuarioIdLogado);
    }
  }

  function aplicarPrivacidadeAtualizada(
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) {
    setPrivacidade(privacidadeAtualizada);
    setMensagemAcao(null);

    const userIdSeguro = usuarioIdLogado.trim();

    if (!userIdSeguro) {
      mostrarMensagemAcao(
        "aviso",
        t(
          "A preferência ficou salva apenas neste aparelho porque sua conta não pôde ser confirmada.",
          "The preference was saved only on this device because your account could not be confirmed.",
          "La preferencia se guardó solo en este dispositivo porque no se pudo confirmar tu cuenta.",
        ),
      );
      return;
    }

    void salvarPreferenciasPrivacidade(
      privacidadeAtualizada,
      userIdSeguro,
    )
      .then((resultado) => {
        if (resultado.ok) {
          return;
        }

        console.warn(
          "A privacidade ficou salva neste aparelho, mas não sincronizou:",
          resultado.erro,
        );

        mostrarMensagemAcao(
          "aviso",
          t(
            "A preferência foi salva neste aparelho, mas não sincronizou com sua conta. Verifique sua conexão e tente novamente.",
            "The preference was saved on this device, but it did not sync with your account. Check your connection and try again.",
            "La preferencia se guardó en este dispositivo, pero no se sincronizó con tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
          ),
        );
      })
      .catch((error) => {
        console.warn(
          "Não foi possível sincronizar a preferência de privacidade:",
          error,
        );

        mostrarMensagemAcao(
          "aviso",
          t(
            "A preferência foi salva neste aparelho, mas não sincronizou com sua conta. Verifique sua conexão e tente novamente.",
            "The preference was saved on this device, but it did not sync with your account. Check your connection and try again.",
            "La preferencia se guardó en este dispositivo, pero no se sincronizó con tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
          ),
        );
      });
  }

  function atualizarPrivacidade<
    K extends keyof PreferenciasPrivacidadeHistorietas,
  >(campo: K, valor: PreferenciasPrivacidadeHistorietas[K]) {
    aplicarPrivacidadeAtualizada({
      ...privacidade,
      [campo]: valor,
    });
  }

  function alternarPerfilPrivado() {
    const perfilPrivado = !privacidade.perfilPrivado;

    aplicarPrivacidadeAtualizada({
      ...privacidade,
      perfilPrivado,
      aprovarNovosSeguidores: perfilPrivado
        ? true
        : privacidade.aprovarNovosSeguidores,
    });
  }

  function alternarAprovacaoNovosSeguidores() {
    const aprovarNovosSeguidores = !privacidade.aprovarNovosSeguidores;

    aplicarPrivacidadeAtualizada({
      ...privacidade,
      aprovarNovosSeguidores,
      perfilPrivado: aprovarNovosSeguidores
        ? privacidade.perfilPrivado
        : false,
    });
  }


  async function salvar() {
    if (salvando) {
      return;
    }

    setMensagemAcao(null);

    const userIdSeguro = usuarioIdLogado.trim();
    const usernameLimpo = normalizarUsernameConfiguracoes(preferencias.username);

    if (!idUsuarioSupabaseValido(userIdSeguro)) {
      router.replace(criarLoginHrefConfiguracoes());
      return;
    }

    if (preferencias.username.trim() && usernameLimpo.length < 3) {
      const mensagem = t(
        "Use pelo menos 3 caracteres no @username.",
        "Use at least 3 characters in the @username.",
        "Usa al menos 3 caracteres en el @username.",
      );

      setErroUsername(mensagem);
      mostrarMensagemAcao("erro", mensagem);
      return;
    }

    const preferenciasNormalizadas: PreferenciasConta = {
      ...preferencias,
      nomeExibicao: preferencias.nomeExibicao.trim(),
      username: usernameLimpo,
      emailContato: preferencias.emailContato.trim(),
    };

    setSalvando(true);
    setErroUsername("");

    try {
      const { data: dadosUsuarioAtual, error: erroUsuarioAtual } =
        await supabase.auth.getUser();
      const usuarioAtualId = dadosUsuarioAtual.user?.id || "";

      if (
        erroUsuarioAtual ||
        !idUsuarioSupabaseValido(usuarioAtualId) ||
        usuarioAtualId !== userIdSeguro
      ) {
        router.replace(criarLoginHrefConfiguracoes());
        return;
      }

      const falhasSincronizacao: string[] = [];

      const resultadoPerfil = await salvarPerfilConfiguracoesSupabase({
        userId: userIdSeguro,
        nome:
          preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
        username: usernameLimpo,
      });

      if (!resultadoPerfil.ok) {
        const mensagem = traduzirErroUsernameConfiguracoes(
          resultadoPerfil.erro,
          language,
        );

        setErroUsername(mensagem);
        mostrarMensagemAcao("erro", mensagem);
        return;
      }

      const { error: erroMetadata } = await supabase.auth.updateUser({
        data: {
          nome:
            preferenciasNormalizadas.nomeExibicao ||
            usuario?.nome ||
            "Usuário",
          username: usernameLimpo,
        },
      });

      if (erroMetadata) {
        falhasSincronizacao.push("metadados");
        console.warn(
          "O perfil foi salvo, mas os metadados da autenticação não sincronizaram:",
          erroMetadata.message,
        );
      }

      salvarPreferencias(preferenciasNormalizadas, userIdSeguro);
      const resultadoPrivacidade = await salvarPreferenciasPrivacidade(
        privacidade,
        userIdSeguro,
      );

      if (!resultadoPrivacidade.ok) {
        falhasSincronizacao.push("privacidade");
        console.warn(
          "As preferências de privacidade ficaram salvas neste aparelho, mas não sincronizaram:",
          resultadoPrivacidade.erro,
        );
      }

      setPreferencias(preferenciasNormalizadas);
      setUsuario((usuarioAtual) =>
        usuarioAtual
          ? {
              ...usuarioAtual,
              nome:
                preferenciasNormalizadas.nomeExibicao || usuarioAtual.nome,
              username: usernameLimpo,
              email:
                preferenciasNormalizadas.emailContato || usuarioAtual.email,
            }
          : usuarioAtual,
      );
      setResumo(await carregarResumoContaSupabase(userIdSeguro));

      if (falhasSincronizacao.length > 0) {
        mostrarMensagemAcao(
          "aviso",
          t(
            "As alterações foram salvas neste aparelho, mas parte delas não sincronizou com sua conta.",
            "The changes were saved on this device, but some of them did not sync with your account.",
            "Los cambios se guardaron en este dispositivo, pero algunos no se sincronizaron con tu cuenta.",
          ),
        );
      } else {
        mostrarMensagemAcao(
          "sucesso",
          t(
            "Alterações salvas com sucesso.",
            "Changes saved successfully.",
            "Cambios guardados correctamente.",
          ),
        );
      }
    } catch (error) {
      console.warn("Não consegui salvar as configurações da conta:", error);

      const mensagem = t(
        "Não consegui salvar suas alterações agora.",
        "I could not save your changes right now.",
        "No pude guardar tus cambios ahora.",
      );

      setErroUsername(mensagem);
      mostrarMensagemAcao("erro", mensagem);
    } finally {
      setSalvando(false);
    }
  }

  function abrirExclusaoConta() {
    setSenhaExclusaoConta("");
    setConfirmacaoExclusaoConta("");
    setErroExclusaoConta("");
    setMostrarExclusaoConta(true);
  }

  function fecharExclusaoConta() {
    if (excluindoConta) {
      return;
    }

    setMostrarExclusaoConta(false);
    setSenhaExclusaoConta("");
    setConfirmacaoExclusaoConta("");
    setErroExclusaoConta("");
  }

  function traduzirErroExclusaoConta(codigo: string, mensagem: string) {
    const mensagens: Record<string, [string, string, string]> = {
      senha_obrigatoria: [
        "Digite sua senha atual.",
        "Enter your current password.",
        "Escribe tu contraseña actual.",
      ],
      confirmacao_invalida: [
        "Digite EXCLUIR exatamente como aparece para confirmar.",
        "Type DELETE exactly as shown to confirm.",
        "Escribe ELIMINAR exactamente como aparece para confirmar.",
      ],
      senha_incorreta: [
        "A senha atual está incorreta.",
        "The current password is incorrect.",
        "La contraseña actual es incorrecta.",
      ],
      muitas_tentativas: [
        "Muitas tentativas de confirmação. Aguarde antes de tentar novamente.",
        "Too many confirmation attempts. Wait before trying again.",
        "Demasiados intentos de confirmación. Espera antes de volver a intentarlo.",
      ],
      protecao_indisponivel: [
        "Não foi possível validar a segurança da operação agora. Tente novamente.",
        "The operation's security could not be validated right now. Try again.",
        "No se pudo validar la seguridad de la operación ahora. Inténtalo de nuevo.",
      ],
      conta_nao_autenticada: [
        "Sua sessão expirou. Entre novamente e tente de novo.",
        "Your session has expired. Sign in again and try once more.",
        "Tu sesión expiró. Inicia sesión de nuevo e inténtalo otra vez.",
      ],
      configuracao_servidor: [
        "A exclusão ainda não foi configurada no servidor. Verifique a chave SUPABASE_SERVICE_ROLE_KEY na Vercel.",
        "Account deletion has not been configured on the server yet. Check SUPABASE_SERVICE_ROLE_KEY in Vercel.",
        "La eliminación aún no está configurada en el servidor. Revisa SUPABASE_SERVICE_ROLE_KEY en Vercel.",
      ],
      exclusao_falhou: [
        "Não foi possível excluir sua conta agora. Tente novamente ou use a página pública de exclusão.",
        "Your account could not be deleted right now. Try again or use the public deletion page.",
        "No se pudo eliminar tu cuenta ahora. Inténtalo de nuevo o usa la página pública de eliminación.",
      ],
    };
    const traducao = mensagens[codigo];

    return traducao ? t(...traducao) : mensagem;
  }

  function limparDadosLocaisContaExcluida(userId: string) {
    if (typeof window === "undefined") {
      return;
    }

    const sufixoUsuario = `:${userId.trim()}`;

    try {
      for (let indice = localStorage.length - 1; indice >= 0; indice -= 1) {
        const chave = localStorage.key(indice);

        if (chave?.endsWith(sufixoUsuario)) {
          localStorage.removeItem(chave);
        }
      }
    } catch {
      // A exclusão remota já foi concluída; falhas locais não devem bloquear a saída.
    }

    try {
      for (let indice = sessionStorage.length - 1; indice >= 0; indice -= 1) {
        const chave = sessionStorage.key(indice);

        if (chave?.endsWith(sufixoUsuario)) {
          sessionStorage.removeItem(chave);
        }
      }
    } catch {
      // A sessão do navegador será encerrada em seguida.
    }
  }

  async function excluirConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (excluindoConta) {
      return;
    }

    setErroExclusaoConta("");

    if (!senhaExclusaoConta) {
      setErroExclusaoConta(
        t(
          "Digite sua senha atual.",
          "Enter your current password.",
          "Escribe tu contraseña actual.",
        ),
      );
      return;
    }

    const confirmacaoEsperada =
      language === "en" ? "DELETE" : language === "es" ? "ELIMINAR" : "EXCLUIR";

    if (confirmacaoExclusaoConta.trim().toUpperCase() !== confirmacaoEsperada) {
      setErroExclusaoConta(
        t(
          "Digite EXCLUIR exatamente como aparece para confirmar.",
          "Type DELETE exactly as shown to confirm.",
          "Escribe ELIMINAR exactamente como aparece para confirmar.",
        ),
      );
      return;
    }

    setExcluindoConta(true);

    try {
      const response = await fetch("/api/conta/excluir", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senha: senhaExclusaoConta,
          confirmacao: "EXCLUIR",
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; codigo?: string; mensagem?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setErroExclusaoConta(
          traduzirErroExclusaoConta(
            data?.codigo || "",
            data?.mensagem ||
              t(
                "Não foi possível excluir sua conta agora.",
                "Your account could not be deleted right now.",
                "No se pudo eliminar tu cuenta ahora.",
              ),
          ),
        );
        return;
      }

      limparDadosLocaisContaExcluida(usuarioIdLogado);

      try {
        await supabase.auth.signOut();
      } catch {
        // A conta já foi removida no servidor.
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErroExclusaoConta(
        t(
          "Não foi possível excluir sua conta agora. Verifique sua conexão e tente novamente.",
          "Your account could not be deleted right now. Check your connection and try again.",
          "No se pudo eliminar tu cuenta ahora. Revisa tu conexión e inténtalo de nuevo.",
        ),
      );
    } finally {
      setExcluindoConta(false);
    }
  }

  function abrirSeguranca() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroSenha("");
    setSenhaAlterada(false);
    setMostrarSeguranca(true);
  }

  function fecharSeguranca() {
    if (salvandoSenha) {
      return;
    }

    setMostrarSeguranca(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroSenha("");
    setSenhaAlterada(false);
  }

  async function alterarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (salvandoSenha || senhaAlterada) {
      return;
    }

    setErroSenha("");

    if (!senhaAtual) {
      setErroSenha(
        t(
          "Digite sua senha atual.",
          "Enter your current password.",
          "Escribe tu contraseña actual.",
        ),
      );
      return;
    }

    if (novaSenha.length < 8) {
      setErroSenha(
        t(
          "A nova senha precisa ter pelo menos 8 caracteres.",
          "The new password must be at least 8 characters long.",
          "La nueva contraseña debe tener al menos 8 caracteres.",
        ),
      );
      return;
    }

    if (
      !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novaSenha) ||
      !/[0-9]/.test(novaSenha)
    ) {
      setErroSenha(
        t(
          "Use pelo menos uma letra e um número na nova senha.",
          "Use at least one letter and one number in the new password.",
          "Usa al menos una letra y un número en la nueva contraseña.",
        ),
      );
      return;
    }

    if (novaSenha === senhaAtual) {
      setErroSenha(
        t(
          "A nova senha precisa ser diferente da senha atual.",
          "The new password must be different from the current password.",
          "La nueva contraseña debe ser diferente de la contraseña actual.",
        ),
      );
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha(
        t(
          "A confirmação não corresponde à nova senha.",
          "The confirmation does not match the new password.",
          "La confirmación no coincide con la nueva contraseña.",
        ),
      );
      return;
    }

    setSalvandoSenha(true);

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      if (
        erroUsuario ||
        !dadosUsuario.user ||
        dadosUsuario.user.id !== usuarioIdLogado
      ) {
        setErroSenha(
          t(
            "Sua sessão expirou. Entre novamente na conta.",
            "Your session has expired. Sign in again.",
            "Tu sesión expiró. Inicia sesión de nuevo.",
          ),
        );
        return;
      }

      const emailUsuario = dadosUsuario.user.email?.trim().toLowerCase() || "";

      if (!emailUsuario) {
        setErroSenha(
          t(
            "Não foi possível confirmar o e-mail da sua conta. Entre novamente e tente de novo.",
            "Your account email could not be confirmed. Sign in again and try once more.",
            "No se pudo confirmar el correo de tu cuenta. Inicia sesión de nuevo e inténtalo otra vez.",
          ),
        );
        return;
      }

      const { data: autenticacaoSenhaAtual, error: erroSenhaAtual } =
        await supabase.auth.signInWithPassword({
          email: emailUsuario,
          password: senhaAtual,
        });

      if (
        erroSenhaAtual ||
        !autenticacaoSenhaAtual.user ||
        autenticacaoSenhaAtual.user.id !== usuarioIdLogado
      ) {
        setErroSenha(
          traduzirErroSenhaConfiguracoes(
            erroSenhaAtual?.message || "invalid login credentials",
            language,
          ),
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        setErroSenha(traduzirErroSenhaConfiguracoes(error.message, language));
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setSenhaAlterada(true);
    } catch (error) {
      setErroSenha(
        traduzirErroSenhaConfiguracoes(
          error instanceof Error ? error.message : "",
          language,
        ),
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function carregarUsuariosBloqueados() {
    if (carregandoUsuariosBloqueados) {
      return;
    }

    setCarregandoUsuariosBloqueados(true);
    setErroUsuariosBloqueados("");

    try {
      const lista = await listarUsuariosBloqueadosConfiguracoes();
      setUsuariosBloqueados(lista);
    } catch (error) {
      setErroUsuariosBloqueados(
        error instanceof Error && error.message.trim()
          ? error.message
          : t(
              "Não foi possível carregar os usuários bloqueados.",
              "Blocked users could not be loaded.",
              "No se pudieron cargar los usuarios bloqueados.",
            ),
      );
    } finally {
      setCarregandoUsuariosBloqueados(false);
    }
  }

  function alternarUsuariosBloqueados() {
    setMostrarUsuariosBloqueados((mostrarAtual) => {
      const proximo = !mostrarAtual;

      if (proximo) {
        void carregarUsuariosBloqueados();
      }

      return proximo;
    });
  }

  async function desbloquearUsuarioConfiguracoes(
    usuarioBloqueado: UsuarioBloqueadoConfiguracoes,
  ) {
    if (
      desbloqueandoUsuarioId ||
      !idUsuarioSupabaseValido(usuarioBloqueado.userId)
    ) {
      return;
    }

    const confirmou = window.confirm(
      t(
        `Desbloquear ${usuarioBloqueado.nome}?`,
        `Unblock ${usuarioBloqueado.nome}?`,
        `¿Desbloquear a ${usuarioBloqueado.nome}?`,
      ),
    );

    if (!confirmou) {
      return;
    }

    setDesbloqueandoUsuarioId(usuarioBloqueado.userId);
    setErroUsuariosBloqueados("");

    try {
      const { data, error } = await supabase.rpc(
        "desbloquear_usuario",
        { p_bloqueado_id: usuarioBloqueado.userId },
      );

      if (error || data !== true) {
        throw error || new Error(
          t(
            "O desbloqueio não foi confirmado.",
            "The unblock action was not confirmed.",
            "No se confirmó el desbloqueo.",
          ),
        );
      }

      setUsuariosBloqueados((usuariosAtuais) =>
        usuariosAtuais.filter(
          (item) => item.userId !== usuarioBloqueado.userId,
        ),
      );

      mostrarMensagemAcao(
        "sucesso",
        t(
          `${usuarioBloqueado.nome} foi desbloqueado.`,
          `${usuarioBloqueado.nome} was unblocked.`,
          `${usuarioBloqueado.nome} fue desbloqueado.`,
        ),
      );
    } catch (error) {
      setErroUsuariosBloqueados(
        error instanceof Error && error.message.trim()
          ? error.message
          : t(
              "Não foi possível desbloquear este usuário.",
              "This user could not be unblocked.",
              "No se pudo desbloquear a este usuario.",
            ),
      );
    } finally {
      setDesbloqueandoUsuarioId("");
    }
  }

  async function copiarBackup() {
    setMensagemAcao(null);

    try {
      await copiarTextoConfiguracoes(criarBackupLocal(usuarioIdLogado));
      mostrarMensagemAcao(
        "sucesso",
        t(
          "Dados copiados para a área de transferência.",
          "Data copied to the clipboard.",
          "Datos copiados al portapapeles.",
        ),
      );
    } catch {
      mostrarMensagemAcao(
        "erro",
        t(
          "Não foi possível copiar os dados.",
          "The data could not be copied.",
          "No se pudieron copiar los datos.",
        ),
      );
    }
  }

  function baixarBackup() {
    setMensagemAcao(null);

    try {
      const backup = criarBackupLocal(usuarioIdLogado);
      const dataAtual = new Date().toISOString().slice(0, 10);
      const arquivo = new Blob([backup], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = url;
      link.download = `historietas-backup-${dataAtual}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);

      mostrarMensagemAcao(
        "sucesso",
        t(
          "Backup preparado e download iniciado.",
          "Backup prepared and download started.",
          "Copia preparada y descarga iniciada.",
        ),
      );
    } catch {
      mostrarMensagemAcao(
        "erro",
        t(
          "Não foi possível baixar o backup.",
          "The backup could not be downloaded.",
          "No se pudo descargar la copia.",
        ),
      );
    }
  }

  async function sairDaConta() {
    setMensagemAcao(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        mostrarMensagemAcao(
          "erro",
          t(
            "N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.",
            "Could not sign out right now. Please try again.",
            "No se pudo cerrar la sesi\u00f3n ahora. Int\u00e9ntalo de nuevo.",
          ),
        );
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      mostrarMensagemAcao(
        "erro",
        t(
          "N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.",
          "Could not sign out right now. Please try again.",
          "No se pudo cerrar la sesi\u00f3n ahora. Int\u00e9ntalo de nuevo.",
        ),
      );
    }
  }

  if (verificandoAcesso) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>
        <LoadingSpinner
          label={t(
            "Carregando configurações",
            "Loading settings",
            "Cargando configuración",
          )}
        />
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

      <section style={containerStyle}>
        <ConfiguracoesPageHeader
          onVoltar={() => router.back()}
          traduzirTexto={t}
        />

        <ConfiguracoesSearch
          busca={busca}
          onBuscaChange={setBusca}
          traduzirTexto={t}
        />

        <ConfiguracoesProfileCard
          nomeExibicao={preferencias.nomeExibicao}
          username={preferencias.username}
          emailContato={preferencias.emailContato}
          usuarioNome={usuario?.nome}
          usuarioEmail={usuario?.email}
          traduzirTexto={t}
        />

        {deveMostrar(
          "conta",
          "nome",
          "username",
          "usuário",
          "email",
          "senha",
          "privacidade",
          "salvar",
        ) ? (
          <SettingsSection
            title={t("Sua conta", "Your account", "Tu cuenta")}
          >
            {deveMostrar("nome", "exibição", "autor") ? (
              <SettingsInput
                icon="user"
                label={t(
                  "Nome de exibição",
                  "Display name",
                  "Nombre visible",
                )}
                value={preferencias.nomeExibicao}
                onChange={(valor) =>
                  atualizarPreferencia("nomeExibicao", valor)
                }
                placeholder={t(
                  "Ex: Nome do autor",
                  "Example: Author name",
                  "Ejemplo: Nombre del autor",
                )}
                maxLength={80}
                autoComplete="name"
              />
            ) : null}

            {deveMostrar("username", "usuário", "perfil", "arroba") ? (
              <SettingsInput
                icon="user"
                label="@username"
                value={preferencias.username}
                onChange={(valor) => {
                  setErroUsername("");
                  atualizarPreferencia(
                    "username",
                    normalizarUsernameConfiguracoes(valor),
                  );
                }}
                placeholder={t(
                  "ex: username",
                  "example: username",
                  "ejemplo: username",
                )}
                maxLength={30}
                autoComplete="username"
                helperText={erroUsername || undefined}
                error={Boolean(erroUsername)}
              />
            ) : null}

            {deveMostrar("email", "contato") ? (
              <SettingsInput
                icon="mail"
                label={t(
                  "E-mail de contato",
                  "Contact email",
                  "Correo de contacto",
                )}
                value={preferencias.emailContato}
                onChange={(valor) =>
                  atualizarPreferencia("emailContato", valor)
                }
                placeholder={t(
                  "Ex: seuemail@email.com",
                  "Example: youremail@email.com",
                  "Ejemplo: tucorreo@email.com",
                )}
                type="email"
                maxLength={254}
                autoComplete="email"
              />
            ) : null}

            {deveMostrar("salvar", "alterações", "configurações") ? (
              <SettingsRow
                icon="check"
                title={
                  salvando
                    ? t("Salvando...", "Saving...", "Guardando...")
                    : t(
                        "Salvar alterações",
                        "Save changes",
                        "Guardar cambios",
                      )
                }
                subtitle={t(
                  "Grava suas preferências nesta conta",
                  "Saves your preferences to this account",
                  "Guarda tus preferencias en esta cuenta",
                )}
                right={
                  salvando ? (
                    <LoadingSpinner
                      compacto
                      label={t(
                        "Salvando alterações",
                        "Saving changes",
                        "Guardando cambios",
                      )}
                    />
                  ) : undefined
                }
                onClick={salvar}
                hideChevron={salvando}
              />
            ) : null}

            {deveMostrar("senha", "segurança") ? (
              <SettingsRow
                icon="lock"
                title={t(
                  "Senha e segurança",
                  "Password and security",
                  "Contraseña y seguridad",
                )}
                subtitle={t(
                  "Altere com segurança sua senha de acesso",
                  "Securely change your access password",
                  "Cambia de forma segura tu contraseña de acceso",
                )}
                right={
                  <ValorLinha>
                    {t("Alterar", "Change", "Cambiar")}
                  </ValorLinha>
                }
                onClick={abrirSeguranca}
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "privacidade",
          "perfil",
          "privado",
          "seguidores",
          "aprovação",
          "solicitações",
          "bloqueio",
          "bloqueados",
          "desbloquear",
        ) ? (
          <SettingsSection
            title={t(
              "Privacidade do perfil",
              "Profile privacy",
              "Privacidad del perfil",
            )}
          >
            {deveMostrar("perfil", "privado", "visibilidade") ? (
              <SettingsRow
                icon="lock"
                title={t(
                  "Perfil privado",
                  "Private profile",
                  "Perfil privado",
                )}
                subtitle={t(
                  "Controla quem pode seguir você.",
                  "Controls who can follow you.",
                  "Controla quién puede seguirte.",
                )}
                right={
                  <Toggle
                    checked={privacidade.perfilPrivado}
                    onChange={alternarPerfilPrivado}
                    ariaLabel={t(
                      "Ativar ou desativar perfil privado",
                      "Enable or disable private profile",
                      "Activar o desactivar el perfil privado",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "aprovar",
              "aprovação",
              "seguidores",
              "solicitações",
            ) ? (
              <SettingsRow
                icon="user"
                title={t(
                  "Aprovar novos seguidores",
                  "Approve new followers",
                  "Aprobar nuevos seguidores",
                )}
                subtitle={
                  privacidade.perfilPrivado
                    ? t(
                        "Novos seguidores precisam da sua aprovação",
                        "New followers need your approval",
                        "Los nuevos seguidores necesitan tu aprobación",
                      )
                    : t(
                        "Ative para receber solicitações antes de alguém seguir você",
                        "Turn this on to receive requests before someone follows you",
                        "Actívalo para recibir solicitudes antes de que alguien te siga",
                      )
                }
                right={
                  <Toggle
                    checked={privacidade.aprovarNovosSeguidores}
                    onChange={alternarAprovacaoNovosSeguidores}
                    ariaLabel={t(
                      "Ativar ou desativar aprovação de novos seguidores",
                      "Enable or disable approval of new followers",
                      "Activar o desactivar la aprobación de nuevos seguidores",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "bloqueio",
              "bloqueados",
              "desbloquear",
              "privacidade",
            ) ? (
              <>
                <SettingsRow
                  icon="shield"
                  title={t(
                    "Usuários bloqueados",
                    "Blocked users",
                    "Usuarios bloqueados",
                  )}
                  subtitle={t(
                    "Revise e desbloqueie perfis da sua lista",
                    "Review and unblock profiles on your list",
                    "Revisa y desbloquea perfiles de tu lista",
                  )}
                  right={
                    carregandoUsuariosBloqueados ? (
                      <LoadingSpinner
                        compacto
                        label={t(
                          "Carregando usuários bloqueados",
                          "Loading blocked users",
                          "Cargando usuarios bloqueados",
                        )}
                      />
                    ) : (
                      <ValorLinha>{usuariosBloqueados.length}</ValorLinha>
                    )
                  }
                  onClick={alternarUsuariosBloqueados}
                />

                {mostrarUsuariosBloqueados ? (
                  <ConfiguracoesBlockedUsersPanel
                    usuarios={usuariosBloqueados}
                    carregando={carregandoUsuariosBloqueados}
                    erro={erroUsuariosBloqueados}
                    desbloqueandoUsuarioId={desbloqueandoUsuarioId}
                    onRecarregar={carregarUsuariosBloqueados}
                    onDesbloquear={desbloquearUsuarioConfiguracoes}
                    traduzirTexto={t}
                  />
                ) : null}
              </>
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "privacidade",
          "visibilidade",
          "obras",
          "sobre",
          "diário",
          "comunidade",
          "biblioteca",
          "atividades",
          "público",
          "seguidores",
          "pessoas que sigo",
          "somente eu",
        ) ? (
          <SettingsSection
            title={t(
              "Visibilidade das abas",
              "Tab visibility",
              "Visibilidad de las pestañas",
            )}
          >
            {deveMostrar("obras", "publicadas", "visibilidade") ? (
              <SettingsRow
                icon="book"
                title={t("Obras", "Works", "Obras")}
                right={
                  <select
                    value={privacidade.visibilidadeObras}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeObras",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Obras",
                      "Works tab visibility",
                      "Visibilidad de la pestaña Obras",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("sobre", "perfil", "visibilidade") ? (
              <SettingsRow
                icon="file"
                title={t("Sobre", "About", "Acerca de")}
                right={
                  <select
                    value={privacidade.visibilidadeSobre}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeSobre",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Sobre",
                      "About tab visibility",
                      "Visibilidad de la pestaña Acerca de",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("diário", "visibilidade") ? (
              <SettingsRow
                icon="pen"
                title={t("Diário", "Journal", "Diario")}
                right={
                  <select
                    value={privacidade.visibilidadeDiario}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeDiario",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Diário",
                      "Journal tab visibility",
                      "Visibilidad de la pestaña Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("comunidade", "publicações", "visibilidade") ? (
              <SettingsRow
                icon="comment"
                title={t("Comunidade", "Community", "Comunidad")}
                right={
                  <select
                    value={privacidade.visibilidadeComunidade}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeComunidade",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Comunidade",
                      "Community tab visibility",
                      "Visibilidad de la pestaña Comunidad",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("biblioteca", "listas", "visibilidade") ? (
              <SettingsRow
                icon="bookmark"
                title={t("Biblioteca", "Library", "Biblioteca")}
                right={
                  <select
                    value={privacidade.visibilidadeBiblioteca}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeBiblioteca",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Biblioteca",
                      "Library tab visibility",
                      "Visibilidad de la pestaña Biblioteca",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("atividades", "leitura", "visibilidade") ? (
              <SettingsRow
                icon="clock"
                title={t("Atividades", "Activity", "Actividad")}
                right={
                  <select
                    value={privacidade.visibilidadeAtividades}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeAtividades",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade das atividades",
                      "Activity visibility",
                      "Visibilidad de la actividad",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "diário",
          "avaliações",
          "avaliar",
          "comentários",
          "seguidores",
          "privacidade",
        ) ? (
          <SettingsSection
            title={t(
              "Privacidade e interações do Diário",
              "Journal privacy and interactions",
              "Privacidad e interacciones del Diario",
            )}
          >
            {deveMostrar(
              "avaliações",
              "mostrar",
              "perfil",
              "diário",
              "visibilidade",
            ) ? (
              <SettingsRow
                icon="star"
                title={t(
                  "Mostrar avaliações do Diário",
                  "Show Journal ratings",
                  "Mostrar valoraciones del Diario",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeAvaliacaoDiario}
                    onChange={(event) => {
                      const visibilidade = event.target
                        .value as VisibilidadeAbaPerfil;

                      aplicarPrivacidadeAtualizada({
                        ...privacidade,
                        visibilidadeAvaliacaoDiario: visibilidade,
                        mostrarAvaliacaoDiario:
                          visibilidade !== "somente_eu",
                      });
                    }}
                    aria-label={t(
                      "Quem pode ver as avaliações do meu Diário",
                      "Who can see my Journal ratings",
                      "Quién puede ver las valoraciones de mi Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">
                      {t("Público", "Public", "Público")}
                    </option>
                    <option value="seguidores">
                      {t("Seguidores", "Followers", "Seguidores")}
                    </option>
                    <option value="seguindo">
                      {t(
                        "Pessoas que sigo",
                        "People I follow",
                        "Personas que sigo",
                      )}
                    </option>
                    <option value="somente_eu">
                      {t("Somente eu", "Only me", "Solo yo")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "avaliações",
              "permitir",
              "avaliar",
              "seguidores",
              "pessoas que sigo",
              "diário",
            ) ? (
              <SettingsRow
                icon="user"
                title={t(
                  "Permitir novas avaliações",
                  "Allow new ratings",
                  "Permitir nuevas valoraciones",
                )}
                right={
                  <select
                    value={privacidade.quemPodeAvaliarDiario}
                    onChange={(event) => {
                      const quemPodeAvaliar = event.target
                        .value as QuemPodeAvaliarDiario;

                      aplicarPrivacidadeAtualizada({
                        ...privacidade,
                        permitirAvaliacaoDiario:
                          quemPodeAvaliar !== "ninguem",
                        quemPodeAvaliarDiario: quemPodeAvaliar,
                      });
                    }}
                    aria-label={t(
                      "Quem pode avaliar meu Diário",
                      "Who can rate my Journal",
                      "Quién puede valorar mi Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="todos">
                      {t("Público", "Public", "Público")}
                    </option>
                    <option value="seguidores">
                      {t("Seguidores", "Followers", "Seguidores")}
                    </option>
                    <option value="seguindo">
                      {t(
                        "Pessoas que sigo",
                        "People I follow",
                        "Personas que sigo",
                      )}
                    </option>
                    <option value="ninguem">
                      {t("Ninguém", "No one", "Nadie")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "comentários",
              "público",
              "seguidores",
              "pessoas que sigo",
              "ninguém",
              "diário",
            ) ? (
              <SettingsRow
                icon="comment"
                title={t(
                  "Quem pode comentar no meu Diário",
                  "Who can comment on my Journal",
                  "Quién puede comentar en mi Diario",
                )}
                right={
                  <select
                    value={privacidade.quemPodeComentarDiario}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "quemPodeComentarDiario",
                        event.target.value as QuemPodeComentarDiario,
                      )
                    }
                    aria-label={t(
                      "Quem pode comentar no meu Diário",
                      "Who can comment on my Journal",
                      "Quién puede comentar en mi Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="todos">
                      {t("Público", "Public", "Público")}
                    </option>
                    <option value="seguidores">
                      {t("Seguidores", "Followers", "Seguidores")}
                    </option>
                    <option value="seguindo">
                      {t(
                        "Pessoas que sigo",
                        "People I follow",
                        "Personas que sigo",
                      )}
                    </option>
                    <option value="ninguem">
                      {t("Ninguém", "No one", "Nadie")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {adminLiberado &&
        deveMostrar("moderação", "admin", "comunidade") ? (
          <SettingsSection
            title={t("Moderação", "Moderation", "Moderación")}
          >
            <SettingsRow
              icon="admin"
              title={t(
                "Área de moderação",
                "Moderation area",
                "Área de moderación",
              )}
              subtitle={t(
                "Revisar denúncias e conteúdos enviados",
                "Review reports and submitted content",
                "Revisar denuncias y contenidos enviados",
              )}
              href="/admin/comunidade"
            />
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "historietas",
          "obras",
          "biblioteca",
          "notificações",
          "comunidade",
          "top 5",
          "diário",
        ) ? (
          <SettingsSection
            title={t(
              "Como você usa o Historietas",
              "How you use Historietas",
              "Cómo usas Historietas",
            )}
          >
            {deveMostrar("obras", "criadas") ? (
              <SettingsRow
                icon="book"
                title={t(
                  "Obras criadas",
                  "Created works",
                  "Obras creadas",
                )}
                subtitle={t(
                  "Total de obras criadas na sua conta",
                  "Total works created on your account",
                  "Total de obras creadas en tu cuenta",
                )}
                right={<ValorLinha>{resumo.obras}</ValorLinha>}
                href="/perfil-autor?aba=obras"
              />
            ) : null}

            {deveMostrar(
              "biblioteca",
              "lista",
              "favoritas",
              "concluidas",
            ) ? (
              <SettingsRow
                icon="bookmark"
                title={t("Biblioteca", "Library", "Biblioteca")}
                subtitle={t(
                  "Favoritas, concluídas e obras seguidas",
                  "Favorites, completed and followed works",
                  "Favoritas, completadas y obras seguidas",
                )}
                right={<ValorLinha>{totalBiblioteca}</ValorLinha>}
                href="/perfil-autor?aba=biblioteca"
              />
            ) : null}

            {deveMostrar("notificações", "avisos") ? (
              <SettingsRow
                icon="bell"
                title={t(
                  "Notificações",
                  "Notifications",
                  "Notificaciones",
                )}
                subtitle={t(
                  "Mensagens, avisos e atividade recente",
                  "Messages, alerts and recent activity",
                  "Mensajes, avisos y actividad reciente",
                )}
                right={<ValorLinha>{notificacoesNaoLidas}</ValorLinha>}
                href="/notificacoes"
              />
            ) : null}

            {deveMostrar("comunidade", "autor") ? (
              <SettingsRow
                icon="comment"
                title={t(
                  "Comunidade do autor",
                  "Author community",
                  "Comunidad del autor",
                )}
                subtitle={t(
                  "Interações e publicações da comunidade",
                  "Community interactions and posts",
                  "Interacciones y publicaciones de la comunidad",
                )}
                href="/perfil-autor?aba=comunidade"
              />
            ) : null}

            {deveMostrar("top 5", "favoritas") ? (
              <SettingsRow
                icon="trophy"
                title="TOP 5"
                subtitle={t(
                  "Escolha suas cinco obras favoritas",
                  "Choose your five favorite works",
                  "Elige tus cinco obras favoritas",
                )}
                href="/perfil-autor/top-5"
              />
            ) : null}

            {deveMostrar("histórico", "leitura", "diário") ? (
              <SettingsRow
                icon="clock"
                title={t(
                  "Histórico de leitura",
                  "Reading history",
                  "Historial de lectura",
                )}
                subtitle={t(
                  "Diário, leituras recentes e avaliações",
                  "Journal, recent reads and ratings",
                  "Diario, lecturas recientes y valoraciones",
                )}
                href="/perfil-autor?aba=diario"
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "preferências",
          "tema",
          "aparência",
          "avisos",
          "idioma",
          "língua",
        ) ? (
          <SettingsSection
            title={t("Preferências", "Preferences", "Preferencias")}
          >
            {deveMostrar("idioma", "língua") ? (
              <SettingsRow
                icon="layers"
                title={t(
                  "Idioma do site",
                  "Site language",
                  "Idioma del sitio",
                )}
                right={
                  <LanguageSelect
                    showLabel={false}
                    style={{
                      width: "clamp(120px, 34vw, 128px)",
                      maxWidth: "100%",
                      transform: "translateX(22px)",
                    }}
                    selectStyle={{
                      width: "100%",
                      minHeight: 38,
                      padding: "7px 8px",
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("receber", "avisos") ? (
              <SettingsRow
                icon="bell"
                title={t(
                  "Receber avisos",
                  "Receive alerts",
                  "Recibir avisos",
                )}
                right={
                  <Toggle
                    checked={preferencias.receberAvisos}
                    onChange={alternarReceberAvisos}
                    ariaLabel={t(
                      "Ativar ou desativar avisos",
                      "Enable or disable alerts",
                      "Activar o desactivar avisos",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

          </SettingsSection>
        ) : null}

        {deveMostrar(
          "dados",
          "backup",
          "copiar",
          "baixar",
          "download",
        ) ? (
          <SettingsSection
            title={t(
              "Dados e arquivos",
              "Data and files",
              "Datos y archivos",
            )}
          >
            {deveMostrar("copiar", "dados") ? (
              <SettingsRow
                icon="copy"
                title={t("Copiar dados", "Copy data", "Copiar datos")}
                subtitle={t(
                  "Copia um backup em texto para a área de transferência",
                  "Copies a text backup to the clipboard",
                  "Copia una copia de seguridad en texto al portapapeles",
                )}
                onClick={copiarBackup}
              />
            ) : null}

            {deveMostrar("baixar", "backup", "download") ? (
              <SettingsRow
                icon="download"
                title={t(
                  "Baixar backup",
                  "Download backup",
                  "Descargar copia",
                )}
                subtitle={t(
                  "Salva um arquivo JSON com seus dados locais",
                  "Saves a JSON file with your local data",
                  "Guarda un archivo JSON con tus datos locales",
                )}
                onClick={baixarBackup}
              />
            ) : null}

            {deveMostrar("resumo", "dados") ? (
              <SettingsRow
                icon="database"
                title={t(
                  "Resumo da conta",
                  "Account summary",
                  "Resumen de la cuenta",
                )}
                subtitle={t(
                  `${resumo.obras} obras, ${resumo.favoritas} na lista, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } seguindo`,
                  `${resumo.obras} works, ${resumo.favoritas} in the list, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } following`,
                  `${resumo.obras} obras, ${resumo.favoritas} en la lista, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } siguiendo`,
                )}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "suporte",
          "ajuda",
          "termos",
          "políticas",
          "sobre",
        ) ? (
          <SettingsSection
            title={t(
              "Suporte e sobre",
              "Support and about",
              "Soporte y acerca de",
            )}
          >
            {deveMostrar("ajuda", "suporte") ? (
              <SettingsRow
                icon="help"
                title={t(
                  "Central de ajuda",
                  "Help center",
                  "Centro de ayuda",
                )}
                subtitle={t(
                  "Dúvidas, problemas e orientação",
                  "Questions, problems and guidance",
                  "Dudas, problemas y orientación",
                )}
                href="/ajuda"
              />
            ) : null}

            {deveMostrar("termos", "políticas", "privacidade") ? (
              <SettingsRow
                icon="file"
                title={t(
                  "Termos e políticas",
                  "Terms and policies",
                  "Términos y políticas",
                )}
                subtitle={t(
                  "Privacidade, uso da plataforma e regras",
                  "Privacy, platform use and rules",
                  "Privacidad, uso de la plataforma y reglas",
                )}
                href="/termos"
              />
            ) : null}

            {deveMostrar("sobre", "versão") ? (
              <SettingsRow
                icon="settings"
                title={t(
                  "Sobre o Historietas",
                  "About Historietas",
                  "Acerca de Historietas",
                )}
                subtitle={t(
                  "Versão local de desenvolvimento",
                  "Local development version",
                  "Versión local de desarrollo",
                )}
                right={<ValorLinha>Beta</ValorLinha>}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("excluir", "apagar", "conta", "dados", "permanente") ? (
          <section style={sectionStyle}>
            <SectionTitle>
              {t("Zona de risco", "Danger zone", "Zona de riesgo")}
            </SectionTitle>
            <div style={listCardTransparentStyle}>
              <SettingsRow
                icon="trash"
                title={t(
                  "Excluir minha conta",
                  "Delete my account",
                  "Eliminar mi cuenta",
                )}
                subtitle={t(
                  "Apagar permanentemente a conta e os dados associados",
                  "Permanently delete the account and associated data",
                  "Eliminar permanentemente la cuenta y los datos asociados",
                )}
                onClick={abrirExclusaoConta}
                danger
              />
            </div>
          </section>
        ) : null}

        {deveMostrar("sair", "conta", "login") ? (
          <section style={sectionStyle}>
            <div style={listCardTransparentStyle}>
              <SettingsRow
                icon="logout"
                title={t(
                  "Sair da conta",
                  "Sign out",
                  "Cerrar sesión",
                )}
                subtitle={t(
                  "Encerrar sessão neste dispositivo",
                  "End the session on this device",
                  "Cerrar la sesión en este dispositivo",
                )}
                onClick={sairDaConta}
                danger
              />
            </div>
          </section>
        ) : null}
      </section>

      {mostrarSeguranca ? (
        <div
          role="presentation"
          style={securityOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharSeguranca();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-seguranca-configuracoes"
            style={securityModalStyle}
          >
            <header style={securityModalHeaderStyle}>
              <span style={securityModalIconStyle}>
                <SvgIcon name="lock" size={24} strokeWidth={2.2} />
              </span>

              <div style={securityModalHeadingStyle}>
                <h2
                  id="titulo-seguranca-configuracoes"
                  style={securityModalTitleStyle}
                >
                  {t(
                    "Alterar senha",
                    "Change password",
                    "Cambiar contraseña",
                  )}
                </h2>
                <p style={securityModalSubtitleStyle}>
                  {t(
                    "Confirme sua senha atual e escolha uma nova senha.",
                    "Confirm your current password and choose a new one.",
                    "Confirma tu contraseña actual y elige una nueva.",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharSeguranca}
                disabled={salvandoSenha}
                aria-label={t("Fechar", "Close", "Cerrar")}
                style={
                  salvandoSenha
                    ? securityCloseButtonDisabledStyle
                    : securityCloseButtonStyle
                }
              >
                ×
              </button>
            </header>

            {senhaAlterada ? (
              <div role="status" aria-live="polite" style={securitySuccessStyle}>
                <SvgIcon name="check" size={25} strokeWidth={2.4} />
                <div style={securityFeedbackTextStyle}>
                  <strong>
                    {t(
                      "Senha alterada com sucesso",
                      "Password changed successfully",
                      "Contraseña cambiada correctamente",
                    )}
                  </strong>
                  <span>
                    {t(
                      "A nova senha já está ativa na sua conta.",
                      "The new password is now active on your account.",
                      "La nueva contraseña ya está activa en tu cuenta.",
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={alterarSenha} style={securityFormStyle}>
                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t(
                      "Senha atual",
                      "Current password",
                      "Contraseña actual",
                    )}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={senhaAtual}
                    onChange={(event) => {
                      setSenhaAtual(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="current-password"
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t("Nova senha", "New password", "Nueva contraseña")}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={novaSenha}
                    onChange={(event) => {
                      setNovaSenha(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t(
                      "Confirmar nova senha",
                      "Confirm new password",
                      "Confirmar nueva contraseña",
                    )}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={confirmarNovaSenha}
                    onChange={(event) => {
                      setConfirmarNovaSenha(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <p style={securityHintStyle}>
                  {t(
                    "Use no mínimo 8 caracteres, incluindo uma letra e um número.",
                    "Use at least 8 characters, including a letter and a number.",
                    "Usa al menos 8 caracteres, incluyendo una letra y un número.",
                  )}
                </p>

                {erroSenha ? (
                  <div role="alert" aria-live="assertive" style={securityErrorStyle}>
                    {erroSenha}
                  </div>
                ) : null}

                <div style={securityActionsStyle}>
                  <button
                    type="button"
                    onClick={fecharSeguranca}
                    disabled={salvandoSenha}
                    style={
                      salvandoSenha
                        ? securitySecondaryButtonDisabledStyle
                        : securitySecondaryButtonStyle
                    }
                  >
                    {t("Cancelar", "Cancel", "Cancelar")}
                  </button>

                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    style={
                      salvandoSenha
                        ? securityPrimaryButtonDisabledStyle
                        : securityPrimaryButtonStyle
                    }
                  >
                    {salvandoSenha ? (
                      <>
                        <LoadingSpinner
                          compacto
                          label={t(
                            "Alterando senha",
                            "Changing password",
                            "Cambiando contraseña",
                          )}
                        />
                        <span>
                          {t(
                            "Alterando...",
                            "Changing...",
                            "Cambiando...",
                          )}
                        </span>
                      </>
                    ) : (
                      t(
                        "Alterar senha",
                        "Change password",
                        "Cambiar contraseña",
                      )
                    )}
                  </button>
                </div>
              </form>
            )}

            {senhaAlterada ? (
              <button
                type="button"
                onClick={fecharSeguranca}
                style={securityDoneButtonStyle}
              >
                {t("Concluído", "Done", "Listo")}
              </button>
            ) : null}
          </section>
        </div>
      ) : null}

      {mostrarExclusaoConta ? (
        <div
          role="presentation"
          style={securityOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharExclusaoConta();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao-conta"
            style={securityModalStyle}
          >
            <header style={securityModalHeaderStyle}>
              <span style={deleteModalIconStyle}>
                <SvgIcon name="trash" size={24} strokeWidth={2.2} />
              </span>

              <div style={securityModalHeadingStyle}>
                <h2 id="titulo-exclusao-conta" style={securityModalTitleStyle}>
                  {t(
                    "Excluir minha conta",
                    "Delete my account",
                    "Eliminar mi cuenta",
                  )}
                </h2>
                <p style={securityModalSubtitleStyle}>
                  {t(
                    "Esta ação é permanente e não pode ser desfeita.",
                    "This action is permanent and cannot be undone.",
                    "Esta acción es permanente y no se puede deshacer.",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharExclusaoConta}
                disabled={excluindoConta}
                aria-label={t("Fechar", "Close", "Cerrar")}
                style={
                  excluindoConta
                    ? securityCloseButtonDisabledStyle
                    : securityCloseButtonStyle
                }
              >
                ×
              </button>
            </header>

            <div style={deleteWarningStyle}>
              <strong>
                {t(
                  "Serão excluídos:",
                  "The following will be deleted:",
                  "Se eliminarán:",
                )}
              </strong>
              <ul style={deleteWarningListStyle}>
                <li>{t("conta, perfil e acesso;", "account, profile, and access;", "cuenta, perfil y acceso;")}</li>
                <li>{t("obras, capítulos, capas e arquivos;", "works, chapters, covers, and files;", "obras, capítulos, portadas y archivos;")}</li>
                <li>{t("comentários, curtidas, avaliações, seguidores e progresso.", "comments, likes, ratings, followers, and progress.", "comentarios, me gusta, valoraciones, seguidores y progreso.")}</li>
              </ul>
              <Link href="/excluir-conta" style={deletePublicLinkStyle}>
                {t(
                  "Ver página pública de exclusão",
                  "View public deletion page",
                  "Ver página pública de eliminación",
                )}
              </Link>
            </div>

            <form onSubmit={excluirConta} style={securityFormStyle}>
              <label style={securityFieldStyle}>
                <span style={securityFieldLabelStyle}>
                  {t("Senha atual", "Current password", "Contraseña actual")}
                </span>
                <input
                  className="configuracoes-input"
                  type="password"
                  value={senhaExclusaoConta}
                  onChange={(event) => {
                    setSenhaExclusaoConta(event.target.value);
                    setErroExclusaoConta("");
                  }}
                  autoComplete="current-password"
                  disabled={excluindoConta}
                  style={securityPasswordInputStyle}
                />
              </label>

              <label style={securityFieldStyle}>
                <span style={securityFieldLabelStyle}>
                  {t(
                    "Digite EXCLUIR para confirmar",
                    "Type DELETE to confirm",
                    "Escribe ELIMINAR para confirmar",
                  )}
                </span>
                <input
                  className="configuracoes-input"
                  type="text"
                  value={confirmacaoExclusaoConta}
                  onChange={(event) => {
                    setConfirmacaoExclusaoConta(event.target.value);
                    setErroExclusaoConta("");
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={excluindoConta}
                  style={securityPasswordInputStyle}
                />
              </label>

              <p style={securityHintStyle}>
                {t(
                  "Antes de continuar, você pode baixar um backup no Resumo da conta.",
                  "Before continuing, you can download a backup from Account summary.",
                  "Antes de continuar, puedes descargar una copia en Resumen de la cuenta.",
                )}
              </p>

              {erroExclusaoConta ? (
                <div role="alert" aria-live="assertive" style={securityErrorStyle}>
                  {erroExclusaoConta}
                </div>
              ) : null}

              <div style={securityActionsStyle}>
                <button
                  type="button"
                  onClick={fecharExclusaoConta}
                  disabled={excluindoConta}
                  style={
                    excluindoConta
                      ? securitySecondaryButtonDisabledStyle
                      : securitySecondaryButtonStyle
                  }
                >
                  {t("Cancelar", "Cancel", "Cancelar")}
                </button>

                <button
                  type="submit"
                  disabled={excluindoConta}
                  style={
                    excluindoConta
                      ? deleteDangerButtonDisabledStyle
                      : deleteDangerButtonStyle
                  }
                >
                  {excluindoConta ? (
                    <>
                      <LoadingSpinner
                        compacto
                        label={t(
                          "Excluindo conta",
                          "Deleting account",
                          "Eliminando cuenta",
                        )}
                      />
                      <span>{t("Excluindo...", "Deleting...", "Eliminando...")}</span>
                    </>
                  ) : (
                    t(
                      "Excluir definitivamente",
                      "Delete permanently",
                      "Eliminar definitivamente",
                    )
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {mensagemAcao ? (
        <ConfiguracoesActionToast
          mensagem={mensagemAcao}
          onFechar={() => setMensagemAcao(null)}
          traduzirTexto={t}
        />
      ) : null}
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--configuracoes-page-bg, #050509)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};


const listCardTransparentStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "20px",
  background: "transparent",
};

const securityOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box",
  background: "rgba(0,0,0,0.74)",
  backdropFilter: "blur(8px)",
};

const securityModalStyle: CSSProperties = {
  width: "min(440px, 100%)",
  maxHeight: "calc(100dvh - 40px)",
  overflowY: "auto",
  borderRadius: "22px",
  padding: "20px",
  boxSizing: "border-box",
  background:
    "var(--configuracoes-card-bg, linear-gradient(180deg, #18131F 0%, #0B090E 100%))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.14))",
  boxShadow: "0 28px 90px rgba(0,0,0,0.62)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const securityModalHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) 36px",
  alignItems: "start",
  gap: "11px",
};

const securityModalIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const deleteModalIconStyle: CSSProperties = {
  ...securityModalIconStyle,
  background: "rgba(127,29,29,0.28)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  border: "1px solid rgba(248,113,113,0.22)",
};

const securityModalHeadingStyle: CSSProperties = {
  minWidth: 0,
};

const securityModalTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.035em",
};

const securityModalSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.58))",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 560,
  ...safeTextStyle,
};

const securityCloseButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  border: "0",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  fontSize: "25px",
  lineHeight: 1,
  cursor: "pointer",
};

const securityCloseButtonDisabledStyle: CSSProperties = {
  ...securityCloseButtonStyle,
  cursor: "not-allowed",
  opacity: 0.45,
};

const securityFormStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  marginTop: "22px",
};

const securityFieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const securityFieldLabelStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.70))",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
};

const securityPasswordInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  boxSizing: "border-box",
  borderRadius: "13px",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.14))",
  outline: "none",
  padding: "10px 13px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.075))",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontFamily: "inherit",
  fontSize: "16px",
  lineHeight: 1.2,
  fontWeight: 680,
};

const securityHintStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.50))",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 570,
  ...safeTextStyle,
};

const securityErrorStyle: CSSProperties = {
  padding: "11px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(248,113,113,0.32)",
  background: "rgba(127,29,29,0.20)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 700,
  ...safeTextStyle,
};

const securitySuccessStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "start",
  marginTop: "22px",
  padding: "15px",
  borderRadius: "15px",
  border: "1px solid rgba(74,222,128,0.30)",
  background: "rgba(20,83,45,0.22)",
  color: "#BBF7D0",
};

const securityFeedbackTextStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  color: "inherit",
  fontSize: "13px",
  lineHeight: 1.35,
  ...safeTextStyle,
};

const deleteWarningStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginTop: "20px",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(248,113,113,0.28)",
  background: "rgba(127,29,29,0.18)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontSize: "13px",
  lineHeight: 1.4,
};

const deleteWarningListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "20px",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.72))",
};

const deletePublicLinkStyle: CSSProperties = {
  width: "fit-content",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontWeight: 780,
};

const securityActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)",
  gap: "10px",
  marginTop: "4px",
};

const securityButtonBaseStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "13px",
  padding: "10px 14px",
  border: "0",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 850,
  cursor: "pointer",
};

const securitySecondaryButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.12))",
};

const securityPrimaryButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "var(--historietas-accent, #F97316)",
  color: "#000000",
};

const deleteDangerButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "#DC2626",
  color: "#FFFFFF",
  boxShadow: "0 10px 28px rgba(220,38,38,0.24)",
};

const deleteDangerButtonDisabledStyle: CSSProperties = {
  ...deleteDangerButtonStyle,
  cursor: "not-allowed",
  opacity: 0.62,
};

const securitySecondaryButtonDisabledStyle: CSSProperties = {
  ...securitySecondaryButtonStyle,
  cursor: "not-allowed",
  opacity: 0.48,
};

const securityPrimaryButtonDisabledStyle: CSSProperties = {
  ...securityPrimaryButtonStyle,
  cursor: "not-allowed",
  opacity: 0.64,
};

const securityDoneButtonStyle: CSSProperties = {
  ...securityPrimaryButtonStyle,
  width: "100%",
  marginTop: "15px",
};

const privacySelectStyle: CSSProperties = {
  width: "clamp(120px, 34vw, 128px)",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: 38,
  padding: "7px 20px 7px 8px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  transform: "translateX(22px)",
};
