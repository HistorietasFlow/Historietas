import type { Dispatch, FormEvent, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import { identificarCategoriaArquivo } from "../lib/editar-obra-file-validation";
import {
  carregarBackupArquivosObras,
  salvarArquivoObraNoBackup,
  sincronizarBackupArquivosObras,
} from "../lib/editar-obra-file-backup-storage";
import { criarAlvoBackupArquivoEdicaoObra } from "../lib/editar-obra-backup-target";
import { salvarObrasDoUsuarioPreservandoOutrasContas } from "../lib/editar-obra-local-work-storage";
import {
  enviarArquivoStorage,
  removerArquivosStorageEdicaoObra,
  type ArquivoStorageEdicaoObra,
} from "../lib/editar-obra-remote-storage";
import { registrarDiarioEdicaoObra } from "../lib/editar-obra-diary-action";
import { validarFormularioEdicaoObra } from "../lib/editar-obra-form-validation";
import { obterIdentidadeSalvamentoEdicaoObra } from "../lib/editar-obra-save-auth-identity";
import { prepararValoresSalvamentoEdicaoObra } from "../lib/editar-obra-save-preparation";
import { prepararAssetsAtuaisEdicaoObra } from "../lib/editar-obra-current-assets-preparation";
import { criarPayloadAtualizacaoObra } from "../lib/editar-obra-update-payload";
import { atualizarObraNaListaLocalEdicao } from "../lib/editar-obra-local-update";
import type { ArquivoObraLocal, ObraLocal } from "../types";

type RouterEditarObra = {
  replace: (href: string) => void;
};

type UseEditarObraSaveActionProps = {
  router: RouterEditarObra;
  processando: boolean;
  titulo: string;
  autor: string;
  autorProfileAtivo: string;
  generoFinal: string;
  generoEhPersonalizado: boolean;
  generoPersonalizadoValido: boolean;
  formatoFinal: string;
  formatoEhPersonalizado: boolean;
  formatoPersonalizadoValido: boolean;
  tagPersonalizadaValida: boolean;
  classificacaoIndicativa: string;
  avisosConteudo18: AvisoConteudo18[];
  sinopse: string;
  tagsTratadas: string[];
  obraId: string;
  obras: ObraLocal[];
  capa: string;
  capaNome: string;
  capaArquivo: File | null;
  capaRemovidaManualmente: boolean;
  arquivoObra: ArquivoObraLocal | null;
  arquivoObraArquivo: File | null;
  arquivoObraRemovidoManualmente: boolean;
  setErro: Dispatch<SetStateAction<string>>;
  setSalvou: Dispatch<SetStateAction<boolean>>;
  setProcessando: Dispatch<SetStateAction<boolean>>;
  setNomeAutorProfile: Dispatch<SetStateAction<string>>;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setAutor: Dispatch<SetStateAction<string>>;
  setCapa: Dispatch<SetStateAction<string>>;
  setCapaNome: Dispatch<SetStateAction<string>>;
  setCapaArquivo: Dispatch<SetStateAction<File | null>>;
  setCapaRemovidaManualmente: Dispatch<SetStateAction<boolean>>;
  setArquivoObra: Dispatch<SetStateAction<ArquivoObraLocal | null>>;
  setArquivoObraArquivo: Dispatch<SetStateAction<File | null>>;
  setArquivoObraRemovidoManualmente: Dispatch<SetStateAction<boolean>>;
};

export function useEditarObraSaveAction({
  router,
  processando,
  titulo,
  autor,
  autorProfileAtivo,
  generoFinal,
  generoEhPersonalizado,
  generoPersonalizadoValido,
  formatoFinal,
  formatoEhPersonalizado,
  formatoPersonalizadoValido,
  tagPersonalizadaValida,
  classificacaoIndicativa,
  avisosConteudo18,
  sinopse,
  tagsTratadas,
  obraId,
  obras,
  capa,
  capaNome,
  capaArquivo,
  capaRemovidaManualmente,
  arquivoObra,
  arquivoObraArquivo,
  arquivoObraRemovidoManualmente,
  setErro,
  setSalvou,
  setProcessando,
  setNomeAutorProfile,
  setObras,
  setAutor,
  setCapa,
  setCapaNome,
  setCapaArquivo,
  setCapaRemovidaManualmente,
  setArquivoObra,
  setArquivoObraArquivo,
  setArquivoObraRemovidoManualmente,
}: UseEditarObraSaveActionProps) {
  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (processando) {
      return;
    }

    const erroValidacao = validarFormularioEdicaoObra({
      titulo,
      autor,
      autorProfileAtivo,
      generoFinal,
      generoEhPersonalizado,
      generoPersonalizadoValido,
      formatoFinal,
      formatoEhPersonalizado,
      formatoPersonalizadoValido,
      tagPersonalizadaValida,
      classificacaoIndicativa,
      avisosConteudo18,
      sinopse,
    });

    if (erroValidacao) {
      setErro(erroValidacao);
      setSalvou(false);

      return;
    }

    setProcessando(true);
    setErro("");

    const valoresSalvamento = prepararValoresSalvamentoEdicaoObra({
      titulo,
      autor,
      autorProfileAtivo,
      generoFinal,
      formatoFinal,
      classificacaoIndicativa,
      avisosConteudo18,
      sinopse,
      tagsTratadas,
    });
    const {
      tituloFinal,
      autorFormularioFinal,
      generoFinalSalvo,
      formatoFinalSalvo,
      classificacaoFinal,
      capaBloqueadaPorClassificacao,
      avisosConteudoFinal,
      sinopseFinal,
      tagsFinais,
    } = valoresSalvamento;
    let autorFinal = valoresSalvamento.autorFinal;
    const agora = new Date().toISOString();

    try {
      const identidadeSalvamento = await obterIdentidadeSalvamentoEdicaoObra({
        obraId,
        autorFormularioFinal,
        router,
        setErro,
      });

      if (!identidadeSalvamento) {
        return;
      }

      const { userId, nomeProfileAtualizado } = identidadeSalvamento;
      autorFinal = nomeProfileAtualizado || autorFinal;
      setNomeAutorProfile(nomeProfileAtualizado);

      const backupArquivosObras = carregarBackupArquivosObras(userId);
      const obraLocalAtual = obras.find((obra) => obra.id === obraId) || null;

      if (obraLocalAtual?.autorId && obraLocalAtual.autorId !== userId) {
        setErro("Você não tem permissão para editar esta obra.");
        setSalvou(false);
        return;
      }

      const { data: obraAutorizadaSupabase, error: erroConfirmarObra } =
        await supabase
          .from("obras")
          .select(
            "id,user_id,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,criada_em"
          )
          .eq("id", obraId)
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

      if (erroConfirmarObra) {
        setErro(
          `Não consegui confirmar sua permissão para editar esta obra: ${erroConfirmarObra.message}`
        );
        setSalvou(false);
        return;
      }

      if (!obraAutorizadaSupabase?.id) {
        setErro("Você não tem permissão para editar esta obra.");
        setSalvou(false);
        return;
      }

      const obraRemotaAtual =
        obraAutorizadaSupabase;
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

      const arquivosNovosEnviados: ArquivoStorageEdicaoObra[] = [];
      const arquivosAntigosParaRemover: Array<{
        bucket: "capas-obras" | "arquivos-obras";
        caminho: string;
      }> = [];
      const {
        caminhoCapaRemotaAtual,
        caminhoArquivoRemotoAtual,
      } = assetsAtuais;

      if (capaBloqueadaPorClassificacao) {
        capaFinal = "";
        capaNomeFinal = "";

        if (caminhoCapaRemotaAtual) {
          const { error: erroRemoverCapaBloqueada } =
            await supabase.storage
              .from("capas-obras")
              .remove([caminhoCapaRemotaAtual]);

          if (erroRemoverCapaBloqueada) {
            throw new Error(
              `Nao consegui remover a capa publica antes de bloquear a obra 18+: ${erroRemoverCapaBloqueada.message}`
            );
          }
        }
      }

      try {
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

        const { data: obraAtualizadaSupabase, error: erroAtualizarObra } =
          await supabase
            .from("obras")
            .update(
              criarPayloadAtualizacaoObra({
                tituloFinal,
                autorFinal,
                generoFinalSalvo,
                formatoFinalSalvo,
                classificacaoFinal,
                avisosConteudoFinal,
                sinopseFinal,
                tagsFinais,
                capaFinal,
                capaNomeFinal,
                arquivoObraFinal,
                agora,
              }),
            )
            .eq("id", obraId)
            .eq("user_id", userId)
            .select("id")
            .maybeSingle();

        if (erroAtualizarObra) {
          throw new Error(
            `Não consegui atualizar a obra no Supabase: ${erroAtualizarObra.message}`
          );
        }

        if (!obraAtualizadaSupabase?.id) {
          throw new Error(
            "Não consegui confirmar a atualização da obra no Supabase."
          );
        }
      } catch (erroSupabase) {
        await removerArquivosStorageEdicaoObra(
          arquivosNovosEnviados.map((arquivo) => ({
            bucket: arquivo.bucket,
            caminho: arquivo.caminho,
          }))
        );

        const mensagemSupabase =
          erroSupabase instanceof Error
            ? erroSupabase.message
            : "Não consegui atualizar a obra no Supabase.";

        throw new Error(mensagemSupabase);
      }

      await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover);

      const novasObras = atualizarObraNaListaLocalEdicao({
        obras,
        obraId,
        titulo: tituloFinal,
        autor: autorFinal,
        genero: generoFinalSalvo,
        formato: formatoFinalSalvo,
        classificacaoIndicativa: classificacaoFinal,
        avisosConteudo: avisosConteudoFinal,
        sinopse: sinopseFinal,
        tags: tagsFinais,
        capa: capaFinal,
        capaNome: capaNomeFinal,
        arquivoObra: arquivoObraFinal,
      });

      const novasObrasDoUsuario =
        salvarObrasDoUsuarioPreservandoOutrasContas(novasObras, userId);

      if (arquivoObraRemovidoManualmente) {
        salvarArquivoObraNoBackup(
          criarAlvoBackupArquivoEdicaoObra({
            obraId,
            obraLocalAtual,
            tituloFinal,
          }),
          null,
          userId
        );
      } else {
        sincronizarBackupArquivosObras(novasObrasDoUsuario, userId);
      }

      const obraAtualizadaDiario = novasObrasDoUsuario.find((obra) => obra.id === obraId);

      if (obraAtualizadaDiario) {
        await registrarDiarioEdicaoObra({
          userId,
          obra: obraAtualizadaDiario,
          visibilidade: obraAtualizadaDiario.publicado ? "publico" : "privado",
          atualizadoEm: agora,
        });
      }

      setObras(novasObrasDoUsuario);
      setAutor(autorFinal);
      setCapa(capaFinal);
      setCapaNome(capaNomeFinal);
      setCapaArquivo(null);
      setCapaRemovidaManualmente(false);
      setArquivoObra(arquivoObraFinal);
      setArquivoObraArquivo(null);
      setArquivoObraRemovidoManualmente(false);
      setSalvou(true);


    } catch (erroDesconhecido) {
      const mensagem =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar as alterações. Tente usar uma capa/arquivo menor ou atualizar a página e salvar novamente.";

      setErro(mensagem);
      setSalvou(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setProcessando(false);
    }
  }

  return { salvarEdicao };
}

