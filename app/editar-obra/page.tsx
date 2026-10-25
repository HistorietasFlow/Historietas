"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { EditarObraAssetUploads } from "./components/EditarObraAssetUploads";
import { EditarObraContentRatingField } from "./components/EditarObraContentRatingField";
import { EditarObraFormatGenreFields } from "./components/EditarObraFormatGenreFields";
import { EditarObraIdentityFields } from "./components/EditarObraIdentityFields";
import { EditarObraLanguageBridge } from "./components/EditarObraLanguageBridge";
import { EditarObraFormActions } from "./components/EditarObraFormActions";
import { EditarObraPreview } from "./components/EditarObraPreview";
import { EditarObraSynopsisField } from "./components/EditarObraSynopsisField";
import { EditarObraTagField } from "./components/EditarObraTagField";
import { editarObraPageCss } from "./styles/editar-obra-page-css";
import { safeTextStyle } from "./styles/editar-obra-shared-styles";
import {
  ehClassificacao18,
  type AvisoConteudo18,
} from "../../lib/historietasAdultContent";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  LIMITE_TAGS_OBRA,
  OPCOES_FORMATO_OBRA,
  OPCOES_GENERO_OBRA,
  OPCOES_TAGS_OBRA,
  OUTRA_TAG_VALUE,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
  TAMANHO_MAXIMO_ARQUIVO_OBRA,
  TAMANHO_MAXIMO_CAPA,
} from "./lib/editar-obra-form-config";
import {
  limparTextoPersonalizado,
} from "./lib/editar-obra-custom-value-utils";
import {
  arquivoImagemAceito,
  arquivoObraAceito,
  identificarCategoriaArquivo,
} from "./lib/editar-obra-file-validation";
import { selecionarObrasLocaisAutorizadasEdicaoObra } from "./lib/editar-obra-local-selection";
import {
  carregarNomeAutorProfileEdicaoObra,
  obterTextoMetadataUsuarioEdicaoObra,
} from "./lib/editar-obra-profile-loader";
import {
  carregarBackupArquivosObras,
  salvarArquivoObraNoBackup,
  sincronizarBackupArquivosObras,
} from "./lib/editar-obra-file-backup-storage";
import { criarAlvoBackupArquivoEdicaoObra } from "./lib/editar-obra-backup-target";
import { normalizarObraSupabase } from "./lib/editar-obra-supabase-work-normalizer";
import { prepararObrasCarregadasEdicaoObra } from "./lib/editar-obra-loaded-work-merge";
import { carregarCapitulosSupabaseEdicaoObra } from "./lib/editar-obra-chapters-loader";
import { carregarObraSupabaseEdicaoObra } from "./lib/editar-obra-work-loader";
import { obterObraIdEdicaoObra } from "./lib/editar-obra-search-params";
import { useEditarObraDesktopMode } from "./hooks/useEditarObraDesktopMode";
import {
  carregarObrasLocalStorageEdicaoObra,
  salvarObrasDoUsuarioPreservandoOutrasContas,
} from "./lib/editar-obra-local-work-storage";
import {
  enviarArquivoStorage,
  removerArquivosStorageEdicaoObra,
  type ArquivoStorageEdicaoObra,
} from "./lib/editar-obra-remote-storage";
import { registrarDiarioEdicaoObra } from "./lib/editar-obra-diary-action";
import {
  calcularProgressoFormularioEdicaoObra,
  validarFormularioEdicaoObra,
} from "./lib/editar-obra-form-validation";
import {
  prepararAtualizacaoTagPersonalizada,
  prepararSelecaoTagEdicaoObra,
} from "./lib/editar-obra-tag-utils";
import {
  criarLoginHrefEditarObra,
  obterHrefsObraEditarObra,
} from "./lib/editar-obra-navigation-utils";
import { prepararValoresFormularioEdicaoObra } from "./lib/editar-obra-form-preparation";
import { calcularValoresDerivadosFormularioEdicaoObra } from "./lib/editar-obra-derived-form-values";
import { prepararTagsEdicaoObra } from "./lib/editar-obra-tags-list-utils";
import { prepararValoresSalvamentoEdicaoObra } from "./lib/editar-obra-save-preparation";
import { prepararAssetsAtuaisEdicaoObra } from "./lib/editar-obra-current-assets-preparation";
import { criarPayloadAtualizacaoObra } from "./lib/editar-obra-update-payload";
import { atualizarObraNaListaLocalEdicao } from "./lib/editar-obra-local-update";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  slug: string;
  link: string;
};

export default function EditarObraPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const [obraId, setObraId] = useState("");
  const [, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [obraEncontrada, setObraEncontrada] = useState(false);
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [nomeAutorProfile, setNomeAutorProfile] = useState("");
  const [genero, setGenero] = useState("");
  const [generoPersonalizado, setGeneroPersonalizado] = useState("");
  const [formato, setFormato] = useState("");
  const [formatoPersonalizado, setFormatoPersonalizado] = useState("");
  const [classificacaoIndicativa, setClassificacaoIndicativa] = useState("");
  const [avisosConteudo18, setAvisosConteudo18] = useState<AvisoConteudo18[]>([]);
  const [sinopse, setSinopse] = useState("");
  const [tags, setTags] = useState("");
  const [tagPersonalizada, setTagPersonalizada] = useState("");
  const [usarTagPersonalizada, setUsarTagPersonalizada] = useState(false);
  const [capa, setCapa] = useState("");
  const [capaNome, setCapaNome] = useState("");
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaErro, setCapaErro] = useState("");
  const [capaRemovidaManualmente, setCapaRemovidaManualmente] =
    useState(false);
  const [arquivoObra, setArquivoObra] = useState<ArquivoObraLocal | null>(null);
  const [arquivoObraArquivo, setArquivoObraArquivo] = useState<File | null>(null);
  const [arquivoObraErro, setArquivoObraErro] = useState("");
  const [arquivoObraRemovidoManualmente, setArquivoObraRemovidoManualmente] =
    useState(false);

  const capaInputRef = useRef<HTMLInputElement | null>(null);
  const arquivoObraInputRef = useRef<HTMLInputElement | null>(null);
  const isDesktop = useEditarObraDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

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
  }, [router]);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const tagsTratadas = useMemo(() => {
    return prepararTagsEdicaoObra(tags, LIMITE_TAGS_OBRA);
  }, [tags]);

  const {
    formatoEhPersonalizado,
    generoEhPersonalizado,
    formatoFinal,
    generoFinal,
    formatoPersonalizadoValido,
    generoPersonalizadoValido,
    tagPersonalizadaValida,
  } = calcularValoresDerivadosFormularioEdicaoObra({
    formato,
    genero,
    tagPersonalizada,
    usarTagPersonalizada,
    formatoPersonalizado,
    generoPersonalizado,
    outroFormatoValue: OUTRO_FORMATO_VALUE,
    outroGeneroValue: OUTRO_GENERO_VALUE,
    limiteCaracteresFormatoGeneroPersonalizado:
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
    limiteCaracteresTagPersonalizada: LIMITE_CARACTERES_TAG_PERSONALIZADA,
  });

  const progresso = useMemo(() => calcularProgressoFormularioEdicaoObra({
    titulo,
    autor,
    generoFinal,
    generoPersonalizadoValido,
    formatoFinal,
    formatoPersonalizadoValido,
    classificacaoIndicativa,
    avisosConteudo18,
    sinopse,
  }), [
    titulo,
    autor,
    generoFinal,
    generoPersonalizadoValido,
    formatoFinal,
    formatoPersonalizadoValido,
    classificacaoIndicativa,
    avisosConteudo18,
    sinopse,
  ]);

  const { minhaObraHref } = obterHrefsObraEditarObra(obraAtual, titulo);
  const autorProfileAtivo = nomeAutorProfile.trim();
  const autorPreview = autorProfileAtivo || autor.trim();
  function marcarAlteracao() {
    if (salvou) {
      setSalvou(false);
    }

    if (erro) {
      setErro("");
    }
  }

  function selecionarCapa(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setCapaErro("");
    marcarAlteracao();

    if (!arquivo) {
      return;
    }

    setCapaArquivo(null);

    if (!arquivoImagemAceito(arquivo)) {
      setCapaErro("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_CAPA) {
      setCapaErro("A capa precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setCapaErro("Não consegui carregar essa imagem.");
        return;
      }

      setCapa(resultado);
      setCapaNome(arquivo.name);
      setCapaArquivo(arquivo);
      setCapaRemovidaManualmente(false);
    };

    leitor.onerror = () => {
      setCapaErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerCapa() {
    setCapa("");
    setCapaNome("");
    setCapaArquivo(null);
    setCapaRemovidaManualmente(true);
    setCapaErro("");
    marcarAlteracao();

    if (capaInputRef.current) {
      capaInputRef.current.value = "";
    }
  }

  function selecionarArquivoObra(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoObraErro("");
    marcarAlteracao();

    if (!arquivo) {
      return;
    }

    setArquivoObraArquivo(null);

    if (!arquivoObraAceito(arquivo)) {
      setArquivoObraErro(
        "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF."
      );
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_OBRA) {
      setArquivoObraErro(
        "O arquivo completo precisa ter no máximo 5 MB."
      );
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setArquivoObraErro("Não consegui carregar esse arquivo.");
        return;
      }

      setArquivoObraRemovidoManualmente(false);
      setArquivoObra({
        nome: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        tamanho: arquivo.size,
        conteudo: resultado,
        categoria: identificarCategoriaArquivo(arquivo),
        criadoEm: new Date().toISOString(),
      });
      setArquivoObraArquivo(arquivo);
    };

    leitor.onerror = () => {
      setArquivoObraErro("Não consegui carregar esse arquivo.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerArquivoObra() {
    setArquivoObra(null);
    setArquivoObraArquivo(null);
    setArquivoObraRemovidoManualmente(true);
    setArquivoObraErro("");
    marcarAlteracao();

    if (arquivoObraInputRef.current) {
      arquivoObraInputRef.current.value = "";
    }
  }

  function atualizarTagPersonalizada(valor: string) {
    const proximaTag = prepararAtualizacaoTagPersonalizada(
      valor,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    );

    setTagPersonalizada(proximaTag.tagPersonalizada);
    setTags(proximaTag.tags);
    marcarAlteracao();
  }

  function adicionarTagSelecionada(tag: string) {
    const proximaTag = prepararSelecaoTagEdicaoObra(
      tag,
      tagPersonalizada,
      OUTRA_TAG_VALUE,
      LIMITE_CARACTERES_TAG_PERSONALIZADA,
    );

    setUsarTagPersonalizada(proximaTag.usarTagPersonalizada);

    if (proximaTag.tagPersonalizada !== undefined) {
      setTagPersonalizada(proximaTag.tagPersonalizada);
    }

    setTags(proximaTag.tags);
    marcarAlteracao();
  }

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
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      const userId = dadosUsuario.user?.id || "";

      if (erroUsuario || !userId || !obraId) {
        setErro("Entre na sua conta antes de editar a obra.");
        router.replace(criarLoginHrefEditarObra(obraId));
        return;
      }

      const metadataUsuario = dadosUsuario.user?.user_metadata as
        | Record<string, unknown>
        | undefined;
      const nomeMetadataUsuario =
        obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "nome") ||
        obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "name") ||
        obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "full_name");
      const nomeProfileAtualizado = await carregarNomeAutorProfileEdicaoObra(
        userId,
        nomeMetadataUsuario || autorFormularioFinal
      );
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

  if (carregando) {
    return (
      <main data-historietas-editar-obra-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        <EditarObraLanguageBridge />
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraEncontrada) {
    return (
      <main data-historietas-editar-obra-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        <EditarObraLanguageBridge />
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Obra não encontrada
          </p>
        </section>
      </main>
    );
  }

  return (
    <main data-historietas-editar-obra-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
      <EditarObraLanguageBridge />
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle}
            >
              EDITAR OBRA
            </span>
          </Link>

        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível salvar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}


        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <EditarObraAssetUploads
              isDesktop={isDesktop}
              capa={capa}
              capaErro={capaErro}
              capaInputRef={capaInputRef}
              onSelecionarCapa={selecionarCapa}
              onRemoverCapa={removerCapa}
              arquivoObra={arquivoObra}
              arquivoObraErro={arquivoObraErro}
              arquivoObraInputRef={arquivoObraInputRef}
              onSelecionarArquivoObra={selecionarArquivoObra}
              onRemoverArquivoObra={removerArquivoObra}
            />

            <EditarObraIdentityFields
              titulo={titulo}
              autor={autor}
              onTituloChange={(novoTitulo) => {
                setTitulo(novoTitulo);
                marcarAlteracao();
              }}
              onAutorChange={(novoAutor) => {
                setAutor(novoAutor);
                marcarAlteracao();
              }}
            />

            <EditarObraFormatGenreFields
              isDesktop={isDesktop}
              formato={formato}
              formatoPersonalizado={formatoPersonalizado}
              formatoEhPersonalizado={formatoEhPersonalizado}
              genero={genero}
              generoPersonalizado={generoPersonalizado}
              generoEhPersonalizado={generoEhPersonalizado}
              onFormatoChange={(novoFormato) => {
                setFormato(novoFormato);

                if (novoFormato !== OUTRO_FORMATO_VALUE) {
                  setFormatoPersonalizado("");
                }

                marcarAlteracao();
              }}
              onFormatoPersonalizadoChange={(novoFormatoPersonalizado) => {
                setFormatoPersonalizado(
                  limparTextoPersonalizado(
                    novoFormatoPersonalizado,
                    LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
                  )
                );
                marcarAlteracao();
              }}
              onGeneroChange={(novoGenero) => {
                setGenero(novoGenero);

                if (novoGenero !== OUTRO_GENERO_VALUE) {
                  setGeneroPersonalizado("");
                }

                marcarAlteracao();
              }}
              onGeneroPersonalizadoChange={(novoGeneroPersonalizado) => {
                setGeneroPersonalizado(
                  limparTextoPersonalizado(
                    novoGeneroPersonalizado,
                    LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
                  )
                );
                marcarAlteracao();
              }}
            />

            <EditarObraTagField
              usarTagPersonalizada={usarTagPersonalizada}
              tagsTratadas={tagsTratadas}
              tagPersonalizada={tagPersonalizada}
              onTagChange={adicionarTagSelecionada}
              onTagPersonalizadaChange={atualizarTagPersonalizada}
            />

            <EditarObraContentRatingField
              classificacaoIndicativa={classificacaoIndicativa}
              avisosConteudo18={avisosConteudo18}
              language={language}
              onClassificacaoChange={(novaClassificacao) => {
                setClassificacaoIndicativa(novaClassificacao);

                if (!ehClassificacao18(novaClassificacao)) {
                  setAvisosConteudo18([]);
                }

                marcarAlteracao();
              }}
              onToggleAvisoConteudo18={(aviso) => {
                setAvisosConteudo18((avisosAtuais) =>
                  avisosAtuais.includes(aviso)
                    ? avisosAtuais.filter((item) => item !== aviso)
                    : [...avisosAtuais, aviso],
                );
                marcarAlteracao();
              }}
            />

            <EditarObraSynopsisField
              isDesktop={isDesktop}
              sinopse={sinopse}
              onSinopseChange={(novaSinopse) => {
                setSinopse(novaSinopse);
                marcarAlteracao();
              }}
            />

            <EditarObraFormActions
              isDesktop={isDesktop}
              processando={processando}
              salvou={salvou}
              minhaObraHref={minhaObraHref}
              progresso={progresso}
            />
          </form>

          <EditarObraPreview
            isDesktop={isDesktop}
            capa={capa}
            titulo={titulo}
            formatoFinal={formatoFinal}
            classificacaoIndicativa={classificacaoIndicativa}
            autorPreview={autorPreview}
            quantidadeCapitulos={obraAtual?.capitulos.length || 0}
            progresso={progresso}
            generoFinal={generoFinal}
            publicado={obraAtual?.publicado}
          />
        </section>
      </section>
    </main>
  );
}

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-editar-obra-bg-page, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
};





const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  flexWrap: "nowrap",
  marginTop: 0,
  marginBottom: "14px",
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  justifyContent: "center",
  minHeight: "48px",
  marginBottom: "24px",
  paddingRight: 0,
  textAlign: "center",
};



const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
  width: "100%",
  justifyContent: "center",
  textAlign: "center",
  fontSize: "29px",
};



const headerTitleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: "-1px",
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "25px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: 0,
  wordSpacing: "normal",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
};

const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
  fontSize: "29px",
  letterSpacing: "-0.035em",
};











const errorBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  marginTop: "12px",
  padding: "11px",
  borderRadius: "16px",
  background: "var(--historietas-editar-obra-danger-bg, rgba(239,68,68,0.075))",
  border: "1px solid var(--historietas-editar-obra-danger-border, rgba(239,68,68,0.18))",
  color: "var(--historietas-editar-obra-danger-text, #FFFFFF)",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-editar-obra-danger-text, #FFFFFF)",
  fontSize: "18px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-editar-obra-danger-text-soft, #FECACA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 850,
  ...safeTextStyle,
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  background: "transparent",
  border: "0",
  borderRadius: 0,
  padding: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};





























const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "30px 0 72px",
};






const desktopMainGridStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 760px)",
  justifyContent: "center",
  alignItems: "start",
  gap: "28px",
};

const desktopFormStyle: CSSProperties = {
  ...formStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  width: "100%",
  maxWidth: "760px",
  padding: 0,
  borderRadius: 0,
  gap: "16px",
  overflow: "visible",
};
