import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const segredoLimitador =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

type ConfiguracaoLimite = {
  admin: SupabaseClient;
  escopo: string;
  identificador: string;
  limite: number;
  janelaSegundos: number;
  bloqueioSegundos: number;
};

export type ResultadoLimite = {
  permitido: boolean;
  restante: number;
  tentarNovamenteSegundos: number;
};

function normalizarInteiroNaoNegativo(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.max(0, Math.trunc(numero));
}

function normalizarIp(valor: string | null) {
  const candidato = valor?.split(",")[0]?.trim().toLowerCase() || "";

  return isIP(candidato) ? candidato : null;
}

export function criarChaveProtecao(escopo: string, identificador: string) {
  const escopoLimpo = escopo.trim();
  const identificadorLimpo = identificador.trim();

  if (!segredoLimitador || !escopoLimpo || !identificadorLimpo) {
    throw new Error("Não foi possível criar a chave do limitador.");
  }

  return createHmac("sha256", segredoLimitador)
    .update(escopoLimpo)
    .update("\0")
    .update(identificadorLimpo)
    .digest("hex");
}

export function obterIpConfiavel(request: NextRequest) {
  if (process.env.VERCEL === "1") {
    return normalizarIp(request.headers.get("x-real-ip"));
  }

  if (process.env.NODE_ENV !== "production") {
    return (
      normalizarIp(request.headers.get("x-real-ip")) ||
      normalizarIp(request.headers.get("x-forwarded-for")) ||
      "127.0.0.1"
    );
  }

  // Fora do proxy confiável da Vercel, é mais seguro não contar uma visita
  // anônima do que aceitar um cabeçalho de IP controlável pelo cliente.
  return null;
}

export async function consumirLimiteRequisicao({
  admin,
  escopo,
  identificador,
  limite,
  janelaSegundos,
  bloqueioSegundos,
}: ConfiguracaoLimite): Promise<ResultadoLimite> {
  const chaveHash = criarChaveProtecao(escopo, identificador);
  const { data, error } = await admin.rpc("consumir_limite_requisicao", {
    p_escopo: escopo,
    p_chave_hash: chaveHash,
    p_limite: limite,
    p_janela_segundos: janelaSegundos,
    p_bloqueio_segundos: bloqueioSegundos,
  });

  if (error) {
    throw new Error(`O limitador recusou a operação: ${error.message}`);
  }

  const primeiroRegistro = Array.isArray(data) ? data[0] : data;

  if (!primeiroRegistro || typeof primeiroRegistro !== "object") {
    throw new Error("O limitador retornou uma resposta inválida.");
  }

  const registro = primeiroRegistro as Record<string, unknown>;

  if (typeof registro.permitido !== "boolean") {
    throw new Error("O limitador não informou se a operação foi permitida.");
  }

  return {
    permitido: registro.permitido,
    restante: normalizarInteiroNaoNegativo(registro.restante),
    tentarNovamenteSegundos: normalizarInteiroNaoNegativo(
      registro.tentar_novamente_segundos,
    ),
  };
}
