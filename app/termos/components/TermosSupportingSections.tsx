import Link from "next/link";
import {
  ATALHOS_POLITICAS,
  ETAPAS_LEITURA,
  PRINCIPIOS_PLATAFORMA,
  type TextoTraduzido,
} from "../lib/termos-content";
import {
  noticeIconStyle,
  noticeStyle,
  noticeTextStyle,
  principlesGridStyle,
  quickAccessGridStyle,
  quickAccessSectionStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
  stepsGridStyle,
} from "../styles/termos-page-styles";
import { TermosSvgIcon } from "./TermosSvgIcon";

type TermosSupportingSectionsProps = {
  t: (texto: TextoTraduzido) => string;
};

export function TermosSupportingSections({ t }: TermosSupportingSectionsProps) {
  return (
    <>
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
            <h2 id="principios-politicas-titulo" style={sectionTitleStyle}>
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
                <TermosSvgIcon
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
            <h2 id="leitura-politicas-titulo" style={sectionTitleStyle}>
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
          <TermosSvgIcon name="info" size={24} strokeWidth={2.1} />
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
            <h2 id="atalhos-politicas-titulo" style={sectionTitleStyle}>
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
                <TermosSvgIcon name={atalho.icon} size={23} strokeWidth={2.05} />
              </span>

              <span className="termos-quick-copy">
                <strong>{t(atalho.titulo)}</strong>
                <span>{t(atalho.descricao)}</span>
              </span>

              <span className="termos-quick-arrow">
                <TermosSvgIcon name="arrowRight" size={20} strokeWidth={2.25} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
