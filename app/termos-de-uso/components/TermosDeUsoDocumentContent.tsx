import Link from "next/link";
import { TermosDeUsoSvgIcon } from "./TermosDeUsoSvgIcon";
import {
  SECOES_TERMOS,
  type TextoTraduzido,
} from "../lib/termos-de-uso-content";
import {
  contentLayoutStyle,
  sectionsColumnStyle,
  tableOfContentsStyle,
  tocLabelStyle,
  tocLinksStyle,
} from "../styles/termos-de-uso-styles";

type TermosDeUsoDocumentContentProps = {
  t: (texto: TextoTraduzido) => string;
};

export function TermosDeUsoDocumentContent({
  t,
}: TermosDeUsoDocumentContentProps) {
  return (
        <div style={contentLayoutStyle} className="termos-uso-content-layout">
          <nav
            style={tableOfContentsStyle}
            aria-label={t({
              pt: "Índice dos Termos de Uso",
              en: "Terms of Use table of contents",
              es: "Índice de los Términos de Uso",
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
              {SECOES_TERMOS.map((secao) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="termos-uso-toc-link"
                >
                  <span>{secao.numero}</span>
                  <strong>{t(secao.titulo)}</strong>
                </a>
              ))}
            </div>
          </nav>

          <div style={sectionsColumnStyle}>
            {SECOES_TERMOS.map((secao) => (
              <section
                key={secao.id}
                id={secao.id}
                className="termos-uso-section"
                aria-labelledby={`${secao.id}-titulo`}
              >
                <header className="termos-uso-section-header">
                  <span className="termos-uso-section-icon">
                    <TermosDeUsoSvgIcon
                      name={secao.icon}
                      size={24}
                      strokeWidth={2.05}
                    />
                  </span>

                  <div className="termos-uso-section-heading">
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

                <div className="termos-uso-section-content">
                  {secao.paragrafos.map((paragrafo, index) => (
                    <p key={`${secao.id}-paragrafo-${index}`}>
                      {t(paragrafo)}
                    </p>
                  ))}

                  {secao.itens?.length ? (
                    <ul>
                      {secao.itens.map((item, index) => (
                        <li key={`${secao.id}-item-${index}`}>
                          <span className="termos-uso-list-check">
                            <TermosDeUsoSvgIcon
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

                  {secao.id === "direitos-autorais" ? (
                    <Link
                      href="/ajuda"
                      className="termos-uso-inline-link"
                    >
                      <span>
                        {t({
                          pt: "Acessar a Central de ajuda",
                          en: "Open the Help center",
                          es: "Acceder al Centro de ayuda",
                        })}
                      </span>
                      <TermosDeUsoSvgIcon
                        name="arrowRight"
                        size={19}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "encerramento" ? (
                    <Link
                      href="/configuracoes"
                      className="termos-uso-inline-link"
                    >
                      <span>
                        {t({
                          pt: "Abrir Configurações da conta",
                          en: "Open account Settings",
                          es: "Abrir Configuración de la cuenta",
                        })}
                      </span>
                      <TermosDeUsoSvgIcon
                        name="arrowRight"
                        size={19}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "contato" ? (
                    <Link
                      href="/ajuda"
                      className="termos-uso-primary-link"
                    >
                      <TermosDeUsoSvgIcon
                        name="help"
                        size={20}
                        strokeWidth={2.15}
                      />
                      <span>
                        {t({
                          pt: "Ir para a Central de ajuda",
                          en: "Go to the Help center",
                          es: "Ir al Centro de ayuda",
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
