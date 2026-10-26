"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { idObraSupabaseValido } from "../../lib/utils";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { traduzirElementoAdicionarCapitulo } from "./lib/adicionar-capitulo-language-bridge";
import {
  criarHrefAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../lib/aceiteTermos";
import { criarId } from "./lib/adicionar-capitulo-id-utils";
import {
  aplicarAutorProfileAdicionarCapitulo,
} from "./lib/adicionar-capitulo-profile-utils";
import {
  criarHrefLeituraCapitulo,
  criarLoginHrefAdicionarCapitulo,
} from "./lib/adicionar-capitulo-route-utils";
import {
  calcularEstatisticasCapitulo,
  calcularProgressoLeitura,
} from "./lib/adicionar-capitulo-metrics-utils";
import {
  contarLetrasNumeros,
  criarTituloPorNomeArquivo,
} from "./lib/adicionar-capitulo-text-utils";
import { validarCapitulo } from "./lib/adicionar-capitulo-validation";
import {
  adicionarCapituloPageCss,
} from "./lib/adicionar-capitulo-page-css";
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
  formPanelStyle,
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
  importIconStyle,
  importIconBoxStyle,
  importTitleStyle,
  importSuccessStyle,
  importErrorStyle,
  importButtonStyle,
  hiddenFileInputStyle,
  buttonAreaStyle,
  primaryButtonStyle,
  disabledButtonStyle,
  secondaryButtonStyle,
  cancelButtonStyle,
  desktopCancelButtonStyle,
  previewPanelStyle,
  previewHeaderStyle,
  previewMiniTitleStyle,
  previewChapterCardStyle,
  previewChapterTitleStyle,
  previewChapterTextStyle,
  desktopPreviewChapterTextStyle,
  desktopPreviewChapterTitleStyle,
  previewTopRowStyle,
  desktopContainerStyle,
  desktopMainGridSoloStyle,
  desktopFormPanelStyle,
  desktopFormHeaderStyle,
  desktopFormTitleStyle,
  desktopImportBoxStyle,
  desktopImportButtonStyle,
  desktopTextareaStyle,
  desktopButtonAreaStyle,
  desktopPrimaryButtonStyle,
  desktopDisabledButtonStyle,
  desktopSecondaryButtonStyle,
  desktopPreviewPanelStyle,
  desktopPreviewChapterCardStyle,
} from "./lib/adicionar-capitulo-styles";
import {
  obterOrdemCapitulo,
  obterProximaOrdemCapitulo,
  ordenarCapitulosPorOrdem,
} from "./lib/adicionar-capitulo-chapter-order-utils";
import { normalizarObra } from "./lib/adicionar-capitulo-work-normalizer";
import {
  restaurarArquivoObraComBackup,
} from "./lib/adicionar-capitulo-file-backup-utils";
import {
  carregarBackupArquivosObras,
} from "./lib/adicionar-capitulo-file-backup-storage";
import { normalizarObraSupabase } from "./lib/adicionar-capitulo-supabase-work-normalizer";
import { mesclarObrasComSupabase } from "./lib/adicionar-capitulo-work-merge-utils";
import { atualizarObrasLocaisDoUsuario, filtrarObrasDoUsuario } from "./lib/adicionar-capitulo-ownership-utils";
import {
  carregarObrasLocais,
  salvarObrasAdicionarCapituloStorage,
} from "./lib/adicionar-capitulo-local-work-storage";
import { criarNotificacaoNovoCapitulo } from "./lib/adicionar-capitulo-notification-utils";
import { carregarNomeProfileAdicionarCapitulo } from "./actions/carregar-nome-profile-adicionar-capitulo";
import { sincronizarAutorObraProfileAdicionarCapitulo } from "./actions/sincronizar-autor-obra-profile-adicionar-capitulo";
import { registrarDiarioNovoCapitulo } from "./actions/registrar-diario-novo-capitulo";
import { registrarNotificacoesNovoCapituloSupabase } from "./actions/registrar-notificacoes-novo-capitulo-supabase";

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

type NotificacaoLocal = {
  id: string;
  tipo: "novo-capitulo";
  titulo: string;
  mensagem: string;
  obraId: string;
  obraTitulo: string;
  autor: string;
  capituloId: string;
  capituloTitulo: string;
  href: string;
  lida: boolean;
  criadaEm: string;
  obraPublicada: boolean;
  capa: string;
  classificacaoIndicativa: string;
};

const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;

function registrarNotificacaoNovoCapituloLocal(
  notificacao: NotificacaoLocal
) {
  return notificacao;
}


export default function AdicionarCapituloPage() {
  const router = useRouter();

  const [obraId, setObraId] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [capituloCriado, setCapituloCriado] = useState<CapituloLocal | null>(
    null
  );
  const [notificacaoCriada, setNotificacaoCriada] =
    useState<NotificacaoLocal | null>(null);
  const [arquivoImportadoNome, setArquivoImportadoNome] = useState("");
  const [arquivoImportadoErro, setArquivoImportadoErro] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { language } = useHistorietasLanguage();
  const criandoCapituloRef = useRef(false);
  const raizTraducaoRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    const params = new URLSearchParams(window.location.search);
    const obraIdParam = params.get("obraId") || "";
    const atualizarObraIdTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraId(obraIdParam);
      }
    }, 0);

    async function carregarDados() {
      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (erroUsuario || !user) {
          setUsuarioIdLogado("");
          setCarregando(false);
          router.replace(criarLoginHrefAdicionarCapitulo(obraIdParam));
          return;
        }

        const statusAceite = await verificarAceiteTermosPublicacao();

        if (cancelado) {
          return;
        }

        if (!statusAceite.aceito) {
          const redirectTo = obraIdParam
            ? `/adicionar-capitulo?obraId=${encodeURIComponent(obraIdParam)}`
            : "/adicionar-capitulo";
          router.replace(criarHrefAceiteTermos(redirectTo));
          return;
        }

        setUsuarioIdLogado(user.id);

        const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);

        let todasObrasLocais: ObraLocal[] = [];
        let obrasLocais: ObraLocal[] = [];

        try {
          todasObrasLocais = carregarObrasLocais(user.id);
          obrasLocais = aplicarAutorProfileAdicionarCapitulo(
            filtrarObrasDoUsuario(todasObrasLocais, user.id),
            user.id,
            nomeProfileAutor
          );
        } catch {
          todasObrasLocais = [];
          obrasLocais = [];
        }

        let obrasFinais = obrasLocais;

        try {
          const { data, error } = await supabase
            .from("obras")
            .select(
              "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em,capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em)"
            )
            .eq("user_id", user.id)
            .order("criada_em", { ascending: false })
            .limit(80);

          if (!error && Array.isArray(data)) {
            const obrasLocaisPorId = new Map(
              obrasLocais.map((obra) => [obra.id, obra])
            );

            const obrasSupabase = data.map((obra, index) =>
              normalizarObraSupabase(
                obra,
                index,
                obrasLocaisPorId.get(obra.id),
                nomeProfileAutor
              )
            );

            obrasFinais = aplicarAutorProfileAdicionarCapitulo(
              mesclarObrasComSupabase(obrasLocais, obrasSupabase),
              user.id,
              nomeProfileAutor
            );
            const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
              todasObrasLocais,
              obrasFinais,
              user.id
            );

            salvarObrasAdicionarCapituloStorage(obrasLocaisAtualizadas, user.id);
          }
        } catch {
          // Se o Supabase falhar, mantém somente as obras locais do usuário logado.
        }

        if (cancelado) {
          return;
        }

        setObras(obrasFinais);
        setCarregando(false);
      } catch {
        if (cancelado) {
          return;
        }

        setUsuarioIdLogado("");
        setObras([]);
        setCarregando(false);
        router.replace(criarLoginHrefAdicionarCapitulo(obraIdParam));
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
      window.clearTimeout(atualizarObraIdTimer);
    };
  }, [router]);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  useEffect(() => {
    const raiz = raizTraducaoRef.current;

    if (!raiz) {
      return;
    }

    let atualizacaoAgendada = false;

    const aplicarTraducao = () => {
      atualizacaoAgendada = false;

      if (raizTraducaoRef.current) {
        traduzirElementoAdicionarCapitulo(
          raizTraducaoRef.current,
          language
        );
      }
    };

    traduzirElementoAdicionarCapitulo(raiz, language);

    const observer = new MutationObserver(() => {
      if (atualizacaoAgendada) {
        return;
      }

      atualizacaoAgendada = true;
      queueMicrotask(aplicarTraducao);
    });

    observer.observe(raiz, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "placeholder", "alt"],
    });

    return () => {
      observer.disconnect();
    };
  }, [language, carregando, obraAtual]);

  const numeroNovoCapitulo = obraAtual
    ? obterProximaOrdemCapitulo(obraAtual.capitulos)
    : 1;

  const tituloPreview = titulo.trim() || `Capítulo ${numeroNovoCapitulo}`;

  const textoPreview = texto.trim();




  function salvarObras(novasObras: ObraLocal[]) {
    const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);
    const obrasNormalizadas = novasObras.map((obra, index) =>
      restaurarArquivoObraComBackup(
        normalizarObra(obra, index),
        backupArquivosObras
      )
    );

    if (!usuarioIdLogado) {
      setObras(obrasNormalizadas);
      return;
    }

    let todasObrasLocaisAtuais: ObraLocal[] = [];

    try {
      todasObrasLocaisAtuais = carregarObrasLocais(usuarioIdLogado);
    } catch {
      todasObrasLocaisAtuais = [];
    }

    const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
      todasObrasLocaisAtuais,
      obrasNormalizadas,
      usuarioIdLogado
    );

    salvarObrasAdicionarCapituloStorage(obrasLocaisAtualizadas, usuarioIdLogado);
    setObras(obrasNormalizadas);
  }

  function limparFeedback() {
    if (erro) {
      setErro("");
    }

    if (capituloCriado) {
      setCapituloCriado(null);
    }

    if (notificacaoCriada) {
      setNotificacaoCriada(null);
    }
  }

  async function importarArquivoTexto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    limparFeedback();
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
        numeroNovoCapitulo
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

  async function criarCapitulo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obraAtual || processando || criandoCapituloRef.current) {
      return;
    }

    const erroValidacao = validarCapitulo(
      titulo,
      texto,
      numeroNovoCapitulo
    );

    if (erroValidacao) {
      setErro(erroValidacao);
      setCapituloCriado(null);
      setNotificacaoCriada(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    criandoCapituloRef.current = true;
    setProcessando(true);
    setErro("");

    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !user) {
        router.replace(criarLoginHrefAdicionarCapitulo(obraAtual.id || obraId));
        return;
      }

      if (obraAtual.autorId && obraAtual.autorId !== user.id) {
        setErro("Você não tem permissão para adicionar capítulo nesta obra.");

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);
      const obraAtualComAutorProfile: ObraLocal = {
        ...obraAtual,
        autor: nomeProfileAutor || obraAtual.autor,
        autorId: obraAtual.autorId || user.id,
      };

      void sincronizarAutorObraProfileAdicionarCapitulo(
        obraAtualComAutorProfile.id,
        user.id,
        nomeProfileAutor
      );

      const criadoEm = new Date().toISOString();
      let ordemNovoCapitulo = obterProximaOrdemCapitulo(obraAtual.capitulos);
      const tituloFinal =
        titulo.trim() || `Capítulo ${ordemNovoCapitulo}`;
      const textoFinal = texto.trim();

      let novoCapitulo: CapituloLocal = {
        id: criarId(),
        titulo: tituloFinal,
        texto: textoFinal,
        curtiu: false,
        salvo: false,
        comentario: "",
        criadoEm,
        lido: false,
        lidoEm: "",
        publicado: true,
        ordem: ordemNovoCapitulo,
      };

      const obraEhSupabase = idObraSupabaseValido(obraAtual.id);

      if (obraEhSupabase) {
        const { data: obraAutorizada, error: erroObraAutorizada } = await supabase
          .from("obras")
          .select("id")
          .eq("id", obraAtual.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (erroObraAutorizada) {
          throw new Error(
            `Não consegui confirmar a autoria da obra: ${erroObraAutorizada.message}`
          );
        }

        if (!obraAutorizada) {
          setErro("Você não tem permissão para adicionar capítulo nesta obra.");

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        const {
          data: ultimoCapituloBanco,
          error: erroUltimoCapituloBanco,
        } = await supabase
          .from("capitulos")
          .select("ordem")
          .eq("obra_id", obraAtual.id)
          .order("ordem", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (erroUltimoCapituloBanco) {
          throw new Error(
            `Não consegui calcular a ordem do novo capítulo: ${erroUltimoCapituloBanco.message}`
          );
        }

        const ultimaOrdemBanco =
          typeof ultimoCapituloBanco?.ordem === "number" &&
          Number.isInteger(ultimoCapituloBanco.ordem) &&
          ultimoCapituloBanco.ordem >= 1
            ? ultimoCapituloBanco.ordem
            : 0;

        ordemNovoCapitulo = Math.max(
          ordemNovoCapitulo,
          ultimaOrdemBanco + 1
        );
        novoCapitulo = {
          ...novoCapitulo,
          titulo:
            titulo.trim() || `Capítulo ${ordemNovoCapitulo}`,
          ordem: ordemNovoCapitulo,
        };

        const { data, error } = await supabase
          .from("capitulos")
          .insert({
            obra_id: obraAtual.id,
            user_id: user.id,
            titulo: novoCapitulo.titulo,
            texto: textoFinal,
            ordem: ordemNovoCapitulo,
            publicado: true,
          })
          .select("id, criado_em, ordem")
          .single();

        if (error) {
          throw new Error(`Não consegui salvar capítulo no Supabase: ${error.message}`);
        }

        if (data?.id) {
          novoCapitulo = {
            ...novoCapitulo,
            id: data.id,
            criadoEm:
              typeof data.criado_em === "string" ? data.criado_em : criadoEm,
            ordem:
              typeof data.ordem === "number" &&
              Number.isInteger(data.ordem) &&
              data.ordem >= 1
                ? data.ordem
                : ordemNovoCapitulo,
          };
        }
      }

      const numeroCapituloCriado = obterOrdemCapitulo(
        novoCapitulo,
        ordemNovoCapitulo
      );
      const novaNotificacao = criarNotificacaoNovoCapitulo(
        obraAtualComAutorProfile,
        novoCapitulo,
        numeroCapituloCriado,
        novoCapitulo.criadoEm || criadoEm
      );

      const novasObras = obras.map((obra) => {
        if (obra.id !== obraAtual.id) {
          return obra;
        }

        const capitulosAtualizados = ordenarCapitulosPorOrdem([
          ...obra.capitulos,
          novoCapitulo,
        ]);

        return {
          ...obra,
          autor: nomeProfileAutor || obra.autor,
          autorId: obra.autorId || usuarioIdLogado || user.id,
          capitulos: capitulosAtualizados,
          progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
        };
      });

      salvarObras(novasObras);

      void registrarDiarioNovoCapitulo({
        userId: user.id,
        obra: obraAtualComAutorProfile,
        capitulo: novoCapitulo,
        numeroCapitulo: numeroCapituloCriado,
        criadoEm: novoCapitulo.criadoEm || criadoEm,
      });

      void registrarNotificacoesNovoCapituloSupabase({
        userId: user.id,
        obra: obraAtualComAutorProfile,
        capitulo: novoCapitulo,
        numeroCapitulo: numeroCapituloCriado,
        criadoEm: novoCapitulo.criadoEm || criadoEm,
      });

      setNotificacaoCriada(
        registrarNotificacaoNovoCapituloLocal(novaNotificacao)
      );

      setCapituloCriado(novoCapitulo);
      setTitulo("");
      setTexto("");
      setArquivoImportadoNome("");
      setArquivoImportadoErro("");
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar esse capítulo. Tente atualizar a página e criar novamente."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      criandoCapituloRef.current = false;
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <main ref={raizTraducaoRef} style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraAtual) {
    return (
      <main ref={raizTraducaoRef} style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

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

  const minhaObraHref = "/painel-autor";
  const capituloCriadoHref = capituloCriado
    ? criarHrefLeituraCapitulo(
        obraAtual,
        capituloCriado,
        obterOrdemCapitulo(
          capituloCriado,
          obraAtual.capitulos.findIndex(
            (capitulo) => capitulo.id === capituloCriado.id
          ) + 1
        )
      )
    : "";


  return (
    <main ref={raizTraducaoRef} style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

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
              ADICIONAR CAPÍTULO
            </span>
          </Link>

        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível criar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridSoloStyle : mainGridStyle}>
          <form onSubmit={criarCapitulo} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            <div
              style={
                isDesktop
                  ? { ...desktopFormHeaderStyle, gridColumn: "1 / -1" }
                  : formHeaderStyle
              }
            >
              <span style={formMiniTitleStyle}>Capítulo {String(numeroNovoCapitulo || 1).padStart(2, "0")}</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>
                {obraAtual.titulo}
              </h2>
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="adicionar-capitulo-titulo" style={labelStyle}>Título do capítulo</label>

              <input
                id="adicionar-capitulo-titulo"
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  limparFeedback();
                  setArquivoImportadoErro("");
                }}
                style={inputStyle}
                placeholder={`Ex: Capítulo ${numeroNovoCapitulo}`}
                type="text"
              />

              <span style={hintStyle}>
                Opcional. Se deixar vazio, o sistema usa Capítulo{" "}
                {numeroNovoCapitulo}.
              </span>
            </div>

            <div
              style={
                isDesktop
                  ? { ...fieldGroupStyle, gridColumn: "1 / -1" }
                  : fieldGroupStyle
              }
            >
              <label htmlFor="adicionar-capitulo-texto" style={labelStyle}>Texto do capítulo</label>

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
                id="adicionar-capitulo-texto"
                value={texto}
                onChange={(event) => {
                  setTexto(event.target.value);
                  limparFeedback();
                  setArquivoImportadoErro("");
                }}
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
                placeholder="Escreva o texto do capítulo aqui..."
              />
            </div>
            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={{
                  ...(processando
                    ? isDesktop
                      ? desktopDisabledButtonStyle
                      : disabledButtonStyle
                    : isDesktop
                      ? desktopPrimaryButtonStyle
                      : primaryButtonStyle),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                disabled={processando}
              >
                {processando ? (
                  "Salvando..."
                ) : capituloCriado ? (
                  <>
                    <span>Criado</span>
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
                  "Criar capítulo"
                )}
              </button>

              <Link href={capituloCriadoHref || minhaObraHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                {capituloCriado ? "Ler capítulo" : "Ver obra"}
              </Link>

              <Link href={minhaObraHref} style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>
            </div>

          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DO CAPÍTULO</span>
            </div>

            <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
              <div style={previewTopRowStyle}>
                <h3 style={isDesktop ? desktopPreviewChapterTitleStyle : previewChapterTitleStyle}>
                  {tituloPreview}
                </h3>
              </div>

              <p style={isDesktop ? desktopPreviewChapterTextStyle : previewChapterTextStyle}>
                {textoPreview}
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
