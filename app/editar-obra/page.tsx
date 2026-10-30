"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
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
import {
  containerStyle,
  desktopContainerStyle,
  desktopFormStyle,
  desktopHeaderTitleLinkStyle,
  desktopHeaderTitleTextStyle,
  desktopMainGridStyle,
  desktopTitleHeaderStyle,
  desktopTopWaterFadeStyle,
  errorBoxStyle,
  errorTextStyle,
  errorTitleStyle,
  formStyle,
  headerTitleLinkStyle,
  headerTitleTextStyle,
  mainGridStyle,
  mobileTopWaterFadeStyle,
  pageStyle,
  titleHeaderStyle,
} from "./styles/editar-obra-layout-styles";
import {
  ehClassificacao18,
  type AvisoConteudo18,
} from "../../lib/historietasAdultContent";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  LIMITE_TAGS_OBRA,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "./lib/editar-obra-form-config";
import {
  limparTextoPersonalizado,
} from "./lib/editar-obra-custom-value-utils";
import {
  identificarCategoriaArquivo,
} from "./lib/editar-obra-file-validation";
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
import { useEditarObraDesktopMode } from "./hooks/useEditarObraDesktopMode";
import { salvarObrasDoUsuarioPreservandoOutrasContas } from "./lib/editar-obra-local-work-storage";
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
  criarLoginHrefEditarObra,
  obterHrefsObraEditarObra,
} from "./lib/editar-obra-navigation-utils";
import { calcularValoresDerivadosFormularioEdicaoObra } from "./lib/editar-obra-derived-form-values";
import { prepararTagsEdicaoObra } from "./lib/editar-obra-tags-list-utils";
import { prepararValoresSalvamentoEdicaoObra } from "./lib/editar-obra-save-preparation";
import { prepararAssetsAtuaisEdicaoObra } from "./lib/editar-obra-current-assets-preparation";
import { criarPayloadAtualizacaoObra } from "./lib/editar-obra-update-payload";
import { atualizarObraNaListaLocalEdicao } from "./lib/editar-obra-local-update";
import { useEditarObraInitialLoad } from "./hooks/use-editar-obra-initial-load";
import { useEditarObraAssetActions } from "./hooks/use-editar-obra-asset-actions";
import { useEditarObraTagActions } from "./hooks/use-editar-obra-tag-actions";
import type { ArquivoObraLocal, ObraLocal } from "./types";

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

  useEditarObraInitialLoad({
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
  });

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

  const {
    selecionarCapa,
    removerCapa,
    selecionarArquivoObra,
    removerArquivoObra,
  } = useEditarObraAssetActions({
    marcarAlteracao,
    capaInputRef,
    arquivoObraInputRef,
    setCapaErro,
    setCapa,
    setCapaNome,
    setCapaArquivo,
    setCapaRemovidaManualmente,
    setArquivoObraErro,
    setArquivoObra,
    setArquivoObraArquivo,
    setArquivoObraRemovidoManualmente,
  });

  const {
    atualizarTagPersonalizada,
    adicionarTagSelecionada,
  } = useEditarObraTagActions({
    tagPersonalizada,
    marcarAlteracao,
    setTagPersonalizada,
    setTags,
    setUsarTagPersonalizada,
  });

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
