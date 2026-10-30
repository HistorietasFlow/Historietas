"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  carregarPainelAutorSupabase,
} from "../lib/painel-autor-supabase-data-loader";
import type { ObraLocal } from "../lib/painel-autor-types";
import {
  filtrarObrasDoUsuarioPainel,
  marcarObrasComDonoPainel,
} from "../lib/painel-autor-ownership-utils";
import {
  carregarBackupArquivosObras,
  sincronizarBackupArquivosObras,
} from "../lib/painel-autor-file-backup-storage";
import { restaurarArquivoObraComBackup } from "../lib/painel-autor-file-backup-restore-utils";
import {
  aplicarNomeProfileNasObrasPainel,
  obterNomeProfilePainelAutor,
} from "../lib/painel-autor-profile-utils";
import { carregarProfilePainelAutor } from "../lib/painel-autor-profile-loader";
import {
  carregarListaIdsPainel,
  lerStorageUsuarioPainel,
  salvarJsonStorageUsuarioPainel,
  salvarListaIdsUsuarioPainel,
} from "../lib/painel-autor-storage-utils";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  STORAGE_KEY,
} from "../lib/painel-autor-storage-keys";
import { filtrarListaPorObrasDoUsuario } from "../lib/painel-autor-collection-utils";
import { normalizarObraPainel } from "../lib/painel-autor-work-normalizer";

type UsePainelAutorInitialDataProps = {
  usuarioIdLogado: string;
  verificandoUsuario: boolean;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setObrasFavoritas: Dispatch<SetStateAction<string[]>>;
  setObrasConcluidas: Dispatch<SetStateAction<string[]>>;
  setCarregandoDados: Dispatch<SetStateAction<boolean>>;
};

export function usePainelAutorInitialData({
  usuarioIdLogado,
  verificandoUsuario,
  setObras,
  setObrasFavoritas,
  setObrasConcluidas,
  setCarregandoDados,
}: UsePainelAutorInitialDataProps) {
  useEffect(() => {
    if (verificandoUsuario || !usuarioIdLogado) {
      return;
    }

    let componenteAtivo = true;

    async function carregarDadosPainelAutor() {
      await Promise.resolve();

      if (!componenteAtivo) {
        return;
      }

      setCarregandoDados(true);

      try {
        const obrasSalvasTexto = lerStorageUsuarioPainel(
          STORAGE_KEY,
          usuarioIdLogado
        );
        const obrasSalvasJson: unknown = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, obraIndex) =>
              restaurarArquivoObraComBackup(
                normalizarObraPainel(obra, obraIndex),
                backupArquivosObras
              )
            )
          : [];
        const profileAutorPainel = await carregarProfilePainelAutor(usuarioIdLogado);
        const nomeProfileAutorPainel = obterNomeProfilePainelAutor(profileAutorPainel);
        const obrasNormalizadasComDono = marcarObrasComDonoPainel(
          obrasNormalizadas,
          usuarioIdLogado
        );
        const obrasUsuarioLogado = aplicarNomeProfileNasObrasPainel(
          filtrarObrasDoUsuarioPainel(obrasNormalizadasComDono, usuarioIdLogado),
          usuarioIdLogado,
          nomeProfileAutorPainel
        );

        const obrasFavoritasNormalizadas = carregarListaIdsPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasConcluidasNormalizadas = carregarListaIdsPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
          obrasFavoritasNormalizadas,
          obrasUsuarioLogado
        );
        const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
          obrasConcluidasNormalizadas,
          obrasUsuarioLogado
        );

        if (!componenteAtivo) {
          return;
        }

        setObras(obrasUsuarioLogado);
        setObrasFavoritas(obrasFavoritasUsuario);
        setObrasConcluidas(obrasConcluidasUsuario);

        const dadosSupabase = await carregarPainelAutorSupabase(
          obrasUsuarioLogado,
          obrasFavoritasUsuario,
          obrasConcluidasUsuario
        );

        if (!componenteAtivo) {
          return;
        }

        const obrasFinais = dadosSupabase.obras.map((obra, index) =>
          normalizarObraPainel(obra, index)
        );

        sincronizarBackupArquivosObras(obrasFinais, usuarioIdLogado);
        salvarJsonStorageUsuarioPainel(STORAGE_KEY, usuarioIdLogado, obrasFinais);
        salvarListaIdsUsuarioPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.favoritas
        );
        salvarListaIdsUsuarioPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.concluidas
        );

        setObras(obrasFinais);
        setObrasFavoritas(dadosSupabase.favoritas);
        setObrasConcluidas(dadosSupabase.concluidas);
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        console.warn("Não consegui atualizar o Painel do Autor:", error);
      } finally {
        if (componenteAtivo) {
          setCarregandoDados(false);
        }
      }
    }

    void carregarDadosPainelAutor();

    return () => {
      componenteAtivo = false;
    };
  }, [
    usuarioIdLogado,
    verificandoUsuario,
    setObras,
    setObrasFavoritas,
    setObrasConcluidas,
    setCarregandoDados,
  ]);
}
