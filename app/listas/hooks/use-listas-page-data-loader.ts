import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import {
  carregarEstadoRelacionamentoPerfil,
  carregarPermissoesAbasPerfil,
  carregarPreferenciasPrivacidade,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
  type PreferenciasPrivacidadeHistorietas,
} from "../../../lib/historietasPrivacy";
import { normalizarTexto } from "../../../lib/utils";
import {
  carregarAvaliacaoDiarioListas,
  carregarPerfil,
} from "../lib/listas-profile-records-loader";
import { carregarListasDoPerfil } from "../lib/listas-profile-loader";
import { carregarObrasPublicadas } from "../lib/listas-published-works-loader";
import {
  carregarAutoresPublicos,
  carregarIdsInteracoesUsuario,
} from "../lib/listas-public-catalog-loader";
import {
  ordenarObrasDaSecao,
  ordenarRecomendacoes,
} from "../lib/listas-public-catalog-utils";
import {
  type AvaliacaoDiarioListasEstado,
} from "../lib/listas-diary-rating-utils";
import {
  idUsuarioValido,
  obterMensagemErroListas,
  pegarTexto,
} from "../lib/listas-value-utils";

type ModoLista = "perfil" | "obras" | "autores";
type OrigemPerfil = "diario" | "biblioteca";

type PerfilListaLike = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
};

type ItemObraListaLike<TCategoria extends string> = {
  chave: string;
  obra: Awaited<ReturnType<typeof carregarObrasPublicadas>>[number];
  categorias: TCategoria[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
};

type StateSetter<T> = Dispatch<SetStateAction<T>>;

type UseListasPageDataLoaderParams<
  TCategoria extends string,
  TItem extends ItemObraListaLike<TCategoria>,
> = {
  modo: ModoLista;
  origemPerfil: OrigemPerfil;
  userIdUrl: string;
  secao: string;
  genero: string;
  listasPerfilVazias: Record<TCategoria, TItem[]>;
  permissoesProprioPerfil: PermissoesAbasPerfil;
  storageKeys: {
    seguindo: string;
    favoritas: string;
    concluidas: string;
  };
  avaliacaoDiarioVazia: AvaliacaoDiarioListasEstado;
  setCarregando: StateSetter<boolean>;
  setBloqueado: StateSetter<boolean>;
  setErro: StateSetter<string>;
  setAvaliacaoDiario: StateSetter<AvaliacaoDiarioListasEstado>;
  setUsuarioAtualId: StateSetter<string>;
  setUsuarioAtualPerfil: StateSetter<PerfilListaLike | null>;
  setPerfil: StateSetter<PerfilListaLike | null>;
  setListasPerfil: StateSetter<Record<TCategoria, TItem[]>>;
  setPreferenciasPerfil: StateSetter<PreferenciasPrivacidadeHistorietas>;
  setRelacionamentoPerfil: StateSetter<EstadoRelacionamentoPerfil>;
  setObrasPublicas: StateSetter<
    Awaited<ReturnType<typeof carregarObrasPublicadas>>
  >;
  setAutores: StateSetter<Awaited<ReturnType<typeof carregarAutoresPublicos>>>;
};

export function useListasPageDataLoader<
  TCategoria extends string,
  TItem extends ItemObraListaLike<TCategoria>,
>({
  modo,
  origemPerfil,
  userIdUrl,
  secao,
  genero,
  listasPerfilVazias,
  permissoesProprioPerfil,
  storageKeys,
  avaliacaoDiarioVazia,
  setCarregando,
  setBloqueado,
  setErro,
  setAvaliacaoDiario,
  setUsuarioAtualId,
  setUsuarioAtualPerfil,
  setPerfil,
  setListasPerfil,
  setPreferenciasPerfil,
  setRelacionamentoPerfil,
  setObrasPublicas,
  setAutores,
}: UseListasPageDataLoaderParams<TCategoria, TItem>) {
  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setBloqueado(false);
      setErro("");
      setAvaliacaoDiario((atual) => ({
        ...avaliacaoDiarioVazia,
        carregando: modo === "perfil" && origemPerfil === "diario",
        configuracoesAbertas: atual.configuracoesAbertas,
      }));

      try {
        const { data: authData } = await supabase.auth.getUser();
        const usuarioLogadoId = authData.user?.id || "";

        if (cancelado) {
          return;
        }

        setUsuarioAtualId(usuarioLogadoId);

        if (usuarioLogadoId) {
          try {
            const perfilUsuarioAtual = await carregarPerfil(
              usuarioLogadoId,
              pegarTexto(authData.user?.user_metadata?.nome) ||
                pegarTexto(authData.user?.email) ||
                "Usuário",
            );

            if (!cancelado) {
              setUsuarioAtualPerfil(perfilUsuarioAtual);
            }
          } catch {
            if (!cancelado) {
              setUsuarioAtualPerfil({
                userId: usuarioLogadoId,
                nome:
                  pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email) ||
                  "Usuário",
                username: pegarTexto(
                  authData.user?.user_metadata?.username,
                ).replace(/^@/, ""),
                avatar: pegarTexto(
                  authData.user?.user_metadata?.avatar_url ??
                    authData.user?.user_metadata?.avatar,
                ),
                bio: "",
              });
            }
          }
        } else {
          setUsuarioAtualPerfil(null);
        }

        if (modo === "perfil") {
          const perfilIdRecebido = userIdUrl.trim() || usuarioLogadoId;

          if (!perfilIdRecebido || !idUsuarioValido(perfilIdRecebido)) {
            setPerfil(null);
            setListasPerfil(listasPerfilVazias);
            setErro("Não foi possível identificar o perfil desta lista.");
            return;
          }

          const perfilInicialmenteProprio =
            perfilIdRecebido === usuarioLogadoId;
          const perfilCarregado = await carregarPerfil(
            perfilIdRecebido,
            perfilInicialmenteProprio
              ? pegarTexto(authData.user?.user_metadata?.nome) ||
                  pegarTexto(authData.user?.email)
              : "",
          );
          const perfilUserId =
            perfilCarregado.userId.trim() || perfilIdRecebido;
          const proprioPerfil =
            Boolean(usuarioLogadoId) &&
            (perfilUserId === usuarioLogadoId ||
              perfilIdRecebido === usuarioLogadoId);
          const preferencias = await carregarPreferenciasPrivacidade(
            perfilUserId,
            {
              usarFallbackLocal: proprioPerfil,
            },
          );
          const permissoes = proprioPerfil
            ? permissoesProprioPerfil
            : await carregarPermissoesAbasPerfil(perfilUserId, preferencias);
          const permitido =
            origemPerfil === "biblioteca"
              ? permissoes.biblioteca
              : permissoes.diario;
          const relacionamento = proprioPerfil
            ? "proprio_perfil"
            : await carregarEstadoRelacionamentoPerfil(
                perfilUserId,
                usuarioLogadoId,
              );

          if (cancelado) {
            return;
          }

          setPerfil(perfilCarregado);
          setPreferenciasPerfil(preferencias);
          setRelacionamentoPerfil(relacionamento);

          if (origemPerfil === "diario") {
            try {
              const avaliacaoCarregada = await carregarAvaliacaoDiarioListas(
                perfilUserId,
              );

              if (!cancelado) {
                setAvaliacaoDiario(avaliacaoCarregada);
              }
            } catch (error) {
              if (!cancelado) {
                setAvaliacaoDiario((atual) => ({
                  ...atual,
                  carregando: false,
                  erro: obterMensagemErroListas(
                    error,
                    "Não foi possível carregar a Avaliação do Diário.",
                  ),
                }));
              }
            }
          }

          if (!permitido) {
            setBloqueado(true);
            setListasPerfil(listasPerfilVazias);
            return;
          }

          const listas = await carregarListasDoPerfil<
            TCategoria,
            TItem
          >(perfilUserId, proprioPerfil, storageKeys);

          if (!cancelado) {
            setListasPerfil(listas);
          }

          return;
        }

        const catalogo = await carregarObrasPublicadas();

        if (cancelado) {
          return;
        }

        let obrasPreparadas = catalogo.filter(
          (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
        );

        if (genero) {
          const generoNormalizado = normalizarTexto(genero);
          obrasPreparadas = obrasPreparadas.filter((obra) =>
            normalizarTexto(obra.genero).includes(generoNormalizado),
          );
        }

        if (secao === "recomendacoes") {
          const idsInteracoes = await carregarIdsInteracoesUsuario(usuarioLogadoId);
          obrasPreparadas = ordenarRecomendacoes(obrasPreparadas, idsInteracoes);
        } else {
          obrasPreparadas = ordenarObrasDaSecao(obrasPreparadas, secao);
        }

        setObrasPublicas(obrasPreparadas);

        if (modo === "autores") {
          const autoresCarregados = await carregarAutoresPublicos(obrasPreparadas);

          if (!cancelado) {
            setAutores(autoresCarregados);
          }
        }
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar esta lista agora.",
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  // Mantém a fronteira de dependências do efeito original da página.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, origemPerfil, userIdUrl, secao, genero]);
}
