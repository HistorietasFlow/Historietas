"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";

type ObraBusca = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  tags: string[];
  status: string;
  classificacao: string;
  slug: string;
  link: string;
  sinopse: string;
  criadoEm: string;
  capitulos: CapituloBusca[];
};

type CapituloBusca = {
  id: string;
  titulo: string;
  numero: number;
  obraId: string;
  obraTitulo: string;
  obraSlug: string;
  criadoEm: string;
};

type AutorBusca = {
  nome: string;
  total: number;
  generos: string[];
};

type TermoBusca = {
  tipo: "Gênero" | "Tag";
  nome: string;
  total: number;
};

const LOCAL_KEYS_OBRAS = [
  "historietas-obras",
  "historietas:obras",
  "historietas:minhas-obras",
];

const CHIPS = [
  "Fantasia",
  "Romance",
  "Terror",
  "Drama",
  "Cyberpunk",
  "Sobrenatural",
  "Webnovel",
];

function texto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function normalizarTexto(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function criarSlug(valor: string) {
  const slug = normalizarTexto(valor)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function publicado(valor: unknown) {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "string") {
    const normalizado = normalizarTexto(valor);

    if (["false", "rascunho", "nao", "não", "despublicado"].includes(normalizado)) {
      return false;
    }
  }

  return true;
}

function tags(valor: unknown) {
  if (Array.isArray(valor)) {
    return valor.map((item) => texto(item)).filter(Boolean).slice(0, 8);
  }

  if (typeof valor === "string" && valor.trim()) {
    try {
      const json: unknown = JSON.parse(valor);

      if (Array.isArray(json)) {
        return json.map((item) => texto(item)).filter(Boolean).slice(0, 8);
      }
    } catch {
      return valor
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8);
    }
  }

  return [];
}

function idFallback(prefixo: string, valor: string, index: number) {
  return `${prefixo}-${criarSlug(valor)}-${index}`;
}

function capituloLocal(
  valor: unknown,
  index: number,
  obra: Pick<ObraBusca, "id" | "titulo" | "slug">
): CapituloBusca | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const item = valor as Record<string, unknown>;
  const titulo = texto(item.titulo) || texto(item.nome) || `Capítulo ${index + 1}`;

  return {
    id: texto(item.id) || idFallback("capitulo", `${obra.titulo}-${titulo}`, index),
    titulo,
    numero: Number(item.numero ?? item.ordem ?? index + 1) || index + 1,
    obraId: obra.id,
    obraTitulo: obra.titulo,
    obraSlug: obra.slug,
    criadoEm: texto(item.criadoEm) || texto(item.criado_em) || texto(item.created_at),
  };
}

function normalizarObra(valor: unknown, origem: string, index: number): ObraBusca | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const item = valor as Record<string, unknown>;
  const titulo = texto(item.titulo) || texto(item.nome) || texto(item.title);

  if (!titulo || !publicado(item.publicado ?? item.disponivel)) {
    return null;
  }

  const slug = texto(item.slug) || texto(item.slug_obra) || criarSlug(titulo);
  const id = texto(item.id) || texto(item.obra_id) || idFallback(origem, titulo, index);

  const obra: ObraBusca = {
    id,
    titulo,
    autor: texto(item.autor) || texto(item.autor_nome) || "Autor não informado",
    genero: texto(item.genero) || texto(item.categoria) || "Sem gênero",
    tags: tags(item.tags),
    status: texto(item.status) || "Em andamento",
    classificacao:
      texto(item.classificacaoIndicativa) ||
      texto(item.classificacao_indicativa) ||
      texto(item.classificacao) ||
      "Livre",
    slug,
    link: texto(item.link) || `/obra/${slug}`,
    sinopse:
      texto(item.sinopse) ||
      texto(item.descricao) ||
      texto(item.description) ||
      "Sem sinopse cadastrada.",
    criadoEm:
      texto(item.criada_em) ||
      texto(item.criado_em) ||
      texto(item.created_at) ||
      texto(item.criadaEm),
    capitulos: [],
  };

  const capitulosBrutos = Array.isArray(item.capitulos)
    ? item.capitulos
    : Array.isArray(item.chapters)
      ? item.chapters
      : [];

  obra.capitulos = capitulosBrutos
    .map((capitulo, capituloIndex) => capituloLocal(capitulo, capituloIndex, obra))
    .filter((capitulo): capitulo is CapituloBusca => Boolean(capitulo));

  return obra;
}

function capituloSupabase(
  valor: unknown,
  index: number,
  obrasPorId: Map<string, ObraBusca>
): CapituloBusca | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const item = valor as Record<string, unknown>;
  const titulo = texto(item.titulo) || texto(item.nome) || texto(item.title);

  if (!titulo) {
    return null;
  }

  const obraId = texto(item.obra_id) || texto(item.obraId);
  const obra = obraId ? obrasPorId.get(obraId) : null;
  const obraTitulo =
    obra?.titulo || texto(item.obra_titulo) || texto(item.obraTitulo) || "Obra não identificada";
  const obraSlug = obra?.slug || texto(item.obra_slug) || criarSlug(obraTitulo);

  return {
    id: texto(item.id) || idFallback("capitulo-supabase", `${obraTitulo}-${titulo}`, index),
    titulo,
    numero: Number(item.numero ?? item.ordem ?? index + 1) || index + 1,
    obraId: obra?.id || obraId || idFallback("obra", obraTitulo, index),
    obraTitulo,
    obraSlug,
    criadoEm: texto(item.criado_em) || texto(item.created_at),
  };
}

function compararPorData(a: { criadoEm: string }, b: { criadoEm: string }) {
  const dataA = new Date(a.criadoEm).getTime();
  const dataB = new Date(b.criadoEm).getTime();

  return (Number.isNaN(dataB) ? 0 : dataB) - (Number.isNaN(dataA) ? 0 : dataA);
}

function removerDuplicadas(obras: ObraBusca[]) {
  const chaves = new Set<string>();

  return obras.filter((obra) => {
    const chave = `${normalizarTexto(obra.titulo)}:${normalizarTexto(obra.autor)}`;

    if (chaves.has(chave)) {
      return false;
    }

    chaves.add(chave);
    return true;
  });
}

function carregarObrasLocais() {
  const obras: ObraBusca[] = [];

  LOCAL_KEYS_OBRAS.forEach((chave) => {
    try {
      const textoSalvo = window.localStorage.getItem(chave);
      const json: unknown = textoSalvo ? JSON.parse(textoSalvo) : [];

      if (!Array.isArray(json)) {
        return;
      }

      json.forEach((item, index) => {
        const obra = normalizarObra(item, "local", index);

        if (obra) {
          obras.push(obra);
        }
      });
    } catch {
      // Ignora dados locais inválidos.
    }
  });

  return obras;
}

async function carregarObrasSupabase() {
  try {
    const { data, error } = await supabase.from("obras").select("*").limit(160);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data
      .map((item, index) => normalizarObra(item, "supabase", index))
      .filter((obra): obra is ObraBusca => Boolean(obra));
  } catch {
    return [];
  }
}

async function carregarCapitulosSupabase(obras: ObraBusca[]) {
  try {
    const obrasPorId = new Map(obras.map((obra) => [obra.id, obra]));
    const { data, error } = await supabase.from("capitulos").select("*").limit(260);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data
      .map((item, index) => capituloSupabase(item, index, obrasPorId))
      .filter((capitulo): capitulo is CapituloBusca => Boolean(capitulo));
  } catch {
    return [];
  }
}

export default function BuscaPage() {
  const [termo, setTermo] = useState("");
  const [obras, setObras] = useState<ObraBusca[]>([]);
  const [capitulosExternos, setCapitulosExternos] = useState<CapituloBusca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarDesktop);
      };
    }

    mediaQuery.addListener(atualizarDesktop);

    return () => {
      mediaQuery.removeListener(atualizarDesktop);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro("");

      const locais = carregarObrasLocais();
      const supabaseObras = await carregarObrasSupabase();
      const obrasCombinadas = removerDuplicadas([...supabaseObras, ...locais]);
      const capitulos = await carregarCapitulosSupabase(obrasCombinadas);

      if (cancelado) {
        return;
      }

      setObras(obrasCombinadas.sort(compararPorData));
      setCapitulosExternos(capitulos.sort(compararPorData));

      if (obrasCombinadas.length === 0 && capitulos.length === 0) {
        setErro("Nenhum dado encontrado no Supabase ou no localStorage.");
      }

      setCarregando(false);
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  const termoNormalizado = useMemo(() => normalizarTexto(termo), [termo]);

  const capitulos = useMemo(() => {
    const vistos = new Set<string>();

    return [...obras.flatMap((obra) => obra.capitulos), ...capitulosExternos].filter(
      (capitulo) => {
        const chave = `${capitulo.obraTitulo}:${capitulo.numero}:${capitulo.titulo}`;

        if (vistos.has(chave)) {
          return false;
        }

        vistos.add(chave);
        return true;
      }
    );
  }, [capitulosExternos, obras]);

  const obrasFiltradas = useMemo(() => {
    const lista = termoNormalizado
      ? obras.filter((obra) => {
          const conteudo = normalizarTexto(
            [
              obra.titulo,
              obra.autor,
              obra.genero,
              obra.status,
              obra.classificacao,
              obra.sinopse,
              ...obra.tags,
            ].join(" ")
          );

          return conteudo.includes(termoNormalizado);
        })
      : obras;

    return lista.slice(0, termoNormalizado ? 30 : 12);
  }, [obras, termoNormalizado]);

  const autores = useMemo<AutorBusca[]>(() => {
    const mapa = new Map<string, AutorBusca>();

    obras.forEach((obra) => {
      const conteudo = normalizarTexto([obra.autor, obra.titulo, obra.genero, ...obra.tags].join(" "));

      if (termoNormalizado && !conteudo.includes(termoNormalizado)) {
        return;
      }

      const atual = mapa.get(obra.autor) || {
        nome: obra.autor,
        total: 0,
        generos: [],
      };

      atual.total += 1;

      if (obra.genero && !atual.generos.includes(obra.genero)) {
        atual.generos.push(obra.genero);
      }

      mapa.set(obra.autor, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, termoNormalizado ? 18 : 8);
  }, [obras, termoNormalizado]);

  const capitulosFiltrados = useMemo(() => {
    const lista = termoNormalizado
      ? capitulos.filter((capitulo) => {
          const conteudo = normalizarTexto(
            [capitulo.titulo, capitulo.obraTitulo, String(capitulo.numero)].join(" ")
          );

          return conteudo.includes(termoNormalizado);
        })
      : capitulos;

    return lista.slice(0, termoNormalizado ? 30 : 10);
  }, [capitulos, termoNormalizado]);

  const termos = useMemo<TermoBusca[]>(() => {
    const mapa = new Map<string, TermoBusca>();

    obras.forEach((obra) => {
      const entradas: TermoBusca[] = [
        { tipo: "Gênero" as const, nome: obra.genero, total: 1 },
        ...obra.tags.map((tag) => ({ tipo: "Tag" as const, nome: tag, total: 1 })),
      ].filter((item) => item.nome);

      entradas.forEach((item) => {
        if (termoNormalizado && !normalizarTexto(item.nome).includes(termoNormalizado)) {
          return;
        }

        const chave = `${item.tipo}:${normalizarTexto(item.nome)}`;
        const atual = mapa.get(chave) || { ...item, total: 0 };
        atual.total += 1;
        mapa.set(chave, atual);
      });
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, termoNormalizado ? 24 : 12);
  }, [obras, termoNormalizado]);

  const totalResultados =
    obrasFiltradas.length + autores.length + capitulosFiltrados.length + termos.length;

  return (
    <main style={pageThemeStyle}>
      <style>{historietasThemeCss}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={heroStyle}>
          <span style={miniTitleStyle}>BUSCA GLOBAL</span>

          <h1 style={titleStyle}>Encontre histórias, autores e capítulos</h1>

          <p style={descriptionStyle}>
            Pesquise obras, autores, gêneros, tags e capítulos em uma única área.
          </p>

          <label style={searchBoxStyle}>
            <span style={searchLabelStyle}>O que você quer encontrar?</span>

            <input
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Buscar por obra, autor, gênero, tag ou capítulo..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={90}
              style={searchInputStyle}
            />
          </label>

          <div style={chipsWrapStyle}>
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setTermo(chip)}
                style={chipButtonStyle}
              >
                {chip}
              </button>
            ))}

            {termo && (
              <button type="button" onClick={() => setTermo("")} style={clearButtonStyle}>
                Limpar
              </button>
            )}
          </div>
        </header>

        {(erro || carregando) && (
          <section style={feedbackBoxStyle}>
            {carregando ? (
              <span style={mutedTextStyle}>Carregando dados da busca...</span>
            ) : (
              <span style={errorTextStyle}>{erro}</span>
            )}
          </section>
        )}

        <section style={summaryStyle}>
          <strong style={summaryTitleStyle}>
            {termo
              ? `${totalResultados} resultados encontrados`
              : "Catálogo inicial da busca"}
          </strong>

          <span style={summaryTextStyle}>
            {obras.length} obras · {autores.length} autores · {capitulos.length} capítulos
          </span>
        </section>

        <section style={isDesktop ? desktopGridStyle : sectionsGridStyle}>
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={miniTitleStyle}>OBRAS</span>
              <strong style={sectionCountStyle}>{obrasFiltradas.length}</strong>
            </div>

            <div style={cardsGridStyle}>
              {obrasFiltradas.length > 0 ? (
                obrasFiltradas.map((obra) => (
                  <article key={`${obra.titulo}-${obra.autor}`} style={obraCardStyle}>
                    <div style={cardTopStyle}>
                      <span style={genreBadgeStyle}>{obra.genero}</span>
                      <span style={ratingBadgeStyle}>{obra.classificacao}</span>
                    </div>

                    <h2 style={cardTitleStyle}>{obra.titulo}</h2>
                    <p style={cardMetaStyle}>Por {obra.autor}</p>
                    <p style={cardTextStyle}>{obra.sinopse}</p>

                    <div style={tagWrapStyle}>
                      {obra.tags.slice(0, 3).map((tag) => (
                        <span key={`${obra.titulo}-${tag}`} style={tagStyle}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div style={actionsRowStyle}>
                      <Link href={obra.link || `/obra/${obra.slug}`} style={primaryLinkStyle}>
                        Ver obra
                      </Link>

                      <Link
                        href={`/perfil-autor?autor=${encodeURIComponent(obra.autor)}`}
                        style={secondaryLinkStyle}
                      >
                        Autor
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article style={emptyStyle}>
                  <strong style={emptyTitleStyle}>Nenhuma obra encontrada.</strong>
                </article>
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={miniTitleStyle}>AUTORES</span>
              <strong style={sectionCountStyle}>{autores.length}</strong>
            </div>

            <div style={smallCardsGridStyle}>
              {autores.length > 0 ? (
                autores.map((autor) => (
                  <Link
                    key={autor.nome}
                    href={`/perfil-autor?autor=${encodeURIComponent(autor.nome)}`}
                    style={authorCardStyle}
                  >
                    <span style={avatarStyle}>{autor.nome.slice(0, 1).toUpperCase()}</span>
                    <strong style={authorNameStyle}>{autor.nome}</strong>
                    <span style={authorMetaStyle}>
                      {autor.total} {autor.total === 1 ? "obra" : "obras"}
                    </span>
                    <span style={authorGenreStyle}>
                      {autor.generos.slice(0, 2).join(" · ") || "Sem gênero"}
                    </span>
                  </Link>
                ))
              ) : (
                <article style={emptyStyle}>
                  <strong style={emptyTitleStyle}>Nenhum autor encontrado.</strong>
                </article>
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={miniTitleStyle}>CAPÍTULOS</span>
              <strong style={sectionCountStyle}>{capitulosFiltrados.length}</strong>
            </div>

            <div style={smallCardsGridStyle}>
              {capitulosFiltrados.length > 0 ? (
                capitulosFiltrados.map((capitulo) => (
                  <Link
                    key={`${capitulo.obraTitulo}-${capitulo.id}`}
                    href={`/ler-capitulo?obraId=${encodeURIComponent(
                      capitulo.obraId
                    )}&capituloId=${encodeURIComponent(capitulo.id)}`}
                    style={chapterCardStyle}
                  >
                    <span style={chapterBadgeStyle}>Capítulo {capitulo.numero}</span>
                    <strong style={chapterTitleStyle}>{capitulo.titulo}</strong>
                    <span style={chapterMetaStyle}>{capitulo.obraTitulo}</span>
                  </Link>
                ))
              ) : (
                <article style={emptyStyle}>
                  <strong style={emptyTitleStyle}>Nenhum capítulo encontrado.</strong>
                </article>
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={miniTitleStyle}>GÊNEROS E TAGS</span>
              <strong style={sectionCountStyle}>{termos.length}</strong>
            </div>

            <div style={termGridStyle}>
              {termos.length > 0 ? (
                termos.map((item) => (
                  <button
                    key={`${item.tipo}-${item.nome}`}
                    type="button"
                    onClick={() => setTermo(item.nome)}
                    style={termButtonStyle}
                  >
                    <span style={termTypeStyle}>{item.tipo}</span>
                    <strong style={termNameStyle}>{item.nome}</strong>
                    <span style={termTotalStyle}>
                      {item.total} {item.total === 1 ? "obra" : "obras"}
                    </span>
                  </button>
                ))
              ) : (
                <article style={emptyStyle}>
                  <strong style={emptyTitleStyle}>Nenhuma tag encontrada.</strong>
                </article>
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.94)) 42%, transparent 100%), radial-gradient(ellipse 72% 82% at 18% 44%, var(--historietas-glow-primary, rgba(124,58,237,0.24)) 0%, transparent 76%), radial-gradient(ellipse 48% 62% at 88% 32%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 78%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(1180px, calc(100% - 28px))",
  margin: "0 auto",
  padding: "18px 0 calc(36px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  paddingTop: "24px",
};

const heroStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "12px",
  padding: "22px 14px",
  borderRadius: "30px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.92)), var(--historietas-surface-strong, rgba(12,7,23,0.98)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  boxShadow: "none",
  textAlign: "center",
  overflow: "hidden",
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  maxWidth: "820px",
  fontSize: "clamp(34px, 7vw, 66px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.075em",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 52%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingBottom: "5px",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "680px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 760,
  ...safeTextStyle,
};

const searchBoxStyle: CSSProperties = {
  width: "min(760px, 100%)",
  display: "grid",
  gap: "8px",
  marginTop: "4px",
  minWidth: 0,
};

const searchLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  outline: "none",
  borderRadius: "999px",
  background: "var(--historietas-input-bg, rgba(255,255,255,0.055))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 18px",
  boxSizing: "border-box",
  fontSize: "14px",
  fontWeight: 850,
  textAlign: "center",
};

const chipsWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "8px",
  maxWidth: "760px",
};

const chipButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
};

const clearButtonStyle: CSSProperties = {
  ...chipButtonStyle,
  color: "var(--historietas-accent, #FDBA74)",
  border: "1px solid rgba(249,115,22,0.22)",
  background: "rgba(249,115,22,0.10)",
};

const feedbackBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "18px",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textAlign: "center",
};

const mutedTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 850,
};

const errorTextStyle: CSSProperties = {
  ...mutedTextStyle,
  color: "#FCA5A5",
};

const summaryStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  margin: "14px 0",
  padding: "12px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textAlign: "center",
};

const summaryTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const summaryTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 800,
  ...safeTextStyle,
};

const sectionsGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
};

const desktopGridStyle: CSSProperties = {
  ...sectionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignItems: "start",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.86)), var(--historietas-surface-strong, rgba(12,7,23,0.94)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  minWidth: 0,
  overflow: "hidden",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const sectionCountStyle: CSSProperties = {
  minWidth: "34px",
  minHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.11)",
  border: "1px solid rgba(249,115,22,0.20)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
};

const cardsGridStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
};

const smallCardsGridStyle: CSSProperties = {
  ...cardsGridStyle,
};

const obraCardStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "20px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const cardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
};

const genreBadgeStyle: CSSProperties = {
  minHeight: "26px",
  display: "inline-flex",
  alignItems: "center",
  padding: "0 9px",
  borderRadius: "999px",
  background: "rgba(124,58,237,0.16)",
  border: "1px solid rgba(124,58,237,0.22)",
  color: "#DDD6FE",
  fontSize: "10px",
  fontWeight: 950,
};

const ratingBadgeStyle: CSSProperties = {
  ...genreBadgeStyle,
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.20)",
  color: "var(--historietas-accent, #FDBA74)",
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const cardMetaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const cardTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 760,
  ...safeTextStyle,
};

const tagWrapStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const tagStyle: CSSProperties = {
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
};

const actionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const primaryLinkStyle: CSSProperties = {
  minHeight: "38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-secondary, #7C3AED), var(--historietas-accent, #F97316))",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  textAlign: "center",
  padding: "0 10px",
  boxSizing: "border-box",
};

const secondaryLinkStyle: CSSProperties = {
  ...primaryLinkStyle,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const authorCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  padding: "12px",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textDecoration: "none",
  textAlign: "center",
  minWidth: 0,
};

const avatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-secondary, #7C3AED), var(--historietas-accent, #F97316))",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 950,
};

const authorNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  ...safeTextStyle,
};

const authorMetaStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 900,
};

const authorGenreStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 760,
  ...safeTextStyle,
};

const chapterCardStyle: CSSProperties = {
  ...authorCardStyle,
  alignItems: "start",
  justifyItems: "start",
  textAlign: "left",
};

const chapterBadgeStyle: CSSProperties = {
  ...genreBadgeStyle,
};

const chapterTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const chapterMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 800,
  ...safeTextStyle,
};

const termGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const termButtonStyle: CSSProperties = {
  minHeight: "78px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  borderRadius: "18px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  padding: "8px",
};

const termTypeStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const termNameStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const termTotalStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 850,
};

const emptyStyle: CSSProperties = {
  padding: "20px 12px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textAlign: "center",
};

const emptyTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  fontWeight: 900,
  ...safeTextStyle,
};
