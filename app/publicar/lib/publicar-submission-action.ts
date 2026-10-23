import type { FormEvent, MutableRefObject } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
} from "../../../lib/historietasAdultContent";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import { obterNomeMetadataPublicar } from "./publicar-auth-utils";
import { registrarDiarioPublicacao } from "./publicar-diary-activity";
import { salvarObrasLocalmente } from "./publicar-file-backup-storage-utils";
import { criarUuidSeguro } from "./publicar-id-utils";
import {
  normalizarObraSalva,
  obraPertenceAoUsuarioPublicar,
} from "./publicar-local-work-utils";
import type {
  ArquivoObraLocal,
  ArquivoStoragePublicar,
  CapituloLocal,
  ObraLocal,
  ObraSalva,
} from "./publicar-models";
import { carregarNomePerfilPublicar } from "./publicar-profile-loader";
import { STORAGE_KEY } from "./publicar-static-options";
import {
  desfazerPublicacaoParcialPublicar,
  enviarArquivoStorage,
} from "./publicar-storage-operations";
import { criarSlugUnicoSupabase } from "./publicar-slug-supabase-loader";
import { campoValido } from "./publicar-text-utils";
import { lerStorageUsuarioPublicar } from "./publicar-user-storage-utils";
import { calcularProgressoLeitura } from "./publicar-work-utils";

export type SalvarObraPublicarParams = {
  arquivoCapituloTexto: string;
  arquivoCapituloTitulo: string;
  arquivoObra: ArquivoObraLocal | null;
  arquivoObraArquivo: File | null;
  autor: string;
  avisosConteudo18Normalizados: AvisoConteudo18[];
  capaArquivo: File | null;
  capaNome: string;
  classificacaoFinal: string;
  formatoFinal: string;
  generoFinal: string;
  jaSalvouRef: MutableRefObject<boolean>;
  router: {
    refresh: () => void;
    replace: (href: string) => void;
  };
  setAutor: (autor: string) => void;
  setErro: (erro: string) => void;
  setProcessando: (processando: boolean) => void;
  sinopse: string;
  tagsDaObra: string[];
  temCapituloImportado: boolean;
  titulo: string;
  validarFormulario: () => string;
};

export async function salvarObraPublicar(
  {
    arquivoCapituloTexto,
    arquivoCapituloTitulo,
    arquivoObra,
    arquivoObraArquivo,
    autor,
    avisosConteudo18Normalizados,
    capaArquivo,
    capaNome,
    classificacaoFinal,
    formatoFinal,
    generoFinal,
    jaSalvouRef,
    router,
    setAutor,
    setErro,
    setProcessando,
    sinopse,
    tagsDaObra,
    temCapituloImportado,
    titulo,
    validarFormulario,
  }: SalvarObraPublicarParams,
  event: FormEvent<HTMLFormElement>,
) {
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
