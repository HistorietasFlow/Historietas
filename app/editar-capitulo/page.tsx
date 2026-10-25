"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { idObraSupabaseValido } from "../../lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { ChangeEvent, FormEvent } from "react";
import { carregarTodasPaginasSupabase } from "../../lib/supabase/paginacao.mjs";
import { EditarCapituloLanguageBridge } from "./components/EditarCapituloLanguageBridge";
import { useEditarCapituloDesktopMode } from "./hooks/useEditarCapituloDesktopMode";
import {
  contarLetrasNumeros,
  criarTituloPorNomeArquivo,
} from "./lib/editar-capitulo-text-utils";
import { validarCapitulo } from "./lib/editar-capitulo-validation";
import {
  mobileTopWaterFadeStyle,
  desktopTopWaterFadeStyle,
  pageStyle,
  containerStyle,
  titleHeaderStyle,
  desktopTitleHeaderStyle,
  headerTitleLinkStyle,
  desktopHeaderTitleLinkStyle,
  headerTitleTextStyle,
  desktopHeaderTitleTextStyle,
  errorBoxStyle,
  errorTitleStyle,
  errorTextStyle,
  mainGridStyle,
  formStyle,
  formHeaderStyle,
  formMiniTitleStyle,
  formTitleStyle,
  fieldGroupStyle,
  labelStyle,
  inputStyle,
  textareaStyle,
  hintStyle,
  importBoxStyle,
  importInfoStyle,
  importTitleStyle,
  importIconBoxStyle,
  importIconStyle,
  importSuccessStyle,
  importErrorStyle,
  importButtonStyle,
  hiddenFileInputStyle,
  buttonAreaStyle,
  saveButtonStyle,
  disabledButtonStyle,
  secondaryButtonStyle,
  cancelButtonStyle,
  deleteButtonStyle,
  disabledDeleteButtonStyle,
  previewPanelStyle,
  previewHeaderStyle,
  previewMiniTitleStyle,
  previewChapterCardStyle,
  previewChapterTitleStyle,
  previewChapterTextStyle,
  previewTopRowStyle,
  desktopContainerStyle,
  desktopMainGridStyle,
  desktopFormStyle,
  desktopFormHeaderStyle,
  desktopFormTitleStyle,
  desktopImportBoxStyle,
  desktopImportButtonStyle,
  desktopTextareaStyle,
  desktopButtonAreaStyle,
  desktopSaveButtonStyle,
  desktopDisabledButtonStyle,
  desktopSecondaryButtonStyle,
  desktopCancelButtonStyle,
  desktopDeleteButtonStyle,
  desktopDisabledDeleteButtonStyle,
  desktopPreviewPanelStyle,
  desktopPreviewChapterCardStyle,
  desktopPreviewChapterTitleStyle,
  desktopPreviewChapterTextStyle,
} from "./lib/editar-capitulo-styles";
import {
  calcularEstatisticasCapitulo,
  calcularProgressoLeitura,
} from "./lib/editar-capitulo-metrics-utils";
import {
  criarHrefLeituraCapitulo,
  criarLoginHrefEditarCapitulo,
} from "./lib/editar-capitulo-route-utils";
import { registrarDiarioEdicaoCapitulo } from "./actions/registrar-diario-edicao-capitulo";
import { atualizarNotificacaoCapituloSupabase } from "./actions/atualizar-notificacao-capitulo";
import { carregarNomeProfileEditarCapitulo } from "./actions/carregar-nome-profile-editar-capitulo";
import { normalizarObra } from "./lib/editar-capitulo-work-normalizer";
import {
  carregarBackupArquivosObras,
  restaurarArquivoObraComBackup,
} from "./lib/editar-capitulo-file-backup-utils";
import {
  carregarObrasLocaisNormalizadas,
  salvarObrasEditarCapituloStorage,
} from "./lib/editar-capitulo-local-work-storage";
import { mapearObraSupabase } from "./lib/editar-capitulo-supabase-mappers";
import { aplicarNomeAutorProfileEditarCapitulo } from "./lib/editar-capitulo-profile-utils";
import { criarMensagemConfirmacaoExclusaoCapitulo } from "./lib/editar-capitulo-delete-message";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido?: boolean;
  lidoEm?: string;
  publicado?: boolean;
  ordem?: number;
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
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId?: string;
  ultimaLeituraEm?: string;
  progressoLeitura?: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalFavoritos?: number;
  totalConcluidas?: number;
  slug: string;
  link: string;
};

type CapituloSupabaseRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};


const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;


export default function EditarCapituloPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [tipoErro, setTipoErro] = useState<"salvar" | "excluir">("salvar");

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [arquivoImportadoNome, setArquivoImportadoNome] = useState("");
  const [arquivoImportadoErro, setArquivoImportadoErro] = useState("");
  const isDesktop = useEditarCapituloDesktopMode();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    let cancelado = false;
    const params = new URLSearchParams(window.location.search);
    const obraIdParam = params.get("obraId") || "";
    const capituloIdParam = params.get("capituloId") || "";
    const atualizarParametrosTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraId(obraIdParam);
        setCapituloId(capituloIdParam);
      }
    }, 0);

    async function carregarCapitulo() {
      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();
        const userId = dadosUsuario.user?.id || "";

        if (erroUsuario || !userId) {
          if (!cancelado) {
            setVerificandoAcesso(false);
            setCarregando(false);
          }

          router.replace(
            criarLoginHrefEditarCapitulo(obraIdParam, capituloIdParam)
          );
          return;
        }

        if (!cancelado) {
          setVerificandoAcesso(false);
        }

        const nomeProfileAutor = await carregarNomeProfileEditarCapitulo(userId);
        const obrasLocais = aplicarNomeAutorProfileEditarCapitulo(
          carregarObrasLocaisNormalizadas(userId).filter((obra) => {
            const autorId = obra.autorId?.trim() || "";

            return !autorId || autorId === userId;
          }),
          userId,
          nomeProfileAutor
        );
        let obrasAtualizadas: ObraLocal[] = obrasLocais;
        const obraLocal = obrasLocais.find((obra) => obra.id === obraIdParam);
        const capituloLocal =
          obraLocal?.capitulos.find(
            (capitulo) => capitulo.id === capituloIdParam
          ) || null;

        if (capituloLocal && !cancelado) {
          setTitulo(capituloLocal.titulo);
          setTexto(capituloLocal.texto);
        }

        if (obraIdParam) {
          const { data: obraSupabase, error: erroObraSupabase } =
            await supabase
              .from("obras")
              .select(
                "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
              )
              .eq("id", obraIdParam)
              .eq("user_id", userId)
              .limit(1)
              .maybeSingle();

          if (erroObraSupabase) {
            console.warn("Não consegui buscar a obra no Supabase:", erroObraSupabase.message);
          }

          if (obraSupabase) {
            let capitulosSupabase: CapituloSupabaseRow[];

            try {
              capitulosSupabase =
                await carregarTodasPaginasSupabase<CapituloSupabaseRow>({
                  nomeColecao: "capítulos da edição de capítulo",
                  buscarPagina: async (inicio, fim) =>
                    supabase
                      .from("capitulos")
                      .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
                      .eq("obra_id", obraIdParam)
                      .eq("user_id", userId)
                      .order("ordem", { ascending: true })
                      .order("id", { ascending: true })
                      .range(inicio, fim),
                });
            } catch (error) {
              console.warn(
                "Não consegui buscar capítulos no Supabase:",
                error,
              );

              if (!cancelado) {
                setObras(obrasLocais);
              }

              return;
            }

            const obraNormalizadaSupabase = mapearObraSupabase(
              obraSupabase,
              capitulosSupabase,
              obraLocal,
              nomeProfileAutor
            );

            obrasAtualizadas = aplicarNomeAutorProfileEditarCapitulo(
              [
                obraNormalizadaSupabase,
                ...obrasLocais.filter((obra) => obra.id !== obraIdParam),
              ],
              userId,
              nomeProfileAutor
            );

            if (
              nomeProfileAutor &&
              obraNormalizadaSupabase.autor !== nomeProfileAutor
            ) {
              void supabase
                .from("obras")
                .update({
                  autor: nomeProfileAutor,
                  atualizado_em: new Date().toISOString(),
                })
                .eq("id", obraIdParam)
                .eq("user_id", userId);
            }

            obrasAtualizadas = salvarObrasEditarCapituloStorage(
              obrasAtualizadas,
              userId
            );

            const capituloSupabase =
              obraNormalizadaSupabase.capitulos.find(
                (capitulo) => capitulo.id === capituloIdParam
              ) || null;

            if (capituloSupabase && !cancelado) {
              setTitulo(capituloSupabase.titulo);
              setTexto(capituloSupabase.texto);
            }
          }
        }

        if (!cancelado) {
          setObras(obrasAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
          setVerificandoAcesso(false);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarCapitulo();

    return () => {
      cancelado = true;
      window.clearTimeout(atualizarParametrosTimer);
    };
  }, [router]);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capituloAtual = useMemo(() => {
    if (!obraAtual) {
      return null;
    }

    return (
      obraAtual.capitulos.find((capitulo) => capitulo.id === capituloId) || null
    );
  }, [obraAtual, capituloId]);

  const numeroCapitulo = useMemo(() => {
    if (!obraAtual || !capituloAtual) {
      return 0;
    }

    if (
      typeof capituloAtual.ordem === "number" &&
      Number.isInteger(capituloAtual.ordem) &&
      capituloAtual.ordem > 0
    ) {
      return capituloAtual.ordem;
    }

    return (
      obraAtual.capitulos.findIndex(
        (capitulo) => capitulo.id === capituloAtual.id
      ) + 1
    );
  }, [obraAtual, capituloAtual]);

  const capituloLabel = `Capítulo ${String(numeroCapitulo || 1).padStart(2, "0")}`;

  const minhaObraHref = obraAtual
    ? `/editar-obra?obraId=${obraAtual.id}`
    : "/painel-autor";

  const lerCapituloHref =
    obraAtual && capituloAtual
      ? criarHrefLeituraCapitulo(
          obraAtual,
          capituloAtual.id,
          numeroCapitulo || 1
        )
      : "/painel-autor";


  const tituloPreview =
    titulo.trim() || `Capítulo ${numeroCapitulo || ""}`.trim();

  const textoPreview =
    texto.trim() || "O texto do capítulo vai aparecer aqui enquanto você edita.";

  function marcarAlteracao() {
    if (salvou) {
      setSalvou(false);
    }

    if (erro) {
      setErro("");
    }

    if (arquivoImportadoErro) {
      setArquivoImportadoErro("");
    }
  }

  async function importarArquivoTexto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    marcarAlteracao();
    setArquivoImportadoNome("");
    setArquivoImportadoErro("");

    const nomeMinusculo = arquivo.name.toLowerCase();
    const extensaoValida =
      nomeMinusculo.endsWith(".txt") || nomeMinusculo.endsWith(".md");

    if (!extensaoValida) {
      setArquivoImportadoErro(
        "Envie um arquivo .txt ou .md para importar o texto do capítulo."
      );
      return;
    }

    if (arquivo.size > MAX_TEXT_FILE_SIZE_BYTES) {
      setArquivoImportadoErro(
        "Esse arquivo é grande demais. Use um arquivo de até 700 KB."
      );
      return;
    }

    try {
      const conteudoArquivo = await arquivo.text();
      const textoImportado = conteudoArquivo.replace(/\r\n/g, "\n").trim();

      if (contarLetrasNumeros(textoImportado) < 20) {
        setArquivoImportadoErro(
          "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo."
        );
        return;
      }

      const tituloArquivo = criarTituloPorNomeArquivo(arquivo.name);
      const estatisticasImportadas = calcularEstatisticasCapitulo(
        tituloArquivo || titulo,
        textoImportado,
        numeroCapitulo || 1
      );

      setTexto(textoImportado);

      if (!titulo.trim() && tituloArquivo) {
        setTitulo(tituloArquivo);
      }

      setArquivoImportadoNome(
        `${arquivo.name} • ${estatisticasImportadas.palavras} palavras • ${estatisticasImportadas.minutosLeitura} min`
      );
    } catch {
      setArquivoImportadoErro(
        "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente."
      );
    }
  }

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (processando || excluindo || !obraAtual || !capituloAtual) {
      return;
    }

    const erroValidacao = validarCapitulo(
      titulo,
      texto,
      numeroCapitulo,
    );

    if (erroValidacao) {
      setErro(erroValidacao);
      setSalvou(false);
      return;
    }

    setProcessando(true);
    setErro("");
    setTipoErro("salvar");
    setSalvou(false);

    const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo || 1}`;
    const textoFinal = texto.trim();

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || "";

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefEditarCapitulo(obraId, capituloId));
        throw new Error("Entre na sua conta antes de editar o capítulo.");
      }

      const autorIdObra = obraAtual.autorId?.trim() || "";

      if (autorIdObra && autorIdObra !== userId) {
        throw new Error("Você não tem permissão para editar este capítulo.");
      }

      const nomeProfileAutor = await carregarNomeProfileEditarCapitulo(userId);
      const autorFinalObra = nomeProfileAutor || obraAtual.autor;
      const atualizadoEm = new Date().toISOString();
      const registroSupabase =
        idObraSupabaseValido(obraId) && idObraSupabaseValido(capituloId);
      let numeroCapituloFinal = numeroCapitulo || 1;

      if (registroSupabase) {
        const { data: obraAutorizada, error: erroObraAutorizada } =
          await supabase
            .from("obras")
            .select("id")
            .eq("id", obraId)
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        if (erroObraAutorizada) {
          throw new Error(
            `Não consegui confirmar sua permissão para editar o capítulo: ${erroObraAutorizada.message}`
          );
        }

        if (!obraAutorizada?.id) {
          throw new Error("Você não tem permissão para editar este capítulo.");
        }

        const { data: capituloAtualizado, error: erroAtualizarCapitulo } =
          await supabase
            .from("capitulos")
            .update({
              titulo: tituloFinal,
              texto: textoFinal,
              atualizado_em: atualizadoEm,
            })
            .eq("id", capituloId)
            .eq("obra_id", obraId)
            .eq("user_id", userId)
            .select("id, ordem")
            .maybeSingle();

        if (erroAtualizarCapitulo) {
          throw new Error(
            `Não consegui atualizar o capítulo no Supabase: ${erroAtualizarCapitulo.message}`
          );
        }

        if (!capituloAtualizado?.id) {
          throw new Error(
            "Não consegui confirmar a atualização do capítulo no Supabase."
          );
        }

        if (
          typeof capituloAtualizado.ordem === "number" &&
          Number.isInteger(capituloAtualizado.ordem) &&
          capituloAtualizado.ordem > 0
        ) {
          numeroCapituloFinal = capituloAtualizado.ordem;
        }

        if (nomeProfileAutor) {
          const { error: erroAutorObra } = await supabase
            .from("obras")
            .update({
              autor: nomeProfileAutor,
              atualizado_em: atualizadoEm,
            })
            .eq("id", obraId)
            .eq("user_id", userId);

          if (erroAutorObra) {
            console.warn(
              "O capítulo foi salvo, mas o autor da obra não sincronizou no Supabase:",
              erroAutorObra.message
            );
          }
        }
      }

      let obraAtualizadaParaAcoes: ObraLocal | null = null;
      const novasObras = obras.map((obra, obraIndex) => {
        const obraNormalizada = normalizarObra(obra, obraIndex);

        if (obraNormalizada.id !== obraId) {
          return obraNormalizada;
        }

        const capitulosAtualizados = obraNormalizada.capitulos.map((capitulo) => {
          if (capitulo.id !== capituloId) {
            return capitulo;
          }

          return {
            ...capitulo,
            titulo: tituloFinal,
            texto: textoFinal,
            ordem: numeroCapituloFinal,
          };
        });

        const obraAtualizada: ObraLocal = {
          ...obraNormalizada,
          autor: autorFinalObra,
          autorId: obraNormalizada.autorId || userId,
          capitulos: capitulosAtualizados,
          progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
        };

        obraAtualizadaParaAcoes = obraAtualizada;
        return obraAtualizada;
      });

      const backupArquivos = carregarBackupArquivosObras(userId);
      const novasObrasComBackup = novasObras.map((obra, index) =>
        restaurarArquivoObraComBackup(
          normalizarObra(obra, index),
          backupArquivos
        )
      );
      const novasObrasDoUsuario = salvarObrasEditarCapituloStorage(
        novasObrasComBackup,
        userId
      );
      const obraAtualizadaFinal =
        novasObrasDoUsuario.find((obra) => obra.id === obraId) ||
        obraAtualizadaParaAcoes || {
          ...obraAtual,
          autor: autorFinalObra,
        };

      setObras(novasObrasDoUsuario);

      if (registroSupabase) {
        await registrarDiarioEdicaoCapitulo({
          userId,
          obra: obraAtualizadaFinal,
          capituloId,
          tituloCapitulo: tituloFinal,
          numeroCapitulo: numeroCapituloFinal,
          atualizadoEm,
        });

        await atualizarNotificacaoCapituloSupabase({
          userId,
          obra: obraAtualizadaFinal,
          capituloId,
          tituloCapitulo: tituloFinal,
          numeroCapitulo: numeroCapituloFinal,
          atualizadoEm,
        });
      }

      setSalvou(true);
    } catch (erroDesconhecido) {
      const mensagem =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar as alterações. Atualize a página e tente novamente.";

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

  async function excluirCapitulo() {
    if (processando || excluindo || !obraAtual || !capituloAtual) {
      return;
    }

    const confirmou = window.confirm(
      criarMensagemConfirmacaoExclusaoCapitulo(
        capituloAtual.titulo,
        language
      )
    );

    if (!confirmou) {
      return;
    }

    setExcluindo(true);
    setErro("");
    setTipoErro("excluir");
    setSalvou(false);

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || "";

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefEditarCapitulo(obraId, capituloId));
        throw new Error("Entre na sua conta antes de excluir o capítulo.");
      }

      const autorIdObra = obraAtual.autorId?.trim() || "";

      if (autorIdObra && autorIdObra !== userId) {
        throw new Error("Você não tem permissão para excluir este capítulo.");
      }

      const registroSupabase =
        idObraSupabaseValido(obraId) && idObraSupabaseValido(capituloId);

      if (registroSupabase) {
        const { data: obraAutorizada, error: erroObraAutorizada } =
          await supabase
            .from("obras")
            .select("id")
            .eq("id", obraId)
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        if (erroObraAutorizada) {
          throw new Error(
            `Não consegui confirmar sua permissão para excluir o capítulo: ${erroObraAutorizada.message}`
          );
        }

        if (!obraAutorizada?.id) {
          throw new Error("Você não tem permissão para excluir este capítulo.");
        }

        const { data: capituloExcluido, error: erroExcluirCapitulo } =
          await supabase
            .from("capitulos")
            .delete()
            .eq("id", capituloId)
            .eq("obra_id", obraId)
            .eq("user_id", userId)
            .select("id")
            .maybeSingle();

        if (erroExcluirCapitulo) {
          throw new Error(
            `Não consegui excluir o capítulo no Supabase: ${erroExcluirCapitulo.message}`
          );
        }

        if (!capituloExcluido?.id) {
          throw new Error(
            "Não consegui confirmar a exclusão do capítulo no Supabase."
          );
        }
      }

      const novasObras = obras.map((obra, obraIndex) => {
        const obraNormalizada = normalizarObra(obra, obraIndex);

        if (obraNormalizada.id !== obraId) {
          return obraNormalizada;
        }

        const capituloRemovido =
          obraNormalizada.capitulos.find(
            (capitulo) => capitulo.id === capituloId
          ) || null;
        const capitulosRestantes = obraNormalizada.capitulos.filter(
          (capitulo) => capitulo.id !== capituloId
        );

        return {
          ...obraNormalizada,
          capitulos: capitulosRestantes,
          ultimoCapituloLidoId:
            obraNormalizada.ultimoCapituloLidoId === capituloId
              ? ""
              : obraNormalizada.ultimoCapituloLidoId,
          progressoLeitura: calcularProgressoLeitura(capitulosRestantes),
          totalCurtidas: Math.max(
            0,
            (obraNormalizada.totalCurtidas || 0) -
              (capituloRemovido?.curtiu ? 1 : 0)
          ),
          totalComentarios: Math.max(
            0,
            (obraNormalizada.totalComentarios || 0) -
              (capituloRemovido?.comentario.trim() ? 1 : 0)
          ),
          totalSalvos: Math.max(
            0,
            (obraNormalizada.totalSalvos || 0) -
              (capituloRemovido?.salvo ? 1 : 0)
          ),
          totalLidos: Math.max(
            0,
            (obraNormalizada.totalLidos || 0) -
              (capituloRemovido?.lido ? 1 : 0)
          ),
        };
      });

      const novasObrasDoUsuario = salvarObrasEditarCapituloStorage(
        novasObras,
        userId
      );

      setObras(novasObrasDoUsuario);
      router.replace("/painel-autor");
      router.refresh();
    } catch (erroDesconhecido) {
      const mensagem =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui excluir o capítulo. Atualize a página e tente novamente.";

      setErro(mensagem);
      setTipoErro("excluir");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando || verificandoAcesso) {
    return (
      <main data-historietas-editar-capitulo-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarCapituloPageCss}`}</style>
        <EditarCapituloLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main data-historietas-editar-capitulo-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarCapituloPageCss}`}</style>
        <EditarCapituloLanguageBridge />

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
            Capítulo não encontrado
          </p>
        </section>
      </main>
    );
  }

  return (
    <main data-historietas-editar-capitulo-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${editarCapituloPageCss}`}</style>
      <EditarCapituloLanguageBridge />

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
              EDITAR CAPÍTULO
            </span>
          </Link>

        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>
              {tipoErro === "excluir"
                ? "Não foi possível excluir"
                : "Não foi possível salvar"}
            </h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <div
              style={
                isDesktop
                  ? { ...desktopFormHeaderStyle, gridColumn: "1 / -1" }
                  : formHeaderStyle
              }
            >
              <span style={formMiniTitleStyle}>{capituloLabel}</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>
                <span data-historietas-i18n-ignore="true">
                  {obraAtual.titulo}
                </span>
              </h2>
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="editar-capitulo-titulo" style={labelStyle}>Título do capítulo</label>

              <input
                id="editar-capitulo-titulo"
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  marcarAlteracao();
                }}
                placeholder={`Ex: Capítulo ${numeroCapitulo}`}
                style={inputStyle}
                type="text"
              />

              <span style={hintStyle}>
                Se deixar vazio, o sistema usa Capítulo {numeroCapitulo}.
              </span>
            </div>

            <div
              style={
                isDesktop
                  ? { ...fieldGroupStyle, gridColumn: "1 / -1" }
                  : fieldGroupStyle
              }
            >
              <label htmlFor="editar-capitulo-texto" style={labelStyle}>Texto do capítulo</label>

              <div style={isDesktop ? desktopImportBoxStyle : importBoxStyle}>
                <div style={importIconBoxStyle}>
                  <span style={importIconStyle}>TXT</span>
                </div>

                <div style={importInfoStyle}>
                  <strong style={importTitleStyle}>Importar versão revisada</strong>

                  <span style={hintStyle}>
                    Opcional. Importe um arquivo .txt ou .md.
                  </span>

                  {arquivoImportadoNome && (
                    <span style={importSuccessStyle}>
                      Arquivo importado: {arquivoImportadoNome}
                    </span>
                  )}

                  {arquivoImportadoErro && (
                    <span style={importErrorStyle}>{arquivoImportadoErro}</span>
                  )}

                  <label style={isDesktop ? desktopImportButtonStyle : importButtonStyle}>
                    Importar .txt/.md
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={importarArquivoTexto}
                      style={hiddenFileInputStyle}
                    />
                  </label>
                </div>
              </div>

              <textarea
                id="editar-capitulo-texto"
                value={texto}
                onChange={(event) => {
                  setTexto(event.target.value);
                  marcarAlteracao();
                }}
                placeholder="Escreva o texto do capítulo"
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
              />

              <span style={hintStyle}>Mínimo: 20 letras ou números.</span>
            </div>

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={{
                  ...((processando || excluindo)
                    ? isDesktop
                      ? desktopDisabledButtonStyle
                      : disabledButtonStyle
                    : isDesktop
                      ? desktopSaveButtonStyle
                      : saveButtonStyle),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                disabled={processando || excluindo}
              >
                {processando ? (
                  "Salvando..."
                ) : salvou ? (
                  <>
                    <span>Atualizado</span>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ width: 17, height: 17, flex: "0 0 auto" }}
                    >
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </button>

              <Link href={lerCapituloHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                Ler capítulo
              </Link>

              <Link href={minhaObraHref} style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>

              <button
                type="button"
                onClick={() => {
                  void excluirCapitulo();
                }}
                style={
                  excluindo || processando
                    ? isDesktop
                      ? desktopDisabledDeleteButtonStyle
                      : disabledDeleteButtonStyle
                    : isDesktop
                      ? desktopDeleteButtonStyle
                      : deleteButtonStyle
                }
                disabled={excluindo || processando}
              >
                {excluindo ? "Excluindo..." : "Excluir capítulo"}
              </button>
            </div>
          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DO CAPÍTULO</span>
            </div>

            <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
              <div style={previewTopRowStyle}>
                <h3 style={isDesktop ? desktopPreviewChapterTitleStyle : previewChapterTitleStyle}>
                  {titulo.trim() ? (
                    <span data-historietas-i18n-ignore="true">{tituloPreview}</span>
                  ) : (
                    tituloPreview
                  )}
                </h3>
              </div>

              <p style={isDesktop ? desktopPreviewChapterTextStyle : previewChapterTextStyle}>
                {texto.trim() ? (
                  <span data-historietas-i18n-ignore="true">{textoPreview}</span>
                ) : (
                  textoPreview
                )}
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}

const editarCapituloPageCss = `
  html {
    --historietas-editar-capitulo-bg-page: #000000;
    --historietas-editar-capitulo-bg-deep: #000000;
    --historietas-editar-capitulo-surface: #050505;
    --historietas-editar-capitulo-accent: #FFFFFF;
    --historietas-editar-capitulo-danger: #FFFFFF;
    --historietas-editar-capitulo-danger-text: #FFFFFF;
    --historietas-editar-capitulo-danger-text-soft: #FECACA;
    --historietas-editar-capitulo-success: #86EFAC;
    --historietas-editar-capitulo-panel: rgba(4, 0, 10, 0.72);
    --historietas-editar-capitulo-danger-surface: rgba(127,29,29,0.18);
    --historietas-editar-capitulo-danger-border: rgba(239,68,68,0.26);
    --historietas-editar-capitulo-danger-bg: rgba(239,68,68,0.13);
    --historietas-editar-capitulo-danger-border-strong: rgba(239,68,68,0.28);
    --historietas-editar-capitulo-success-bg: rgba(34,197,94,0.12);
    --historietas-editar-capitulo-success-border: rgba(34,197,94,0.28);
  }

  html {
    --historietas-editar-capitulo-bg-page: #000000;
    --historietas-editar-capitulo-bg-deep: #000000;
    --historietas-editar-capitulo-surface: #050505;
    --historietas-editar-capitulo-accent: #FFFFFF;
    --historietas-editar-capitulo-danger: #A1A1AA;
    --historietas-editar-capitulo-danger-text: #FFFFFF;
    --historietas-editar-capitulo-danger-text-soft: #D4D4D8;
    --historietas-editar-capitulo-success: #FFFFFF;
    --historietas-editar-capitulo-panel: rgba(5,5,5,0.92);
    --historietas-editar-capitulo-danger-surface: rgba(255,255,255,0.08);
    --historietas-editar-capitulo-danger-border: rgba(255,255,255,0.18);
    --historietas-editar-capitulo-danger-bg: rgba(255,255,255,0.06);
    --historietas-editar-capitulo-danger-border-strong: rgba(255,255,255,0.22);
    --historietas-editar-capitulo-success-bg: rgba(255,255,255,0.06);
    --historietas-editar-capitulo-success-border: rgba(255,255,255,0.18);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #000000 !important;
  }

  html body,
  html main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] {
    background: var(
      --historietas-bottom-nav-active-bg,
      rgba(59, 7, 100, 0.54)
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-border,
      rgba(109, 40, 217, 0.48)
    ) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(
      --historietas-bottom-nav-active-icon-bg,
      #3B0764
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-icon-border,
      rgba(167, 139, 250, 0.46)
    ) !important;
  }

  html nav a[href="/painel-autor"],
  html [data-bottom-nav] a[href="/painel-autor"],
  html [data-mobile-nav] a[href="/painel-autor"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }
`;
