import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  OPCOES_FORMATO_OBRA,
  OPCOES_GENERO_OBRA,
  OPCOES_TAGS_OBRA,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/editar-obra-form-config";
import { selecionarObrasLocaisAutorizadasEdicaoObra } from "../lib/editar-obra-local-selection";
import {
  carregarNomeAutorProfileEdicaoObra,
  obterTextoMetadataUsuarioEdicaoObra,
} from "../lib/editar-obra-profile-loader";
import { sincronizarBackupArquivosObras } from "../lib/editar-obra-file-backup-storage";
import { normalizarObraSupabase } from "../lib/editar-obra-supabase-work-normalizer";
import { prepararObrasCarregadasEdicaoObra } from "../lib/editar-obra-loaded-work-merge";
import { carregarCapitulosSupabaseEdicaoObra } from "../lib/editar-obra-chapters-loader";
import { carregarObraSupabaseEdicaoObra } from "../lib/editar-obra-work-loader";
import { obterObraIdEdicaoObra } from "../lib/editar-obra-search-params";
import {
  carregarObrasLocalStorageEdicaoObra,
  salvarObrasDoUsuarioPreservandoOutrasContas,
} from "../lib/editar-obra-local-work-storage";
import { criarLoginHrefEditarObra } from "../lib/editar-obra-navigation-utils";
import { prepararValoresFormularioEdicaoObra } from "../lib/editar-obra-form-preparation";
import type { ArquivoObraLocal, ObraLocal } from "../types";

type RouterEditarObra = {
  replace: (href: string) => void;
};

type UseEditarObraInitialLoadProps = {
  router: RouterEditarObra;
  setObraId: Dispatch<SetStateAction<string>>;
  setUsuarioIdLogado: Dispatch<SetStateAction<string>>;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
  setObraEncontrada: Dispatch<SetStateAction<boolean>>;
  setTitulo: Dispatch<SetStateAction<string>>;
  setAutor: Dispatch<SetStateAction<string>>;
  setNomeAutorProfile: Dispatch<SetStateAction<string>>;
  setGenero: Dispatch<SetStateAction<string>>;
  setGeneroPersonalizado: Dispatch<SetStateAction<string>>;
  setFormato: Dispatch<SetStateAction<string>>;
  setFormatoPersonalizado: Dispatch<SetStateAction<string>>;
  setClassificacaoIndicativa: Dispatch<SetStateAction<string>>;
  setAvisosConteudo18: Dispatch<SetStateAction<AvisoConteudo18[]>>;
  setSinopse: Dispatch<SetStateAction<string>>;
  setTags: Dispatch<SetStateAction<string>>;
  setTagPersonalizada: Dispatch<SetStateAction<string>>;
  setUsarTagPersonalizada: Dispatch<SetStateAction<boolean>>;
  setCapa: Dispatch<SetStateAction<string>>;
  setCapaNome: Dispatch<SetStateAction<string>>;
  setCapaArquivo: Dispatch<SetStateAction<File | null>>;
  setCapaRemovidaManualmente: Dispatch<SetStateAction<boolean>>;
  setArquivoObra: Dispatch<SetStateAction<ArquivoObraLocal | null>>;
  setArquivoObraArquivo: Dispatch<SetStateAction<File | null>>;
  setArquivoObraRemovidoManualmente: Dispatch<SetStateAction<boolean>>;
};

export function useEditarObraInitialLoad({
  router,
  setObraId,
  setUsuarioIdLogado,
  setObras,
  setCarregando,
  setObraEncontrada,
  setTitulo,
  setAutor,
  setNomeAutorProfile,
  setGenero,
  setGeneroPersonalizado,
  setFormato,
  setFormatoPersonalizado,
  setClassificacaoIndicativa,
  setAvisosConteudo18,
  setSinopse,
  setTags,
  setTagPersonalizada,
  setUsarTagPersonalizada,
  setCapa,
  setCapaNome,
  setCapaArquivo,
  setCapaRemovidaManualmente,
  setArquivoObra,
  setArquivoObraArquivo,
  setArquivoObraRemovidoManualmente,
}: UseEditarObraInitialLoadProps) {
  useEffect(() => {
    let cancelado = false;

    function aplicarObraNoFormulario(
      obraAtual: ObraLocal,
      nomeAutorProfileAtual = ""
    ) {
      const valoresFormulario = prepararValoresFormularioEdicaoObra({
        obraAtual,
        nomeAutorProfileAtual,
        opcoesFormato: OPCOES_FORMATO_OBRA,
        opcoesGenero: OPCOES_GENERO_OBRA,
        opcoesTags: OPCOES_TAGS_OBRA,
        outroFormatoValue: OUTRO_FORMATO_VALUE,
        outroGeneroValue: OUTRO_GENERO_VALUE,
        limiteCaracteresFormatoGeneroPersonalizado:
          LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
        limiteCaracteresTagPersonalizada: LIMITE_CARACTERES_TAG_PERSONALIZADA,
      });

      setObraEncontrada(true);
      setTitulo(valoresFormulario.titulo);
      setAutor(valoresFormulario.autor);
      setGenero(valoresFormulario.genero);
      setGeneroPersonalizado(valoresFormulario.generoPersonalizado);
      setFormato(valoresFormulario.formato);
      setFormatoPersonalizado(valoresFormulario.formatoPersonalizado);
      setClassificacaoIndicativa(valoresFormulario.classificacaoIndicativa);
      setAvisosConteudo18(valoresFormulario.avisosConteudo18);
      setSinopse(valoresFormulario.sinopse);
      setUsarTagPersonalizada(valoresFormulario.usarTagPersonalizada);
      setTagPersonalizada(valoresFormulario.tagPersonalizada);
      setTags(valoresFormulario.tags);
      setCapa(valoresFormulario.capa);
      setCapaNome(valoresFormulario.capaNome);
      setCapaArquivo(null);
      setCapaRemovidaManualmente(false);
      setArquivoObra(valoresFormulario.arquivoObra);
      setArquivoObraArquivo(null);
      setArquivoObraRemovidoManualmente(false);
    }

    async function carregarObra() {
      const obraIdParam = obterObraIdEdicaoObra(window.location.search);

      window.setTimeout(() => {
        if (!cancelado) {
          setObraId(obraIdParam);
        }
      }, 0);

      let obrasNormalizadas: ObraLocal[] = [];

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        const userId = dadosUsuario.user?.id || "";

        if (erroUsuario || !userId) {
          if (!cancelado) {
            setUsuarioIdLogado("");
            router.replace(criarLoginHrefEditarObra(obraIdParam));
          }

          return;
        }

        if (!cancelado) {
          setUsuarioIdLogado(userId);
        }

        const metadataUsuario = dadosUsuario.user?.user_metadata as
          | Record<string, unknown>
          | undefined;
        const nomeMetadataUsuario =
          obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "nome") ||
          obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "name") ||
          obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "full_name");
        const nomeProfileUsuario = await carregarNomeAutorProfileEdicaoObra(
          userId,
          nomeMetadataUsuario
        );

        if (!cancelado) {
          setNomeAutorProfile(nomeProfileUsuario);
        }

        if (!obraIdParam) {
          return;
        }

        try {
          obrasNormalizadas = carregarObrasLocalStorageEdicaoObra(userId);

          const { obrasAutorizadas, obraLocal } =
            selecionarObrasLocaisAutorizadasEdicaoObra({
              obrasNormalizadas,
              userId,
              obraId: obraIdParam,
            });

          if (!cancelado) {
            setObras(obrasAutorizadas);

            if (obraLocal) {
              aplicarObraNoFormulario(obraLocal, nomeProfileUsuario);
            }
          }
        } catch {
          obrasNormalizadas = [];

          if (!cancelado) {
            setObras([]);
          }
        }

        const obraSupabase = await carregarObraSupabaseEdicaoObra(
          obraIdParam,
          userId,
        );

        if (!obraSupabase) {
          return;
        }

        const capitulosSupabase = await carregarCapitulosSupabaseEdicaoObra(
          obraIdParam,
          userId,
        );

        const { obrasAutorizadas, obraLocal } =
          selecionarObrasLocaisAutorizadasEdicaoObra({
            obrasNormalizadas,
            userId,
            obraId: obraIdParam,
          });
        const obraNormalizadaSupabase = normalizarObraSupabase(
          obraSupabase,
          capitulosSupabase,
          obraLocal,
          0
        );
        const { obraSupabaseComAutorProfile, obrasAtualizadas } =
          prepararObrasCarregadasEdicaoObra({
            obraNormalizadaSupabase,
            nomeProfileUsuario,
            userId,
            obrasAutorizadas,
            obraIdParam,
          });

        const obrasAtualizadasDoUsuario =
          salvarObrasDoUsuarioPreservandoOutrasContas(obrasAtualizadas, userId);

        sincronizarBackupArquivosObras(obrasAtualizadasDoUsuario, userId);

        if (!cancelado) {
          setObras(obrasAtualizadasDoUsuario);
          aplicarObraNoFormulario(obraSupabaseComAutorProfile, nomeProfileUsuario);
        }
      } catch (erroSupabase) {
        console.warn("Falha ao carregar dados do Supabase:", erroSupabase);
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarObra();

    return () => {
      cancelado = true;
    };
  }, [
    router,
    setObraId,
    setUsuarioIdLogado,
    setObras,
    setCarregando,
    setObraEncontrada,
    setTitulo,
    setAutor,
    setNomeAutorProfile,
    setGenero,
    setGeneroPersonalizado,
    setFormato,
    setFormatoPersonalizado,
    setClassificacaoIndicativa,
    setAvisosConteudo18,
    setSinopse,
    setTags,
    setTagPersonalizada,
    setUsarTagPersonalizada,
    setCapa,
    setCapaNome,
    setCapaArquivo,
    setCapaRemovidaManualmente,
    setArquivoObra,
    setArquivoObraArquivo,
    setArquivoObraRemovidoManualmente,
  ]);
}
