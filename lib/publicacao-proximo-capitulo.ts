import { idObraSupabaseValido } from "./utils";

const CHAVE = "historietas-publicacao-proximo-capitulo";

type ConfirmacaoPublicacao = {
  autorId: string;
  obraId: string;
  capituloId: string;
};

export function registrarProximoCapitulo(confirmacao: ConfirmacaoPublicacao | null) {
  try {
    if (confirmacao) {
      window.sessionStorage.setItem(CHAVE, JSON.stringify(confirmacao));
    } else {
      window.sessionStorage.removeItem(CHAVE);
    }
  } catch {
    // O atalho é opcional. Uma restrição do navegador não impede a navegação.
  }
}

export function lerProximoCapitulo(autorId: string): ConfirmacaoPublicacao | null {
  try {
    const registro: Partial<ConfirmacaoPublicacao> | null = JSON.parse(
      window.sessionStorage.getItem(CHAVE) || "null",
    );
    if (
      autorId &&
      registro?.autorId === autorId &&
      typeof registro.obraId === "string" &&
      idObraSupabaseValido(registro.obraId) &&
      typeof registro.capituloId === "string" &&
      idObraSupabaseValido(registro.capituloId)
    ) {
      return { autorId, obraId: registro.obraId, capituloId: registro.capituloId };
    }
  } catch {
    // Uma leitura indisponível ou inválida equivale a não ter confirmação.
  }
  return null;
}
