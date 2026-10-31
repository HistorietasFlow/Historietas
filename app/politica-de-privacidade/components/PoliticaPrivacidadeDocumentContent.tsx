import Link from "next/link";
import { PoliticaPrivacidadeSvgIcon } from "./PoliticaPrivacidadeSvgIcon";
import {
  SECOES_PRIVACIDADE,
  type TextoTraduzido,
} from "../lib/politica-de-privacidade-content";
import {
  contentLayoutStyle,
  sectionsColumnStyle,
  tableOfContentsStyle,
  tocLabelStyle,
  tocLinksStyle,
} from "../styles/politica-de-privacidade-styles";

type PoliticaPrivacidadeDocumentContentProps = {
  t: (texto: TextoTraduzido) => string;
};

export function PoliticaPrivacidadeDocumentContent({
  t,
}: PoliticaPrivacidadeDocumentContentProps) {
  return (
    <div
      style={contentLayoutStyle}
      className="privacidade-content-layout"
    >
      <nav
        style={tableOfContentsStyle}
        aria-label={t({
          pt: "Índice da Política de Privacidade",
          en: "Privacy Policy table of contents",
          es: "Índice de la Política de Privacidad",
        })}
      >
        <span style={tocLabelStyle}>
          {t({
            pt: "NESTA PÁGINA",
            en: "ON THIS PAGE",
            es: "EN ESTA PÁGINA",
          })}
        </span>

        <div style={tocLinksStyle}>
          {SECOES_PRIVACIDADE.map((secao) => (
            <a
              key={secao.id}
              href={`#${secao.id}`}
              className="privacidade-toc-link"
            >
              <span>{secao.numero}</span>
              <strong>{t(secao.titulo)}</strong>
            </a>
          ))}
        </div>
      </nav>

      <div style={sectionsColumnStyle}>
        {SECOES_PRIVACIDADE.map((secao) => (
          <section
            key={secao.id}
            id={secao.id}
            className="privacidade-section"
            aria-labelledby={`${secao.id}-titulo`}
          >
            <header className="privacidade-section-header">
              <span className="privacidade-section-icon">
                <PoliticaPrivacidadeSvgIcon
                  name={secao.icon}
                  size={24}
                  strokeWidth={2.05}
                />
              </span>

              <div className="privacidade-section-heading">
                <span>
                  {t({
                    pt: `SEÇÃO ${secao.numero}`,
                    en: `SECTION ${secao.numero}`,
                    es: `SECCIÓN ${secao.numero}`,
                  })}
                </span>

                <h2 id={`${secao.id}-titulo`}>
                  {t(secao.titulo)}
                </h2>

                <p>{t(secao.resumo)}</p>
              </div>
            </header>

            <div className="privacidade-section-content">
              {secao.paragrafos.map((paragrafo, index) => (
                <p key={`${secao.id}-paragrafo-${index}`}>
                  {t(paragrafo)}
                </p>
              ))}

              {secao.itens?.length ? (
                <ul>
                  {secao.itens.map((item, index) => (
                    <li key={`${secao.id}-item-${index}`}>
                      <span className="privacidade-list-check">
                        <PoliticaPrivacidadeSvgIcon
                          name="check"
                          size={18}
                          strokeWidth={2.35}
                        />
                      </span>
                      <span>{t(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {secao.id === "conteudo-publico" ? (
                <Link
                  href="/configuracoes"
                  className="privacidade-inline-link"
                >
                  <PoliticaPrivacidadeSvgIcon
                    name="settings"
                    size={19}
                    strokeWidth={2.15}
                  />
                  <span>
                    {t({
                      pt: "Abrir controles de privacidade",
                      en: "Open privacy controls",
                      es: "Abrir controles de privacidad",
                    })}
                  </span>
                  <PoliticaPrivacidadeSvgIcon
                    name="arrowRight"
                    size={18}
                    strokeWidth={2.3}
                  />
                </Link>
              ) : null}

              {secao.id === "armazenamento-local" ? (
                <Link
                  href="/configuracoes"
                  className="privacidade-inline-link"
                >
                  <PoliticaPrivacidadeSvgIcon
                    name="download"
                    size={19}
                    strokeWidth={2.15}
                  />
                  <span>
                    {t({
                      pt: "Abrir dados e backup",
                      en: "Open data and backup",
                      es: "Abrir datos y copia de seguridad",
                    })}
                  </span>
                  <PoliticaPrivacidadeSvgIcon
                    name="arrowRight"
                    size={18}
                    strokeWidth={2.3}
                  />
                </Link>
              ) : null}

              {secao.id === "seguranca" ? (
                <div className="privacidade-alert-box">
                  <span>
                    <PoliticaPrivacidadeSvgIcon
                      name="alert"
                      size={21}
                      strokeWidth={2.1}
                    />
                  </span>
                  <p>
                    {t({
                      pt: "Nunca informe sua senha em comentários, publicações ou mensagens. O Historietas não precisa conhecer sua senha para prestar atendimento.",
                      en: "Never disclose your password in comments, posts, or messages. Historietas does not need to know your password to provide support.",
                      es: "Nunca informes tu contraseña en comentarios, publicaciones o mensajes. Historietas no necesita conocer tu contraseña para prestar atención.",
                    })}
                  </p>
                </div>
              ) : null}

              {secao.id === "direitos" || secao.id === "contato" ? (
                <Link
                  href="/ajuda"
                  className="privacidade-primary-link"
                >
                  <PoliticaPrivacidadeSvgIcon
                    name="help"
                    size={20}
                    strokeWidth={2.15}
                  />
                  <span>
                    {t({
                      pt: "Acessar a Central de ajuda",
                      en: "Open the Help center",
                      es: "Acceder al Centro de ayuda",
                    })}
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
