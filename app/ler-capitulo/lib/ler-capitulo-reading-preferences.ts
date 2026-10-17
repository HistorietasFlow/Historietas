import type { TamanhoFonte } from "../components/ler-capitulo-reader-content";
import { lerStorageUsuarioLeitor, salvarJsonStorageUsuarioLeitor } from "./ler-capitulo-local-storage";

type PreferenciasLeitura = {
  tamanhoFonte: TamanhoFonte;
  mostrarLinhaProgresso: boolean;
  versaoTamanhoFonte: 2;
};

export const FONT_SCALE_VALUES: TamanhoFonte[] = [1, 2, 3, 4, 5];
const READER_PREFERENCES_STORAGE_KEY = "historietas-preferencias-leitura";

function normalizarTamanhoFonte(
  valor: unknown,
  versaoAtual = false
): TamanhoFonte {
  const numero = Number(valor);

  if (
    versaoAtual &&
    FONT_SCALE_VALUES.includes(numero as TamanhoFonte)
  ) {
    return numero as TamanhoFonte;
  }

  if (!Number.isFinite(numero)) {
    return 3;
  }

  if (numero <= 1) {
    return 1;
  }

  if (numero <= 3) {
    return 2;
  }

  if (numero <= 5) {
    return 3;
  }

  if (numero <= 8) {
    return 4;
  }

  return 5;
}

export function carregarPreferenciasLeitura(userId = ""): PreferenciasLeitura {
  if (typeof window === "undefined" || !userId.trim()) {
    return {
      tamanhoFonte: 3,
      mostrarLinhaProgresso: false,
      versaoTamanhoFonte: 2,
    };
  }

  try {
    const preferenciasTexto = lerStorageUsuarioLeitor(
      READER_PREFERENCES_STORAGE_KEY,
      userId
    );
    const preferenciasJson: unknown = preferenciasTexto
      ? JSON.parse(preferenciasTexto)
      : null;

    if (
      !preferenciasJson ||
      typeof preferenciasJson !== "object" ||
      Array.isArray(preferenciasJson)
    ) {
      return {
        tamanhoFonte: 3,
        mostrarLinhaProgresso: false,
        versaoTamanhoFonte: 2,
      };
    }

    const preferencias = preferenciasJson as Partial<PreferenciasLeitura>;

    return {
      tamanhoFonte: normalizarTamanhoFonte(
        preferencias.tamanhoFonte,
        preferencias.versaoTamanhoFonte === 2
      ),
      mostrarLinhaProgresso: Boolean(preferencias.mostrarLinhaProgresso),
      versaoTamanhoFonte: 2,
    };
  } catch {
    return {
      tamanhoFonte: 3,
      mostrarLinhaProgresso: false,
      versaoTamanhoFonte: 2,
    };
  }
}

export function salvarPreferenciasLeitura(
  preferencias: PreferenciasLeitura,
  userId = ""
) {
  salvarJsonStorageUsuarioLeitor(
    READER_PREFERENCES_STORAGE_KEY,
    userId,
    preferencias
  );
}
