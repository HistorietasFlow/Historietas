// Limite opcional na escala existente de meia estrela (0,5 a 5).
export function normalizarNotaMinimaCatalogo(valor: unknown): number | null {
  if (typeof valor === "string" && !/^\d(?:\.[05])?$/.test(valor.trim())) return null;
  if (typeof valor !== "number" && typeof valor !== "string") return null;
  const nota = Number(typeof valor === "string" ? valor.trim() : valor);
  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5 && Number.isInteger(nota * 2)
    ? nota : null;
}
