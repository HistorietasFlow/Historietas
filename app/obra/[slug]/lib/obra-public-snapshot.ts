import type { SnapshotObraPublica } from "../../../../lib/cache/obrasPublicas";
import { normalizarAvisosConteudo18 } from "../../../../lib/historietasAdultContent";
import type { ObraDinamica } from "./obra-data-utils";

export type ResultadoSnapshotObra = { estado: "ausente" } |
  { estado: "disponivel"; snapshot: SnapshotObraPublica } |
  { estado: "inalterada"; obraId: string; geracao: string; revisao: string; slug: string };

export function slugRotaObra(pathname: string) {
  const partes = pathname.split("/");
  try {
    const slug = decodeURIComponent(partes[2] || "");
    return partes.length === 3 && partes[1] === "obra" && slug && slug.length <= 200 && !slug.includes("/") ? slug : null;
  } catch { return null; }
}

export function mesmaVersaoObra(a: SnapshotObraPublica, b: Pick<SnapshotObraPublica, "obraId" | "geracao" | "revisao" | "slug">) {
  return a.obraId === b.obraId && a.geracao === b.geracao && a.revisao === b.revisao && a.slug === b.slug;
}

// Adapta somente a projeção pública. Não normaliza/mescla ObraLocal ou backups.
export function snapshotParaObra(snapshot: SnapshotObraPublica): ObraDinamica {
  const { obra, anexo, capitulos } = snapshot;
  return {
    ...obra, id: snapshot.obraId, slug: snapshot.slug, link: `/obra/${encodeURIComponent(snapshot.slug)}`,
    origem: "local", status: "Publicado", views: "0", likes: "0", comentarios: "0",
    avisosConteudo: normalizarAvisosConteudo18(obra.avisosConteudo, obra.classificacaoIndicativa),
    disponivel: capitulos.length > 0 || Boolean(anexo),
    arquivoObra: anexo ? { nome: anexo.nome || "Arquivo da obra",
      tipo: anexo.tipo || (anexo.categoria === "documento" ? "application/pdf" : anexo.categoria === "imagem" ? "image/*" : anexo.categoria === "texto" ? "text/plain" : ""), tamanho: anexo.tamanho || 0,
      categoria: anexo.categoria === "texto" || anexo.categoria === "documento" || anexo.categoria === "imagem" ? anexo.categoria : "outro",
      conteudo: "", criadoEm: obra.criadaEm } : null,
    capitulos: capitulos.map(c => ({ id: c.id, numero: String(c.ordem).padStart(2, "0"), titulo: c.titulo,
      descricao: "", href: c.href, disponivel: true, lido: false, lidoEm: "" })),
    ultimoCapituloLidoId: "", ultimaLeituraEm: "", progressoLeitura: 0,
  };
}

export type ProgressoObra = { capitulo_id: string; lido_em: string | null }[];
export function perfilDoAutorAtual<T extends { userId?: string }>(perfil: T | null, autorId?: string): T | null {
  return autorId && perfil?.userId === autorId ? perfil : null;
}
export function aplicarProgressoObra(obra: ObraDinamica, progresso: ProgressoObra): ObraDinamica {
  const porId = new Map(progresso.map(p => [p.capitulo_id, p.lido_em || ""]));
  const capitulos = obra.capitulos.map(c => porId.has(c.id) ? { ...c, lido: true, lidoEm: porId.get(c.id)! } : c);
  const lidos = capitulos.filter(c => c.lido);
  const ultimo = lidos.reduce<typeof lidos[number] | undefined>((anterior, capitulo) => {
    const atual = new Date(capitulo.lidoEm).getTime() || 0;
    const antes = anterior ? new Date(anterior.lidoEm).getTime() || 0 : 0;
    return !anterior || atual >= antes ? capitulo : anterior;
  }, undefined);
  return { ...obra, capitulos, ultimoCapituloLidoId: ultimo?.id || "", ultimaLeituraEm: ultimo?.lidoEm || "",
    progressoLeitura: capitulos.length ? Math.round(lidos.length / capitulos.length * 100) : 0 };
}
