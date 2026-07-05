"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";

const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";


type SupabaseObraEmBreveRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  capa_url: string | null;
  arquivo_url: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

type SupabaseCapituloEmBreveRow = {
  obra_id: string | null;
};

type ObraEmBreveCard = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  views: string;
  likes: string;
  comentarios: string;
  slug: string;
  link: string;
  capa: string;
  origem: "supabase";
};

function criarStorageKeyUsuarioEmBreve(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function carregarJsonUsuarioEmBreve(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEmBreve(chave, userIdLimpo);

    if (!chaveStorage) {
      return null;
    }

    const texto = localStorage.getItem(chaveStorage);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonUsuarioEmBreve(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioEmBreve(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a tela continua com estado em memória.
  }
}

function pegarParametro(parametro?: string | string[] | null) {
  if (Array.isArray(parametro)) {
    return parametro[0]?.trim() || "";
  }

  return parametro?.trim() || "";
}

function criarLoginHrefEmBreve() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/em-breve";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/em-breve";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function obraSupabaseTemArquivoEmBreve(obra: SupabaseObraEmBreveRow) {
  return Boolean(obra.arquivo_url?.trim());
}

function normalizarObraSupabaseEmBreve(
  obra: SupabaseObraEmBreveRow
): ObraEmBreveCard {
  const titulo = obra.titulo?.trim() || "Obra sem título";
  const slug = obra.slug?.trim() || criarSlugBase(titulo);
  return {
    id: obra.id || slug || titulo,
    titulo,
    autor: obra.autor?.trim() || "Autor não informado",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Original",
    views: "0",
    likes: "0",
    comentarios: "0",
    slug,
    link: obra.link?.trim() || `/obra/${slug}`,
    capa: obra.capa_url?.trim() || "",
    origem: "supabase",
  };
}

function normalizarListaIdsEmBreve(valor: unknown) {
  return Array.isArray(valor)
    ? Array.from(
        new Set(
          valor
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean)
        )
      )
    : [];
}

function obterIdentificadoresObraEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo), normalizarTexto(obra.titulo)]
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );
}

function listaTemObraEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">,
  lista: string[]
) {
  const listaNormalizada = new Set(normalizarListaIdsEmBreve(lista));

  return obterIdentificadoresObraEmBreve(obra).some((id) =>
    listaNormalizada.has(id)
  );
}

function removerObraDaListaEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">,
  lista: string[]
) {
  const idsObra = new Set(obterIdentificadoresObraEmBreve(obra));

  return normalizarListaIdsEmBreve(lista).filter((id) => !idsObra.has(id));
}

function adicionarObraNaListaEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">,
  lista: string[]
) {
  return normalizarListaIdsEmBreve([
    ...removerObraDaListaEmBreve(obra, lista),
    ...obterIdentificadoresObraEmBreve(obra),
  ]);
}

async function carregarLancamentosSalvosSupabaseEmBreve(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from("seguindo_obras")
      .select("obra_id")
      .eq("user_id", userIdLimpo)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      if (error) {
        console.warn(
          "Não consegui carregar avisos reais do Em breve:",
          error.message
        );
      }

      return [] as string[];
    }

    return normalizarListaIdsEmBreve(
      data.map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId : "";
      })
    );
  } catch (error) {
    console.warn("Não consegui acessar seguindo_obras no Em breve:", error);
    return [] as string[];
  }
}

async function sincronizarAvisoLancamentoSupabaseEmBreve(
  userId: string,
  obraId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();

  if (!userIdLimpo || !obraIdLimpo) {
    return;
  }

  try {
    const { error: erroDelete } = await supabase
      .from("seguindo_obras")
      .delete()
      .eq("user_id", userIdLimpo)
      .eq("obra_id", obraIdLimpo);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userIdLimpo,
      obra_id: obraIdLimpo,
    };

    const { error: erroComVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert({
        ...payloadBase,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }
  } catch (error) {
    console.warn("Não consegui sincronizar aviso real do Em breve:", error);
  }
}

async function carregarObrasReaisEmBreve() {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,capa_url,arquivo_url,publicado,slug,link,criada_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(100);

    if (erroObras || !Array.isArray(obrasBanco)) {
      if (erroObras) {
        console.warn(
          "Não consegui carregar obras reais do Em breve:",
          erroObras.message
        );
      }

      return [] as ObraEmBreveCard[];
    }

    const obrasPublicadas = obrasBanco as unknown as SupabaseObraEmBreveRow[];
    const obraIds = obrasPublicadas
      .map((obra) => obra.id?.trim() || "")
      .filter(Boolean);

    if (obraIds.length === 0) {
      return [] as ObraEmBreveCard[];
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("obra_id")
      .in("obra_id", obraIds)
      .eq("publicado", true)
      .limit(1000);

    if (erroCapitulos || !Array.isArray(capitulosBanco)) {
      if (erroCapitulos) {
        console.warn(
          "Não consegui verificar capítulos das obras do Em breve:",
          erroCapitulos.message
        );
      }

      return [] as ObraEmBreveCard[];
    }

    const obrasComCapituloPublicado = new Set(
      (capitulosBanco as unknown as SupabaseCapituloEmBreveRow[])
        .map((capitulo) => capitulo.obra_id?.trim() || "")
        .filter(Boolean)
    );

    return obrasPublicadas
      .filter((obra) => {
        const obraId = obra.id?.trim() || "";

        return (
          obraId &&
          !obrasComCapituloPublicado.has(obraId) &&
          !obraSupabaseTemArquivoEmBreve(obra)
        );
      })
      .map((obra) => normalizarObraSupabaseEmBreve(obra));
  } catch (error) {
    console.warn("Não consegui acessar obras reais do Em breve:", error);
    return [] as ObraEmBreveCard[];
  }
}

function removerObrasDuplicadasEmBreve(obrasParaMostrar: ObraEmBreveCard[]) {
  const obrasVistas = new Set<string>();

  return obrasParaMostrar.filter((obra) => {
    const chave = normalizarTexto(obra.titulo) || obra.id;

    if (!chave || obrasVistas.has(chave)) {
      return false;
    }

    obrasVistas.add(chave);
    return true;
  });
}

function criarLinkCardEmBreve(obra: ObraEmBreveCard) {
  return `/em-breve?obra=${encodeURIComponent(obra.titulo)}`;
}

function criarLinkObraPublicadaEmBreve(obra: Pick<SupabaseObraEmBreveRow, "titulo" | "slug" | "link">) {
  const titulo = obra.titulo?.trim() || "obra";
  const slug = obra.slug?.trim() || criarSlugBase(titulo);
  const link = obra.link?.trim() || "";

  return link && !link.startsWith("/em-breve") ? link : `/obra/${slug}`;
}

async function encontrarLinkObraComConteudoEmBreve(tituloBusca: string) {
  const tituloLimpo = tituloBusca.trim();

  if (!tituloLimpo) {
    return "";
  }

  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("id,titulo,slug,link,arquivo_url,publicado")
      .ilike("titulo", tituloLimpo)
      .eq("publicado", true)
      .limit(5);

    if (erroObras || !Array.isArray(obrasBanco)) {
      return "";
    }

    const obrasEncontradas = obrasBanco as unknown as SupabaseObraEmBreveRow[];
    const obraEncontrada =
      obrasEncontradas.find(
        (obra) => normalizarTexto(obra.titulo || "") === normalizarTexto(tituloLimpo)
      ) || obrasEncontradas[0] || null;

    if (!obraEncontrada?.id) {
      return "";
    }

    if (obraSupabaseTemArquivoEmBreve(obraEncontrada)) {
      return criarLinkObraPublicadaEmBreve(obraEncontrada);
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("obra_id")
      .eq("obra_id", obraEncontrada.id)
      .eq("publicado", true)
      .limit(1);

    if (erroCapitulos || !Array.isArray(capitulosBanco)) {
      return "";
    }

    return capitulosBanco.length > 0 ? criarLinkObraPublicadaEmBreve(obraEncontrada) : "";
  } catch {
    return "";
  }
}

function obterIconeTematicaEmBreve(genero: string) {
  const generoNormalizado = normalizarTexto(genero);

  if (generoNormalizado.includes("romance")) {
    return "♡";
  }

  if (generoNormalizado.includes("terror")) {
    return "☾";
  }

  if (generoNormalizado.includes("fantasia")) {
    return "✦";
  }

  if (generoNormalizado.includes("acao")) {
    return "⚡";
  }

  if (generoNormalizado.includes("aventura")) {
    return "⌖";
  }

  if (generoNormalizado.includes("comedia")) {
    return "☺";
  }

  if (
    generoNormalizado.includes("ficcao") ||
    generoNormalizado.includes("sci-fi") ||
    generoNormalizado.includes("sci fi")
  ) {
    return "⌬";
  }

  if (generoNormalizado.includes("misterio")) {
    return "◇";
  }

  if (generoNormalizado.includes("suspense")) {
    return "◌";
  }

  if (generoNormalizado.includes("sobrenatural")) {
    return "✧";
  }

  return "✦";
}

function criarCoverCardEmBreveStyle(
  obra: ObraEmBreveCard,
  desktopLayout: boolean
): CSSProperties {
  const baseStyle = desktopLayout ? desktopRelatedCoverStyle : relatedCoverStyle;

  if (!obra.capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${obra.capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export default function EmBrevePage() {
  const router = useRouter();
  const [nomeObra, setNomeObra] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const [obrasReaisEmBreve, setObrasReaisEmBreve] = useState<ObraEmBreveCard[]>([]);
  const [avisoAcesso, setAvisoAcesso] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
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

    consultaDesktop.addEventListener("change", atualizarLayoutDesktop);

    return () => {
      window.clearTimeout(atualizarLayoutDesktopTimer);
      consultaDesktop.removeEventListener("change", atualizarLayoutDesktop);
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
      const nomeObraParam = pegarParametro(parametros.get("obra"));

      window.setTimeout(() => {
        if (componenteAtivo) {
          setNomeObra(nomeObraParam);
        }
      }, 0);

      if (nomeObraParam) {
        const linkObraComConteudo = await encontrarLinkObraComConteudoEmBreve(
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
  }, []);

  const obrasEmBreve = removerObrasDuplicadasEmBreve(obrasReaisEmBreve);

  const obraConsultada = nomeObra
    ? obrasEmBreve.find(
        (obra) => normalizarTexto(obra.titulo) === normalizarTexto(nomeObra)
      ) || null
    : null;

  const outrasObrasEmBreve = obraConsultada
    ? [
        obraConsultada,
        ...obrasEmBreve.filter((obra) => obra.id !== obraConsultada.id),
      ].slice(0, 8)
    : obrasEmBreve.slice(0, 8);

  async function salvarLancamento(obra: ObraEmBreveCard) {
    const identificadoresObra = obterIdentificadoresObraEmBreve(obra);

    if (identificadoresObra.length === 0) {
      return;
    }

    setAvisoAcesso("");

    try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setAvisoAcesso("Entre na sua conta para ativar aviso de lançamento.");
        router.push(criarLoginHrefEmBreve());
        return;
      }

      setUsuarioIdLogado(data.user.id);

      const avisoAtivo = listaTemObraEmBreve(obra, obrasSalvas);
      const novasObrasSalvas = avisoAtivo
        ? removerObraDaListaEmBreve(obra, obrasSalvas)
        : adicionarObraNaListaEmBreve(obra, obrasSalvas);

      salvarJsonUsuarioEmBreve(
        SAVED_RELEASES_STORAGE_KEY,
        data.user.id,
        novasObrasSalvas
      );

      setObrasSalvas(novasObrasSalvas);

      void sincronizarAvisoLancamentoSupabaseEmBreve(
        data.user.id,
        obra.id,
        !avisoAtivo
      );
      return;
    } catch {
      setAvisoAcesso("Não consegui confirmar sua conta agora. Tente novamente.");
      router.push(criarLoginHrefEmBreve());
      return;
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${emBrevePageCss}`}</style>

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
                const obraSalva = listaTemObraEmBreve(obra, obrasSalvas);

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
                          <strong style={relatedTitleStyle}>
                            {obra.titulo}
                          </strong>
                        </Link>
                      </div>

                      <span style={relatedAuthorStyle}>Por {obra.autor}</span>

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
                          style={
                            obraSalva
                              ? relatedSavedButtonStyle
                              : relatedSaveButtonStyle
                          }
                          aria-pressed={obraSalva}
                        >
                          {obraSalva ? "✓ Aviso ativo" : "Avisar"}
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

const emBrevePageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }
`;

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const buttonBaseStyle: CSSProperties = {
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
  fontFamily: "inherit",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "clamp(19px, 6vw, 24px)",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 126px)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(124,58,237,0.24))",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "18px",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

const titleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  textAlign: "center",
  flex: "0 1 auto",
  ...safeTextStyle,
};


const titleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "18px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, #04000A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, #070212)",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
};

const desktopTitleLinkStyle: CSSProperties = {
  ...titleLinkStyle,
};


const desktopTitleTextStyle: CSSProperties = {
  ...titleTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(10px, 2.7vw, 14px)",
  display: "grid",
  justifyItems: "center",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};


const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(124,58,237,0.12)",
  border: "1px solid rgba(124,58,237,0.24)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const genreBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(26px, 7.1vw, 40px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.8px",
  lineHeight: 1.38,
  fontWeight: 650,
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const releaseBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "36px minmax(0, 1fr)",
  alignItems: "center",
  gap: "9px",
  padding: "10px",
  borderRadius: "18px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  width: "min(100%, 620px)",
  maxWidth: "100%",
  justifySelf: "center",
  textAlign: "left",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const releaseIconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "var(--historietas-accent, #FDBA74)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const releaseContentStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
};

const releaseLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const releaseNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 5.4vw, 22px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const releaseTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.34,
  fontWeight: 750,
  ...safeTextStyle,
};

const releaseMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  gap: "6px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const notifyButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(124,58,237,0.34)",
  background: "rgba(124,58,237,0.18)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const savedButtonStyle: CSSProperties = {
  ...notifyButtonStyle,
  background: "rgba(34,197,94,0.13)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#86EFAC",
};

const savedMessageStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 800,
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const accessMessageStyle: CSSProperties = {
  margin: "0 auto 10px",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 850,
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "9px",
  marginTop: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const summaryCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  padding: "13px",
  borderRadius: "18px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  boxSizing: "border-box",
  boxShadow: "none",
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  ...safeTextStyle,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const relatedSectionStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "3px",
  marginBottom: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 7vw, 32px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.058em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 54%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const releaseSectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "clamp(24px, 7vw, 32px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  maxWidth: "100%",
  ...safeTextStyle,
};

const relatedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const relatedCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const relatedCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  height: "100%",
  boxSizing: "border-box",
};

const relatedCoverStyle: CSSProperties = {
  minHeight: "122px",
  height: "100%",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  boxSizing: "border-box",
};

const relatedGenreStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "8px",
  transform: "translateX(-50%)",
  width: "fit-content",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(4,0,10,0.76)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "9.5px",
  fontWeight: 950,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const relatedContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "stretch",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const relatedTitleLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
};

const relatedTopLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const relatedTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(18px, 5.8vw, 21px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const relatedAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const relatedReleasePanelStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const relatedReleaseLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const relatedReleaseTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

const relatedBottomRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(74px, 84px)",
  alignItems: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const relatedStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const relatedMetaBadgesStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const relatedThemeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "5px",
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  boxSizing: "border-box",
  overflow: "hidden",
  ...safeTextStyle,
};

const relatedThemeIconStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  flex: "0 0 auto",
};

const relatedThemeTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const relatedFormatBadgeStyle: CSSProperties = {
  ...relatedThemeBadgeStyle,
  gap: 0,
  background: "transparent",
  color: "#FFFFFF",
};

const relatedSaveButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  borderRadius: "999px",
  minHeight: "34px",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const relatedSavedButtonStyle: CSSProperties = {
  ...relatedSaveButtonStyle,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "13px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "20px 0 34px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};

const desktopLogoStyle: CSSProperties = {
  ...logoStyle,
  maxWidth: "420px",
};


const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "34px",
  boxShadow: "none",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "28px 30px",
  gap: "10px",
  justifyItems: "center",
  textAlign: "center",
};

const desktopHeroContentWithReleaseStyle: CSSProperties = {
  ...desktopHeroContentStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  columnGap: 0,
};

const desktopBadgeRowStyle: CSSProperties = {
  ...badgeRowStyle,
  gridColumn: "1",
  justifyContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "1",
  fontSize: "clamp(46px, 4.5vw, 64px)",
  lineHeight: 1.03,
  maxWidth: "760px",
  margin: "0 auto",
  textAlign: "center",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  gridColumn: "1",
  maxWidth: "660px",
  margin: "0 auto",
  fontSize: "14px",
  lineHeight: 1.56,
  textAlign: "center",
};

const desktopReleaseBoxStyle: CSSProperties = {
  ...releaseBoxStyle,
  gridColumn: "1",
  gridRow: "auto",
  alignSelf: "auto",
  justifySelf: "center",
  width: "min(720px, 100%)",
  gridTemplateColumns: "64px minmax(0, 1fr)",
  gap: "14px",
  padding: "17px",
  borderRadius: "24px",
  background: "rgba(4, 0, 10, 0.72)",
};

const desktopSavedMessageStyle: CSSProperties = {
  ...savedMessageStyle,
  gridColumn: "1",
  textAlign: "center",
  margin: "0 auto",
};

const desktopSummaryGridStyle: CSSProperties = {
  ...summaryGridStyle,
  width: "min(720px, 100%)",
  margin: "14px auto 0",
  gap: "12px",
};

const desktopSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  padding: "17px",
  borderRadius: "22px",
};

const desktopRelatedSectionStyle: CSSProperties = {
  ...relatedSectionStyle,
  marginTop: "18px",
};

const desktopRelatedGridStyle: CSSProperties = {
  ...relatedGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const desktopRelatedCardStyle: CSSProperties = {
  ...relatedCardStyle,
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  alignItems: "stretch",
  minHeight: "178px",
  background: "rgba(4, 0, 10, 0.72)",
  boxShadow: "none",
};

const desktopRelatedCoverStyle: CSSProperties = {
  ...relatedCoverStyle,
  minHeight: "158px",
  borderRadius: "18px",
};

const desktopRelatedContentStyle: CSSProperties = {
  ...relatedContentStyle,
  gap: "9px",
};

const desktopRelatedTopLineStyle: CSSProperties = {
  ...relatedTopLineStyle,
  gap: "10px",
};

const desktopRelatedReleasePanelStyle: CSSProperties = {
  ...relatedReleasePanelStyle,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
};

const desktopRelatedBottomRowStyle: CSSProperties = {
  ...relatedBottomRowStyle,
  gridTemplateColumns: "minmax(0, 1fr) 104px",
  gap: "10px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  width: "min(860px, 100%)",
  margin: "14px auto 0",
  padding: "18px",
  borderRadius: "24px",
};