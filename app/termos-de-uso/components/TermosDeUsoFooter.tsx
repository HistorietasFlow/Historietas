import Link from "next/link";
import { TermosDeUsoSvgIcon } from "./TermosDeUsoSvgIcon";
import { type TextoTraduzido } from "../lib/termos-de-uso-content";
import {
  footerIconStyle,
  footerLinkStyle,
  footerStyle,
  footerTextStyle,
} from "../styles/termos-de-uso-styles";

type TermosDeUsoFooterProps = {
  t: (texto: TextoTraduzido) => string;
};

export function TermosDeUsoFooter({
  t,
}: TermosDeUsoFooterProps) {
  return (
        <footer style={footerStyle}>
          <span style={footerIconStyle}>
            <TermosDeUsoSvgIcon name="scale" size={24} strokeWidth={2.05} />
          </span>

          <div style={footerTextStyle}>
            <strong>
              {t({
                pt: "Consulte os demais documentos",
                en: "Review the other documents",
                es: "Consulta los demás documentos",
              })}
            </strong>
            <p>
              {t({
                pt: "A Política de Privacidade e as Diretrizes da Comunidade complementam estes Termos de Uso.",
                en: "The Privacy Policy and Community Guidelines complement these Terms of Use.",
                es: "La Política de Privacidad y las Normas de la Comunidad complementan estos Términos de Uso.",
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
            <TermosDeUsoSvgIcon name="arrowRight" size={19} strokeWidth={2.3} />
          </Link>
        </footer>
  );
}
