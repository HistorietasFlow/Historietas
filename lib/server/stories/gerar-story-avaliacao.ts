import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { carregarStoryAvaliacaoObra } from "./carregar-story-avaliacao";
import { carregarMidiaStory } from "./midia-story";
import { comporStoryAvaliacao } from "./story-avaliacao-layout";

/** Única entrada da geração: não aceita payload/URLs fornecidos pelo navegador.
 * Sem endpoint público, UI ou compartilhamento (a etapa 3 não foi iniciada). */
export async function gerarStoryAvaliacao(input: { slug: string; leitorId: string }) {
  const source = await carregarStoryAvaliacaoObra(input);
  if (source.estado !== "disponivel" || !source.payload.compartilhavel) return { estado: "indisponivel" as const, motivo: "dados_nao_autorizados" };
  try {
    const payload = source.payload;
    // Serial para respeitar memória/concorrência em ambientes pequenos.
    const capa = await carregarMidiaStory(payload.obra.capa, "capas-obras");
    if (!capa) return { estado: "indisponivel" as const, motivo: "capa_indisponivel" };
    const leitor = await carregarMidiaStory(payload.leitor.foto, "avatars");
    const autor = await carregarMidiaStory(payload.autor.foto, "avatars");
    const asset = async (name: "wordmark" | "minha-avaliacao" | "por" | "separador") =>
      `data:image/png;base64,${(await readFile(join(process.cwd(), `lib/server/stories/assets/${name}.png`))).toString("base64")}`;
    const wordmark = await asset("wordmark"), legenda = await asset("minha-avaliacao"), por = await asset("por"), separador = await asset("separador");
    const png = Buffer.from(await comporStoryAvaliacao(payload, { capa, leitor, autor, wordmark, legenda, por, separador }).arrayBuffer());
    // A geração/IO não pode devolver imagem após logout/revogação/despublicação.
    const current = await carregarStoryAvaliacaoObra(input);
    if (current.estado !== "disponivel" || JSON.stringify(current.payload) !== JSON.stringify(payload)) return { estado: "indisponivel" as const, motivo: "fonte_alterada" };
    return { estado: "gerado" as const, png, contentType: "image/png" as const,
      cacheControl: "private, no-store, max-age=0", width: 1080 as const, height: 1920 as const,
      ausencias: { fotoLeitor: !leitor, fotoAutor: !autor } };
  } catch {
    return { estado: "indisponivel" as const, motivo: "geracao_indisponivel" };
  }
}
