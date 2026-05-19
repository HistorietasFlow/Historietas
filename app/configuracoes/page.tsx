"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type TemaVisual =
  | "original"
  | "fantasia"
  | "romance"
  | "terror"
  | "acao"
  | "scifi"
  | "drama"
  | "aventura"
  | "sobrenatural"
  | "comedia";

type PreferenciasConta = {
  nomeExibicao: string;
  emailContato: string;
  receberAvisos: boolean;
  leituraConfortavel: boolean;
  reduzirEfeitos: boolean;
  temaVisual: TemaVisual;
};

type ResumoLocal = {
  obras: number;
  notificacoes: number;
  lancamentos: number;
  favoritas: number;
  concluidas: number;
  seguindoObras: number;
  seguindoAutores: number;
};

const CONFIG_STORAGE_KEY = "historietas-configuracoes-conta";
const THEME_STORAGE_KEY = "historietas-tema-visual";

const TEMAS_VISUAIS: Record<
  TemaVisual,
  {
    nome: string;
    descricao: string;
    icone: string;
    accent: string;
    secondary: string;
    bgStart: string;
    bgMid: string;
    bgEnd: string;
    glowPrimary: string;
    glowSecondary: string;
  }
> = {
  original: {
    nome: "Historietas Original",
    descricao: "Roxo e laranja premium, o visual padrão do app.",
    icone: "✦",
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#0B0614",
    bgMid: "#12081F",
    bgEnd: "#17101B",
    glowPrimary: "rgba(124,58,237,0.32)",
    glowSecondary: "rgba(249,115,22,0.16)",
  },
  fantasia: {
    nome: "Fantasia",
    descricao: "Aura mística com violeta profundo e azul arcano.",
    icone: "◇",
    accent: "#A855F7",
    secondary: "#2563EB",
    bgStart: "#090417",
    bgMid: "#130A2A",
    bgEnd: "#0B1028",
    glowPrimary: "rgba(168,85,247,0.34)",
    glowSecondary: "rgba(37,99,235,0.18)",
  },
  romance: {
    nome: "Romance",
    descricao: "Rosa, vinho e brilho suave para histórias emocionais.",
    icone: "♡",
    accent: "#EC4899",
    secondary: "#BE123C",
    bgStart: "#140711",
    bgMid: "#251022",
    bgEnd: "#1E0B16",
    glowPrimary: "rgba(236,72,153,0.30)",
    glowSecondary: "rgba(190,18,60,0.18)",
  },
  terror: {
    nome: "Terror",
    descricao: "Vermelho sombrio, clima pesado e cinematográfico.",
    icone: "☾",
    accent: "#EF4444",
    secondary: "#7F1D1D",
    bgStart: "#080305",
    bgMid: "#160707",
    bgEnd: "#100608",
    glowPrimary: "rgba(239,68,68,0.30)",
    glowSecondary: "rgba(127,29,29,0.22)",
  },
  acao: {
    nome: "Ação",
    descricao: "Laranja e vermelho intenso, com energia de batalha.",
    icone: "⚡",
    accent: "#F97316",
    secondary: "#DC2626",
    bgStart: "#100604",
    bgMid: "#1E0B08",
    bgEnd: "#17101B",
    glowPrimary: "rgba(249,115,22,0.34)",
    glowSecondary: "rgba(220,38,38,0.18)",
  },
  scifi: {
    nome: "Sci-fi",
    descricao: "Azul e ciano neon para mundos tecnológicos.",
    icone: "◌",
    accent: "#06B6D4",
    secondary: "#2563EB",
    bgStart: "#031017",
    bgMid: "#071C2D",
    bgEnd: "#071321",
    glowPrimary: "rgba(6,182,212,0.30)",
    glowSecondary: "rgba(37,99,235,0.20)",
  },
  drama: {
    nome: "Drama",
    descricao: "Roxo dramático e profundo para histórias intensas.",
    icone: "✧",
    accent: "#C084FC",
    secondary: "#581C87",
    bgStart: "#0E0718",
    bgMid: "#160A24",
    bgEnd: "#17101F",
    glowPrimary: "rgba(192,132,252,0.30)",
    glowSecondary: "rgba(88,28,135,0.22)",
  },
  aventura: {
    nome: "Aventura",
    descricao: "Dourado e sombra épica para jornadas e descobertas.",
    icone: "⌖",
    accent: "#FBBF24",
    secondary: "#B45309",
    bgStart: "#100B06",
    bgMid: "#181020",
    bgEnd: "#17101F",
    glowPrimary: "rgba(251,191,36,0.24)",
    glowSecondary: "rgba(180,83,9,0.20)",
  },
  sobrenatural: {
    nome: "Sobrenatural",
    descricao: "Verde espectral com toque místico e misterioso.",
    icone: "☾",
    accent: "#34D399",
    secondary: "#065F46",
    bgStart: "#06120D",
    bgMid: "#0B1D1C",
    bgEnd: "#10171A",
    glowPrimary: "rgba(52,211,153,0.24)",
    glowSecondary: "rgba(6,95,70,0.22)",
  },
  comedia: {
    nome: "Comédia",
    descricao: "Amarelo vibrante e coral para histórias leves e divertidas.",
    icone: "☀",
    accent: "#FACC15",
    secondary: "#FB7185",
    bgStart: "#110D04",
    bgMid: "#1D1608",
    bgEnd: "#1A1014",
    glowPrimary: "rgba(250,204,21,0.24)",
    glowSecondary: "rgba(251,113,133,0.18)",
  },
};

const ORDEM_TEMAS_VISUAIS: TemaVisual[] = [
  "original",
  "fantasia",
  "romance",
  "terror",
  "acao",
  "scifi",
  "drama",
  "aventura",
  "sobrenatural",
  "comedia",
];

const CHAVES_RESUMO = [
  "historietas-obras",
  "historietas-notificacoes",
  "historietas-lancamentos-salvos",
  "historietas-obras-favoritas",
  "historietas-obras-concluidas",
  "historietas-obras-seguidas",
  "historietas-autores-seguidos",
  "historietas-perfis-autores",
  THEME_STORAGE_KEY,
];

const preferenciasPadrao: PreferenciasConta = {
  nomeExibicao: "",
  emailContato: "",
  receberAvisos: true,
  leituraConfortavel: true,
  reduzirEfeitos: false,
  temaVisual: "original",
};

const resumoPadrao: ResumoLocal = {
  obras: 0,
  notificacoes: 0,
  lancamentos: 0,
  favoritas: 0,
  concluidas: 0,
  seguindoObras: 0,
  seguindoAutores: 0,
};


function obterTemaVisualSeguro(valor: unknown): TemaVisual {
  if (typeof valor === "string" && valor in TEMAS_VISUAIS) {
    return valor as TemaVisual;
  }

  return "original";
}

function carregarTemaVisualSalvo() {
  try {
    const texto = localStorage.getItem(THEME_STORAGE_KEY);

    if (!texto) {
      return "original";
    }

    try {
      return obterTemaVisualSeguro(JSON.parse(texto));
    } catch {
      return obterTemaVisualSeguro(texto);
    }
  } catch {
    return "original";
  }
}

function salvarTemaVisual(temaVisual: TemaVisual) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(temaVisual));
}

function aplicarTemaVisual(temaVisual: TemaVisual) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS[temaVisual];
  const raiz = document.documentElement;

  raiz.style.setProperty("--historietas-accent", tema.accent);
  raiz.style.setProperty("--historietas-secondary", tema.secondary);
  raiz.style.setProperty("--historietas-bg-start", tema.bgStart);
  raiz.style.setProperty("--historietas-bg-mid", tema.bgMid);
  raiz.style.setProperty("--historietas-bg-end", tema.bgEnd);
  raiz.style.setProperty("--historietas-glow-primary", tema.glowPrimary);
  raiz.style.setProperty("--historietas-glow-secondary", tema.glowSecondary);
}

function carregarJsonArray(chave: string) {
  try {
    const texto = localStorage.getItem(chave);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

function contarItens(chave: string) {
  return carregarJsonArray(chave).length;
}

function criarResumoLocal(): ResumoLocal {
  return {
    obras: contarItens("historietas-obras"),
    notificacoes: contarItens("historietas-notificacoes"),
    lancamentos: contarItens("historietas-lancamentos-salvos"),
    favoritas: contarItens("historietas-obras-favoritas"),
    concluidas: contarItens("historietas-obras-concluidas"),
    seguindoObras: contarItens("historietas-obras-seguidas"),
    seguindoAutores: contarItens("historietas-autores-seguidos"),
  };
}

function carregarPreferencias(): PreferenciasConta {
  try {
    const texto = localStorage.getItem(CONFIG_STORAGE_KEY);
    const json: unknown = texto ? JSON.parse(texto) : null;

    if (!json || typeof json !== "object") {
      return {
        ...preferenciasPadrao,
        temaVisual: carregarTemaVisualSalvo(),
      };
    }

    const preferencias = json as Partial<PreferenciasConta>;

    return {
      nomeExibicao:
        typeof preferencias.nomeExibicao === "string"
          ? preferencias.nomeExibicao
          : "",
      emailContato:
        typeof preferencias.emailContato === "string"
          ? preferencias.emailContato
          : "",
      receberAvisos:
        typeof preferencias.receberAvisos === "boolean"
          ? preferencias.receberAvisos
          : true,
      leituraConfortavel:
        typeof preferencias.leituraConfortavel === "boolean"
          ? preferencias.leituraConfortavel
          : true,
      reduzirEfeitos:
        typeof preferencias.reduzirEfeitos === "boolean"
          ? preferencias.reduzirEfeitos
          : false,
      temaVisual: obterTemaVisualSeguro(
        preferencias.temaVisual || carregarTemaVisualSalvo()
      ),
    };
  } catch {
    return {
      ...preferenciasPadrao,
      temaVisual: carregarTemaVisualSalvo(),
    };
  }
}

function salvarPreferencias(preferencias: PreferenciasConta) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(preferencias));
  salvarTemaVisual(preferencias.temaVisual);
  aplicarTemaVisual(preferencias.temaVisual);
}

function criarBackupLocal() {
  const backup: Record<string, unknown> = {};

  CHAVES_RESUMO.forEach((chave) => {
    try {
      const valor = localStorage.getItem(chave);
      backup[chave] = valor ? JSON.parse(valor) : null;
    } catch {
      backup[chave] = null;
    }
  });

  backup[CONFIG_STORAGE_KEY] = carregarPreferencias();
  backup.exportadoEm = new Date().toISOString();
  backup.projeto = "Historietas";

  return JSON.stringify(backup, null, 2);
}

async function copiarTexto(texto: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }

  const campoTemporario = document.createElement("textarea");
  campoTemporario.value = texto;
  campoTemporario.setAttribute("readonly", "true");
  campoTemporario.style.position = "fixed";
  campoTemporario.style.left = "-9999px";
  document.body.appendChild(campoTemporario);
  campoTemporario.select();
  document.execCommand("copy");
  document.body.removeChild(campoTemporario);
}

export default function ConfiguracoesPage() {
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [mensagem, setMensagem] = useState("");
  const [resumoAtualizadoEm, setResumoAtualizadoEm] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 900px)");

    function atualizarModoDesktop() {
      setIsDesktop(mediaQuery.matches);
    }

    atualizarModoDesktop();
    mediaQuery.addEventListener("change", atualizarModoDesktop);

    return () => {
      mediaQuery.removeEventListener("change", atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    const preferenciasCarregadas = carregarPreferencias();

    setPreferencias(preferenciasCarregadas);
    aplicarTemaVisual(preferenciasCarregadas.temaVisual);
    setResumo(criarResumoLocal());
    setResumoAtualizadoEm(new Date().toLocaleTimeString("pt-BR"));
  }, []);

  function atualizarPreferencia<K extends keyof PreferenciasConta>(
    campo: K,
    valor: PreferenciasConta[K]
  ) {
    setPreferencias((preferenciasAtuais) => ({
      ...preferenciasAtuais,
      [campo]: valor,
    }));
  }

  function atualizarTemaVisual(temaVisual: TemaVisual) {
    setPreferencias((preferenciasAtuais) => ({
      ...preferenciasAtuais,
      temaVisual,
    }));

    salvarTemaVisual(temaVisual);
    aplicarTemaVisual(temaVisual);
    setMensagem(`Tema ${TEMAS_VISUAIS[temaVisual].nome} aplicado neste navegador.`);

    window.setTimeout(() => {
      setMensagem("");
    }, 1900);
  }

  function salvar() {
    salvarPreferencias(preferencias);
    setMensagem("Configurações salvas neste navegador.");

    window.setTimeout(() => {
      setMensagem("");
    }, 2200);
  }

  function restaurarPadrao() {
    setPreferencias(preferenciasPadrao);
    salvarPreferencias(preferenciasPadrao);
    setMensagem("Preferências restauradas para o padrão.");

    window.setTimeout(() => {
      setMensagem("");
    }, 2200);
  }

  async function copiarBackup() {
    try {
      await copiarTexto(criarBackupLocal());
      setMensagem("Backup copiado para a área de transferência.");
    } catch {
      setMensagem("Não consegui copiar o backup neste navegador.");
    }

    window.setTimeout(() => {
      setMensagem("");
    }, 2600);
  }

  function atualizarResumo() {
    setResumo(criarResumoLocal());
    setResumoAtualizadoEm(new Date().toLocaleTimeString("pt-BR"));
    setMensagem("Resumo atualizado.");

    window.setTimeout(() => {
      setMensagem("");
    }, 1600);
  }

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={badgeStyle}>CONFIGURAÇÕES</span>
        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>Conta e preferências</h1>

            <p style={descriptionStyle}>
              Ajuste detalhes do seu perfil local, preferências de leitura e
              faça backup dos dados salvos neste navegador.
            </p>

            <div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>
              <Link href="/painel-autor" style={primaryLinkStyle}>
                Ir para o Painel
              </Link>

              <Link href="/notificacoes" style={secondaryLinkStyle}>
                Ver notificações
              </Link>
            </div>
          </div>
        </section>

        {mensagem && <span style={messageStyle}>{mensagem}</span>}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={miniTitleStyle}>CONTA</span>
            <h2 style={sectionTitleStyle}>Dados básicos</h2>
          </div>

          <div style={isDesktop ? desktopAccountCardStyle : cardStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Nome de exibição</span>

              <input
                value={preferencias.nomeExibicao}
                onChange={(event) =>
                  atualizarPreferencia("nomeExibicao", event.target.value)
                }
                placeholder="Ex: Nome do autor"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>E-mail de contato</span>

              <input
                value={preferencias.emailContato}
                onChange={(event) =>
                  atualizarPreferencia("emailContato", event.target.value)
                }
                placeholder="Ex: seuemail@email.com"
                style={inputStyle}
                type="email"
              />
            </label>

            <p style={isDesktop ? desktopHelperFullStyle : helperTextStyle}>
              Esses dados ficam apenas no navegador. O login e as obras já usam
              Supabase, mas essas preferências continuam locais.
            </p>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={miniTitleStyle}>APARÊNCIA</span>
            <h2 style={sectionTitleStyle}>Tema visual</h2>
          </div>

          <div style={isDesktop ? desktopThemeGridStyle : themeGridStyle}>
            {ORDEM_TEMAS_VISUAIS.map((temaVisual) => {
              const tema = TEMAS_VISUAIS[temaVisual];
              const temaAtivo = preferencias.temaVisual === temaVisual;

              return (
                <button
                  key={temaVisual}
                  type="button"
                  onClick={() => atualizarTemaVisual(temaVisual)}
                  style={
                    temaAtivo
                      ? isDesktop
                        ? desktopThemeOptionActiveStyle
                        : themeOptionActiveStyle
                      : isDesktop
                      ? desktopThemeOptionStyle
                      : themeOptionStyle
                  }
                  aria-pressed={temaAtivo}
                >
                  <span
                    style={{
                      ...themePreviewStyle,
                      background: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
                      boxShadow: `0 0 22px ${tema.glowPrimary}`,
                    }}
                  >
                    {tema.icone}
                  </span>

                  <span style={themeTextBoxStyle}>
                    <strong style={themeTitleStyle}>{tema.nome}</strong>
                    <span style={themeDescriptionStyle}>{tema.descricao}</span>
                  </span>

                  {temaAtivo && <span style={themeActiveBadgeStyle}>Ativo</span>}
                </button>
              );
            })}
          </div>

          <p style={helperTextStyle}>
            O tema escolhido fica salvo no navegador e já alimenta as cores globais
            do app.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={miniTitleStyle}>PREFERÊNCIAS</span>
            <h2 style={sectionTitleStyle}>Experiência</h2>
          </div>

          <div style={isDesktop ? desktopSettingsGridStyle : settingsGridStyle}>
            <button
              type="button"
              onClick={() =>
                atualizarPreferencia(
                  "receberAvisos",
                  !preferencias.receberAvisos
                )
              }
              style={
                preferencias.receberAvisos
                  ? isDesktop
                    ? desktopPreferenceActiveStyle
                    : preferenceActiveStyle
                  : isDesktop
                  ? desktopPreferenceStyle
                  : preferenceStyle
              }
            >
              <span style={preferenceIconStyle}>🔔</span>
              <strong style={preferenceTitleStyle}>Avisos ativos</strong>
              <span style={preferenceTextStyle}>
                {preferencias.receberAvisos
                  ? "Você quer receber avisos locais de novidades."
                  : "Avisos locais desativados nesta conta."}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                atualizarPreferencia(
                  "leituraConfortavel",
                  !preferencias.leituraConfortavel
                )
              }
              style={
                preferencias.leituraConfortavel
                  ? isDesktop
                    ? desktopPreferenceActiveStyle
                    : preferenceActiveStyle
                  : isDesktop
                  ? desktopPreferenceStyle
                  : preferenceStyle
              }
            >
              <span style={preferenceIconStyle}>📖</span>
              <strong style={preferenceTitleStyle}>Leitura confortável</strong>
              <span style={preferenceTextStyle}>
                {preferencias.leituraConfortavel
                  ? "Priorizar espaçamento e legibilidade."
                  : "Usar leitura mais compacta futuramente."}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                atualizarPreferencia(
                  "reduzirEfeitos",
                  !preferencias.reduzirEfeitos
                )
              }
              style={
                preferencias.reduzirEfeitos
                  ? isDesktop
                    ? desktopPreferenceActiveStyle
                    : preferenceActiveStyle
                  : isDesktop
                  ? desktopPreferenceStyle
                  : preferenceStyle
              }
            >
              <span style={preferenceIconStyle}>✨</span>
              <strong style={preferenceTitleStyle}>Reduzir efeitos</strong>
              <span style={preferenceTextStyle}>
                {preferencias.reduzirEfeitos
                  ? "Preferência para menos brilho/animação."
                  : "Visual premium completo ativo."}
              </span>
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={miniTitleStyle}>DADOS LOCAIS</span>
            <h2 style={sectionTitleStyle}>Resumo do navegador</h2>
          </div>

          <div style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.obras}</strong>
              <span style={statLabelStyle}>obras criadas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.notificacoes}</strong>
              <span style={statLabelStyle}>notificações</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.lancamentos}</strong>
              <span style={statLabelStyle}>lançamentos salvos</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.favoritas}</strong>
              <span style={statLabelStyle}>favoritas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.concluidas}</strong>
              <span style={statLabelStyle}>concluídas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>
                {resumo.seguindoObras + resumo.seguindoAutores}
              </strong>
              <span style={statLabelStyle}>seguindo</span>
            </div>
          </div>

          <p style={lastUpdateStyle}>
            Resumo atualizado às {resumoAtualizadoEm || "--:--"}.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={miniTitleStyle}>AÇÕES</span>
            <h2 style={sectionTitleStyle}>Controle local</h2>
          </div>

          <div style={isDesktop ? desktopActionsStyle : actionsStyle}>
            <button type="button" onClick={salvar} style={primaryButtonStyle}>
              Salvar configurações
            </button>

            <button
              type="button"
              onClick={copiarBackup}
              style={secondaryButtonStyle}
            >
              Copiar backup local
            </button>

            <button
              type="button"
              onClick={atualizarResumo}
              style={secondaryButtonStyle}
            >
              Atualizar resumo
            </button>

            <button
              type="button"
              onClick={restaurarPadrao}
              style={dangerButtonStyle}
            >
              Restaurar preferências
            </button>
          </div>
        </section>

        <section style={isDesktop ? desktopInfoBoxStyle : infoBoxStyle}>
          <h2 style={infoTitleStyle}>Preferências locais</h2>

          <p style={infoTextStyle}>
            Algumas preferências desta tela ficam salvas neste navegador. O projeto
            já está integrado ao Supabase nas áreas principais, mas tema visual,
            backup local e preferências de experiência continuam locais.
          </p>
        </section>
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-primary, rgba(124,58,237,0.32)), transparent 31%), radial-gradient(circle at 88% 12%, var(--historietas-glow-secondary, rgba(249,115,22,0.15)), transparent 25%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(900px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 96px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
  padding: "6px 0",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 138px)",
  overflow: "visible",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #F5F3FF 0%, #C4B5FD 42%, #FDBA74 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px rgba(139, 92, 246, 0.24)",
  overflow: "visible",
  whiteSpace: "nowrap",
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "28px",
  border: "1px solid rgba(251,191,36,0.16)",
  background:
    "linear-gradient(135deg, rgba(31,16,52,0.98) 0%, rgba(12,7,23,0.99) 100%)",
  boxShadow:
    "0 18px 48px rgba(0,0,0,0.32), 0 0 36px rgba(124,58,237,0.12)",
  overflow: "hidden",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 18% 14%, var(--historietas-glow-secondary, rgba(249,115,22,0.28)), transparent 32%), radial-gradient(circle at 82% 14%, var(--historietas-glow-primary, rgba(124,58,237,0.52)), transparent 38%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "20px 16px",
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  minWidth: 0,
  textAlign: "center",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 40%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  whiteSpace: "nowrap",
  boxShadow: "none",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.4vw, 60px)",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 48%, #FDBA74 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.58,
  fontWeight: 650,
  maxWidth: "620px",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: "8px",
  margin: "4px auto 0",
  width: "min(420px, 100%)",
  minWidth: 0,
};

const primaryLinkStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryLinkStyle: CSSProperties = {
  ...primaryLinkStyle,
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 40%, transparent)",
  boxShadow: "none",
};

const messageStyle: CSSProperties = {
  display: "block",
  marginTop: "12px",
  padding: "9px 12px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(18,12,30,0.92) 100%)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "20px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  marginBottom: "10px",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 7vw, 34px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  ...safeTextStyle,
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(33,24,50,0.92) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.20)",
  minWidth: 0,
  overflow: "hidden",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#18181B",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  color: "#A1A1AA",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 650,
  ...safeTextStyle,
};

const settingsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const themeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const themeOptionStyle: CSSProperties = {
  position: "relative",
  minHeight: "124px",
  borderRadius: "22px",
  padding: "13px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(18,12,30,0.82)",
  color: "#FFFFFF",
  display: "grid",
  gridTemplateColumns: "44px minmax(0, 1fr)",
  alignItems: "center",
  gap: "11px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
  minWidth: 0,
  overflow: "hidden",
};

const themeOptionActiveStyle: CSSProperties = {
  ...themeOptionStyle,
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 46%, transparent)",
  background:
    "radial-gradient(circle at 92% 0%, var(--historietas-glow-secondary, rgba(249,115,22,0.16)), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, transparent), rgba(18,12,30,0.92))",
  boxShadow:
    "0 14px 34px rgba(0,0,0,0.18), 0 0 24px var(--historietas-glow-primary, rgba(124,58,237,0.12))",
};

const themePreviewStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "17px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const themeTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const themeTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const themeDescriptionStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

const themeActiveBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  maxWidth: "calc(100% - 20px)",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const preferenceStyle: CSSProperties = {
  minHeight: "154px",
  borderRadius: "22px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(18,12,30,0.82)",
  color: "#FFFFFF",
  display: "grid",
  justifyItems: "start",
  alignContent: "start",
  gap: "8px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
  minWidth: 0,
  overflow: "hidden",
};

const preferenceActiveStyle: CSSProperties = {
  ...preferenceStyle,
  border: "1px solid rgba(249, 115, 22, 0.30)",
  background:
    "radial-gradient(circle at 92% 0%, rgba(249,115,22,0.16), transparent 34%), linear-gradient(135deg, rgba(124,58,237,0.24), rgba(18,12,30,0.92))",
  boxShadow:
    "0 14px 34px rgba(0,0,0,0.18), 0 0 24px rgba(124,58,237,0.12)",
};

const preferenceIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "15px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
};

const preferenceTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const preferenceTextStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "12px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  ...safeTextStyle,
};

const lastUpdateStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#A1A1AA",
  fontSize: "11px",
  fontWeight: 750,
  ...safeTextStyle,
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  padding: "12px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(33,24,50,0.90) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const buttonBaseStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  padding: "0 12px",
  fontSize: "11.5px",
  lineHeight: 1.12,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  boxShadow: "none",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 52%, transparent)",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 74%, #FFFFFF) 100%)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, rgba(255,255,255,0.08))",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.035))",
  color: "#DDD6FE",
  boxShadow: "none",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(239, 68, 68, 0.26)",
  background: "rgba(239, 68, 68, 0.105)",
  color: "#FCA5A5",
  boxShadow: "none",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "22px",
  padding: "15px",
  borderRadius: "22px",
  background: "rgba(249, 115, 22, 0.075)",
  border: "1px solid rgba(249, 115, 22, 0.18)",
  minWidth: 0,
  overflow: "hidden",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.58,
  fontWeight: 650,
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 56px))",
  padding: "24px 0 88px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
  boxShadow:
    "0 24px 62px rgba(0,0,0,0.34), 0 0 42px var(--historietas-glow-primary, rgba(124,58,237,0.14))",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "34px 42px",
  gap: "14px",
  maxWidth: "900px",
  margin: "0 auto",
  textAlign: "center",
  justifyItems: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(52px, 5vw, 68px)",
  lineHeight: 1.08,
  maxWidth: "820px",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridTemplateColumns: "repeat(2, minmax(190px, 240px))",
  justifyContent: "center",
  maxWidth: "520px",
};

const desktopAccountCardStyle: CSSProperties = {
  ...cardStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  padding: "18px",
};

const desktopHelperFullStyle: CSSProperties = {
  ...helperTextStyle,
  gridColumn: "1 / -1",
};

const desktopThemeGridStyle: CSSProperties = {
  ...themeGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const desktopThemeOptionStyle: CSSProperties = {
  ...themeOptionStyle,
  minHeight: "118px",
  padding: "14px",
};

const desktopThemeOptionActiveStyle: CSSProperties = {
  ...themeOptionActiveStyle,
  minHeight: "118px",
  padding: "14px",
};

const desktopSettingsGridStyle: CSSProperties = {
  ...settingsGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const desktopPreferenceStyle: CSSProperties = {
  ...preferenceStyle,
  minHeight: "146px",
  padding: "16px",
};

const desktopPreferenceActiveStyle: CSSProperties = {
  ...preferenceActiveStyle,
  minHeight: "146px",
  padding: "16px",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "10px",
};

const desktopActionsStyle: CSSProperties = {
  ...actionsStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  padding: "14px",
  borderRadius: "26px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  padding: "18px",
  display: "grid",
  gridTemplateColumns: "240px minmax(0, 1fr)",
  alignItems: "center",
  gap: "18px",
};
