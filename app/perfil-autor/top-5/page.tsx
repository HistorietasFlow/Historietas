"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { Top5LanguageBridge } from "./components/top5-language-bridge";
import { top5PerfilAutorPageCss } from "./lib/top5-page-css";
import {
  moverIdSelecionadoTop5,
  removerIdSelecionadoTop5,
} from "./lib/top5-selection-list";
import {
  gridSectionStyle,
  pageStyle,
  selectedBadgeStyle,
  top5CardSelectedStyle,
  top5CardStyle,
  worksGridStyle,
} from "./lib/top5-main-styles";
import {
  cancelButtonStyle,
  emptySelectedSlotStyle,
  footerActionsStyle,
  saveButtonDisabledStyle,
  saveButtonStyle,
  selectedActionsStyle,
  selectedHeaderStyle,
  selectedListStyle,
  selectedMoveButtonStyle,
  selectedNumberStyle,
  selectedRemoveButtonStyle,
  selectedSectionStyle,
  selectedSlotStyle,
  selectedTitleStyle,
} from "./lib/top5-selected-section-styles";
import {
  loadingStyle,
  loginButtonStyle,
  messageStyle,
  noticeStyle,
  noticeTextStyle,
  noticeTitleStyle,
} from "./lib/top5-search-feedback-styles";
import { Top5SearchSection } from "./components/top5-search-section";
import { filtrarObrasTop5 } from "./lib/top5-work-filter";
import { criarChaveObraTop5 } from "./lib/top5-work-identifiers";
import {
  criarMapaObrasTop5,
  selecionarObrasTop5,
} from "./lib/top5-work-selectors";
import {
  criarCapaSelecionadaTop5Style,
  criarCapaTop5Style,
} from "./lib/top5-cover-styles";
import { sincronizarSelecaoInicialTop5 } from "./lib/top5-initial-selection-sync";
import { carregarDadosIniciaisTop5 } from "./lib/top5-initial-data-loader";
import { prepararConteudoInicialTop5 } from "./lib/top5-initial-content";
import { persistirSelecaoTop5 } from "./lib/top5-selection-save";
import { alternarIdSelecionadoTop5 } from "./lib/top5-selection-toggle";
import { carregarNomePerfilTop5 } from "./lib/top5-profile-name-loader";
import { obterNomeInicialUsuarioTop5 } from "./lib/top5-user-name";
import { TOP_FIVE_MAXIMO } from "./lib/top5-selection-storage";
import type {
  ObraTop5,
  UsuarioTop5,
} from "./lib/top5-types";

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
        const {
          authData,
          obrasSupabase,
        } = await carregarDadosIniciaisTop5();

        if (cancelado) {
          return;
        }

        const userId = authData.user?.id || "";
        let nomeUsuario = obterNomeInicialUsuarioTop5(
          authData.user?.user_metadata?.nome,
          authData.user?.user_metadata?.name,
          authData.user?.email,
        );

        if (userId) {
          nomeUsuario = await carregarNomePerfilTop5(
            userId,
            nomeUsuario,
          );
        }

        if (cancelado) {
          return;
        }

        const {
          obrasMescladas,
          idsSalvos,
          idsNormalizados,
        } = prepararConteudoInicialTop5(
          userId,
          obrasSupabase,
        );

        setUsuario(userId ? { id: userId, nome: nomeUsuario } : null);
        setObras(obrasMescladas);
        setIdsSelecionados(idsNormalizados);

        sincronizarSelecaoInicialTop5(
          userId,
          idsSalvos,
          idsNormalizados,
        );
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

  const obrasPorChave = useMemo(
    () => criarMapaObrasTop5(obras),
    [obras],
  );

  const obrasSelecionadas = useMemo(
    () =>
      selecionarObrasTop5(
        idsSelecionados,
        obrasPorChave,
      ),
    [idsSelecionados, obrasPorChave],
  );

  const obrasFiltradas = useMemo(
    () => filtrarObrasTop5(obras, idsSelecionados, busca),
    [busca, idsSelecionados, obras],
  );

  function alternarObraTop5(obra: ObraTop5) {
    const chave = criarChaveObraTop5(obra);

    if (!chave) {
      return;
    }

    setMensagem("");
    setIdsSelecionados((idsAtuais) => {
      const resultado = alternarIdSelecionadoTop5(idsAtuais, chave);

      if (resultado.limiteAtingido) {
        setMensagem("Você já escolheu 5 obras. Remova uma para trocar.");
      }

      return resultado.ids;
    });
  }

  function removerSelecionadaTop5(chave: string) {
    setMensagem("");
    setIdsSelecionados((idsAtuais) =>
      removerIdSelecionadoTop5(
        idsAtuais,
        chave,
      ),
    );
  }

  function moverSelecionadaTop5(chave: string, direcao: -1 | 1) {
    setIdsSelecionados((idsAtuais) =>
      moverIdSelecionadoTop5(
        idsAtuais,
        chave,
        direcao,
      ),
    );
  }

  function salvarEscolhasTop5() {
    if (!usuario?.id) {
      setMensagem("Entre na sua conta para salvar seu TOP 5.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      const idsValidos = persistirSelecaoTop5(
        usuario.id,
        idsSelecionados,
        obras,
      );

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

      <Top5SearchSection busca={busca} onBuscaChange={setBusca} />

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
