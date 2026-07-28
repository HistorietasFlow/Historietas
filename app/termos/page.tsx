"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import type { HistorietasLanguage } from "../../lib/i18n";

type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

type IconName =
  | "arrowLeft"
  | "arrowRight"
  | "file"
  | "shield"
  | "users"
  | "scale"
  | "book"
  | "lock"
  | "copyright"
  | "check"
  | "help"
  | "settings"
  | "info";

type DocumentoPolitica = {
  href: string;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
  temas: TextoTraduzido[];
};

type PrincipioPlataforma = {
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

type EtapaLeitura = {
  numero: string;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

type AtalhoPoliticas = {
  href: string;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

const DOCUMENTOS_POLITICAS: DocumentoPolitica[] = [
  {
    href: "/termos-de-uso",
    icon: "file",
    titulo: {
      pt: "Termos de Uso",
      en: "Terms of Use",
      es: "Términos de Uso",
    },
    descricao: {
      pt: "Explicam as condições para criar uma conta, publicar, ler e utilizar os recursos do Historietas.",
      en: "Explain the conditions for creating an account, publishing, reading, and using Historietas features.",
      es: "Explican las condiciones para crear una cuenta, publicar, leer y utilizar las funciones de Historietas.",
    },
    temas: [
      {
        pt: "Conta e acesso",
        en: "Account and access",
        es: "Cuenta y acceso",
      },
      {
        pt: "Publicação",
        en: "Publishing",
        es: "Publicación",
      },
      {
        pt: "Uso da plataforma",
        en: "Platform use",
        es: "Uso de la plataforma",
      },
      {
        pt: "Responsabilidades",
        en: "Responsibilities",
        es: "Responsabilidades",
      },
    ],
  },
  {
    href: "/politica-de-privacidade",
    icon: "shield",
    titulo: {
      pt: "Política de Privacidade",
      en: "Privacy Policy",
      es: "Política de Privacidad",
    },
    descricao: {
      pt: "Mostra quais dados podem ser utilizados, por que são necessários e quais controles pertencem ao usuário.",
      en: "Shows which data may be used, why it is needed, and which controls belong to the user.",
      es: "Muestra qué datos pueden utilizarse, por qué son necesarios y qué controles pertenecen al usuario.",
    },
    temas: [
      {
        pt: "Dados da conta",
        en: "Account data",
        es: "Datos de la cuenta",
      },
      {
        pt: "Privacidade",
        en: "Privacy",
        es: "Privacidad",
      },
      {
        pt: "Armazenamento",
        en: "Storage",
        es: "Almacenamiento",
      },
      {
        pt: "Direitos do usuário",
        en: "User rights",
        es: "Derechos del usuario",
      },
    ],
  },
  {
    href: "/diretrizes-da-comunidade",
    icon: "users",
    titulo: {
      pt: "Diretrizes da Comunidade",
      en: "Community Guidelines",
      es: "Normas de la Comunidad",
    },
    descricao: {
      pt: "Definem as regras de convivência, publicação responsável, moderação e proteção da comunidade.",
      en: "Define the rules for respectful interaction, responsible publishing, moderation, and community protection.",
      es: "Definen las reglas de convivencia, publicación responsable, moderación y protección de la comunidad.",
    },
    temas: [
      {
        pt: "Respeito",
        en: "Respect",
        es: "Respeto",
      },
      {
        pt: "Conteúdo permitido",
        en: "Allowed content",
        es: "Contenido permitido",
      },
      {
        pt: "Moderação",
        en: "Moderation",
        es: "Moderación",
      },
      {
        pt: "Denúncias",
        en: "Reports",
        es: "Denuncias",
      },
    ],
  },
];

const PRINCIPIOS_PLATAFORMA: PrincipioPlataforma[] = [
  {
    icon: "copyright",
    titulo: {
      pt: "Respeito à autoria",
      en: "Respect for authorship",
      es: "Respeto por la autoría",
    },
    descricao: {
      pt: "Cada pessoa deve publicar apenas conteúdo próprio ou que tenha autorização para utilizar.",
      en: "Each person must publish only content they own or are authorized to use.",
      es: "Cada persona debe publicar solo contenido propio o que tenga autorización para utilizar.",
    },
  },
  {
    icon: "shield",
    titulo: {
      pt: "Privacidade com controle",
      en: "Privacy with control",
      es: "Privacidad con control",
    },
    descricao: {
      pt: "O usuário escolhe a visibilidade de diferentes áreas do perfil e deve compreender como seus dados são utilizados.",
      en: "Users choose the visibility of different profile areas and should understand how their data is used.",
      es: "El usuario elige la visibilidad de distintas áreas del perfil y debe comprender cómo se utilizan sus datos.",
    },
  },
  {
    icon: "lock",
    titulo: {
      pt: "Segurança da conta",
      en: "Account security",
      es: "Seguridad de la cuenta",
    },
    descricao: {
      pt: "Senhas, sessões e informações de acesso devem ser protegidas e nunca compartilhadas com terceiros.",
      en: "Passwords, sessions, and access information must be protected and never shared with third parties.",
      es: "Las contraseñas, sesiones y datos de acceso deben protegerse y nunca compartirse con terceros.",
    },
  },
  {
    icon: "users",
    titulo: {
      pt: "Convivência responsável",
      en: "Responsible interaction",
      es: "Convivencia responsable",
    },
    descricao: {
      pt: "Comentários, avaliações e publicações devem respeitar outras pessoas e contribuir para um ambiente seguro.",
      en: "Comments, ratings, and posts should respect others and contribute to a safe environment.",
      es: "Los comentarios, valoraciones y publicaciones deben respetar a otras personas y contribuir a un entorno seguro.",
    },
  },
];

const ETAPAS_LEITURA: EtapaLeitura[] = [
  {
    numero: "1",
    titulo: {
      pt: "Escolha o documento",
      en: "Choose the document",
      es: "Elige el documento",
    },
    descricao: {
      pt: "Abra a página relacionada à sua dúvida ou ao recurso que você pretende utilizar.",
      en: "Open the page related to your question or the feature you intend to use.",
      es: "Abre la página relacionada con tu duda o con la función que deseas utilizar.",
    },
  },
  {
    numero: "2",
    titulo: {
      pt: "Leia os pontos importantes",
      en: "Read the important points",
      es: "Lee los puntos importantes",
    },
    descricao: {
      pt: "Observe as regras sobre conta, conteúdo, privacidade, segurança e participação na comunidade.",
      en: "Review the rules about accounts, content, privacy, security, and community participation.",
      es: "Revisa las reglas sobre cuenta, contenido, privacidad, seguridad y participación en la comunidad.",
    },
  },
  {
    numero: "3",
    titulo: {
      pt: "Consulte quando precisar",
      en: "Review whenever needed",
      es: "Consulta cuando lo necesites",
    },
    descricao: {
      pt: "As páginas permanecem disponíveis para esclarecer dúvidas antes ou depois de utilizar o Historietas.",
      en: "The pages remain available to answer questions before or after using Historietas.",
      es: "Las páginas permanecen disponibles para resolver dudas antes o después de utilizar Historietas.",
    },
  },
];

const ATALHOS_POLITICAS: AtalhoPoliticas[] = [
  {
    href: "/ajuda",
    icon: "help",
    titulo: {
      pt: "Central de ajuda",
      en: "Help center",
      es: "Centro de ayuda",
    },
    descricao: {
      pt: "Encontre respostas sobre os recursos do site.",
      en: "Find answers about site features.",
      es: "Encuentra respuestas sobre las funciones del sitio.",
    },
  },
  {
    href: "/configuracoes",
    icon: "settings",
    titulo: {
      pt: "Configurações",
      en: "Settings",
      es: "Configuración",
    },
    descricao: {
      pt: "Gerencie conta, privacidade, dados e preferências.",
      en: "Manage your account, privacy, data, and preferences.",
      es: "Gestiona tu cuenta, privacidad, datos y preferencias.",
    },
  },
];

function traduzirTexto(
  texto: TextoTraduzido,
  language: HistorietasLanguage,
) {
  if (language === "en") {
    return texto.en;
  }

  if (language === "es") {
    return texto.es;
  }

  return texto.pt;
}

function SvgIcon({
  name,
  size = 24,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<IconName, ReactNode> = {
    arrowLeft: (
      <>
        <path {...common} d="M19 12H5" />
        <path {...common} d="m12 19-7-7 7-7" />
      </>
    ),
    arrowRight: (
      <>
        <path {...common} d="M5 12h14" />
        <path {...common} d="m12 5 7 7-7 7" />
      </>
    ),
    file: (
      <>
        <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...common} d="M14 2v6h6" />
        <path {...common} d="M8 13h8M8 17h6" />
      </>
    ),
    shield: (
      <>
        <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path {...common} d="m9 12 2 2 4-4" />
      </>
    ),
    users: (
      <>
        <path {...common} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle {...common} cx="9" cy="7" r="4" />
        <path {...common} d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path {...common} d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    scale: (
      <>
        <path {...common} d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7Z" />
        <path {...common} d="M8 21h8" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      </>
    ),
    lock: (
      <>
        <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
        <path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    copyright: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M15 9.5a4 4 0 1 0 0 5" />
      </>
    ),
    check: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m8 12 2.6 2.6L16 9" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.6 9.1a2.7 2.7 0 0 1 5.1 1.2c0 2-2.7 2.3-2.7 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
      </>
    ),
    info: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 11v5M12 8h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}

export default function TermosPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-termos-root="true"
    >
      <style>{`${historietasThemeCss}${termosPageCss}`}</style>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/configuracoes"
            style={backButtonStyle}
            aria-label={t({
              pt: "Voltar para Configurações",
              en: "Back to Settings",
              es: "Volver a Configuración",
            })}
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "INFORMAÇÕES LEGAIS",
                en: "LEGAL INFORMATION",
                es: "INFORMACIÓN LEGAL",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Termos e políticas",
                en: "Terms and policies",
                es: "Términos y políticas",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <SvgIcon name="scale" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <SvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Área oficial do Historietas",
                en: "Official Historietas area",
                es: "Área oficial de Historietas",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Conheça seus direitos e responsabilidades",
                en: "Understand your rights and responsibilities",
                es: "Conoce tus derechos y responsabilidades",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Consulte os documentos que explicam o funcionamento da plataforma, o tratamento de dados e as regras para participar da comunidade.",
                en: "Review the documents that explain how the platform works, how data is handled, and the rules for participating in the community.",
                es: "Consulta los documentos que explican el funcionamiento de la plataforma, el tratamiento de datos y las reglas para participar en la comunidad.",
              })}
            </p>
          </div>
        </section>

        <section
          style={sectionStyle}
          aria-labelledby="documentos-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "DOCUMENTOS PRINCIPAIS",
                  en: "MAIN DOCUMENTS",
                  es: "DOCUMENTOS PRINCIPALES",
                })}
              </span>
              <h2
                id="documentos-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Escolha o que deseja consultar",
                  en: "Choose what you want to review",
                  es: "Elige lo que deseas consultar",
                })}
              </h2>
            </div>

            <span style={documentsCountStyle}>
              {DOCUMENTOS_POLITICAS.length}{" "}
              {t({
                pt: "documentos",
                en: "documents",
                es: "documentos",
              })}
            </span>
          </div>

          <div style={documentsGridStyle}>
            {DOCUMENTOS_POLITICAS.map((documento) => (
              <Link
                key={documento.href}
                href={documento.href}
                className="termos-document-link"
              >
                <span className="termos-document-icon">
                  <SvgIcon
                    name={documento.icon}
                    size={27}
                    strokeWidth={2.05}
                  />
                </span>

                <span className="termos-document-copy">
                  <strong>{t(documento.titulo)}</strong>
                  <span className="termos-document-description">
                    {t(documento.descricao)}
                  </span>

                  <span className="termos-document-topics">
                    {documento.temas.map((tema) => (
                      <span
                        key={`${documento.href}-${tema.pt}`}
                        className="termos-topic-chip"
                      >
                        {t(tema)}
                      </span>
                    ))}
                  </span>
                </span>

                <span className="termos-document-arrow">
                  <SvgIcon name="arrowRight" size={22} strokeWidth={2.35} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section
          style={sectionStyle}
          aria-labelledby="principios-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "BASE DA PLATAFORMA",
                  en: "PLATFORM FOUNDATION",
                  es: "BASE DE LA PLATAFORMA",
                })}
              </span>
              <h2
                id="principios-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Princípios importantes",
                  en: "Important principles",
                  es: "Principios importantes",
                })}
              </h2>
            </div>
          </div>

          <div style={principlesGridStyle}>
            {PRINCIPIOS_PLATAFORMA.map((principio) => (
              <article key={principio.titulo.pt} className="termos-principle-card">
                <span className="termos-principle-icon">
                  <SvgIcon
                    name={principio.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>
                <div className="termos-principle-copy">
                  <h3>{t(principio.titulo)}</h3>
                  <p>{t(principio.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          style={sectionStyle}
          aria-labelledby="leitura-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "COMO CONSULTAR",
                  en: "HOW TO REVIEW",
                  es: "CÓMO CONSULTAR",
                })}
              </span>
              <h2
                id="leitura-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Use esta área em três passos",
                  en: "Use this area in three steps",
                  es: "Usa esta área en tres pasos",
                })}
              </h2>
            </div>
          </div>

          <div style={stepsGridStyle}>
            {ETAPAS_LEITURA.map((etapa) => (
              <article key={etapa.numero} className="termos-step-card">
                <span className="termos-step-number">{etapa.numero}</span>
                <div className="termos-step-copy">
                  <h3>{t(etapa.titulo)}</h3>
                  <p>{t(etapa.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside style={noticeStyle}>
          <span style={noticeIconStyle}>
            <SvgIcon name="info" size={24} strokeWidth={2.1} />
          </span>

          <div style={noticeTextStyle}>
            <strong>
              {t({
                pt: "Documentos transparentes e acessíveis",
                en: "Transparent and accessible documents",
                es: "Documentos transparentes y accesibles",
              })}
            </strong>
            <p>
              {t({
                pt: "Cada documento deve apresentar seu conteúdo de forma clara e indicar quando foi atualizado. Consulte novamente esta área sempre que tiver dúvidas sobre as regras do Historietas.",
                en: "Each document should present its content clearly and indicate when it was updated. Review this area again whenever you have questions about Historietas rules.",
                es: "Cada documento debe presentar su contenido con claridad e indicar cuándo fue actualizado. Consulta nuevamente esta área cuando tengas dudas sobre las reglas de Historietas.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={quickAccessSectionStyle}
          aria-labelledby="atalhos-politicas-titulo"
        >
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "ACESSO RÁPIDO",
                  en: "QUICK ACCESS",
                  es: "ACCESO RÁPIDO",
                })}
              </span>
              <h2
                id="atalhos-politicas-titulo"
                style={sectionTitleStyle}
              >
                {t({
                  pt: "Outras áreas úteis",
                  en: "Other useful areas",
                  es: "Otras áreas útiles",
                })}
              </h2>
            </div>
          </div>

          <div style={quickAccessGridStyle}>
            {ATALHOS_POLITICAS.map((atalho) => (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="termos-quick-link"
              >
                <span className="termos-quick-icon">
                  <SvgIcon name={atalho.icon} size={23} strokeWidth={2.05} />
                </span>

                <span className="termos-quick-copy">
                  <strong>{t(atalho.titulo)}</strong>
                  <span>{t(atalho.descricao)}</span>
                </span>

                <span className="termos-quick-arrow">
                  <SvgIcon name="arrowRight" size={20} strokeWidth={2.25} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const termosPageCss = `
  [data-historietas-termos-root="true"] {
    --termos-card: color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent);
    --termos-card-strong: color-mix(in srgb, var(--historietas-surface-strong, #120C1E) 95%, transparent);
    --termos-control: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent);
    --termos-control-hover: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent);
    --termos-border: var(--historietas-border-soft, rgba(255,255,255,0.10));
    --termos-muted: var(--historietas-text-secondary, #D4D4D8);
  }

  [data-historietas-termos-root="true"] .termos-document-link {
    min-height: 210px;
    border: 1px solid var(--termos-border);
    border-radius: 20px;
    padding: 17px;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 30px;
    align-items: start;
    gap: 13px;
    background: var(--termos-card);
    color: inherit;
    text-decoration: none;
    transition:
      transform 160ms ease,
      background 160ms ease,
      border-color 160ms ease;
  }

  [data-historietas-termos-root="true"] .termos-document-link:hover {
    transform: translateY(-2px);
    background: var(--termos-card-strong);
    border-color: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 65%,
      var(--termos-border)
    );
  }

  [data-historietas-termos-root="true"] .termos-document-link:focus-visible,
  [data-historietas-termos-root="true"] .termos-quick-link:focus-visible {
    outline: 3px solid color-mix(
      in srgb,
      var(--historietas-accent, #F97316) 70%,
      transparent
    );
    outline-offset: 3px;
  }

  [data-historietas-termos-root="true"] .termos-document-icon {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 22%,
      var(--termos-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-root="true"] .termos-document-copy {
    min-width: 0;
    display: grid;
    gap: 8px;
  }

  [data-historietas-termos-root="true"] .termos-document-copy > strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 18px;
    line-height: 1.12;
    font-weight: 880;
    letter-spacing: -0.025em;
  }

  [data-historietas-termos-root="true"] .termos-document-description {
    color: var(--termos-muted);
    font-size: 13px;
    line-height: 1.5;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-root="true"] .termos-document-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 3px;
  }

  [data-historietas-termos-root="true"] .termos-topic-chip {
    min-height: 27px;
    border: 1px solid var(--termos-border);
    border-radius: 999px;
    padding: 6px 9px;
    display: inline-flex;
    align-items: center;
    background: var(--termos-control);
    color: var(--termos-muted);
    font-size: 10px;
    line-height: 1;
    font-weight: 760;
  }

  [data-historietas-termos-root="true"] .termos-document-arrow {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--termos-muted);
    transition: transform 160ms ease;
  }

  [data-historietas-termos-root="true"] .termos-document-link:hover .termos-document-arrow {
    transform: translateX(2px);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-root="true"] .termos-principle-card {
    min-height: 138px;
    border: 1px solid var(--termos-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--termos-card);
  }

  [data-historietas-termos-root="true"] .termos-principle-icon,
  [data-historietas-termos-root="true"] .termos-quick-icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--termos-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-root="true"] .termos-principle-copy,
  [data-historietas-termos-root="true"] .termos-step-copy {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-termos-root="true"] .termos-principle-copy h3,
  [data-historietas-termos-root="true"] .termos-step-copy h3 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.2;
    font-weight: 820;
  }

  [data-historietas-termos-root="true"] .termos-principle-copy p,
  [data-historietas-termos-root="true"] .termos-step-copy p {
    margin: 0;
    color: var(--termos-muted);
    font-size: 12px;
    line-height: 1.48;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-root="true"] .termos-step-card {
    min-height: 126px;
    border: 1px solid var(--termos-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--termos-card);
  }

  [data-historietas-termos-root="true"] .termos-step-number {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font-size: 14px;
    line-height: 1;
    font-weight: 900;
  }

  [data-historietas-termos-root="true"] .termos-quick-link {
    min-height: 76px;
    border: 1px solid var(--termos-border);
    border-radius: 16px;
    padding: 12px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) 26px;
    align-items: center;
    gap: 10px;
    background: var(--termos-card);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, background 160ms ease;
  }

  [data-historietas-termos-root="true"] .termos-quick-link:hover {
    transform: translateY(-1px);
    background: var(--termos-control-hover);
  }

  [data-historietas-termos-root="true"] .termos-quick-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  [data-historietas-termos-root="true"] .termos-quick-copy strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.15;
    font-weight: 820;
  }

  [data-historietas-termos-root="true"] .termos-quick-copy span {
    color: var(--termos-muted);
    font-size: 12px;
    line-height: 1.35;
    font-weight: 550;
  }

  [data-historietas-termos-root="true"] .termos-quick-arrow {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--termos-muted);
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-termos-root="true"] {
    --termos-card: #050505;
    --termos-card-strong: #000000;
    --termos-control: rgba(255,255,255,0.08);
    --termos-control-hover: rgba(255,255,255,0.10);
    --termos-border: rgba(255,255,255,0.18);
    --termos-muted: #A1A1AA;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-termos-root="true"] .termos-document-link:hover {
    border-color: #FFFFFF;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-termos-root="true"] .termos-step-number {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 620px) {
    [data-historietas-termos-root="true"] .termos-document-link {
      min-height: 0;
      grid-template-columns: 44px minmax(0, 1fr) 26px;
      padding: 14px;
    }

    [data-historietas-termos-root="true"] .termos-document-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
    }

    [data-historietas-termos-root="true"] .termos-document-copy > strong {
      font-size: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-termos-root="true"] *,
    [data-historietas-termos-root="true"] *::before,
    [data-historietas-termos-root="true"] *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-page-background, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(920px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 124px",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "center",
  gap: "11px",
  marginBottom: "17px",
};

const backButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

const headerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "2px",
};

const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.16em",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(21px, 5vw, 27px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

const heroStyle: CSSProperties = {
  borderRadius: "24px",
  padding: "clamp(18px, 4vw, 28px)",
  display: "grid",
  gridTemplateColumns: "50px minmax(0, 1fr)",
  alignItems: "start",
  gap: "13px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "27px",
};

const heroIconStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const heroTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

const heroBadgeStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "28px",
  borderRadius: "999px",
  padding: "6px 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 9%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 800,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(24px, 6vw, 38px)",
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: "-0.055em",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "700px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

const sectionStyle: CSSProperties = {
  marginBottom: "28px",
};

const quickAccessSectionStyle: CSSProperties = {
  marginTop: "28px",
};

const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "12px",
};

const sectionKickerStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 4.5vw, 22px)",
  lineHeight: 1.1,
  fontWeight: 870,
  letterSpacing: "-0.035em",
};

const documentsCountStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "7px 10px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 7%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 760,
};

const documentsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(270px, 100%), 1fr))",
  gap: "11px",
};

const principlesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
  gap: "10px",
};

const stepsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(230px, 100%), 1fr))",
  gap: "10px",
};

const noticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "12px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const noticeIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const noticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};

const quickAccessGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "10px",
};