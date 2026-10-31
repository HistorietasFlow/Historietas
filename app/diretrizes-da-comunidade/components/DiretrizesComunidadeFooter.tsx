import Link from "next/link";
import { DiretrizesComunidadeSvgIcon } from "./DiretrizesComunidadeSvgIcon";
import type { TextoTraduzido } from "../lib/diretrizes-da-comunidade-content";
import {
  footerIconStyle,
  footerLinkStyle,
  footerStyle,
  footerTextStyle,
} from "../styles/diretrizes-da-comunidade-styles";

type DiretrizesComunidadeTranslationProps = {
  t: (texto: TextoTraduzido) => string;
};

export function DiretrizesComunidadeFooter({
  t,
}: DiretrizesComunidadeTranslationProps) {
  return (
<footer style={footerStyle}>
  <span style={footerIconStyle}>
    <DiretrizesComunidadeSvgIcon name="users" size={24} strokeWidth={2.05} />
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
        pt: "Os Termos de Uso e a Política de Privacidade complementam estas Diretrizes da Comunidade.",
        en: "The Terms of Use and Privacy Policy complement these Community Guidelines.",
        es: "Los Términos de Uso y la Política de Privacidad complementan estas Normas de la Comunidad.",
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
    <DiretrizesComunidadeSvgIcon
      name="arrowRight"
      size={19}
      strokeWidth={2.3}
    />
  </Link>
</footer>
  );
}
