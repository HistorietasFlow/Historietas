"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { usePublicarCoverUpload } from "./hooks/use-publicar-cover-upload";
import { usePublicarBasicFields } from "./hooks/use-publicar-basic-fields";
import { usePublicarContentFileUpload } from "./hooks/use-publicar-content-file-upload";
import { usePublicarPublicationOptions } from "./hooks/use-publicar-publication-options";
import { usePublicarTags } from "./hooks/use-publicar-tags";
import { usePublicarFormValidation } from "./hooks/use-publicar-form-validation";
import {
  calcularMinutosLeitura,
  campoValido,
  contarCaracteresValidos,
  contarPalavras,
} from "./lib/publicar-text-utils";
import {
  criarUuidSeguro,
} from "./lib/publicar-id-utils";
import {
  calcularProgressoLeitura,
} from "./lib/publicar-work-utils";
import {
  normalizarObraSalva,
  obraPertenceAoUsuarioPublicar,
} from "./lib/publicar-local-work-utils";
import { salvarObrasLocalmente } from "./lib/publicar-file-backup-storage-utils";
import {
  lerStorageUsuarioPublicar,
} from "./lib/publicar-user-storage-utils";
import { obterNomeMetadataPublicar } from "./lib/publicar-auth-utils";
import {
  STORAGE_KEY,
} from "./lib/publicar-static-options";
import type {
  ArquivoStoragePublicar,
  CapituloLocal,
  ObraLocal,
  ObraSalva,
} from "./lib/publicar-models";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { formatarTamanhoArquivo } from "../../lib/utils";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  obterTextoPublicar,
  traduzirClassificacaoPublicar,
  traduzirMensagemPublicar,
  type ChaveTextoPublicar,
} from "./lib/publicar-translations";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import {
  desfazerPublicacaoParcialPublicar,
  enviarArquivoStorage,
} from "./lib/publicar-storage-operations";
import { registrarDiarioPublicacao } from "./lib/publicar-diary-activity";
import { criarSlugUnicoSupabase } from "./lib/publicar-slug-supabase-loader";
import { carregarNomePerfilPublicar } from "./lib/publicar-profile-loader";
import {
  PublicarLoadingShell,
  PublicarPageShell,
} from "./components/PublicarPageShell";
import { PublicarPageBackdrop } from "./components/PublicarPageBackdrop";
import { PublicarFormError } from "./components/PublicarFormError";
import { PublicarWorkPreview } from "./components/PublicarWorkPreview";
import { PublicarCoverUpload } from "./components/PublicarCoverUpload";
import { PublicarContentFileUpload } from "./components/PublicarContentFileUpload";
import { PublicarSynopsisField } from "./components/PublicarSynopsisField";
import { PublicarFormActions } from "./components/PublicarFormActions";
import { PublicarBasicFields } from "./components/PublicarBasicFields";
import { PublicarFormatGenreFields } from "./components/PublicarFormatGenreFields";
import { PublicarTagClassificationFields } from "./components/PublicarTagClassificationFields";
import {
  pageStyle,
} from "./lib/publicar-layout-styles";
import {
  desktopFormPanelStyle,
  desktopMainGridSingleStyle,
  formPanelStyle,
  mainGridStyle,
} from "./lib/publicar-form-upload-styles";


export default function PublicarPage() {
  const router = useRouter();

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const {
    atualizarAutor,
    atualizarSinopse,
    atualizarTitulo,
    autor,
    setAutor,
    sinopse,
    titulo,
  } = usePublicarBasicFields({ setErro });
  const {
    atualizarTagPersonalizada,
    atualizarTagSelecionada,
    tagPersonalizada,
    tags,
    tagsDaObra,
    usarTagPersonalizada,
  } = usePublicarTags({ setErro });
  const {
    alternarAvisoConteudo18,
    atualizarClassificacaoIndicativa,
    atualizarFormato,
    atualizarFormatoPersonalizado,
    atualizarGenero,
    atualizarGeneroPersonalizado,
    avisosConteudo18,
    classificacaoIndicativa,
    formato,
    formatoPersonalizado,
    genero,
    generoPersonalizado,
  } = usePublicarPublicationOptions({ setErro });
  const {
    capa,
    capaArquivo,
    capaErro,
    capaInputRef,
    capaNome,
    removerCapa,
    selecionarCapa,
  } = usePublicarCoverUpload({ setErro });
  const {
    anexarArquivoCompleto,
    arquivoCapituloErro,
    arquivoCapituloNome,
    arquivoCapituloTexto,
    arquivoCapituloTitulo,
    arquivoConteudoInputRef,
    arquivoObra,
    arquivoObraArquivo,
    arquivoObraErro,
    arquivoTextoPendente,
    cancelarEscolhaArquivoTexto,
    limparSelecaoConteudoArquivo,
    selecionarConteudoArquivo,
    transformarArquivoTextoEmCapitulo,
  } = usePublicarContentFileUpload({ setErro });
  const [verificandoAutenticacao, setVerificandoAutenticacao] = useState(true);
  const isDesktop = usePublicarDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { language: idioma } = useHistorietasLanguage();
  const t = (chave: ChaveTextoPublicar) => obterTextoPublicar(idioma, chave);

  usePublicarInitialAccess({
    router,
    setAutor,
    setVerificandoAutenticacao,
  });

  const jaSalvouRef = useRef(false);

  const {
    avisosConteudo18Normalizados,
    classificacao18Selecionada,
    classificacaoFinal,
    formatoEhPersonalizado,
    formatoFinal,
    generoEhPersonalizado,
    generoFinal,
    progresso,
    previewTemConteudo,
    sinopseValida,
    temCapituloImportado,
    temConteudoPorArquivo,
    validarFormulario,
  } = usePublicarFormValidation({
    arquivoCapituloTexto,
    arquivoObra,
    autor,
    avisosConteudo18,
    capa,
    classificacaoIndicativa,
    formato,
    formatoPersonalizado,
    genero,
    generoPersonalizado,
    sinopse,
    tagPersonalizada,
    tags,
    titulo,
    usarTagPersonalizada,
  });

  const sinopseCaracteresValidos = contarCaracteresValidos(sinopse);
  const sinopsePalavras = contarPalavras(sinopse);
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "";
  const arquivoObraTipoTexto = arquivoObra
    ? arquivoObra.categoria === "imagem"
      ? t("imagem")
      : arquivoObra.categoria === "documento"
      ? "PDF"
      : arquivoObra.categoria === "texto"
      ? t("texto")
      : t("arquivo")
    : "";
  const arquivoTextoPendenteTamanhoTexto = arquivoTextoPendente
    ? formatarTamanhoArquivo(arquivoTextoPendente.size)
    : "";
  const arquivoCapituloPalavras = contarPalavras(arquivoCapituloTexto);
  const arquivoCapituloMinutos = calcularMinutosLeitura(arquivoCapituloTexto);
  async function salvarObra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (jaSalvouRef.current) {
      return;
    }

    setErro("");
    jaSalvouRef.current = true;
    setProcessando(true);

    const arquivosEnviados: ArquivoStoragePublicar[] = [];
    let obraCriadaId = "";
    let publicacaoConcluida = false;

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !dadosUsuario.user) {
        throw new Error("Entre na sua conta antes de publicar uma obra.");
      }

      const userId = dadosUsuario.user.id;
      const autorFallbackPublicacao =
        autor.trim() ||
        obterNomeMetadataPublicar({
          email: dadosUsuario.user.email || "",
          user_metadata: dadosUsuario.user.user_metadata || {},
        });
      const autorFinalPublicacao = await carregarNomePerfilPublicar(
        userId,
        autorFallbackPublicacao
      );

      if (!campoValido(autorFinalPublicacao, 2)) {
        throw new Error(
          "Não consegui encontrar um nome de autor válido no seu perfil. Atualize seu perfil ou preencha o nome do autor."
        );
      }

      setAutor(autorFinalPublicacao);

      const obrasSalvasTexto = lerStorageUsuarioPublicar(STORAGE_KEY, userId);
      let obrasSalvasJson: unknown = [];

      if (obrasSalvasTexto) {
        try {
          obrasSalvasJson = JSON.parse(obrasSalvasTexto);
        } catch {
          obrasSalvasJson = [];
        }
      }

      const obrasSalvas: ObraLocal[] = Array.isArray(obrasSalvasJson)
        ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
            normalizarObraSalva(obra, index)
          )
        : [];

      const obraId = criarUuidSeguro();
      const slug = await criarSlugUnicoSupabase(titulo.trim(), obrasSalvas);
      const criadaEm = new Date().toISOString();
      const capituloId = temCapituloImportado ? criarUuidSeguro() : "";
      const capitulosIniciais: CapituloLocal[] = temCapituloImportado
        ? [
            {
              id: capituloId,
              titulo: arquivoCapituloTitulo.trim() || "Capítulo 1",
              texto: arquivoCapituloTexto.trim(),
              curtiu: false,
              salvo: false,
              comentario: "",
              criadoEm: criadaEm,
              lido: false,
              lidoEm: "",
            },
          ]
        : [];

      const capaBloqueadaPorClassificacao =
        ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
        ehClassificacao18(classificacaoFinal);
      const capaEnviada =
        capaArquivo && !capaBloqueadaPorClassificacao
          ? await enviarArquivoStorage("capas-obras", userId, capaArquivo)
          : null;

      if (capaEnviada) {
        arquivosEnviados.push(capaEnviada);
      }

      const arquivoObraEnviado =
        arquivoObra && arquivoObraArquivo
          ? await enviarArquivoStorage(
              "arquivos-obras",
              userId,
              arquivoObraArquivo
            )
          : null;

      if (arquivoObraEnviado) {
        arquivosEnviados.push(arquivoObraEnviado);
      }

      const capaUrlSupabase = capaEnviada?.publicUrl || "";
      const capaNomePersistivel = capaBloqueadaPorClassificacao ? "" : capaNome;
      const arquivoObraReferenciaSupabase =
        arquivoObraEnviado?.caminho || "";
      const link = `/obra/${slug}`;

      const { error: erroObra } = await supabase.from("obras").insert({
        id: obraId,
        user_id: userId,
        titulo: titulo.trim(),
        autor: autorFinalPublicacao,
        genero: generoFinal,
        formato: formatoFinal,
        classificacao_indicativa: classificacaoFinal,
        avisos_conteudo: avisosConteudo18Normalizados,
        sinopse: sinopse.trim(),
        tags: tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"],
        capa_url: capaUrlSupabase,
        capa_nome: capaNomePersistivel,
        arquivo_url: arquivoObraReferenciaSupabase,
        arquivo_nome: arquivoObra?.nome || "",
        arquivo_tipo: arquivoObra?.tipo || "",
        arquivo_tamanho: arquivoObra?.tamanho || 0,
        arquivo_categoria: arquivoObra?.categoria || "outro",
        publicado: false,
        visualizacoes: 0,
        slug,
        link,
        criada_em: criadaEm,
        atualizado_em: criadaEm,
      });

      if (erroObra) {
        throw new Error(`Não consegui salvar a obra agora: ${erroObra.message}`);
      }

      obraCriadaId = obraId;

      if (capitulosIniciais.length > 0) {
        const { error: erroCapitulo } = await supabase.from("capitulos").insert(
          capitulosIniciais.map((capitulo, index) => ({
            id: capitulo.id,
            obra_id: obraId,
            user_id: userId,
            titulo: capitulo.titulo,
            texto: capitulo.texto,
            ordem: index + 1,
            publicado: true,
            criado_em: criadaEm,
            atualizado_em: criadaEm,
          }))
        );

        if (erroCapitulo) {
          throw new Error(
            `Não consegui salvar o capítulo inicial: ${erroCapitulo.message}`
          );
        }
      }

      const { data: obraPublicada, error: erroPublicarObra } = await supabase
        .from("obras")
        .update({
          publicado: true,
          atualizado_em: criadaEm,
        })
        .eq("id", obraId)
        .eq("user_id", userId)
        .select("id, publicado")
        .maybeSingle();

      if (
        erroPublicarObra ||
        !obraPublicada?.id ||
        obraPublicada.publicado !== true
      ) {
        const detalheErro =
          erroPublicarObra?.message ||
          "a atualização não confirmou a publicação da obra.";

        throw new Error(
          `A obra foi preparada, mas não pôde ser publicada: ${detalheErro}`
        );
      }

      const novaObra: ObraLocal = {
        id: obraId,
        titulo: titulo.trim(),
        autor: autorFinalPublicacao,
        autorId: userId,
        genero: generoFinal,
        formato: formatoFinal,
        classificacaoIndicativa: classificacaoFinal,
        avisosConteudo: avisosConteudo18Normalizados,
        sinopse: sinopse.trim(),
        tags: tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"],
        capa: capaUrlSupabase,
        capaNome: capaNomePersistivel,
        arquivoObra: arquivoObra
          ? {
              ...arquivoObra,
              conteudo: arquivoObraReferenciaSupabase,
              criadoEm: criadaEm,
            }
          : null,
        publicado: true,
        capitulos: capitulosIniciais,
        criadaEm,
        ultimoCapituloLidoId: "",
        ultimaLeituraEm: "",
        progressoLeitura: calcularProgressoLeitura(capitulosIniciais),
        visualizacoes: 0,
        totalCurtidas: 0,
        totalComentarios: 0,
        totalSalvos: 0,
        totalLidos: 0,
        slug,
        link,
      };

      await registrarDiarioPublicacao({
        userId,
        obraId,
        tipo: "publicou_obra",
        tituloObra: novaObra.titulo,
        criadaEm,
      });

      if (capituloId) {
        await registrarDiarioPublicacao({
          userId,
          obraId,
          capituloId,
          tipo: "publicou_capitulo",
          tituloObra: novaObra.titulo,
          tituloCapitulo: capitulosIniciais[0]?.titulo || "Capítulo 1",
          criadaEm,
        });
      }

      const obrasSalvasDoUsuario = obrasSalvas.filter((obra) =>
        obraPertenceAoUsuarioPublicar(obra, userId),
      );
      const novasObrasDoUsuario = [
        novaObra,
        ...obrasSalvasDoUsuario.filter((obra) => obra.id !== novaObra.id),
      ];

      salvarObrasLocalmente(novasObrasDoUsuario, userId);

      publicacaoConcluida = true;
      router.replace("/painel-autor");
      router.refresh();
    } catch (erroDesconhecido) {
      const publicacaoDesfeita = publicacaoConcluida
        ? false
        : await desfazerPublicacaoParcialPublicar(
            obraCriadaId,
            arquivosEnviados
          );

      jaSalvouRef.current = publicacaoConcluida || !publicacaoDesfeita;
      setProcessando(false);

      const mensagemBase =
        erroDesconhecido instanceof Error &&
        erroDesconhecido.name === "QuotaExceededError"
          ? "O navegador recusou salvar dados locais porque o armazenamento está cheio."
          : erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar a obra agora. Tente novamente.";
      const mensagem = publicacaoConcluida
        ? "A obra foi publicada, mas não consegui abrir o Painel do Autor. Acesse o painel antes de tentar publicar novamente."
        : publicacaoDesfeita
        ? mensagemBase
        : `${mensagemBase} A publicação parcial não pôde ser removida automaticamente. Confira o Painel do Autor antes de tentar novamente.`;

      setErro(mensagem);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  if (verificandoAutenticacao) {
    return <PublicarLoadingShell isDesktop={isDesktop} pageThemeStyle={pageThemeStyle} />;
  }

  return (
    <main style={pageThemeStyle}>
      <PublicarPageBackdrop isDesktop={isDesktop} />

      <PublicarPageShell
        isDesktop={isDesktop}
        novaObra={t("novaObra")}
        voltarHome={t("voltarHome")}
      >
        <section style={isDesktop ? desktopMainGridSingleStyle : mainGridStyle}>
          <form onSubmit={salvarObra} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            {erro && (
              <PublicarFormError
                isDesktop={isDesktop}
                mensagem={traduzirMensagemPublicar(idioma, erro)}
                titulo={t("ajusteNecessario")}
              />
            )}


            <PublicarCoverUpload
              capa={capa}
              capaErro={capaErro}
              capaInputRef={capaInputRef}
              capaNome={capaNome}
              isDesktop={isDesktop}
              onRemoverCapa={removerCapa}
              onSelecionarCapa={selecionarCapa}
              t={t}
              traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
            />


            <PublicarBasicFields
              autor={autor}
              isDesktop={isDesktop}
              onAutorChange={atualizarAutor}
              onTituloChange={atualizarTitulo}
              t={t}
              titulo={titulo}
            />

            <PublicarFormatGenreFields
              formato={formato}
              formatoEhPersonalizado={formatoEhPersonalizado}
              formatoPersonalizado={formatoPersonalizado}
              genero={genero}
              generoEhPersonalizado={generoEhPersonalizado}
              generoPersonalizado={generoPersonalizado}
              idioma={idioma}
              isDesktop={isDesktop}
              onFormatoChange={atualizarFormato}
              onFormatoPersonalizadoChange={atualizarFormatoPersonalizado}
              onGeneroChange={atualizarGenero}
              onGeneroPersonalizadoChange={atualizarGeneroPersonalizado}
              t={t}
            />

            <PublicarTagClassificationFields
              avisosConteudo18={avisosConteudo18}
              classificacao18Selecionada={classificacao18Selecionada}
              classificacaoIndicativa={classificacaoIndicativa}
              idioma={idioma}
              isDesktop={isDesktop}
              onAlternarAviso={alternarAvisoConteudo18}
              onClassificacaoChange={atualizarClassificacaoIndicativa}
              onTagChange={atualizarTagSelecionada}
              onTagPersonalizadaChange={atualizarTagPersonalizada}
              t={t}
              tagPersonalizada={tagPersonalizada}
              tagsDaObra={tagsDaObra}
              usarTagPersonalizada={usarTagPersonalizada}
            />

            <PublicarSynopsisField
              caracteresValidos={sinopseCaracteresValidos}
              isDesktop={isDesktop}
              onSinopseChange={atualizarSinopse}
              palavras={sinopsePalavras}
              sinopse={sinopse}
              sinopseValida={sinopseValida}
              t={t}
            />


            <PublicarContentFileUpload
              arquivoCapituloErro={arquivoCapituloErro}
              arquivoCapituloMinutos={arquivoCapituloMinutos}
              arquivoCapituloNome={arquivoCapituloNome}
              arquivoCapituloPalavras={arquivoCapituloPalavras}
              arquivoCapituloTitulo={arquivoCapituloTitulo}
              arquivoConteudoInputRef={arquivoConteudoInputRef}
              arquivoObra={arquivoObra}
              arquivoObraErro={arquivoObraErro}
              arquivoObraTamanhoTexto={arquivoObraTamanhoTexto}
              arquivoObraTipoTexto={arquivoObraTipoTexto}
              arquivoTextoPendente={arquivoTextoPendente}
              arquivoTextoPendenteTamanhoTexto={arquivoTextoPendenteTamanhoTexto}
              isDesktop={isDesktop}
              onAnexarArquivoCompleto={anexarArquivoCompleto}
              onCancelarEscolhaArquivoTexto={cancelarEscolhaArquivoTexto}
              onLimparSelecaoConteudoArquivo={limparSelecaoConteudoArquivo}
              onSelecionarConteudoArquivo={selecionarConteudoArquivo}
              onTransformarArquivoTextoEmCapitulo={transformarArquivoTextoEmCapitulo}
              t={t}
              temCapituloImportado={temCapituloImportado}
              temConteudoPorArquivo={temConteudoPorArquivo}
              traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
            />

            <PublicarFormActions
              cancelar={t("cancelar")}
              criarObra={t("criarObra")}
              isDesktop={isDesktop}
              processando={processando}
              progresso={progresso}
              progressoRotulo={t("progresso")}
              salvando={t("salvando")}
            />
          </form>

          <PublicarWorkPreview
            arquivoCapituloMinutos={arquivoCapituloMinutos}
            arquivoCapituloPalavras={arquivoCapituloPalavras}
            arquivoCapituloTitulo={arquivoCapituloTitulo}
            autor={autor}
            capa={capa}
            classificacaoTexto={
              classificacaoFinal
                ? traduzirClassificacaoPublicar(idioma, classificacaoFinal)
                : t("classificacao")
            }
            formatoFinal={formatoFinal}
            generoFinal={generoFinal}
            idioma={idioma}
            isDesktop={isDesktop}
            previewTemConteudo={previewTemConteudo}
            t={(chave) => t(chave as ChaveTextoPublicar)}
            temCapituloImportado={temCapituloImportado}
            titulo={titulo}
          />
        </section>
      </PublicarPageShell>
    </main>
  );
}
