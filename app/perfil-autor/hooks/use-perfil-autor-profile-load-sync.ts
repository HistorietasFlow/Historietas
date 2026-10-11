import { useEffect, type Dispatch, type SetStateAction } from "react";
import { idObraSupabaseValido } from "../../../lib/utils";
import {
  AUTHOR_FOLLOW_STORAGE_KEY,
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  LIBRARY_FOLLOW_STORAGE_KEY,
  STORAGE_KEY,
} from "../constants";
import type {
  AbaPerfilAutor,
  ObraLocal,
  ObraSalva,
  PerfisAutoresSalvos,
  PerfilUsuarioRemoto,
} from "../types";
import {
  normalizarAbaPerfilAutor,
  normalizarNomeAutor,
} from "../lib/profile-formatters";
import {
  filtrarObrasLocaisDoUsuarioPerfilAutor,
  mesclarObrasLocalStoragePerfilAutor,
  normalizarObra,
  obraPertenceAoUsuarioPerfilAutor,
} from "../lib/work-normalizers";
import {
  execucaoCarregamentoPerfilAutorEstaAtual,
  type IdentidadeAutenticadaPerfilAutor,
} from "../lib/profile-auth-identity";
import {
  aplicarInteracoesNasObras,
  mesclarObrasPorIdSlug,
} from "../lib/data-normalizers";
import { carregarPerfilUsuarioSupabase } from "../lib/profile-public-profile-loader";
import {
  carregarObrasPublicadasPorIdsSupabase,
  carregarObrasPublicadasSupabase,
} from "../lib/profile-published-works-loader";
import { carregarEstadoUsuarioSupabase } from "../lib/profile-user-state-loader";
import { carregarInteracoesCapitulosSupabase } from "../lib/profile-interactions-loader";
import {
  carregarJsonUsuarioPerfilAutor,
  carregarListaIdsPerfilBiblioteca,
  salvarJsonUsuarioPerfilAutor,
  salvarListaIdsPerfilBiblioteca,
} from "../lib/profile-local-storage-utils";
import { carregarPerfisAutores } from "../lib/profile-local-author-utils";

type Setter<T> = Dispatch<SetStateAction<T>>;

export function usePerfilAutorProfileLoadSync({
  autenticacaoCarregada,
  queryPerfilAtual,
  usuarioIdLogado,
  identidadeAutenticadaPerfilRef,
  setAbaPerfil,
  setAutorSelecionado,
  setAutorIdSelecionado,
  setMostrarDestaquesVisitante,
  setUsernameCabecalhoVisivel,
  setPerfilUsuarioRemoto,
  setObras,
  setAutoresSeguidos,
  setObrasFavoritas,
  setObrasConcluidas,
  setObrasSeguidasBiblioteca,
  setPerfisAutoresSalvos,
  setCarregando,
}: {
  autenticacaoCarregada: boolean;
  queryPerfilAtual: string;
  usuarioIdLogado: string;
  identidadeAutenticadaPerfilRef: {
    current: IdentidadeAutenticadaPerfilAutor;
  };
  setAbaPerfil: Setter<AbaPerfilAutor>;
  setAutorSelecionado: Setter<string>;
  setAutorIdSelecionado: Setter<string>;
  setMostrarDestaquesVisitante: Setter<boolean>;
  setUsernameCabecalhoVisivel: Setter<boolean>;
  setPerfilUsuarioRemoto: Setter<PerfilUsuarioRemoto | null>;
  setObras: Setter<ObraLocal[]>;
  setAutoresSeguidos: Setter<string[]>;
  setObrasFavoritas: Setter<string[]>;
  setObrasConcluidas: Setter<string[]>;
  setObrasSeguidasBiblioteca: Setter<string[]>;
  setPerfisAutoresSalvos: Setter<PerfisAutoresSalvos>;
  setCarregando: Setter<boolean>;
}) {
  useEffect(() => {
    if (!autenticacaoCarregada) {
      return;
    }

    let componenteAtivo = true;
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;

    function execucaoCarregamentoEstaAtual() {
      return execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: !componenteAtivo,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaPerfilRef.current,
      });
    }

    async function carregarPerfilAutor() {
      const params = new URLSearchParams(queryPerfilAtual);
      const autorParam = params.get("autor") || "";
      const autorIdParam =
        params.get("autorId") || params.get("id") || params.get("userId") || "";
      const abaParam = normalizarAbaPerfilAutor(params.get("aba"));
      setAbaPerfil(abaParam);
      setAutorSelecionado(autorParam.trim());
      setAutorIdSelecionado(autorIdParam.trim());
      setMostrarDestaquesVisitante(false);
      setUsernameCabecalhoVisivel(false);

      let obrasNormalizadas: ObraLocal[] = [];
      let autoresSeguidosNormalizados: string[] = [];
      let obrasFavoritasNormalizadas: string[] = [];
      let obrasConcluidasNormalizadas: string[] = [];
      let obrasSeguidasBibliotecaNormalizadas: string[] = [];
      let perfilUsuarioRemotoCarregado: PerfilUsuarioRemoto | null = null;

      const obrasSupabase = await carregarObrasPublicadasSupabase();

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      const resultadoEstadoUsuario = await carregarEstadoUsuarioSupabase();
      const estadoUsuarioSupabase = resultadoEstadoUsuario.estadoUsuario;
      const usuarioIdConfirmado = estadoUsuarioSupabase?.userId || "";
      const usuarioIdAtual = resultadoEstadoUsuario.identidadeConfirmada
        ? usuarioIdConfirmado
        : identidadeEsperada.usuarioId;

      if (
        !execucaoCarregamentoEstaAtual() ||
        (resultadoEstadoUsuario.identidadeConfirmada &&
          usuarioIdAtual !== identidadeEsperada.usuarioId)
      ) {
        return;
      }

      if (usuarioIdAtual) {
        try {
          const obrasSalvasJson = carregarJsonUsuarioPerfilAutor(
            STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasNormalizadas = Array.isArray(obrasSalvasJson)
            ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
                normalizarObra(obra, index),
              )
            : [];

          const autoresSeguidosJson = carregarJsonUsuarioPerfilAutor(
            AUTHOR_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
          );

          autoresSeguidosNormalizados = Array.isArray(autoresSeguidosJson)
            ? autoresSeguidosJson
                .filter(
                  (autor): autor is string =>
                    typeof autor === "string" && Boolean(autor.trim()),
                )
                .map((autor) => normalizarNomeAutor(autor))
            : [];

          obrasFavoritasNormalizadas = carregarListaIdsPerfilBiblioteca(
            FAVORITES_STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasConcluidasNormalizadas = carregarListaIdsPerfilBiblioteca(
            COMPLETED_STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasSeguidasBibliotecaNormalizadas =
            carregarListaIdsPerfilBiblioteca(
              LIBRARY_FOLLOW_STORAGE_KEY,
              usuarioIdAtual,
            );
        } catch {
          obrasNormalizadas = [];
          autoresSeguidosNormalizados = [];
          obrasFavoritasNormalizadas = [];
          obrasConcluidasNormalizadas = [];
          obrasSeguidasBibliotecaNormalizadas = [];
        }
      }

      const perfilUsuarioIdParaBuscar =
        autorIdParam.trim() || usuarioIdAtual;

      perfilUsuarioRemotoCarregado = await carregarPerfilUsuarioSupabase(
        perfilUsuarioIdParaBuscar,
        autorParam.trim(),
      );

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      const obrasLocaisDoUsuario = filtrarObrasLocaisDoUsuarioPerfilAutor(
        obrasNormalizadas,
        usuarioIdAtual,
      );

      let obrasMescladas = mesclarObrasPorIdSlug(
        obrasLocaisDoUsuario,
        obrasSupabase,
      );

      if (estadoUsuarioSupabase) {
        obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...obrasFavoritasNormalizadas,
            ...estadoUsuarioSupabase.favoritas,
          ]),
        );
        obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...obrasConcluidasNormalizadas,
            ...estadoUsuarioSupabase.concluidas,
          ]),
        );
        autoresSeguidosNormalizados = Array.from(
          new Set([
            ...autoresSeguidosNormalizados,
            ...estadoUsuarioSupabase.autoresSeguidos,
          ]),
        );
        obrasSeguidasBibliotecaNormalizadas = Array.from(
          new Set([
            ...obrasSeguidasBibliotecaNormalizadas,
            ...estadoUsuarioSupabase.obrasSeguidas,
          ]),
        );
      }

      const idsBibliotecaLocal = Array.from(
        new Set([
          ...obrasFavoritasNormalizadas,
          ...obrasConcluidasNormalizadas,
          ...obrasSeguidasBibliotecaNormalizadas,
        ]),
      ).filter((obraId) => idObraSupabaseValido(obraId));

      if (idsBibliotecaLocal.length > 0) {
        const idsObrasCarregadas = new Set(
          obrasMescladas.map((obra) => obra.id).filter(Boolean),
        );
        const idsObrasBibliotecaFaltantes = idsBibliotecaLocal.filter(
          (obraId) => !idsObrasCarregadas.has(obraId),
        );

        if (idsObrasBibliotecaFaltantes.length > 0) {
          const obrasBibliotecaFaltantes =
            await carregarObrasPublicadasPorIdsSupabase(
              idsObrasBibliotecaFaltantes,
            );

          if (!execucaoCarregamentoEstaAtual()) {
            return;
          }

          obrasMescladas = mesclarObrasPorIdSlug(
            obrasMescladas,
            obrasBibliotecaFaltantes,
          );
        }
      }

      if (estadoUsuarioSupabase) {
        const interacoes = await carregarInteracoesCapitulosSupabase(
          estadoUsuarioSupabase.userId,
          obrasMescladas,
        );

        if (!execucaoCarregamentoEstaAtual()) {
          return;
        }

        obrasMescladas = aplicarInteracoesNasObras(
          obrasMescladas,
          interacoes.curtidas,
          interacoes.salvos,
          interacoes.comentarios,
          interacoes.progresso,
          interacoes.progressoCarregado,
          interacoes.capitulosComMetricas,
        );
      }

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      if (usuarioIdAtual) {
        try {
          const obrasDoUsuarioParaPersistir = obrasMescladas.filter((obra) =>
            obraPertenceAoUsuarioPerfilAutor(obra, usuarioIdAtual),
          );
          const obrasParaPersistir = mesclarObrasLocalStoragePerfilAutor(
            obrasNormalizadas,
            obrasDoUsuarioParaPersistir,
            usuarioIdAtual,
          );

          salvarJsonUsuarioPerfilAutor(
            STORAGE_KEY,
            usuarioIdAtual,
            obrasParaPersistir,
          );

          salvarJsonUsuarioPerfilAutor(
            AUTHOR_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
            autoresSeguidosNormalizados,
          );
          salvarListaIdsPerfilBiblioteca(
            FAVORITES_STORAGE_KEY,
            usuarioIdAtual,
            obrasFavoritasNormalizadas,
          );
          salvarListaIdsPerfilBiblioteca(
            COMPLETED_STORAGE_KEY,
            usuarioIdAtual,
            obrasConcluidasNormalizadas,
          );
          salvarListaIdsPerfilBiblioteca(
            LIBRARY_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
            obrasSeguidasBibliotecaNormalizadas,
          );
        } catch {
          // Se o navegador bloquear localStorage, a página ainda usa o estado em memória.
        }
      }

      if (!execucaoCarregamentoEstaAtual()) {
        return;
      }

      setPerfilUsuarioRemoto(perfilUsuarioRemotoCarregado);
      setObras(obrasMescladas);
      setAutoresSeguidos(autoresSeguidosNormalizados);
      setObrasFavoritas(obrasFavoritasNormalizadas);
      setObrasConcluidas(obrasConcluidasNormalizadas);
      setObrasSeguidasBiblioteca(obrasSeguidasBibliotecaNormalizadas);
      setPerfisAutoresSalvos(carregarPerfisAutores(usuarioIdAtual));
      setCarregando(false);
    }

    void carregarPerfilAutor();

    return () => {
      componenteAtivo = false;
    };
  }, [
    autenticacaoCarregada,
    queryPerfilAtual,
    usuarioIdLogado,
    identidadeAutenticadaPerfilRef,
    setAbaPerfil,
    setAutorSelecionado,
    setAutorIdSelecionado,
    setMostrarDestaquesVisitante,
    setUsernameCabecalhoVisivel,
    setPerfilUsuarioRemoto,
    setObras,
    setAutoresSeguidos,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasSeguidasBiblioteca,
    setPerfisAutoresSalvos,
    setCarregando,
  ]);
}
