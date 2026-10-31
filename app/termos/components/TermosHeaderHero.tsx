import Link from "next/link";
import { type TextoTraduzido } from "../lib/termos-content";
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
  pageTitleStyle,
} from "../styles/termos-page-styles";
import { TermosSvgIcon } from "./TermosSvgIcon";

type TermosHeaderHeroProps = {
  t: (texto: TextoTraduzido) => string;
};

export function TermosHeaderHero({ t }: TermosHeaderHeroProps) {
  return (
    <>
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
          <TermosSvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
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
          <TermosSvgIcon name="scale" size={31} strokeWidth={2.05} />
        </span>

        <div style={heroTextStyle}>
          <span style={heroBadgeStyle}>
            <TermosSvgIcon name="check" size={16} strokeWidth={2.35} />
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
    </>
  );
}
