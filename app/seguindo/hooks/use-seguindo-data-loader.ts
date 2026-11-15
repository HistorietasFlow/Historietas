"use client";

import { useCallback, useEffect, useRef } from "react";
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

type ContextoCargaSeguindo = {
  usuarioLogadoId: string;
  perfilSocialId: string;
  ativo: boolean;
  versao: number;
  timers: Set<number>;
};

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
  const contextoRef = useRef<ContextoCargaSeguindo | null>(null);

  useEffect(() => {
    const contexto: ContextoCargaSeguindo = {
      usuarioLogadoId, perfilSocialId, ativo: true,
      versao: 0, timers: new Set(),
    };
    contextoRef.current = contexto;

    // Limpar o contexto anterior também no logout, quando o trigger não chama
    // o loader. Este timer pertence ao contexto, não a uma tentativa de carga.
    const timerContexto = window.setTimeout(() => {
      if (!contexto.ativo) return;
      setObras([]);
      setObrasSeguidas([]);
      setAutoresSeguidos([]);
      setUsuariosSeguidos([]);
      setUsuariosSeguidores([]);
      setSolicitacoesSeguidores([]);
      setSolicitacoesEnviadasIds([]);
      setAtividadesSeguindo([]);
      setObrasFavoritas([]);
      setObrasConcluidas([]);
      if (!usuarioLogadoId) setCarregando(false);
    }, 0);

    return () => {
      contexto.ativo = false;
      window.clearTimeout(timerContexto);
      contexto.timers.forEach(timer => window.clearTimeout(timer));
      contexto.timers.clear();
    };
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

  return useCallback(async () => {
    const contexto = contextoRef.current;
    if (!contexto?.ativo || !usuarioLogadoId ||
        contexto.usuarioLogadoId !== usuarioLogadoId || contexto.perfilSocialId !== perfilSocialId) {
      return;
    }
    const versao = ++contexto.versao;
    const cargaAtual = () => contexto.ativo && contexto.versao === versao;
    contexto.timers.forEach(timer => window.clearTimeout(timer));
    contexto.timers.clear();
    const agendarAtualizacao = (atualizar: () => void) => {
      const timer = window.setTimeout(() => {
        contexto.timers.delete(timer);
        if (cargaAtual()) atualizar();
      }, 0);
      contexto.timers.add(timer);
    };

    setCarregando(true);

    try {
      const dadosLocaisSeguindo = carregarDadosLocaisSeguindo(usuarioLogadoId);
      const {
        obras: obrasNormalizadas,
        obrasSeguidas: seguindoNormalizado,
        obrasFavoritas: favoritasNormalizadas,
        obrasConcluidas: concluidasNormalizadas,
      } = dadosLocaisSeguindo;
      const autoresNormalizados = dadosLocaisSeguindo.autoresSeguidos;

      agendarAtualizacao(() => {
        setObras(obrasNormalizadas);
        setObrasSeguidas(perfilSocialId ? [] : seguindoNormalizado);
        setAutoresSeguidos(autoresNormalizados);
        setObrasFavoritas(favoritasNormalizadas);
        setObrasConcluidas(concluidasNormalizadas);
        setCarregando(false);
      });

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
      if (!cargaAtual()) return;

      const dadosRemotosPreparados = await prepararDadosRemotosSeguindo({
        dadosSupabase,
        usuariosSeguidosSupabase,
        usuarioLogadoId,
      });
      if (!cargaAtual()) return;
      const atividadesSeguindoSupabase = dadosRemotosPreparados.atividades;

      salvarDadosLocaisSeguindo({
        userId: usuarioLogadoId,
        obras: dadosRemotosPreparados.obras,
        obrasSeguidas: dadosRemotosPreparados.obrasSeguidas,
        autoresSeguidos: autoresNormalizados,
        obrasFavoritas: dadosRemotosPreparados.obrasFavoritas,
        obrasConcluidas: dadosRemotosPreparados.obrasConcluidas,
      });

      agendarAtualizacao(() => {
        setObras(dadosRemotosPreparados.obras);
        setObrasSeguidas(dadosRemotosPreparados.obrasSeguidas);
        setAutoresSeguidos(autoresNormalizados);
        setUsuariosSeguidos(usuariosSeguidosSupabase);
        setUsuariosSeguidores(usuariosSeguidoresSupabase);
        setSolicitacoesSeguidores(solicitacoesSeguidoresSupabase);
        setSolicitacoesEnviadasIds(solicitacoesEnviadasSupabase);
        setAtividadesSeguindo(atividadesSeguindoSupabase);
        setObrasFavoritas(dadosRemotosPreparados.obrasFavoritas);
        setObrasConcluidas(dadosRemotosPreparados.obrasConcluidas);
        setCarregando(false);
      });
    } catch (erro) {
      if (cargaAtual()) {
        console.warn("Não consegui atualizar os dados de Seguindo:", erro);
        setCarregando(false);
      }
    }
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
