"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { normalizarTexto } from "../../../lib/utils";
import { Top5LanguageBridge } from "./components/top5-language-bridge";
import { pegarTexto } from "./lib/top5-work-normalizers";
import {
  criarChaveObraTop5,
  obterIdentificadoresObraTop5,
} from "./lib/top5-work-identifiers";
import { carregarObrasLocaisTop5 } from "./lib/top5-local-works-loader";
import { carregarObrasSupabaseTop5 } from "./lib/top5-supabase-works-loader";
import { mesclarObrasTop5 } from "./lib/top5-work-merge";
import {
  TOP_FIVE_MAXIMO,
  carregarTop5Salvo,
  salvarTop5,
} from "./lib/top5-selection-storage";
import type {
  ObraTop5,
  UsuarioTop5,
} from "./lib/top5-types";

function normalizarIdsSelecionadosTop5(
  ids: string[],
  obrasDisponiveis: ObraTop5[],
) {
  const obrasPorIdentificador = new Map<string, ObraTop5>();

  obrasDisponiveis.forEach((obra) => {
    obterIdentificadoresObraTop5(obra).forEach((identificador) => {
      obrasPorIdentificador.set(identificador, obra);
    });
  });

  const idsNormalizados: string[] = [];
  const chavesUsadas = new Set<string>();

  ids.forEach((id) => {
    const obra = obrasPorIdentificador.get(id.trim());

    if (!obra) {
      return;
    }

    const chaveCanonica = criarChaveObraTop5(obra);

    if (!chaveCanonica || chavesUsadas.has(chaveCanonica)) {
      return;
    }

    chavesUsadas.add(chaveCanonica);
    idsNormalizados.push(chaveCanonica);
  });

  return idsNormalizados.slice(0, TOP_FIVE_MAXIMO);
}

function criarCapaTop5Style(capa: string): CSSProperties {
  if (!capa) {
    return top5CoverEmptyStyle;
  }

  return {
    ...top5CoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarCapaSelecionadaTop5Style(capa: string): CSSProperties {
  if (!capa) {
    return selectedCoverEmptyStyle;
  }

  return {
    ...selectedCoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export default function Top5PerfilAutorPage() {
  const router = useRouter();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const [usuario, setUsuario] = useState<UsuarioTop5 | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [obras, setObras] = useState<ObraTop5[]>([]);
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function iniciarPagina() {
      setCarregando(true);

      try {
        const [{ data: authData }, obrasSupabase] = await Promise.all([
          supabase.auth.getUser(),
          carregarObrasSupabaseTop5(),
        ]);

        if (cancelado) {
          return;
        }

        const userId = authData.user?.id || "";
        let nomeUsuario =
          pegarTexto(authData.user?.user_metadata?.nome) ||
          pegarTexto(authData.user?.user_metadata?.name) ||
          pegarTexto(authData.user?.email) ||
          "Usuário";

        if (userId) {
          const { data: perfilAtual, error: erroPerfilAtual } = await supabase
            .from("profiles")
            .select("nome")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

          if (!erroPerfilAtual) {
            nomeUsuario = pegarTexto(perfilAtual?.nome) || nomeUsuario;
          }
        }

        if (cancelado) {
          return;
        }

        const obrasMescladas = mesclarObrasTop5([
          ...carregarObrasLocaisTop5(userId),
          ...obrasSupabase,
        ]);
        const idsSalvos = userId ? carregarTop5Salvo(userId) : [];
        const idsNormalizados = normalizarIdsSelecionadosTop5(
          idsSalvos,
          obrasMescladas,
        );

        setUsuario(userId ? { id: userId, nome: nomeUsuario } : null);
        setObras(obrasMescladas);
        setIdsSelecionados(idsNormalizados);

        if (
          userId &&
          JSON.stringify(idsSalvos) !== JSON.stringify(idsNormalizados)
        ) {
          salvarTop5(userId, idsNormalizados);
        }
      } catch {
        if (!cancelado) {
          setUsuario(null);
          setObras([]);
          setIdsSelecionados([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciarPagina();

    return () => {
      cancelado = true;
    };
  }, []);

  const obrasPorChave = useMemo(() => {
    const mapa = new Map<string, ObraTop5>();

    obras.forEach((obra) => {
      obterIdentificadoresObraTop5(obra).forEach((chave) => {
        mapa.set(chave, obra);
      });
    });

    return mapa;
  }, [obras]);

  const obrasSelecionadas = useMemo(
    () => idsSelecionados.map((id) => obrasPorChave.get(id)).filter((obra): obra is ObraTop5 => Boolean(obra)),
    [idsSelecionados, obrasPorChave],
  );

  const obrasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    const idsSelecionadosSet = new Set(idsSelecionados);
    const obrasOrdenadas = [...obras].sort((obraA, obraB) => {
      const selecionadaA = idsSelecionadosSet.has(criarChaveObraTop5(obraA));
      const selecionadaB = idsSelecionadosSet.has(criarChaveObraTop5(obraB));

      if (selecionadaA !== selecionadaB) {
        return Number(selecionadaB) - Number(selecionadaA);
      }

      return obraA.titulo.localeCompare(obraB.titulo, "pt-BR");
    });

    if (!buscaNormalizada) {
      return obrasOrdenadas;
    }

    return obrasOrdenadas.filter((obra) => {
      const textoBusca = normalizarTexto(
        [obra.titulo, obra.autor, obra.genero, obra.formato, ...obra.tags].join(" "),
      );

      return textoBusca.includes(buscaNormalizada);
    });
  }, [busca, idsSelecionados, obras]);

  function alternarObraTop5(obra: ObraTop5) {
    const chave = criarChaveObraTop5(obra);

    if (!chave) {
      return;
    }

    setMensagem("");
    setIdsSelecionados((idsAtuais) => {
      if (idsAtuais.includes(chave)) {
        return idsAtuais.filter((id) => id !== chave);
      }

      if (idsAtuais.length >= TOP_FIVE_MAXIMO) {
        setMensagem("Você já escolheu 5 obras. Remova uma para trocar.");
        return idsAtuais;
      }

      return [...idsAtuais, chave];
    });
  }

  function removerSelecionadaTop5(chave: string) {
    setMensagem("");
    setIdsSelecionados((idsAtuais) => idsAtuais.filter((id) => id !== chave));
  }

  function moverSelecionadaTop5(chave: string, direcao: -1 | 1) {
    setIdsSelecionados((idsAtuais) => {
      const indiceAtual = idsAtuais.indexOf(chave);
      const novoIndice = indiceAtual + direcao;

      if (indiceAtual < 0 || novoIndice < 0 || novoIndice >= idsAtuais.length) {
        return idsAtuais;
      }

      const novaLista = [...idsAtuais];
      const [item] = novaLista.splice(indiceAtual, 1);
      novaLista.splice(novoIndice, 0, item);

      return novaLista;
    });
  }

  function salvarEscolhasTop5() {
    if (!usuario?.id) {
      setMensagem("Entre na sua conta para salvar seu TOP 5.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      const idsValidos = normalizarIdsSelecionadosTop5(
        idsSelecionados,
        obras,
      );

      const salvou = salvarTop5(usuario.id, idsValidos);

      if (!salvou) {
        throw new Error("Não foi possível gravar o TOP 5 no navegador.");
      }

      setIdsSelecionados(idsValidos);
      router.push("/perfil-autor");
    } catch {
      setSalvando(false);
      setMensagem("Não foi possível salvar agora. Tente novamente.");
    }
  }

  return (
    <main data-historietas-top5-root="true" style={pageThemeStyle}>
      <Top5LanguageBridge />
      <style>{`${historietasThemeCss}${top5PerfilAutorPageCss}`}</style>
      <section style={selectedSectionStyle} aria-label="Obras escolhidas para o TOP 5">
        <div style={selectedHeaderStyle}>
          <span style={selectedTitleStyle}>Seu TOP 5</span>

          <div style={footerActionsStyle}>
            <Link href="/perfil-autor" style={cancelButtonStyle}>
              Cancelar
            </Link>
            <button
              type="button"
              onClick={salvarEscolhasTop5}
              disabled={salvando || !usuario?.id}
              style={
                salvando || !usuario?.id
                  ? saveButtonDisabledStyle
                  : saveButtonStyle
              }
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div style={selectedListStyle}>
          {Array.from({ length: TOP_FIVE_MAXIMO }).map((_, index) => {
            const obra = obrasSelecionadas[index];
            const chave = obra ? criarChaveObraTop5(obra) : "";

            return (
              <div key={`slot-top-5-${index + 1}`} style={selectedSlotStyle}>
                <span style={selectedNumberStyle}>{index + 1}</span>

                {obra ? (
                  <>
                    <button
                      type="button"
                      onClick={() => removerSelecionadaTop5(chave)}
                      style={selectedRemoveButtonStyle}
                      aria-label={`Remover ${obra.titulo} do TOP 5`}
                    >
                      ×
                    </button>
                    <div style={criarCapaSelecionadaTop5Style(obra.capa)} />
                    <div style={selectedActionsStyle}>
                      <button
                        type="button"
                        onClick={() => moverSelecionadaTop5(chave, -1)}
                        style={selectedMoveButtonStyle}
                        aria-label={`Subir ${obra.titulo}`}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moverSelecionadaTop5(chave, 1)}
                        style={selectedMoveButtonStyle}
                        aria-label={`Descer ${obra.titulo}`}
                        disabled={index === obrasSelecionadas.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={emptySelectedSlotStyle}>+</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section style={searchSectionStyle} aria-label="Buscar obras">
        <label style={searchShellStyle} htmlFor="buscar-obra-top-5">
          <span style={searchIconStyle}>⌕</span>

          <input
            id="buscar-obra-top-5"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            aria-label="Pesquisar obra, autor, gênero ou tag"
            placeholder="Pesquisar obra, autor, gênero ou tag"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={90}
            style={searchInputStyle}
            type="text"
          />
        </label>
      </section>

      {mensagem && (
        <p role="status" aria-live="polite" style={messageStyle}>
          {mensagem}
        </p>
      )}

      {!usuario && !carregando && (
        <section style={noticeStyle}>
          <strong style={noticeTitleStyle}>Entre para salvar seu TOP 5</strong>
          <span style={noticeTextStyle}>
            Você pode ver as obras, mas precisa estar logado para salvar suas escolhas.
          </span>
          <Link href="/login?redirectTo=/perfil-autor/top-5" style={loginButtonStyle}>
            Entrar
          </Link>
        </section>
      )}

      <section style={gridSectionStyle} aria-label="Lista de obras disponíveis">
        {carregando && (
          <p role="status" aria-live="polite" style={loadingStyle}>
            Carregando obras...
          </p>
        )}

        {!carregando && (
          obrasFiltradas.length > 0 ? (
            <div
              data-historietas-top5-works-grid="true"
              style={worksGridStyle}
            >
              {obrasFiltradas.map((obra) => {
                const chave = criarChaveObraTop5(obra);
                const posicaoSelecionada = idsSelecionados.indexOf(chave) + 1;
                const selecionada = posicaoSelecionada > 0;

                return (
                  <button
                    key={`obra-top-5-${chave}`}
                    type="button"
                    onClick={() => alternarObraTop5(obra)}
                    style={selecionada ? top5CardSelectedStyle : top5CardStyle}
                    aria-label={
                      selecionada
                        ? `Remover ${obra.titulo} do TOP 5`
                        : `Adicionar ${obra.titulo} ao TOP 5`
                    }
                  >
                    <div style={criarCapaTop5Style(obra.capa)}>
                      {selecionada && <span style={selectedBadgeStyle}>{posicaoSelecionada}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p
              style={{
                margin: "10px 0 0",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Nenhuma obra encontrada
            </p>
          )
        )}
      </section>

    </main>
  );
}

const top5PerfilAutorPageCss = `
  html {
    --historietas-top5-message: #FDE68A;
    --historietas-top5-purple-page: rgba(124,58,237,0.12);
    --historietas-top5-purple-empty: rgba(124,58,237,0.18);
    --historietas-top5-purple-cover: rgba(124,58,237,0.22);
    --historietas-top5-orange-soft: rgba(249,115,22,0.10);
    --historietas-top5-orange-cover: rgba(249,115,22,0.13);
    --historietas-top5-orange-border: rgba(249,115,22,0.20);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-top5-message: #FFFFFF;
    --historietas-top5-purple-page: rgba(255,255,255,0.06);
    --historietas-top5-purple-empty: rgba(255,255,255,0.08);
    --historietas-top5-purple-cover: rgba(255,255,255,0.10);
    --historietas-top5-orange-soft: rgba(255,255,255,0.06);
    --historietas-top5-orange-cover: rgba(255,255,255,0.08);
    --historietas-top5-orange-border: rgba(255,255,255,0.18);
  }

  html[data-historietas-tema-visual="original"] body {
    background: #000000 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual="foco"] input,
  html[data-historietas-tema-visual="foco"] button,
  html[data-historietas-tema-visual="foco"] a {
    color: #FFFFFF;
  }


  @media (min-width: 768px) {
    [data-historietas-top5-works-grid="true"] {
      grid-template-columns: repeat(
        auto-fill,
        minmax(138px, 1fr)
      ) !important;
      row-gap: 12px !important;
      column-gap: 14px !important;
    }
  }
`;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "12px 10px 48px",
  background:
    "radial-gradient(circle at top left, var(--historietas-top5-purple-page, rgba(124,58,237,0.12)), transparent 34%), #000000",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const selectedSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
};

const selectedHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  marginBottom: "8px",
};

const selectedTitleStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  opacity: 1,
  filter: "none",
  textShadow: "none",
};

 const selectedListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "5px",
};

const selectedSlotStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  aspectRatio: "0.62 / 1",
  borderRadius: "15px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const selectedNumberStyle: CSSProperties = {
  position: "absolute",
  top: "6px",
  left: "6px",
  zIndex: 3,
  width: "19px",
  height: "19px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.76)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
};

const selectedRemoveButtonStyle: CSSProperties = {
  position: "absolute",
  top: "5px",
  right: "5px",
  zIndex: 4,
  width: "22px",
  height: "22px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.72)",
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1,
  cursor: "pointer",
};

const selectedActionsStyle: CSSProperties = {
  position: "absolute",
  left: "5px",
  right: "5px",
  bottom: "5px",
  zIndex: 4,
  display: "flex",
  justifyContent: "space-between",
  gap: "4px",
};

const selectedMoveButtonStyle: CSSProperties = {
  width: "24px",
  height: "22px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.68)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
};

const selectedCoverStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "#09090B",
};

const selectedCoverEmptyStyle: CSSProperties = {
  ...selectedCoverStyle,
  background:
    "linear-gradient(135deg, var(--historietas-top5-purple-empty, rgba(124,58,237,0.18)), var(--historietas-top5-orange-soft, rgba(249,115,22,0.10))), #09090B",
};

const emptySelectedSlotStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.28)",
  fontSize: "28px",
  fontWeight: 400,
};

const searchSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  boxSizing: "border-box",
};

const searchShellStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 16px",
  boxSizing: "border-box",
  boxShadow: "none",
};

const searchIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const searchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "46px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 850,
  letterSpacing: "-0.035em",
  boxSizing: "border-box",
};

const messageStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
  color: "var(--historietas-top5-message, #FDE68A)",
  fontSize: "12px",
  fontWeight: 800,
};

const loadingStyle: CSSProperties = {
  margin: "18px 0 0",
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

const noticeStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 12px",
  padding: "12px",
  borderRadius: "18px",
  background: "var(--historietas-top5-orange-soft, rgba(249,115,22,0.10))",
  border: "1px solid var(--historietas-top5-orange-border, rgba(249,115,22,0.20))",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const noticeTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
};

const noticeTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 650,
};

const loginButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  marginTop: "3px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#0A0A0A",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
};

const gridSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
};

const worksGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "start",
  rowGap: "10px",
  columnGap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const top5CardStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "0",
  border: "0",
  background: "transparent",
  color: "#FFFFFF",
  cursor: "pointer",
  textAlign: "left",
};

const top5CardSelectedStyle: CSSProperties = {
  ...top5CardStyle,
};

const top5CoverStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#09090B",
  border: "none",
  boxShadow: "none",
};

const top5CoverEmptyStyle: CSSProperties = {
  ...top5CoverStyle,
  background:
    "linear-gradient(135deg, var(--historietas-top5-purple-cover, rgba(124,58,237,0.22)), var(--historietas-top5-orange-cover, rgba(249,115,22,0.13))), #09090B",
};

const selectedBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "7px",
  left: "7px",
  width: "28px",
  height: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.76)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(0,0,0,0.32)",
};


const footerActionsStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  margin: 0,
};

const cancelButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#0B0B0B",
  border: "1px solid #2A2A2A",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const saveButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  border: "1px solid #2A2A2A",
  borderRadius: "999px",
  background: "#0B0B0B",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const saveButtonDisabledStyle: CSSProperties = {
  ...saveButtonStyle,
  opacity: 0.48,
  cursor: "not-allowed",
};
