"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { idObraSupabaseValido } from "../../lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { carregarTodasPaginasSupabase } from "../../lib/supabase/paginacao.mjs";
import { EditarCapituloLanguageBridge } from "./components/EditarCapituloLanguageBridge";
import {
  lerStorageUsuarioEditarCapitulo,
  salvarJsonStorageUsuarioEditarCapitulo,
} from "./lib/editar-capitulo-storage-utils";
import {
  contarLetrasNumeros,
  criarTituloPorNomeArquivo,
} from "./lib/editar-capitulo-text-utils";
import {
  calcularEstatisticasCapitulo,
  calcularProgressoLeitura,
} from "./lib/editar-capitulo-metrics-utils";
import {
  criarHrefLeituraCapitulo,
  criarLoginHrefEditarCapitulo,
} from "./lib/editar-capitulo-route-utils";
import { normalizarObra } from "./lib/editar-capitulo-work-normalizer";
import {
  carregarBackupArquivosObras,
  restaurarArquivoObraComBackup,
  sincronizarBackupArquivosObras,
} from "./lib/editar-capitulo-file-backup-utils";
import { mapearObraSupabase } from "./lib/editar-capitulo-supabase-mappers";

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


const STORAGE_KEY = "historietas-obras";
const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;

function obterNomeProfileEditarCapitulo(profile: unknown) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return "";
  }

  const registro = profile as Record<string, unknown>;
  const nome = registro.nome;

  return typeof nome === "string" ? nome.trim() : "";
}

async function carregarNomeProfileEditarCapitulo(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return "";
  }

  try {
    const { data: profilePorUserId, error: erroPorUserId } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroPorUserId) {
      const nome = obterNomeProfileEditarCapitulo(profilePorUserId);

      if (nome) {
        return nome;
      }
    }

    const { data: profilePorId, error: erroPorId } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroPorId) {
      return obterNomeProfileEditarCapitulo(profilePorId);
    }
  } catch (error) {
    console.warn("Não consegui carregar profiles.nome no Editor de Capítulo:", error);
  }

  return "";
}

function aplicarNomeAutorProfileEditarCapitulo(
  obras: ObraLocal[],
  userId: string,
  nomeProfile: string
) {
  const usuarioIdLimpo = userId.trim();
  const nomeProfileLimpo = nomeProfile.trim();

  if (!usuarioIdLimpo || !nomeProfileLimpo) {
    return obras;
  }

  return obras.map((obra) => {
    const autorId = obra.autorId?.trim() || "";

    if (autorId && autorId !== usuarioIdLimpo) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeProfileLimpo,
      autorId: autorId || usuarioIdLimpo,
    };
  });
}

function carregarObrasLocaisNormalizadas(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraLocal[];
  }

  const obrasSalvasTexto = lerStorageUsuarioEditarCapitulo(
    STORAGE_KEY,
    userIdLimpo
  );
  let obrasSalvasJson: unknown = [];

  try {
    obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
  } catch {
    obrasSalvasJson = [];
  }

  const backupArquivos = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadasBase: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  const obrasNormalizadas = obrasNormalizadasBase
    .map((obra) => restaurarArquivoObraComBackup(obra, backupArquivos))
    .map((obra) =>
      userIdLimpo
        ? {
            ...obra,
            autorId: obra.autorId?.trim() || userIdLimpo,
          }
        : obra
    )
    .filter((obra) =>
      userIdLimpo ? obraPertenceAoUsuarioEditarCapitulo(obra, userIdLimpo) : true
    );

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);
  salvarJsonStorageUsuarioEditarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
    obrasNormalizadas
  );

  return obrasNormalizadas;
}


function obraPertenceAoUsuarioEditarCapitulo(obra: ObraLocal, userId: string) {
  const usuarioId = userId.trim();
  const autorId = obra.autorId?.trim() || "";

  return Boolean(usuarioId && autorId === usuarioId);
}

function salvarObrasEditarCapituloStorage(
  obrasDoUsuario: ObraLocal[],
  userId: string
) {
  const usuarioId = userId.trim();

  if (!usuarioId) {
    return [] as ObraLocal[];
  }

  const obrasDoUsuarioNormalizadas = obrasDoUsuario
    .map((obra, index) =>
      normalizarObra(
        {
          ...obra,
          autorId: obra.autorId?.trim() || usuarioId,
        },
        index
      )
    )
    .filter((obra) => obraPertenceAoUsuarioEditarCapitulo(obra, usuarioId));

  sincronizarBackupArquivosObras(obrasDoUsuarioNormalizadas, usuarioId);
  salvarJsonStorageUsuarioEditarCapitulo(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuarioNormalizadas
  );

  return obrasDoUsuarioNormalizadas;
}

function criarMensagemConfirmacaoExclusaoCapitulo(
  tituloCapitulo: string,
  idioma: HistorietasLanguage
) {
  const tituloSeguro = tituloCapitulo.trim() || "Capítulo";

  if (idioma === "en") {
    return `Delete "${tituloSeguro}" permanently? This action cannot be undone.`;
  }

  if (idioma === "es") {
    return `¿Eliminar "${tituloSeguro}" permanentemente? Esta acción no se puede deshacer.`;
  }

  return `Excluir "${tituloSeguro}" permanentemente? Esta ação não pode ser desfeita.`;
}


async function registrarDiarioEdicaoCapitulo({
  userId,
  obra,
  capituloId,
  tituloCapitulo,
  numeroCapitulo,
  atualizadoEm,
}: {
  userId: string;
  obra: ObraLocal;
  capituloId: string;
  tituloCapitulo: string;
  numeroCapitulo: number;
  atualizadoEm: string;
}) {
  const usuarioId = userId.trim();

  if (
    !usuarioId ||
    !idObraSupabaseValido(obra.id) ||
    !idObraSupabaseValido(capituloId)
  ) {
    return;
  }

  const hrefCapitulo = criarHrefLeituraCapitulo(
    obra,
    capituloId,
    numeroCapitulo
  );
  const visibilidade = obra.publicado ? "publico" : "privado";

  try {
    const payload = {
      user_id: usuarioId,
      tipo: "editou_capitulo",
      obra_id: obra.id,
      capitulo_id: capituloId,
      texto: "",
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        titulo_obra: obra.titulo,
        capitulo_titulo: tituloCapitulo,
        numero_capitulo: numeroCapitulo,
        href: hrefCapitulo,
      },
      criado_em: atualizadoEm,
      atualizado_em: atualizadoEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    await supabase.from("diario_atividades").insert({
      user_id: usuarioId,
      tipo: "editou_capitulo",
      obra_id: obra.id,
      capitulo_id: capituloId,
      texto: "",
      visibilidade,
      criado_em: atualizadoEm,
    });
  } catch (error) {
    console.warn("Não consegui registrar a edição do capítulo no Diário:", error);
  }
}

async function atualizarNotificacaoCapituloSupabase({
  userId,
  obra,
  capituloId,
  tituloCapitulo,
  numeroCapitulo,
  atualizadoEm,
}: {
  userId: string;
  obra: ObraLocal;
  capituloId: string;
  tituloCapitulo: string;
  numeroCapitulo: number;
  atualizadoEm: string;
}) {
  const usuarioId = userId.trim();

  if (
    !usuarioId ||
    !obra.publicado ||
    !idObraSupabaseValido(obra.id) ||
    !idObraSupabaseValido(capituloId)
  ) {
    return;
  }

  const hrefCapitulo = criarHrefLeituraCapitulo(
    obra,
    capituloId,
    numeroCapitulo
  );

  try {
    const { error } = await supabase.rpc("criar_notificacoes_capitulo", {
      p_obra_id: obra.id,
      p_capitulo_id: capituloId,
      p_titulo: "Capítulo atualizado",
      p_mensagem: `${tituloCapitulo} foi atualizado em ${obra.titulo}.`,
      p_href: hrefCapitulo,
      p_tipo: "novo-capitulo",
      p_criado_em: atualizadoEm,
    });

    if (error) {
      console.warn("Não consegui criar notificações da edição do capítulo:", error.message);
    }
  } catch (error) {
    console.warn("Não consegui notificar leitores da edição do capítulo:", error);
  }
}

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
  const [isDesktop, setIsDesktop] = useState(false);
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const atualizarModoDesktopTimer = window.setTimeout(
      atualizarModoDesktop,
      0
    );

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        window.clearTimeout(atualizarModoDesktopTimer);
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      window.clearTimeout(atualizarModoDesktopTimer);
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

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
        let obrasAtualizadas = obrasLocais;
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

  function validarCapitulo() {
    const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
    const textoLimpo = texto.trim();

    if (contarLetrasNumeros(tituloFinal) < 3) {
      return "O título do capítulo precisa ter pelo menos 3 letras ou números. Se quiser usar o título automático, deixe o campo vazio.";
    }

    if (contarLetrasNumeros(textoLimpo) < 20) {
      return "O texto do capítulo precisa ter pelo menos 20 letras ou números.";
    }

    return "";
  }

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (processando || excluindo || !obraAtual || !capituloAtual) {
      return;
    }

    const erroValidacao = validarCapitulo();

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
  background: "var(--historietas-editar-capitulo-bg-page, #000000)",
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
  background: "var(--historietas-editar-capitulo-danger-surface, rgba(127,29,29,0.18))",
  border: "1px solid var(--historietas-editar-capitulo-danger-border, rgba(239,68,68,0.26))",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, var(--historietas-editar-capitulo-danger-text, #FFFFFF))",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, var(--historietas-editar-capitulo-danger-text-soft, #FECACA))",
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
  background: "var(--historietas-editar-capitulo-bg-deep, #000000)",
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
  background: "var(--historietas-editar-capitulo-bg-deep, #000000)",
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

const importTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const importIconBoxStyle: CSSProperties = {
  minHeight: "82px",
  borderRadius: "18px",
  background: "var(--historietas-editar-capitulo-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
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



const importSuccessStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-editar-capitulo-success-bg, rgba(34,197,94,0.12))",
  border: "1px solid var(--historietas-editar-capitulo-success-border, rgba(34,197,94,0.28))",
  color: "var(--historietas-editar-capitulo-success, #86EFAC)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const importErrorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-danger-surface, var(--historietas-editar-capitulo-danger-bg, rgba(239,68,68,0.13)))",
  border: "1px solid var(--historietas-editar-capitulo-danger-border-strong, rgba(239,68,68,0.28))",
  color: "var(--historietas-danger-button-text, var(--historietas-editar-capitulo-danger-text, #FFFFFF))",
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
  background: "var(--historietas-editar-capitulo-surface, #050505)",
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

const saveButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-editar-capitulo-surface, #050505)",
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
  ...saveButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  boxShadow: "none",
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-editar-capitulo-surface, #050505)",
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

const deleteButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  gridColumn: "1 / -1",
};

const disabledDeleteButtonStyle: CSSProperties = {
  ...deleteButtonStyle,
  cursor: "not-allowed",
  opacity: 0.62,
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
  background: "var(--historietas-editar-capitulo-panel, rgba(4, 0, 10, 0.72))",
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




const desktopMainGridStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 760px)",
  justifyContent: "center",
  alignItems: "start",
  gap: "28px",
  width: "100%",
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

const desktopSaveButtonStyle: CSSProperties = {
  ...saveButtonStyle,
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

const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopDeleteButtonStyle: CSSProperties = {
  ...deleteButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopDisabledDeleteButtonStyle: CSSProperties = {
  ...desktopDeleteButtonStyle,
  cursor: "not-allowed",
  opacity: 0.62,
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

const desktopPreviewChapterTitleStyle: CSSProperties = {
  ...previewChapterTitleStyle,
  fontSize: "24px",
  lineHeight: 1.12,
};

const desktopPreviewChapterTextStyle: CSSProperties = {
  ...previewChapterTextStyle,
  minHeight: "132px",
  fontSize: "14px",
  lineHeight: 1.65,
};
