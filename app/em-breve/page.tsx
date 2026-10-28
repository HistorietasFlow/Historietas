"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  mobileTopWaterFadeStyle,
  desktopTopWaterFadeStyle,
  pageStyle,
  containerStyle,
  titleHeaderStyle,
  titleLinkStyle,
  titleTextStyle,
  desktopTitleHeaderStyle,
  desktopNotificationButtonStyle,
  desktopNotificationBadgeStyle,
  desktopTitleLinkStyle,
  desktopTitleTextStyle,
  accessMessageStyle,
  relatedSectionStyle,
  relatedGridStyle,
  relatedCardStyle,
  relatedCoverLinkStyle,
  relatedContentStyle,
  relatedTitleLinkStyle,
  relatedTopLineStyle,
  relatedTitleStyle,
  relatedAuthorStyle,
  relatedReleasePanelStyle,
  relatedReleaseLabelStyle,
  relatedReleaseTextStyle,
  relatedBottomRowStyle,
  relatedMetaBadgesStyle,
  relatedThemeBadgeStyle,
  relatedThemeIconStyle,
  relatedThemeTextStyle,
  relatedFormatBadgeStyle,
  relatedSaveButtonStyle,
  relatedSavedButtonStyle,
  desktopContainerStyle,
  desktopRelatedSectionStyle,
  desktopRelatedGridStyle,
  desktopRelatedCardStyle,
  desktopRelatedContentStyle,
  desktopRelatedTopLineStyle,
  desktopRelatedReleasePanelStyle,
  desktopRelatedBottomRowStyle,
  criarCoverCardEmBreveStyle,
} from "./lib/em-breve-styles";
import { emBrevePageCss } from "./lib/em-breve-page-css";
import { traduzirTextoEmBreve } from "./lib/em-breve-translations";
import { sincronizarAvisoLancamentoSupabaseEmBreve } from "./actions/sincronizar-aviso-lancamento-supabase-em-breve";
import { carregarObrasReaisEmBreve } from "./loaders/carregar-obras-reais-em-breve";
import { encontrarLinkObraComConteudoEmBreve } from "./loaders/encontrar-link-obra-com-conteudo-em-breve";
import { criarLinkCardEmBreve } from "./lib/em-breve-work-link-utils";
import { obterIconeTematicaEmBreve } from "./lib/em-breve-presentation-utils";
import {
  criarLoginHrefEmBreve,
  pegarParametro,
} from "./lib/em-breve-route-utils";
import {
  SAVED_RELEASES_STORAGE_KEY,
  carregarJsonUsuarioEmBreve,
  salvarJsonUsuarioEmBreve,
} from "./lib/em-breve-storage-utils";
import { type ObraEmBreveCard } from "./lib/em-breve-work-normalizers";
import {
  adicionarObraNaListaEmBreve,
  listaTemObraEmBreve,
  normalizarLancamentosSalvosComObrasEmBreve,
  normalizarListaIdsEmBreve,
  obterIdentificadoresObraEmBreve,
  removerObrasDuplicadasEmBreve,
  removerObraDaListaEmBreve,
} from "./lib/em-breve-work-list-utils";
import { carregarLancamentosSalvosSupabaseEmBreve } from "./loaders/carregar-lancamentos-salvos-supabase-em-breve";
import { normalizarTexto } from "../../lib/utils";

function EmBreveLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz = "[data-historietas-em-breve-root='true']";

    type EstadoTraducaoEmBreve = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoEmBreve> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoEmBreve>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function elementoEstaNaPagina(elemento: Element | null) {
      return Boolean(
        elemento?.matches(seletorRaiz) || elemento?.closest(seletorRaiz)
      );
    }

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento || !elementoEstaNaPagina(elemento)) {
        return true;
      }

      if (elemento.closest("[data-historietas-i18n-ignore='true']")) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return tag === "script" || tag === "style";
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (
        deveIgnorarElemento(elementoPai) ||
        elementoPai?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoEmBreve(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributos(elemento: Element) {
      if (deveIgnorarElemento(elemento)) {
        return;
      }

      let estadosElemento = estadosAtributos.get(elemento);

      if (!estadosElemento) {
        estadosElemento = new Map();
        estadosAtributos.set(elemento, estadosElemento);
      }

      atributosTraduziveis.forEach((atributo) => {
        const atual = elemento.getAttribute(atributo);

        if (atual === null) {
          return;
        }

        let estado = estadosElemento?.get(atributo);

        if (!estado) {
          estado = { original: atual, traduzido: atual };
          estadosElemento?.set(atributo, estado);
          atributosAlterados.push({ elemento, atributo });
        } else if (atual !== estado.traduzido && atual !== estado.original) {
          estado.original = atual;
        }

        const proximo = traduzirTextoEmBreve(estado.original, language);
        estado.traduzido = proximo;

        if (atual !== proximo) {
          elemento.setAttribute(atributo, proximo);
        }
      });
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (no.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const elemento = no as Element;

      if (deveIgnorarElemento(elemento)) {
        return;
      }

      aplicarAtributos(elemento);

      elemento.querySelectorAll("*").forEach((filho) => {
        if (!deveIgnorarElemento(filho)) {
          aplicarAtributos(filho);
        }
      });

      const percorrer = document.createTreeWalker(
        elemento,
        NodeFilter.SHOW_TEXT
      );
      let textoAtual = percorrer.nextNode();

      while (textoAtual) {
        aplicarTexto(textoAtual as Text);
        textoAtual = percorrer.nextNode();
      }
    }

    function aplicarPagina() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        document.querySelectorAll(seletorRaiz).forEach(aplicarNo);
      } finally {
        aplicando = false;
      }
    }

    aplicarPagina();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (mutacao.type === "attributes") {
            aplicarAtributos(mutacao.target as Element);
            return;
          }

          mutacao.addedNodes.forEach(aplicarNo);
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.isConnected && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach(({ elemento, atributo }) => {
        const estado = estadosAtributos.get(elemento)?.get(atributo);

        if (
          estado &&
          elemento.isConnected &&
          elemento.getAttribute(atributo) === estado.traduzido
        ) {
          elemento.setAttribute(atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}


export default function EmBrevePage() {
  const router = useRouter();
  const [nomeObra, setNomeObra] = useState("");
  const [obraIdConsultada, setObraIdConsultada] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const [obrasReaisEmBreve, setObrasReaisEmBreve] = useState<ObraEmBreveCard[]>([]);
  const [avisoAcesso, setAvisoAcesso] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [obraProcessandoId, setObraProcessandoId] = useState("");
  const [desktopLayout, setDesktopLayout] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    const consultaDesktop = window.matchMedia("(min-width: 900px)");

    function atualizarLayoutDesktop() {
      setDesktopLayout(consultaDesktop.matches);
    }

    const atualizarLayoutDesktopTimer = window.setTimeout(
      atualizarLayoutDesktop,
      0
    );

    if (typeof consultaDesktop.addEventListener === "function") {
      consultaDesktop.addEventListener("change", atualizarLayoutDesktop);

      return () => {
        window.clearTimeout(atualizarLayoutDesktopTimer);
        consultaDesktop.removeEventListener("change", atualizarLayoutDesktop);
      };
    }

    consultaDesktop.addListener(atualizarLayoutDesktop);

    return () => {
      window.clearTimeout(atualizarLayoutDesktopTimer);
      consultaDesktop.removeListener(atualizarLayoutDesktop);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarObrasReais() {
      const obrasSemConteudo = await carregarObrasReaisEmBreve();

      window.setTimeout(() => {
        if (componenteAtivo) {
          setObrasReaisEmBreve(obrasSemConteudo);
        }
      }, 0);
    }

    void carregarObrasReais();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarLancamentosSalvos() {
      const parametros = new URLSearchParams(window.location.search);
      const obraIdParam = pegarParametro(parametros.get("obraId"));
      const nomeObraParam = pegarParametro(parametros.get("obra"));

      window.setTimeout(() => {
        if (componenteAtivo) {
          setObraIdConsultada(obraIdParam);
          setNomeObra(nomeObraParam);
        }
      }, 0);

      if (obraIdParam || nomeObraParam) {
        const linkObraComConteudo = await encontrarLinkObraComConteudoEmBreve(
          obraIdParam,
          nomeObraParam
        );

        if (componenteAtivo && linkObraComConteudo) {
          router.replace(linkObraComConteudo);
          return;
        }
      }

      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          window.setTimeout(() => {
            if (componenteAtivo) {
              setUsuarioIdLogado("");
              setObrasSalvas([]);
            }
          }, 0);

          return;
        }

        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado(data.user.id);
          }
        }, 0);

        const salvasJson: unknown =
          carregarJsonUsuarioEmBreve(SAVED_RELEASES_STORAGE_KEY, data.user.id) ||
          [];
        const salvasLocaisNormalizadas = normalizarListaIdsEmBreve(salvasJson);
        const salvasSupabase = await carregarLancamentosSalvosSupabaseEmBreve(
          data.user.id
        );
        const salvasNormalizadas = normalizarListaIdsEmBreve([
          ...salvasLocaisNormalizadas,
          ...salvasSupabase,
        ]);

        salvarJsonUsuarioEmBreve(
          SAVED_RELEASES_STORAGE_KEY,
          data.user.id,
          salvasNormalizadas
        );

        window.setTimeout(() => {
          if (componenteAtivo) {
            setObrasSalvas(salvasNormalizadas);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado("");
            setObrasSalvas([]);
          }
        }, 0);
      }
    }

    void carregarLancamentosSalvos();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  const obrasEmBreve = removerObrasDuplicadasEmBreve(obrasReaisEmBreve);

  const obrasSalvasNormalizadas = useMemo(() => {
    if (!usuarioIdLogado || obrasReaisEmBreve.length === 0) {
      return obrasSalvas;
    }

    return normalizarLancamentosSalvosComObrasEmBreve(
      obrasSalvas,
      obrasReaisEmBreve
    );
  }, [obrasReaisEmBreve, obrasSalvas, usuarioIdLogado]);

  useEffect(() => {
    if (!usuarioIdLogado || obrasReaisEmBreve.length === 0) {
      return;
    }

    salvarJsonUsuarioEmBreve(
      SAVED_RELEASES_STORAGE_KEY,
      usuarioIdLogado,
      obrasSalvasNormalizadas
    );
  }, [
    obrasReaisEmBreve.length,
    obrasSalvasNormalizadas,
    usuarioIdLogado,
  ]);

  const obraConsultada = obraIdConsultada || nomeObra
    ? obrasEmBreve.find((obra) => {
        if (obraIdConsultada && obra.id === obraIdConsultada) {
          return true;
        }

        return (
          Boolean(nomeObra) &&
          normalizarTexto(obra.titulo) === normalizarTexto(nomeObra)
        );
      }) || null
    : null;

  const outrasObrasEmBreve = obraConsultada
    ? [
        obraConsultada,
        ...obrasEmBreve.filter((obra) => obra.id !== obraConsultada.id),
      ].slice(0, 8)
    : obrasEmBreve.slice(0, 8);

  async function salvarLancamento(obra: ObraEmBreveCard) {
    const identificadoresObra = obterIdentificadoresObraEmBreve(obra);

    if (identificadoresObra.length === 0 || obraProcessandoId) {
      return;
    }

    setAvisoAcesso("");
    setObraProcessandoId(obra.id);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setAvisoAcesso("Entre na sua conta para ativar aviso de lançamento.");
        router.push(criarLoginHrefEmBreve());
        return;
      }

      const avisoAtivo = listaTemObraEmBreve(obra, obrasSalvasNormalizadas);
      const deveAtivar = !avisoAtivo;
      const sincronizou = await sincronizarAvisoLancamentoSupabaseEmBreve(
        data.user.id,
        obra.id,
        deveAtivar
      );

      if (!sincronizou) {
        setAvisoAcesso(
          "Não consegui salvar o aviso agora. Tente novamente em instantes."
        );
        return;
      }

      const novasObrasSalvas = deveAtivar
        ? adicionarObraNaListaEmBreve(obra, obrasSalvasNormalizadas)
        : removerObraDaListaEmBreve(obra, obrasSalvasNormalizadas);
      const obrasNormalizadas = normalizarLancamentosSalvosComObrasEmBreve(
        novasObrasSalvas,
        obrasReaisEmBreve
      );

      setUsuarioIdLogado(data.user.id);
      salvarJsonUsuarioEmBreve(
        SAVED_RELEASES_STORAGE_KEY,
        data.user.id,
        obrasNormalizadas
      );
      setObrasSalvas(obrasNormalizadas);
    } catch {
      setAvisoAcesso("Não consegui confirmar sua conta agora. Tente novamente.");
    } finally {
      setObraProcessandoId("");
    }
  }


  return (
    <main
      data-historietas-em-breve-root="true"
      style={pageThemeStyle}
    >
      <style>{`${historietasThemeCss}${emBrevePageCss}`}</style>
      <EmBreveLanguageBridge />

      {desktopLayout && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!desktopLayout && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={desktopLayout ? desktopContainerStyle : containerStyle}>
        <header style={desktopLayout ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={desktopLayout ? desktopTitleLinkStyle : titleLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={desktopLayout ? desktopTitleTextStyle : titleTextStyle}
            >
              EM BREVE
            </span>
          </Link>

          {desktopLayout ? (
            <Link
              href="/notificacoes"
              style={desktopNotificationButtonStyle}
              aria-label={
                notificacoesNaoLidas > 0
                  ? `Notificações: ${notificacoesNaoLidas} não lidas`
                  : "Notificações"
              }
            >
              N

              {notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}
        </header>

        {outrasObrasEmBreve.length > 0 ? (
          <section
            style={
              desktopLayout ? desktopRelatedSectionStyle : relatedSectionStyle
            }
          >
            {avisoAcesso && <p style={accessMessageStyle}>{avisoAcesso}</p>}

            <div style={desktopLayout ? desktopRelatedGridStyle : relatedGridStyle}>
              {outrasObrasEmBreve.map((obra) => {
                const obraSalva = listaTemObraEmBreve(obra, obrasSalvasNormalizadas);

                return (
                  <article
                    key={`${obra.origem}-${obra.id}`}
                    style={desktopLayout ? desktopRelatedCardStyle : relatedCardStyle}
                  >
                    <Link
                      href={criarLinkCardEmBreve(obra)}
                      style={relatedCoverLinkStyle}
                      aria-label={`Abrir aviso de ${obra.titulo}`}
                    >
                      <div
                        style={criarCoverCardEmBreveStyle(obra, desktopLayout)}
                      />
                    </Link>

                    <div
                      style={
                        desktopLayout ? desktopRelatedContentStyle : relatedContentStyle
                      }
                    >
                      <div
                        style={
                          desktopLayout
                            ? desktopRelatedTopLineStyle
                            : relatedTopLineStyle
                        }
                      >
                        <Link
                          href={criarLinkCardEmBreve(obra)}
                          style={relatedTitleLinkStyle}
                        >
                          <strong
                            data-historietas-i18n-ignore="true"
                            style={relatedTitleStyle}
                          >
                            {obra.titulo}
                          </strong>
                        </Link>
                      </div>

                      <span style={relatedAuthorStyle}>
                        Por{" "}
                        <span data-historietas-i18n-ignore="true">{obra.autor}</span>
                      </span>

                      <div
                        style={
                          desktopLayout
                            ? desktopRelatedReleasePanelStyle
                            : relatedReleasePanelStyle
                        }
                      >
                        <span style={relatedReleaseLabelStyle}>
                          {obraSalva ? "AVISO ATIVADO" : "LANÇAMENTO REAL SEM CONTEÚDO"}
                        </span>

                        <span style={relatedReleaseTextStyle}>
                          {obraSalva
                            ? "Você será avisado quando a leitura for liberada."
                            : "Esta obra existe, mas ainda não tem capítulo ou arquivo publicado."}
                        </span>
                      </div>

                      <div
                        style={
                          desktopLayout
                            ? desktopRelatedBottomRowStyle
                            : relatedBottomRowStyle
                        }
                      >
                        <div style={relatedMetaBadgesStyle}>
                          <div style={relatedThemeBadgeStyle}>
                            <span style={relatedThemeIconStyle}>
                              {obterIconeTematicaEmBreve(obra.genero)}
                            </span>
                            <span style={relatedThemeTextStyle}>
                              {obra.genero}
                            </span>
                          </div>

                          <div style={relatedFormatBadgeStyle}>
                            <span style={relatedThemeTextStyle}>
                              {obra.formato}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => salvarLancamento(obra)}
                          disabled={Boolean(obraProcessandoId)}
                          style={{
                            ...(obraSalva
                              ? relatedSavedButtonStyle
                              : relatedSaveButtonStyle),
                            opacity:
                              obraProcessandoId && obraProcessandoId !== obra.id
                                ? 0.55
                                : 1,
                            cursor: obraProcessandoId ? "wait" : "pointer",
                          }}
                          aria-pressed={obraSalva}
                          aria-busy={obraProcessandoId === obra.id}
                        >
                          {obraProcessandoId === obra.id
                            ? "Salvando..."
                            : obraSalva
                              ? "✓ Aviso ativo"
                              : "Avisar"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <>
            {avisoAcesso && <p style={accessMessageStyle}>{avisoAcesso}</p>}

            <p
              style={{
                margin: "10px 0 0",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {nomeObra
                ? "Essa obra ainda não está disponível"
                : "Ainda não há lançamentos em breve"}
            </p>
          </>
        )}

        {outrasObrasEmBreve.length > 0 && (
          <p
            style={{
              margin: "12px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Sobre o aviso
          </p>
        )}
      </section>
    </main>
  );
}
