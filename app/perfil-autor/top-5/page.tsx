"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase/client";
import { criarSlugBase, normalizarTexto } from "../../../lib/utils";

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
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraTop5 = {
  id: string;
  titulo: string;
  autorId: string;
  autor: string;
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
  visualizacoes: number;
  slug: string;
  link: string;
};

type ObraTop5Salva = Partial<ObraTop5> & Record<string, unknown>;

type SupabaseObraTop5Row = Record<string, unknown>;

type UsuarioTop5 = {
  id: string;
  nome: string;
};

const STORAGE_KEY = "historietas-obras";
const TOP_FIVE_STORAGE_KEY = "historietas-top-5-obras";
const TOP_FIVE_MAXIMO = 5;

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function pegarNumero(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function pegarTags(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      .map((tag) => tag.trim());

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}

function normalizarCategoriaArquivo(tipo: string): ArquivoObraLocal["categoria"] {
  const tipoNormalizado = tipo.toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (tipoNormalizado.includes("pdf") || tipoNormalizado.includes("document")) {
    return "documento";
  }

  if (tipoNormalizado.startsWith("text/") || tipoNormalizado.includes("markdown")) {
    return "texto";
  }

  return "outro";
}

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  const tipo = typeof arquivo.tipo === "string" ? arquivo.tipo : "";

  return {
    nome: arquivo.nome.trim(),
    tipo,
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria:
      arquivo.categoria === "texto" ||
      arquivo.categoria === "documento" ||
      arquivo.categoria === "imagem" ||
      arquivo.categoria === "outro"
        ? arquivo.categoria
        : normalizarCategoriaArquivo(tipo),
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function normalizarCapituloTop5(
  capitulo: Partial<CapituloLocal>,
  capituloIndex: number,
  obraIndex: number,
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario: typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarObraLocalTop5(obra: ObraTop5Salva, obraIndex: number): ObraTop5 {
  const titulo = pegarTexto(obra.titulo, `Obra ${obraIndex + 1}`);
  const slug = pegarTexto(obra.slug, criarSlugBase(titulo));
  const capitulos = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloTop5(capitulo as Partial<CapituloLocal>, capituloIndex, obraIndex),
      )
    : [];

  return {
    id: pegarTexto(obra.id, `obra-${obraIndex + 1}`),
    titulo,
    autorId: pegarTexto(obra.autorId ?? obra.user_id ?? obra.autor_id, ""),
    autor: pegarTexto(obra.autor ?? obra.nome_autor ?? obra.autor_nome, "Autor não informado"),
    genero: pegarTexto(obra.genero, "Não informado"),
    formato: pegarTexto(obra.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      obra.classificacaoIndicativa ?? obra.classificacao_indicativa,
      "Não informada",
    ),
    sinopse: pegarTexto(obra.sinopse, ""),
    tags: pegarTags(obra.tags),
    capa: pegarTexto(obra.capa ?? obra.capa_url ?? obra.capaUrl, ""),
    capaNome: pegarTexto(obra.capaNome ?? obra.capa_nome, ""),
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: pegarBooleano(obra.publicado, false),
    capitulos,
    criadaEm: pegarTexto(obra.criadaEm ?? obra.criada_em ?? obra.created_at, ""),
    ultimoCapituloLidoId: pegarTexto(obra.ultimoCapituloLidoId, ""),
    ultimaLeituraEm: pegarTexto(obra.ultimaLeituraEm, ""),
    progressoLeitura: pegarNumero(obra.progressoLeitura, 0),
    visualizacoes: pegarNumero(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes,
      0,
    ),
    slug,
    link: pegarTexto(obra.link, `/obra/${slug}`),
  };
}

function criarArquivoObraSupabase(row: SupabaseObraTop5Row): ArquivoObraLocal | null {
  const conteudo = pegarTexto(
    row.arquivo_url ?? row.arquivoUrl ?? row.arquivo_conteudo ?? row.arquivoObra,
  );

  if (!conteudo) {
    return null;
  }

  const tipo = pegarTexto(row.arquivo_tipo ?? row.arquivoTipo, "outro");

  return {
    nome: pegarTexto(row.arquivo_nome ?? row.arquivoNome, "arquivo-da-obra"),
    tipo,
    tamanho: pegarNumero(row.arquivo_tamanho ?? row.arquivoTamanho, 0),
    conteudo,
    categoria: normalizarCategoriaArquivo(tipo),
    criadoEm: pegarTexto(row.arquivo_criado_em ?? row.arquivoCriadoEm ?? row.created_at),
  };
}

function normalizarObraSupabaseTop5(row: SupabaseObraTop5Row, index: number): ObraTop5 {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autorId: pegarTexto(row.user_id ?? row.autor_id ?? row.autorId, ""),
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada",
    ),
    sinopse: pegarTexto(row.sinopse, ""),
    tags: pegarTags(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    arquivoObra: criarArquivoObraSupabase(row),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    visualizacoes: pegarNumero(
      row.visualizacoes ??
        row.views ??
        row.visualizacoes_total ??
        row.total_visualizacoes ??
        row.totalVisualizacoes,
      0,
    ),
    slug,
    link: `/obra/${slug}`,
  };
}

function criarChaveObraTop5(obra: Pick<ObraTop5, "id" | "slug" | "titulo">) {
  return obra.id.trim() || obra.slug.trim() || normalizarTexto(obra.titulo);
}

function criarStorageKeyUsuarioTop5(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function carregarObrasLocaisTop5() {
  if (typeof window === "undefined") {
    return [] as ObraTop5[];
  }

  try {
    const texto = localStorage.getItem(STORAGE_KEY);
    const obrasSalvas = texto ? JSON.parse(texto) : [];

    if (!Array.isArray(obrasSalvas)) {
      return [] as ObraTop5[];
    }

    return obrasSalvas.map((obra, index) =>
      normalizarObraLocalTop5(obra as ObraTop5Salva, index),
    );
  } catch {
    return [] as ObraTop5[];
  }
}

async function carregarObrasSupabaseTop5() {
  try {
    const { data, error } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,criada_em,atualizado_em",
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(160);

    if (error || !Array.isArray(data)) {
      return [] as ObraTop5[];
    }

    return data.map((obra, index) =>
      normalizarObraSupabaseTop5(obra as SupabaseObraTop5Row, index),
    );
  } catch {
    return [] as ObraTop5[];
  }
}

function mesclarObrasTop5(obras: ObraTop5[]) {
  const mapa = new Map<string, ObraTop5>();

  obras.forEach((obra) => {
    const chaves = Array.from(
      new Set(
        [obra.id, obra.slug, normalizarTexto(obra.titulo)].filter(
          (valor): valor is string => typeof valor === "string" && Boolean(valor.trim()),
        ),
      ),
    );

    const chaveExistente = chaves.find((chave) => mapa.has(chave));

    if (chaveExistente) {
      const obraExistente = mapa.get(chaveExistente);

      if (obraExistente) {
        const obraAtualizada = {
          ...obraExistente,
          ...obra,
          capa: obra.capa || obraExistente.capa,
          capitulos: obra.capitulos.length > 0 ? obra.capitulos : obraExistente.capitulos,
          arquivoObra: obra.arquivoObra || obraExistente.arquivoObra,
        };

        chaves.forEach((chave) => mapa.set(chave, obraAtualizada));
      }

      return;
    }

    chaves.forEach((chave) => mapa.set(chave, obra));
  });

  return Array.from(new Map(Array.from(mapa.values()).map((obra) => [criarChaveObraTop5(obra), obra])).values());
}

function carregarTop5Salvo(userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return [] as string[];
  }

  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioTop5(TOP_FIVE_STORAGE_KEY, userId),
    );
    const ids = texto ? JSON.parse(texto) : [];

    if (!Array.isArray(ids)) {
      return [] as string[];
    }

    return ids
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      .slice(0, TOP_FIVE_MAXIMO);
  } catch {
    return [] as string[];
  }
}

function salvarTop5(userId: string, ids: string[]) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  localStorage.setItem(
    criarStorageKeyUsuarioTop5(TOP_FIVE_STORAGE_KEY, userId),
    JSON.stringify(ids.slice(0, TOP_FIVE_MAXIMO)),
  );
}

function criarCapaTop5Style(capa: string): CSSProperties {
  if (!capa) {
    return top5CoverEmptyStyle;
  }

  return {
    ...top5CoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarCapaSelecionadaTop5Style(capa: string): CSSProperties {
  if (!capa) {
    return selectedCoverEmptyStyle;
  }

  return {
    ...selectedCoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export default function Top5PerfilAutorPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioTop5 | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [obras, setObras] = useState<ObraTop5[]>([]);
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function iniciarPagina() {
      setCarregando(true);

      try {
        const [{ data: authData }, obrasSupabase] = await Promise.all([
          supabase.auth.getUser(),
          carregarObrasSupabaseTop5(),
        ]);

        if (cancelado) {
          return;
        }

        const userId = authData.user?.id || "";
        const nomeUsuario =
          pegarTexto(authData.user?.user_metadata?.nome) ||
          pegarTexto(authData.user?.user_metadata?.name) ||
          pegarTexto(authData.user?.email) ||
          "Usuário";

        setUsuario(userId ? { id: userId, nome: nomeUsuario } : null);
        setObras(mesclarObrasTop5([...obrasSupabase, ...carregarObrasLocaisTop5()]));
        setIdsSelecionados(userId ? carregarTop5Salvo(userId) : []);
      } catch {
        if (!cancelado) {
          setUsuario(null);
          setObras(carregarObrasLocaisTop5());
          setIdsSelecionados([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    iniciarPagina();

    return () => {
      cancelado = true;
    };
  }, []);

  const obrasPorChave = useMemo(() => {
    const mapa = new Map<string, ObraTop5>();

    obras.forEach((obra) => {
      [obra.id, obra.slug, normalizarTexto(obra.titulo)]
        .filter(Boolean)
        .forEach((chave) => mapa.set(chave, obra));
    });

    return mapa;
  }, [obras]);

  const obrasSelecionadas = useMemo(
    () => idsSelecionados.map((id) => obrasPorChave.get(id)).filter((obra): obra is ObraTop5 => Boolean(obra)),
    [idsSelecionados, obrasPorChave],
  );

  const obrasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    const obrasOrdenadas = [...obras].sort((obraA, obraB) => {
      const selecionadaA = idsSelecionados.includes(criarChaveObraTop5(obraA));
      const selecionadaB = idsSelecionados.includes(criarChaveObraTop5(obraB));

      if (selecionadaA !== selecionadaB) {
        return Number(selecionadaB) - Number(selecionadaA);
      }

      return obraA.titulo.localeCompare(obraB.titulo, "pt-BR");
    });

    if (!buscaNormalizada) {
      return obrasOrdenadas;
    }

    return obrasOrdenadas.filter((obra) => {
      const textoBusca = normalizarTexto(
        [obra.titulo, obra.autor, obra.genero, obra.formato, ...obra.tags].join(" "),
      );

      return textoBusca.includes(buscaNormalizada);
    });
  }, [busca, idsSelecionados, obras]);

  function alternarObraTop5(obra: ObraTop5) {
    const chave = criarChaveObraTop5(obra);

    if (!chave) {
      return;
    }

    setMensagem("");
    setIdsSelecionados((idsAtuais) => {
      if (idsAtuais.includes(chave)) {
        return idsAtuais.filter((id) => id !== chave);
      }

      if (idsAtuais.length >= TOP_FIVE_MAXIMO) {
        setMensagem("Você já escolheu 5 obras. Remova uma para trocar.");
        return idsAtuais;
      }

      return [...idsAtuais, chave];
    });
  }

  function removerSelecionadaTop5(chave: string) {
    setMensagem("");
    setIdsSelecionados((idsAtuais) => idsAtuais.filter((id) => id !== chave));
  }

  function moverSelecionadaTop5(chave: string, direcao: -1 | 1) {
    setIdsSelecionados((idsAtuais) => {
      const indiceAtual = idsAtuais.indexOf(chave);
      const novoIndice = indiceAtual + direcao;

      if (indiceAtual < 0 || novoIndice < 0 || novoIndice >= idsAtuais.length) {
        return idsAtuais;
      }

      const novaLista = [...idsAtuais];
      const [item] = novaLista.splice(indiceAtual, 1);
      novaLista.splice(novoIndice, 0, item);

      return novaLista;
    });
  }

  function salvarEscolhasTop5() {
    if (!usuario?.id) {
      setMensagem("Entre na sua conta para salvar seu TOP 5.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      salvarTop5(usuario.id, idsSelecionados);
      window.setTimeout(() => {
        router.push("/perfil-autor");
      }, 350);
    } catch {
      setMensagem("Não foi possível salvar agora. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={pageStyle}>
      <section style={selectedSectionStyle} aria-label="Obras escolhidas para o TOP 5">
        <div style={selectedHeaderStyle}>
          <span style={selectedTitleStyle}>Seu TOP 5</span>
        </div>

        <div style={selectedListStyle}>
          {Array.from({ length: TOP_FIVE_MAXIMO }).map((_, index) => {
            const obra = obrasSelecionadas[index];
            const chave = obra ? criarChaveObraTop5(obra) : "";

            return (
              <div key={`slot-top-5-${index + 1}`} style={selectedSlotStyle}>
                <span style={selectedNumberStyle}>{index + 1}</span>

                {obra ? (
                  <>
                    <button
                      type="button"
                      onClick={() => removerSelecionadaTop5(chave)}
                      style={selectedRemoveButtonStyle}
                      aria-label={`Remover ${obra.titulo} do TOP 5`}
                    >
                      ×
                    </button>
                    <div style={criarCapaSelecionadaTop5Style(obra.capa)} />
                    <div style={selectedActionsStyle}>
                      <button
                        type="button"
                        onClick={() => moverSelecionadaTop5(chave, -1)}
                        style={selectedMoveButtonStyle}
                        aria-label={`Subir ${obra.titulo}`}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moverSelecionadaTop5(chave, 1)}
                        style={selectedMoveButtonStyle}
                        aria-label={`Descer ${obra.titulo}`}
                        disabled={index === obrasSelecionadas.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={emptySelectedSlotStyle}>+</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div style={footerActionsStyle}>
        <Link href="/perfil-autor" style={cancelButtonStyle}>
          Cancelar
        </Link>
        <button
          type="button"
          onClick={salvarEscolhasTop5}
          disabled={salvando || !usuario?.id}
          style={salvando || !usuario?.id ? saveButtonDisabledStyle : saveButtonStyle}
        >
          {salvando ? "Salvando..." : "Salvar TOP 5"}
        </button>
      </div>

      <section style={searchSectionStyle} aria-label="Buscar obras">
        <label style={searchShellStyle} htmlFor="buscar-obra-top-5">
          <span style={searchIconStyle}>⌕</span>

          <input
            id="buscar-obra-top-5"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar obra..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={90}
            style={searchInputStyle}
            type="text"
          />
        </label>
      </section>

      {mensagem && <p style={messageStyle}>{mensagem}</p>}

      {!usuario && !carregando && (
        <section style={noticeStyle}>
          <strong style={noticeTitleStyle}>Entre para salvar seu TOP 5</strong>
          <span style={noticeTextStyle}>
            Você pode ver as obras, mas precisa estar logado para salvar suas escolhas.
          </span>
          <Link href="/login?redirectTo=/perfil-autor/top-5" style={loginButtonStyle}>
            Entrar
          </Link>
        </section>
      )}

      <section style={gridSectionStyle} aria-label="Lista de obras disponíveis">
        {!carregando && (
          obrasFiltradas.length > 0 ? (
            <div style={worksGridStyle}>
              {obrasFiltradas.map((obra) => {
                const chave = criarChaveObraTop5(obra);
                const posicaoSelecionada = idsSelecionados.indexOf(chave) + 1;
                const selecionada = posicaoSelecionada > 0;

                return (
                  <button
                    key={`obra-top-5-${chave}`}
                    type="button"
                    onClick={() => alternarObraTop5(obra)}
                    style={selecionada ? top5CardSelectedStyle : top5CardStyle}
                    aria-label={
                      selecionada
                        ? `Remover ${obra.titulo} do TOP 5`
                        : `Adicionar ${obra.titulo} ao TOP 5`
                    }
                  >
                    <div style={criarCapaTop5Style(obra.capa)}>
                      {selecionada && <span style={selectedBadgeStyle}>{posicaoSelecionada}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p
              style={{
                margin: "10px 0 0",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Nenhuma obra encontrada
            </p>
          )
        )}
      </section>

    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "12px 10px 48px",
  background:
    "radial-gradient(circle at top left, rgba(124,58,237,0.12), transparent 34%), #000000",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const selectedSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
};

const selectedHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const selectedTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  letterSpacing: "0",
  textTransform: "uppercase",
  opacity: 1,
  filter: "none",
  textShadow: "none",
};

 const selectedListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "5px",
};

const selectedSlotStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  aspectRatio: "0.62 / 1",
  borderRadius: "15px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const selectedNumberStyle: CSSProperties = {
  position: "absolute",
  top: "6px",
  left: "6px",
  zIndex: 3,
  width: "19px",
  height: "19px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.76)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
};

const selectedRemoveButtonStyle: CSSProperties = {
  position: "absolute",
  top: "5px",
  right: "5px",
  zIndex: 4,
  width: "22px",
  height: "22px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.72)",
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1,
  cursor: "pointer",
};

const selectedActionsStyle: CSSProperties = {
  position: "absolute",
  left: "5px",
  right: "5px",
  bottom: "5px",
  zIndex: 4,
  display: "flex",
  justifyContent: "space-between",
  gap: "4px",
};

const selectedMoveButtonStyle: CSSProperties = {
  width: "24px",
  height: "22px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.68)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
};

const selectedCoverStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "#09090B",
};

const selectedCoverEmptyStyle: CSSProperties = {
  ...selectedCoverStyle,
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(249,115,22,0.10)), #09090B",
};

const emptySelectedSlotStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.28)",
  fontSize: "28px",
  fontWeight: 400,
};

const searchSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  boxSizing: "border-box",
};

const searchShellStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 16px",
  boxSizing: "border-box",
  boxShadow: "none",
};

const searchIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const searchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "50px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 850,
  letterSpacing: "-0.035em",
  boxSizing: "border-box",
};

const messageStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
  color: "#FDE68A",
  fontSize: "12px",
  fontWeight: 800,
};

const noticeStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 12px",
  padding: "12px",
  borderRadius: "18px",
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.20)",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const noticeTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
};

const noticeTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 650,
};

const loginButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  marginTop: "3px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#0A0A0A",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
};

const gridSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
};

const worksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
};

const top5CardStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "0",
  border: "0",
  background: "transparent",
  color: "#FFFFFF",
  cursor: "pointer",
  textAlign: "left",
};

const top5CardSelectedStyle: CSSProperties = {
  ...top5CardStyle,
};

const top5CoverStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "0.68 / 1",
  borderRadius: "14px",
  overflow: "hidden",
  background: "#09090B",
  boxShadow: "0 12px 22px rgba(0,0,0,0.22)",
};

const top5CoverEmptyStyle: CSSProperties = {
  ...top5CoverStyle,
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(249,115,22,0.13)), #09090B",
};

const selectedBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "7px",
  left: "7px",
  width: "24px",
  height: "24px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#000000",
  fontSize: "12px",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(0,0,0,0.32)",
};


const footerActionsStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 14px",
  display: "flex",
  gap: "10px",
};

const cancelButtonStyle: CSSProperties = {
  flex: 1,
  minHeight: "46px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#0B0B0B",
  border: "1px solid #2A2A2A",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
};

const saveButtonStyle: CSSProperties = {
  flex: 1,
  minHeight: "46px",
  border: "1px solid #2A2A2A",
  borderRadius: "999px",
  background: "#0B0B0B",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
};

const saveButtonDisabledStyle: CSSProperties = {
  ...saveButtonStyle,
  opacity: 0.48,
  cursor: "not-allowed",
};