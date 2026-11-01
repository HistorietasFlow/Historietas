import { supabase } from "../../../lib/supabase/client";
import { identificarCategoriaArquivo } from "./editar-obra-file-validation";
import { prepararAssetsAtuaisEdicaoObra } from "./editar-obra-current-assets-preparation";
import {
  enviarArquivoStorage,
  type ArquivoStorageEdicaoObra,
} from "./editar-obra-remote-storage";
import type { ArquivoObraLocal, ObraLocal } from "../types";

type ObraRemotaAtualEdicaoObra = Parameters<
  typeof prepararAssetsAtuaisEdicaoObra
>[0]["obraRemotaAtual"];

export type ArquivoAntigoEdicaoObra = {
  bucket: "capas-obras" | "arquivos-obras";
  caminho: string;
};

type PrepararEEnviarAssetsEdicaoObraParams = {
  capa: string;
  capaNome: string;
  arquivoObra: ArquivoObraLocal | null;
  obraRemotaAtual: ObraRemotaAtualEdicaoObra;
  obraLocalAtual: ObraLocal | null;
  backupArquivosObras: Record<string, unknown>;
  capaRemovidaManualmente: boolean;
  arquivoObraRemovidoManualmente: boolean;
  capaBloqueadaPorClassificacao: boolean;
  capaArquivo: File | null;
  arquivoObraArquivo: File | null;
  userId: string;
  agora: string;
  arquivosNovosEnviados: ArquivoStorageEdicaoObra[];
};

export async function prepararEEnviarAssetsEdicaoObra({
  capa,
  capaNome,
  arquivoObra,
  obraRemotaAtual,
  obraLocalAtual,
  backupArquivosObras,
  capaRemovidaManualmente,
  arquivoObraRemovidoManualmente,
  capaBloqueadaPorClassificacao,
  capaArquivo,
  arquivoObraArquivo,
  userId,
  agora,
  arquivosNovosEnviados,
}: PrepararEEnviarAssetsEdicaoObraParams) {
  const assetsAtuais = prepararAssetsAtuaisEdicaoObra({
    capa,
    capaNome,
    arquivoObra,
    obraRemotaAtual,
    obraLocalAtual,
    backupArquivosObras,
    capaRemovidaManualmente,
    arquivoObraRemovidoManualmente,
  });

  let capaFinal = assetsAtuais.capaFinalInicial;
  let capaNomeFinal = assetsAtuais.capaNomeFinalInicial;
  let arquivoObraFinal: ArquivoObraLocal | null =
    assetsAtuais.arquivoObraFinalInicial;
  const arquivosAntigosParaRemover: ArquivoAntigoEdicaoObra[] = [];
  const {
    caminhoCapaRemotaAtual,
    caminhoArquivoRemotoAtual,
  } = assetsAtuais;

  if (capaBloqueadaPorClassificacao) {
    capaFinal = "";
    capaNomeFinal = "";

    if (caminhoCapaRemotaAtual) {
      const { error: erroRemoverCapaBloqueada } = await supabase.storage
        .from("capas-obras")
        .remove([caminhoCapaRemotaAtual]);

      if (erroRemoverCapaBloqueada) {
        throw new Error(
          `Nao consegui remover a capa publica antes de bloquear a obra 18+: ${erroRemoverCapaBloqueada.message}`
        );
      }
    }
  }

  if (capaArquivo && !capaBloqueadaPorClassificacao) {
    const novaCapa = await enviarArquivoStorage(
      "capas-obras",
      userId,
      capaArquivo
    );

    arquivosNovosEnviados.push(novaCapa);
    capaFinal = novaCapa.referencia;
    capaNomeFinal = capaArquivo.name;

    if (
      caminhoCapaRemotaAtual &&
      caminhoCapaRemotaAtual !== novaCapa.caminho
    ) {
      arquivosAntigosParaRemover.push({
        bucket: "capas-obras",
        caminho: caminhoCapaRemotaAtual,
      });
    }
  } else if (
    !capaBloqueadaPorClassificacao &&
    capaRemovidaManualmente &&
    caminhoCapaRemotaAtual
  ) {
    arquivosAntigosParaRemover.push({
      bucket: "capas-obras",
      caminho: caminhoCapaRemotaAtual,
    });
  }

  if (arquivoObraArquivo && arquivoObra) {
    const novoArquivoObra = await enviarArquivoStorage(
      "arquivos-obras",
      userId,
      arquivoObraArquivo
    );

    arquivosNovosEnviados.push(novoArquivoObra);
    arquivoObraFinal = {
      ...arquivoObra,
      nome: arquivoObraArquivo.name,
      tipo: arquivoObraArquivo.type || arquivoObra.tipo,
      tamanho: arquivoObraArquivo.size,
      conteudo: novoArquivoObra.referencia,
      categoria: identificarCategoriaArquivo(arquivoObraArquivo),
      criadoEm: arquivoObra.criadoEm || agora,
    };

    if (
      caminhoArquivoRemotoAtual &&
      caminhoArquivoRemotoAtual !== novoArquivoObra.caminho
    ) {
      arquivosAntigosParaRemover.push({
        bucket: "arquivos-obras",
        caminho: caminhoArquivoRemotoAtual,
      });
    }
  } else if (
    arquivoObraRemovidoManualmente &&
    caminhoArquivoRemotoAtual
  ) {
    arquivosAntigosParaRemover.push({
      bucket: "arquivos-obras",
      caminho: caminhoArquivoRemotoAtual,
    });
  }

  return {
    capaFinal,
    capaNomeFinal,
    arquivoObraFinal,
    arquivosNovosEnviados,
    arquivosAntigosParaRemover,
  };
}
