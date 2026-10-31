import Link from "next/link";
import { DiretrizesComunidadeSvgIcon } from "./DiretrizesComunidadeSvgIcon";
import {
  PRINCIPIOS_COMUNIDADE,
  ULTIMA_ATUALIZACAO,
  type TextoTraduzido,
} from "../lib/diretrizes-da-comunidade-content";
import {
  backButtonStyle,
  eyebrowStyle,
  headerStyle,
  headerTextStyle,
  heroBadgeStyle,
  heroDescriptionStyle,
  heroIconStyle,
  heroStyle,
  heroTextStyle,
  heroTitleStyle,
  importantNoticeIconStyle,
  importantNoticeStyle,
  importantNoticeTextStyle,
  pageTitleStyle,
  principlesGridStyle,
  principlesSectionStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionTitleStyle,
  updatedAtStyle,
} from "../styles/diretrizes-da-comunidade-styles";

type DiretrizesComunidadeTranslationProps = {
  t: (texto: TextoTraduzido) => string;
};

export function DiretrizesComunidadeOverview({
  t,
}: DiretrizesComunidadeTranslationProps) {
  return (
    <>
<header style={headerStyle}>
  <Link
    href="/termos"
    style={backButtonStyle}
    aria-label={t({
      pt: "Voltar para Termos e políticas",
      en: "Back to Terms and policies",
      es: "Volver a Términos y políticas",
    })}
  >
    <DiretrizesComunidadeSvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
  </Link>

  <div style={headerTextStyle}>
    <span style={eyebrowStyle}>
      {t({
        pt: "CONVIVÊNCIA E SEGURANÇA",
        en: "COMMUNITY AND SAFETY",
        es: "CONVIVENCIA Y SEGURIDAD",
      })}
    </span>
    <h1 style={pageTitleStyle}>
      {t({
        pt: "Diretrizes da Comunidade",
        en: "Community Guidelines",
        es: "Normas de la Comunidad",
      })}
    </h1>
  </div>
</header>

<section style={heroStyle}>
  <span style={heroIconStyle}>
    <DiretrizesComunidadeSvgIcon name="users" size={31} strokeWidth={2.05} />
  </span>

  <div style={heroTextStyle}>
    <span style={heroBadgeStyle}>
      <DiretrizesComunidadeSvgIcon name="check" size={16} strokeWidth={2.35} />
      {t({
        pt: "Regras para uma comunidade segura",
        en: "Rules for a safer community",
        es: "Reglas para una comunidad segura",
      })}
    </span>

    <h2 style={heroTitleStyle}>
      {t({
        pt: "Crie, leia e participe com respeito",
        en: "Create, read, and participate respectfully",
        es: "Crea, lee y participa con respeto",
      })}
    </h2>

    <p style={heroDescriptionStyle}>
      {t({
        pt: "Estas Diretrizes explicam o que é permitido, o que deve ser evitado e como o Historietas age diante de riscos, abusos e violações.",
        en: "These Guidelines explain what is allowed, what should be avoided, and how Historietas responds to risks, abuse, and violations.",
        es: "Estas Normas explican qué está permitido, qué debe evitarse y cómo actúa Historietas ante riesgos, abusos e infracciones.",
      })}
    </p>

    <span style={updatedAtStyle}>
      {t({
        pt: "Última atualização:",
        en: "Last updated:",
        es: "Última actualización:",
      })}{" "}
      <strong>{t(ULTIMA_ATUALIZACAO)}</strong>
    </span>
  </div>
</section>

<aside style={importantNoticeStyle}>
  <span style={importantNoticeIconStyle}>
    <DiretrizesComunidadeSvgIcon name="info" size={23} strokeWidth={2.1} />
  </span>

  <div style={importantNoticeTextStyle}>
    <strong>
      {t({
        pt: "Resumo importante",
        en: "Important summary",
        es: "Resumen importante",
      })}
    </strong>
    <p>
      {t({
        pt: "O Historietas apoia liberdade criativa, críticas e debates. Essa liberdade não inclui assédio, exploração, fraude, ameaças, plágio ou exposição indevida de outras pessoas.",
        en: "Historietas supports creative freedom, criticism, and debate. That freedom does not include harassment, exploitation, fraud, threats, plagiarism, or improper exposure of others.",
        es: "Historietas apoya la libertad creativa, las críticas y los debates. Esa libertad no incluye acoso, explotación, fraude, amenazas, plagio ni exposición indebida de otras personas.",
      })}
    </p>
  </div>
</aside>

<section
  style={principlesSectionStyle}
  aria-labelledby="principios-diretrizes"
>
  <div style={sectionHeadingStyle}>
    <span style={sectionKickerStyle}>
      {t({
        pt: "PRINCÍPIOS",
        en: "PRINCIPLES",
        es: "PRINCIPIOS",
      })}
    </span>
    <h2
      id="principios-diretrizes"
      style={sectionTitleStyle}
    >
      {t({
        pt: "A base da comunidade",
        en: "The foundation of the community",
        es: "La base de la comunidad",
      })}
    </h2>
  </div>

  <div style={principlesGridStyle}>
    {PRINCIPIOS_COMUNIDADE.map((principio) => (
      <article
        key={principio.titulo.pt}
        className="diretrizes-principle"
      >
        <span className="diretrizes-principle-icon">
          <DiretrizesComunidadeSvgIcon
            name={principio.icon}
            size={24}
            strokeWidth={2.05}
          />
        </span>

        <div className="diretrizes-principle-copy">
          <h3>{t(principio.titulo)}</h3>
          <p>{t(principio.descricao)}</p>
        </div>
      </article>
    ))}
  </div>
</section>
    </>
  );
}
