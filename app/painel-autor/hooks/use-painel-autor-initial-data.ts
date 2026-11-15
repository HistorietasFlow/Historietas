"use client";

import {
  useEffect,
  useMemo,
  useState,
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
import type { ConfirmacaoRascunhosPainel } from "../lib/painel-autor-draft-chapters";
import { mesclarObrasPainelAutor } from "../lib/painel-autor-work-merge-utils";

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
  const contexto = useMemo(() => ({ usuarioIdLogado, verificandoUsuario }), [usuarioIdLogado, verificandoUsuario]);
  const [confirmacao, setConfirmacao] = useState<{
    contexto: typeof contexto;
    dados: ConfirmacaoRascunhosPainel;
  } | null>(null);
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
      setConfirmacao(null);
      setObras([]);
      setObrasFavoritas([]);
      setObrasConcluidas([]);

      try {
        let cacheIntegro = true;
        const obrasSalvasTexto = lerStorageUsuarioPainel(
          STORAGE_KEY,
          usuarioIdLogado,
          () => { cacheIntegro = false; },
        );
        let obrasSalvasJson: unknown = [];
        try {
          obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
          if (!Array.isArray(obrasSalvasJson)) cacheIntegro = false;
        } catch {
          // Não regravar um cache que não conseguimos interpretar integralmente.
          cacheIntegro = false;
        }

        const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);

        const normalizarListaLocal = (lista: unknown): ObraLocal[] => {
          const idsLocais = new Set<string>();
          return Array.isArray(lista)
            ? lista.flatMap((obra, obraIndex) => {
                if (!obra || typeof obra !== "object" || Array.isArray(obra)) {
                  cacheIntegro = false;
                  return [];
                }
                if (Array.isArray(obra.capitulos) && obra.capitulos.some(
                  (capitulo: unknown) => !capitulo || typeof capitulo !== "object" || Array.isArray(capitulo),
                )) cacheIntegro = false;
                const normalizada = restaurarArquivoObraComBackup(
                  normalizarObraPainel(obra, obraIndex),
                  backupArquivosObras
                );
                if (idsLocais.has(normalizada.id)) cacheIntegro = false;
                idsLocais.add(normalizada.id);
                return [normalizada];
              })
            : [];
        };
        const obrasNormalizadas = normalizarListaLocal(obrasSalvasJson);
        const profileAutorPainel = await carregarProfilePainelAutor(usuarioIdLogado);
        if (!componenteAtivo) return;
        const nomeProfileAutorPainel = obterNomeProfilePainelAutor(profileAutorPainel);
        const obrasNormalizadasComDono = marcarObrasComDonoPainel(
          obrasNormalizadas,
          usuarioIdLogado
        );
        const obrasDoUsuario = filtrarObrasDoUsuarioPainel(obrasNormalizadasComDono, usuarioIdLogado);
        const obrasUsuarioLogado = aplicarNomeProfileNasObrasPainel(
          mesclarObrasPainelAutor(obrasDoUsuario, []),
          usuarioIdLogado,
          nomeProfileAutorPainel
        );
        if (obrasDoUsuario.length !== obrasNormalizadas.length) cacheIntegro = false;

        const textosColecoes = [FAVORITES_STORAGE_KEY, COMPLETED_STORAGE_KEY].map(chave => {
          const texto = lerStorageUsuarioPainel(chave, usuarioIdLogado, () => { cacheIntegro = false; });
          try {
            const lista: unknown = texto ? JSON.parse(texto) : [];
            if (!Array.isArray(lista) || lista.some(id => typeof id !== "string")) cacheIntegro = false;
          } catch { cacheIntegro = false; }
          return texto;
        });

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

        let rascunhosRemotos: ConfirmacaoRascunhosPainel | null = null;
        let falhaRemota = false;
        const dadosSupabase = await carregarPainelAutorSupabase(
          obrasUsuarioLogado,
          obrasFavoritasUsuario,
          obrasConcluidasUsuario,
          (dados) => { rascunhosRemotos = dados; },
          { usuarioIdEsperado: usuarioIdLogado, onFalha: () => { falhaRemota = true; } },
        );

        if (!componenteAtivo) {
          return;
        }

        const obrasFinais = dadosSupabase.obras.map((obra, index) =>
          normalizarObraPainel(obra, index)
        );

        // Uma edição local ocorrida durante a rede não pertence a este snapshot.
        const textosAtuais = [STORAGE_KEY, FAVORITES_STORAGE_KEY, COMPLETED_STORAGE_KEY]
          .map(chave => lerStorageUsuarioPainel(chave, usuarioIdLogado, () => { cacheIntegro = false; }));
        const snapshotAtual = [obrasSalvasTexto, ...textosColecoes]
          .every((texto, index) => texto === textosAtuais[index]);
        if (!snapshotAtual) {
          try {
            const atual: unknown = textosAtuais[0] ? JSON.parse(textosAtuais[0]) : [];
            if (Array.isArray(atual)) {
              const obrasAtuaisDoUsuario = filtrarObrasDoUsuarioPainel(
                marcarObrasComDonoPainel(normalizarListaLocal(atual), usuarioIdLogado), usuarioIdLogado,
              );
              const obrasAtuais = aplicarNomeProfileNasObrasPainel(
                mesclarObrasPainelAutor(obrasAtuaisDoUsuario, []), usuarioIdLogado, nomeProfileAutorPainel,
              );
              setObras(obrasAtuais);
              setObrasFavoritas(filtrarListaPorObrasDoUsuario(
                carregarListaIdsPainel(FAVORITES_STORAGE_KEY, usuarioIdLogado), obrasAtuais,
              ));
              setObrasConcluidas(filtrarListaPorObrasDoUsuario(
                carregarListaIdsPainel(COMPLETED_STORAGE_KEY, usuarioIdLogado), obrasAtuais,
              ));
            }
          } catch {
            // A edição concorrente continua no storage; não aplicar a resposta antiga.
          }
          return;
        }
        if (cacheIntegro && !falhaRemota) {
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
        }

        setObras(obrasFinais);
        if (rascunhosRemotos) setConfirmacao({ contexto, dados: rascunhosRemotos });
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
    contexto,
    usuarioIdLogado,
    verificandoUsuario,
    setObras,
    setObrasFavoritas,
    setObrasConcluidas,
    setCarregandoDados,
  ]);
  return !verificandoUsuario && usuarioIdLogado && confirmacao?.contexto === contexto &&
    confirmacao.dados.usuarioId === usuarioIdLogado ? confirmacao.dados.porObra : undefined;
}
