import Link from "next/link";
import { PoliticaPrivacidadeSvgIcon } from "./PoliticaPrivacidadeSvgIcon";
import type { TextoTraduzido } from "../lib/politica-de-privacidade-content";
import {
  footerIconStyle,
  footerLinkStyle,
  footerStyle,
  footerTextStyle,
} from "../styles/politica-de-privacidade-styles";

type PoliticaPrivacidadeFooterProps = {
  t: (texto: TextoTraduzido) => string;
};

export function PoliticaPrivacidadeFooter({
  t,
}: PoliticaPrivacidadeFooterProps) {
  return (
    <footer style={footerStyle}>
      <span style={footerIconStyle}>
        <PoliticaPrivacidadeSvgIcon name="shield" size={24} strokeWidth={2.05} />
      </span>

      <div style={footerTextStyle}>
        <strong>
          {t({
            pt: "Consulte os documentos relacionados",
            en: "Review related documents",
            es: "Consulta los documentos relacionados",
          })}
        </strong>
        <p>
          {t({
            pt: "Os Termos de Uso e as Diretrizes da Comunidade complementam esta Política de Privacidade.",
            en: "The Terms of Use and Community Guidelines complement this Privacy Policy.",
            es: "Los Términos de Uso y las Normas de la Comunidad complementan esta Política de Privacidad.",
          })}
        </p>
      </div>

      <Link
        href="/termos"
        style={footerLinkStyle}
      >
        <span>
          {t({
            pt: "Termos e políticas",
            en: "Terms and policies",
            es: "Términos y políticas",
          })}
        </span>
        <PoliticaPrivacidadeSvgIcon name="arrowRight" size={19} strokeWidth={2.3} />
      </Link>
    </footer>
  );
}
