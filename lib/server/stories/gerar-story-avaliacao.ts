import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { carregarStoryAvaliacaoObra } from "./carregar-story-avaliacao";
import { carregarMidiaStory } from "./midia-story";
import { comporStoryAvaliacao } from "./story-avaliacao-layout";
import { carregarGeistStory } from "./fonte-story";
import { diagnosticoPng } from "./diagnostico-png";

/** Única entrada da geração: não aceita payload/URLs fornecidos pelo navegador. */
export async function gerarStoryAvaliacao(input: { slug: string; leitorId: string }) {
  const diag = diagnosticoPng();
  let status: "gerado" | "indisponivel" = "indisponivel";
  try {
    const source = await diag.medir("fonte_inicial", () => carregarStoryAvaliacaoObra(input));
    if (source.estado !== "disponivel" || !source.payload.compartilhavel) return { estado: "indisponivel" as const, motivo: "dados_nao_autorizados" };
    const payload = source.payload;
    // Serial para respeitar memória/concorrência em ambientes pequenos.
    const capa = await diag.medir("capa", () => carregarMidiaStory(payload.obra.capa, "capas-obras"));
    if (!capa) return { estado: "indisponivel" as const, motivo: "capa_indisponivel" };
    const leitor = await diag.medir("foto_leitor", () => carregarMidiaStory(payload.leitor.foto, "avatars"));
    const autor = await diag.medir("foto_autor", () => carregarMidiaStory(payload.autor.foto, "avatars"));
    const asset = async (name: "wordmark" | "minha-avaliacao" | "por" | "separador") =>
      `data:image/png;base64,${(await readFile(join(process.cwd(), `lib/server/stories/assets/${name}.png`))).toString("base64")}`;
    const [wordmark, legenda, por, separador] = await diag.medir("assets", async () =>
      [await asset("wordmark"), await asset("minha-avaliacao"), await asset("por"), await asset("separador")]);
    const geist = await diag.medir("geist", carregarGeistStory);
    const png = await diag.medir("render_png", async () => Buffer.from(await comporStoryAvaliacao(payload,
      { capa, leitor, autor, wordmark, legenda, por, separador }, geist).arrayBuffer()));
    // A geração/IO não pode devolver imagem após logout/revogação/despublicação.
    const current = await diag.medir("revalidacao", () => carregarStoryAvaliacaoObra(input));
    if (current.estado !== "disponivel" || JSON.stringify(current.payload) !== JSON.stringify(payload)) return { estado: "indisponivel" as const, motivo: "fonte_alterada" };
    status = "gerado";
    return { estado: "gerado" as const, png, contentType: "image/png" as const,
      cacheControl: "private, no-store, max-age=0", width: 1080 as const, height: 1920 as const,
      ausencias: { fotoLeitor: !leitor, fotoAutor: !autor } };
  } catch {
    return { estado: "indisponivel" as const, motivo: "geracao_indisponivel" };
  } finally {
    diag.finalizar(status);
  }
}
