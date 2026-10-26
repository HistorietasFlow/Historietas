"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
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

const adicionarCapituloPageCss = `
  html {
    --historietas-adicionar-capitulo-bg-page: #000000;
    --historietas-adicionar-capitulo-bg-deep: #000000;
    --historietas-adicionar-capitulo-surface: #050505;
    --historietas-adicionar-capitulo-bg-end: #000000;
    --historietas-adicionar-capitulo-accent: #FFFFFF;
    --historietas-adicionar-capitulo-secondary: #A1A1AA;
    --historietas-adicionar-capitulo-accent-soft: #FFFFFF;
    --historietas-adicionar-capitulo-purple-text: #FFFFFF;
    --historietas-adicionar-capitulo-purple-soft: #D4D4D8;
    --historietas-adicionar-capitulo-danger: #FFFFFF;
    --historietas-adicionar-capitulo-danger-text: #FFFFFF;
    --historietas-adicionar-capitulo-danger-text-soft: #FFFFFF;
    --historietas-adicionar-capitulo-success: #FFFFFF;
    --historietas-adicionar-capitulo-purple-border: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-danger-surface: rgba(255,255,255,0.08);
    --historietas-adicionar-capitulo-danger-border: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-danger-bg: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-danger-border-strong: rgba(255,255,255,0.22);
    --historietas-adicionar-capitulo-success-bg: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-success-border: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-success-bg-soft: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-success-border-soft: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-accent-bg: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-accent-border: rgba(255,255,255,0.18);
  }
body,
  main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  input,
  textarea {
    color: #FFFFFF !important;
  }

  nav,
  [data-bottom-nav],
  [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  nav a[href="/painel-autor"],
  [data-bottom-nav] a[href="/painel-autor"],
  [data-mobile-nav] a[href="/painel-autor"] {
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

  nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
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

  nav a[href="/painel-autor"],
  [data-bottom-nav] a[href="/painel-autor"],
  [data-mobile-nav] a[href="/painel-autor"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }
`;


const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
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
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-adicionar-capitulo-bg-page, #000000)",
  color: "#FFFFFF",
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

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "18px",
  minWidth: 0,
  padding: 0,
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  justifyContent: "center",
  minHeight: "48px",
  marginTop: "6px",
  marginBottom: "24px",
  paddingRight: 0,
  textAlign: "center",
};



const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
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
  margin: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  textAlign: "center",
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
  marginTop: "18px",
  padding: "18px",
  borderRadius: "24px",
  background: "var(--historietas-adicionar-capitulo-danger-surface, rgba(127,29,29,0.18))",
  border: "1px solid var(--historietas-adicionar-capitulo-danger-border, rgba(239,68,68,0.26))",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, var(--historietas-adicionar-capitulo-danger-text, #FFFFFF))",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, var(--historietas-adicionar-capitulo-danger-text-soft, #FFFFFF))",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 750,
  ...safeTextStyle,
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
};

const formPanelStyle: CSSProperties = {
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

const formHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
  justifyItems: "center",
};

const formMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  textAlign: "center",
  ...safeTextStyle,
};

const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-adicionar-capitulo-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "78px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-adicionar-capitulo-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.58,
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  ...safeTextStyle,
};

const hintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

const importBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(56px, 64px) minmax(0, 1fr)",
  gap: "12px",
  alignItems: "stretch",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

const importInfoStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const importIconStyle: CSSProperties = {
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  boxShadow: "none",
};

const importIconBoxStyle: CSSProperties = {
  minHeight: "82px",
  borderRadius: "18px",
  background: "var(--historietas-adicionar-capitulo-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const importTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const importSuccessStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-adicionar-capitulo-success-bg, rgba(34,197,94,0.12))",
  border: "1px solid var(--historietas-adicionar-capitulo-success-border, rgba(34,197,94,0.28))",
  color: "var(--historietas-adicionar-capitulo-success, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importErrorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-danger-surface, var(--historietas-adicionar-capitulo-danger-bg, rgba(239,68,68,0.13)))",
  border: "1px solid var(--historietas-adicionar-capitulo-danger-border-strong, rgba(239,68,68,0.28))",
  color: "var(--historietas-danger-button-text, var(--historietas-adicionar-capitulo-danger-text, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-adicionar-capitulo-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "none",
  minWidth: 0,
  boxSizing: "border-box",
  ...safeTextStyle,
};

const hiddenFileInputStyle: CSSProperties = {
  display: "none",
};

const buttonAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-adicionar-capitulo-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  boxShadow: "none",
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-adicionar-capitulo-surface, #050505)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const cancelButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
};

const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: 0,
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const previewHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
};

const previewMiniTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "19px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const previewChapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const previewChapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "19px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

const previewChapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "left",
  ...safeTextStyle,
};

const desktopPreviewChapterTextStyle: CSSProperties = {
  ...previewChapterTextStyle,
  minHeight: "132px",
  fontSize: "14px",
  lineHeight: 1.65,
};

const desktopPreviewChapterTitleStyle: CSSProperties = {
  ...previewChapterTitleStyle,
  fontSize: "24px",
  lineHeight: 1.12,
};

const previewTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "6px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
};


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "30px 0 72px",
};

const desktopMainGridSoloStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 760px)",
  justifyContent: "center",
  alignItems: "start",
  gap: "28px",
  width: "100%",
};


const desktopFormPanelStyle: CSSProperties = {
  ...formPanelStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  width: "100%",
  maxWidth: "760px",
  padding: 0,
  borderRadius: 0,
  gap: "16px",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  overflow: "visible",
};

const desktopFormHeaderStyle: CSSProperties = {
  ...formHeaderStyle,
  gap: "5px",
  justifyItems: "center",
  textAlign: "center",
};

const desktopFormTitleStyle: CSSProperties = {
  ...formTitleStyle,
  fontSize: "30px",
};

const desktopImportBoxStyle: CSSProperties = {
  ...importBoxStyle,
  gridTemplateColumns: "88px minmax(0, 1fr)",
  alignItems: "center",
  padding: 0,
  gap: "16px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
};

const desktopImportButtonStyle: CSSProperties = {
  ...importButtonStyle,
  minHeight: "36px",
  fontSize: "11px",
  padding: "0 12px",
};

const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "132px",
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  gap: "10px",
  marginTop: "4px",
};

const desktopPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  position: "static",
  top: "auto",
  alignSelf: "stretch",
  width: "100%",
  maxWidth: "760px",
  margin: "0 auto",
};

const desktopPreviewChapterCardStyle: CSSProperties = {
  ...previewChapterCardStyle,
  width: "100%",
  padding: "14px",
  borderRadius: "22px",
};
