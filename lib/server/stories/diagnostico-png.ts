import "server-only";

type Etapa = "fonte_inicial" | "capa" | "foto_leitor" | "foto_autor" | "assets" | "geist" | "render_png" | "revalidacao" | "total";
type Status = "inicio" | "concluido" | "falhou" | "gerado" | "indisponivel";

/** Não recebe contexto da requisição, erro, payload ou qualquer texto livre. */
export function diagnosticoPng() {
  const enabled = process.env.STORY_PNG_DIAGNOSTICS === "1";
  const total = performance.now();
  const record = (etapa: Etapa, status: Status, inicio: number) => {
    if (!enabled) return;
    try {
      console.info("[story-png]", JSON.stringify({ etapa, status, duracaoMs: Math.round(Math.max(0, performance.now() - inicio)) }));
    } catch { /* Diagnóstico não pode alterar geração ou autorização. */ }
  };
  return {
    async medir<T>(etapa: Exclude<Etapa, "total">, action: () => Promise<T>): Promise<T> {
      const start = performance.now();
      record(etapa, "inicio", start);
      try {
        const result = await action();
        record(etapa, "concluido", start);
        return result;
      } catch (error) {
        record(etapa, "falhou", start);
        throw error;
      }
    },
    finalizar(status: "gerado" | "indisponivel") { record("total", status, total); },
  };
}
