import { lerStorageUsuarioTop5 } from "./top5-storage-utils";
import { normalizarObraLocalTop5 } from "./top5-work-normalizers";
import type {
  ObraTop5,
  ObraTop5Salva,
} from "./top5-types";

const STORAGE_KEY = "historietas-obras";

export function carregarObrasLocaisTop5(userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as ObraTop5[];
  }

  try {
    const texto = lerStorageUsuarioTop5(STORAGE_KEY, userIdLimpo);
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
