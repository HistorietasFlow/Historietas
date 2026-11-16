/** DTO público: nunca receber metadata de Auth, cache pessoal ou perfis privados. */
export type TextoStory = { texto: string | null; truncado: boolean };
type PerfilStory = { nome: unknown; avatar_url: unknown; username?: unknown };

export function textoStory(valor: unknown, limite: number): TextoStory {
  if (typeof valor !== "string") return { texto: null, truncado: false };
  const texto = valor.trim().replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!texto) return { texto: null, truncado: false };
  // Não cortar pares surrogate, acentos combinados ou sequências de emoji.
  const segmentos = new Intl.Segmenter("pt", { granularity: "grapheme" }).segment(texto);
  const partes: string[] = [];
  for (const { segment } of segmentos) {
    if (partes.length === limite) return { texto: `${partes.join("")}…`, truncado: true };
    partes.push(segment);
  }
  return { texto, truncado: false };
}

/** Não assinar, resolver nem baixar mídia nesta etapa. Só buckets públicos conhecidos. */
export function imagemPublicaStory(valor: unknown, supabaseUrl: string, bucket: "avatars" | "capas-obras") {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const url = new URL(valor);
    const origem = new URL(supabaseUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.origin !== origem.origin ||
      url.username || url.password || url.search || url.hash ||
      !url.pathname.startsWith(`/storage/v1/object/public/${bucket}/`) ||
      !url.pathname.slice(`/storage/v1/object/public/${bucket}/`.length)) return null;
    return url.href;
  } catch { return null; }
}

export function montarPayloadStoryAvaliacao({ obra, leitor, autor, nota, supabaseUrl }: {
  obra: { titulo: unknown; autor: unknown; capa: unknown; slug: string };
  leitor: PerfilStory | null;
  autor: PerfilStory | null;
  nota: unknown;
  supabaseUrl: string;
}) {
  // Não arredondar, converter média em nota individual ou preencher avaliação ausente.
  const valor = typeof nota === "number" ? nota :
    typeof nota === "string" && /^(?:[0-5](?:\.[05])?)$/.test(nota) ? Number(nota) : NaN;
  if (!Number.isFinite(valor) || valor < 0.5 || valor > 5 || !Number.isInteger(valor * 2)) return null;
  const titulo = textoStory(obra.titulo, 120);
  const nomeLeitor = textoStory(leitor?.nome, 80);
  const nomeAutor = textoStory(autor?.nome, 80);
  const creditoObra = textoStory(obra.autor, 80);
  const username = typeof autor?.username === "string" &&
    /^[a-z0-9](?:[a-z0-9._]{0,28}[a-z0-9])?$/.test(autor.username) ? autor.username : null;
  const fotoLeitor = imagemPublicaStory(leitor?.avatar_url, supabaseUrl, "avatars");
  const fotoAutor = imagemPublicaStory(autor?.avatar_url, supabaseUrl, "avatars");
  const capa = imagemPublicaStory(obra.capa, supabaseUrl, "capas-obras");
  return {
    versao: 1 as const,
    compartilhavel: Boolean(titulo.texto && nomeLeitor.texto && nomeAutor.texto),
    leitor: { nome: nomeLeitor, foto: fotoLeitor },
    obra: { titulo, autor: creditoObra, capa, href: `/obra/${encodeURIComponent(obra.slug)}` },
    autor: {
      nome: nomeAutor, foto: fotoAutor, username,
      handle: username ? `@${username}` : null,
      mostrarHandle: username !== null,
      // A futura UI deve ocultar o grupo inteiro, inclusive “&”, quando false.
      mostrarSeparador: username !== null,
    },
    avaliacao: { nota: valor, escala: 5 as const, estrelasInteiras: Math.floor(valor), meiaEstrela: valor % 1 === 0.5 },
    ausencias: {
      titulo: !titulo.texto, nomeLeitor: !nomeLeitor.texto, fotoLeitor: !fotoLeitor,
      nomeAutor: !nomeAutor.texto, fotoAutor: !fotoAutor, usernameAutor: !username,
      creditoObra: !creditoObra.texto, capa: !capa,
    },
  };
}

export type PayloadStoryAvaliacao = NonNullable<ReturnType<typeof montarPayloadStoryAvaliacao>>;
