import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { PermissoesAbasPerfil } from "../../../lib/historietasPrivacy";
import { diarioPerfilVazio } from "../constants";
import type {
  AbaPerfilAutor,
  AutorPerfil,
  DiarioPerfilEstado,
  ObraLocal,
} from "../types";
import {
  aplicarPermissoesAbasAoDiario,
  idAutorSupabaseValido,
} from "../lib/profile-formatters";
import { criarEstadoDiarioPerfilVazio } from "../lib/profile-diary-record-utils";
import { carregarDiarioPerfilSupabase } from "../lib/profile-diary-loader";
import { mesclarDiarioPerfilComLocal } from "../lib/profile-diary-merge-utils";
import { montarDiarioPerfilLocal } from "../lib/profile-diary-local-utils";

export function usePerfilAutorDiarySync({
  perfilParaMostrar,
  obras,
  obrasFavoritas,
  obrasConcluidas,
  obrasSeguidasBiblioteca,
  podeEditarPerfil,
  bibliotecaPerfilVisivel,
  abaPerfil,
  usuarioIdLogado,
  versaoSincronizacaoBiblioteca,
  permissoesAbasPerfil,
  diarioPerfilVisivel,
  atividadesPerfilVisivel,
  setDiarioPerfil,
}: {
  perfilParaMostrar: AutorPerfil | null;
  obras: ObraLocal[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  obrasSeguidasBiblioteca: string[];
  podeEditarPerfil: boolean;
  bibliotecaPerfilVisivel: boolean;
  abaPerfil: AbaPerfilAutor;
  usuarioIdLogado: string;
  versaoSincronizacaoBiblioteca: number;
  permissoesAbasPerfil: PermissoesAbasPerfil;
  diarioPerfilVisivel: boolean;
  atividadesPerfilVisivel: boolean;
  setDiarioPerfil: Dispatch<SetStateAction<DiarioPerfilEstado>>;
}) {
  useEffect(() => {
    const perfilAtual = perfilParaMostrar;
    let cancelado = false;

    async function carregarDiarioPerfil() {
      if (!perfilAtual) {
        setDiarioPerfil(diarioPerfilVazio);
        return;
      }

      const perfilDiario = perfilAtual;
      const userIdPerfil = perfilDiario.autorId.trim();
      const bibliotecaUsaUsuarioLogado =
        bibliotecaPerfilVisivel &&
        abaPerfil === "biblioteca" &&
        Boolean(usuarioIdLogado.trim());
      const userIdFonteDiario = bibliotecaUsaUsuarioLogado
        ? usuarioIdLogado.trim()
        : userIdPerfil;

      const estaVendoProprioPerfil =
        Boolean(usuarioIdLogado.trim()) &&
        userIdPerfil === usuarioIdLogado.trim();

      const incluirItensPrivados =
        bibliotecaUsaUsuarioLogado ||
        podeEditarPerfil ||
        estaVendoProprioPerfil;

      setDiarioPerfil({
        ...diarioPerfilVazio,
        carregando: true,
      });

      const diarioLocal = incluirItensPrivados
        ? montarDiarioPerfilLocal(
            perfilDiario,
            obrasFavoritas,
            obrasConcluidas,
            obrasSeguidasBiblioteca,
            obras,
          )
        : criarEstadoDiarioPerfilVazio();

      if (!userIdFonteDiario || !idAutorSupabaseValido(userIdFonteDiario)) {
        if (!cancelado) {
          setDiarioPerfil({
            carregando: false,
            ...diarioLocal,
          });
        }

        return;
      }

      const diarioSupabase = await carregarDiarioPerfilSupabase(
        userIdFonteDiario,
        obras,
        incluirItensPrivados,
        diarioPerfilVisivel,
        atividadesPerfilVisivel,
        obrasConcluidas,
      );
      const diarioSemFiltro = incluirItensPrivados
        ? mesclarDiarioPerfilComLocal(diarioSupabase, diarioLocal)
        : diarioSupabase;
      const diarioFinal = incluirItensPrivados
        ? diarioSemFiltro
        : aplicarPermissoesAbasAoDiario(
            diarioSemFiltro,
            permissoesAbasPerfil,
          );

      if (!cancelado) {
        setDiarioPerfil({
          carregando: false,
          ...diarioFinal,
        });
      }
    }

    const carregarDiarioTimer = window.setTimeout(() => {
      void carregarDiarioPerfil();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarDiarioTimer);
    };
  }, [
    perfilParaMostrar,
    obras,
    obrasFavoritas,
    obrasConcluidas,
    obrasSeguidasBiblioteca,
    podeEditarPerfil,
    bibliotecaPerfilVisivel,
    abaPerfil,
    usuarioIdLogado,
    versaoSincronizacaoBiblioteca,
    permissoesAbasPerfil,
    diarioPerfilVisivel,
    atividadesPerfilVisivel,
    setDiarioPerfil,
  ]);
}
