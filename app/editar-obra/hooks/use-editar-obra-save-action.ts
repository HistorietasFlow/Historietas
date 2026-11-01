import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import {
  carregarBackupArquivosObras,
  salvarArquivoObraNoBackup,
  sincronizarBackupArquivosObras,
} from "../lib/editar-obra-file-backup-storage";
import { criarAlvoBackupArquivoEdicaoObra } from "../lib/editar-obra-backup-target";
import { salvarObrasDoUsuarioPreservandoOutrasContas } from "../lib/editar-obra-local-work-storage";
import {
  removerArquivosStorageEdicaoObra,
  type ArquivoStorageEdicaoObra,
} from "../lib/editar-obra-remote-storage";
import { registrarDiarioEdicaoObra } from "../lib/editar-obra-diary-action";
import { validarFormularioEdicaoObra } from "../lib/editar-obra-form-validation";
import { obterIdentidadeSalvamentoEdicaoObra } from "../lib/editar-obra-save-auth-identity";
import { confirmarPropriedadeObraParaSalvamentoEdicao } from "../lib/editar-obra-save-work-ownership";
import { prepararValoresSalvamentoEdicaoObra } from "../lib/editar-obra-save-preparation";
import {
  prepararEEnviarAssetsEdicaoObra,
  type ArquivoAntigoEdicaoObra,
} from "../lib/editar-obra-save-assets-preparation";
import { atualizarObraRemotaEdicaoObra } from "../lib/editar-obra-remote-update";
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
      const confirmacaoPropriedade =
        await confirmarPropriedadeObraParaSalvamentoEdicao({
          obras,
          obraId,
          userId,
          setErro,
          setSalvou,
        });

      if (!confirmacaoPropriedade) {
        return;
      }

      const { obraLocalAtual, obraRemotaAtual } = confirmacaoPropriedade;
      let capaFinal = "";
      let capaNomeFinal = "";
      let arquivoObraFinal: ArquivoObraLocal | null = null;
      const arquivosNovosEnviados: ArquivoStorageEdicaoObra[] = [];
      let arquivosAntigosParaRemover: ArquivoAntigoEdicaoObra[] = [];

      try {
        const assetsPreparados = await prepararEEnviarAssetsEdicaoObra({
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
        });
        capaFinal = assetsPreparados.capaFinal;
        capaNomeFinal = assetsPreparados.capaNomeFinal;
        arquivoObraFinal = assetsPreparados.arquivoObraFinal;
        arquivosAntigosParaRemover =
          assetsPreparados.arquivosAntigosParaRemover;

      } catch (erroSupabase) {
        await removerArquivosStorageEdicaoObra(
          arquivosNovosEnviados.map((arquivo) => ({
            bucket: arquivo.bucket,
            caminho: arquivo.caminho,
          })),
        );

        const mensagemSupabase =
          erroSupabase instanceof Error
            ? erroSupabase.message
            : "Não consegui atualizar a obra no Supabase.";

        throw new Error(mensagemSupabase);
      }

      await atualizarObraRemotaEdicaoObra({
        obraId,
        userId,
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
        arquivosNovosEnviados,
      });

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

