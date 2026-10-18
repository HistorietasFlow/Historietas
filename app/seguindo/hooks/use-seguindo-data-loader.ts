"use client";

import { useCallback } from "react";
import {
  carregarDadosLocaisSeguindo,
  salvarDadosLocaisSeguindo,
} from "../lib/seguindo-local-data-utils";
import {
  carregarDadosRemotosSeguindo,
  prepararDadosRemotosSeguindo,
} from "../lib/seguindo-remote-data-utils";

type DadosLocaisSeguindo = ReturnType<typeof carregarDadosLocaisSeguindo>;
type ObraSeguindo = DadosLocaisSeguindo["obras"][number];
type DadosRemotosSeguindo = Awaited<
  ReturnType<typeof carregarDadosRemotosSeguindo>
>;
type UsuarioSeguindo =
  DadosRemotosSeguindo["usuariosSeguidosSupabase"][number];
type SolicitacaoSeguindo =
  DadosRemotosSeguindo["solicitacoesSeguidoresSupabase"][number];
type DadosRemotosPreparadosSeguindo = Awaited<
  ReturnType<typeof prepararDadosRemotosSeguindo>
>;
type AtividadeSeguindo =
  DadosRemotosPreparadosSeguindo["atividades"][number];

type Setter<T> = (valor: T) => void;

type UseSeguindoDataLoaderParams = {
  perfilSocialId: string;
  usuarioLogadoId: string;
  setObras: Setter<ObraSeguindo[]>;
  setObrasSeguidas: Setter<string[]>;
  setAutoresSeguidos: Setter<string[]>;
  setUsuariosSeguidos: Setter<UsuarioSeguindo[]>;
  setUsuariosSeguidores: Setter<UsuarioSeguindo[]>;
  setSolicitacoesSeguidores: Setter<SolicitacaoSeguindo[]>;
  setSolicitacoesEnviadasIds: Setter<string[]>;
  setAtividadesSeguindo: Setter<AtividadeSeguindo[]>;
  setObrasFavoritas: Setter<string[]>;
  setObrasConcluidas: Setter<string[]>;
  setCarregando: Setter<boolean>;
};

export function useSeguindoDataLoader({
  perfilSocialId,
  usuarioLogadoId,
  setObras,
  setObrasSeguidas,
  setAutoresSeguidos,
  setUsuariosSeguidos,
  setUsuariosSeguidores,
  setSolicitacoesSeguidores,
  setSolicitacoesEnviadasIds,
  setAtividadesSeguindo,
  setObrasFavoritas,
  setObrasConcluidas,
  setCarregando,
}: UseSeguindoDataLoaderParams) {
  return useCallback(async () => {
    window.setTimeout(() => {
      setCarregando(true);
    }, 0);

    const dadosLocaisSeguindo = carregarDadosLocaisSeguindo(usuarioLogadoId);
    let {
      obras: obrasNormalizadas,
      obrasSeguidas: seguindoNormalizado,
      obrasFavoritas: favoritasNormalizadas,
      obrasConcluidas: concluidasNormalizadas,
    } = dadosLocaisSeguindo;
    const autoresNormalizados = dadosLocaisSeguindo.autoresSeguidos;

    window.setTimeout(() => {
      setObras(obrasNormalizadas);
      setObrasSeguidas(perfilSocialId ? [] : seguindoNormalizado);
      setAutoresSeguidos(autoresNormalizados);
      setObrasFavoritas(favoritasNormalizadas);
      setObrasConcluidas(concluidasNormalizadas);
      setCarregando(false);
    }, 0);

    const {
      dadosSupabase,
      usuariosSeguidosSupabase,
      usuariosSeguidoresSupabase,
      solicitacoesSeguidoresSupabase,
      solicitacoesEnviadasSupabase,
    } = await carregarDadosRemotosSeguindo({
      obrasLocais: obrasNormalizadas,
      obrasSeguidasLocais: seguindoNormalizado,
      obrasFavoritasLocais: favoritasNormalizadas,
      obrasConcluidasLocais: concluidasNormalizadas,
      perfilSocialId,
      usuarioLogadoId,
    });

    const dadosRemotosPreparados = await prepararDadosRemotosSeguindo({
      dadosSupabase,
      usuariosSeguidosSupabase,
      usuarioLogadoId,
    });
    obrasNormalizadas = dadosRemotosPreparados.obras;
    seguindoNormalizado = dadosRemotosPreparados.obrasSeguidas;
    favoritasNormalizadas = dadosRemotosPreparados.obrasFavoritas;
    concluidasNormalizadas = dadosRemotosPreparados.obrasConcluidas;
    const atividadesSeguindoSupabase = dadosRemotosPreparados.atividades;

    salvarDadosLocaisSeguindo({
      userId: usuarioLogadoId,
      obras: obrasNormalizadas,
      obrasSeguidas: seguindoNormalizado,
      autoresSeguidos: autoresNormalizados,
      obrasFavoritas: favoritasNormalizadas,
      obrasConcluidas: concluidasNormalizadas,
    });

    window.setTimeout(() => {
      setObras(obrasNormalizadas);
      setObrasSeguidas(seguindoNormalizado);
      setAutoresSeguidos(autoresNormalizados);
      setUsuariosSeguidos(usuariosSeguidosSupabase);
      setUsuariosSeguidores(usuariosSeguidoresSupabase);
      setSolicitacoesSeguidores(solicitacoesSeguidoresSupabase);
      setSolicitacoesEnviadasIds(solicitacoesEnviadasSupabase);
      setAtividadesSeguindo(atividadesSeguindoSupabase);
      setObrasFavoritas(favoritasNormalizadas);
      setObrasConcluidas(concluidasNormalizadas);
      setCarregando(false);
    }, 0);
  }, [
    perfilSocialId,
    setAtividadesSeguindo,
    setAutoresSeguidos,
    setCarregando,
    setObras,
    setObrasConcluidas,
    setObrasFavoritas,
    setObrasSeguidas,
    setSolicitacoesEnviadasIds,
    setSolicitacoesSeguidores,
    setUsuariosSeguidores,
    setUsuariosSeguidos,
    usuarioLogadoId,
  ]);
}
