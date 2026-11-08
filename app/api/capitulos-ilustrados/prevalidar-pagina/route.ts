import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ErroImagemPagina, validarImagemPagina } from "@/lib/server/capitulos-ilustrados/validar-imagem-pagina";
import { criarRecepcaoPrevalidacao, ErroPrevalidacao } from "@/lib/server/capitulos-ilustrados/receber-prevalidacao-pagina";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
function clienteUsuario(token: string) {
  if (!url || !key) throw new ErroPrevalidacao(503, "prevalidacao_indisponivel");
  return createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export const POST = criarRecepcaoPrevalidacao({
  async autenticar(token) {
    const { data, error } = await clienteUsuario(token).auth.getUser(token);
    if (error && (!error.status || error.status >= 500)) throw new ErroPrevalidacao(503, "autenticacao_indisponivel");
    return !error && data.user ? { usuarioId: data.user.id } : null;
  },
  async limitar(token) {
    const { data, error } = await clienteUsuario(token).rpc("limitar_prevalidacao_pagina_capitulo");
    if (error || !data || typeof data !== "object" || Array.isArray(data) ||
      typeof data.permitido !== "boolean" || typeof data.tentarNovamenteSegundos !== "number") {
      throw new ErroPrevalidacao(503, "limitador_indisponivel");
    }
    return { permitido: data.permitido, tentarNovamenteSegundos: data.tentarNovamenteSegundos };
  },
  async conferir(token, dados) {
    const { data, error } = await clienteUsuario(token).rpc("conferir_reserva_pagina_capitulo", {
      p_reserva_id: dados.reservaId, p_capitulo_id: dados.capituloId, p_versao_esperada: dados.versaoEsperada,
    });
    if (error) {
      if (error.code === "42501") throw new ErroPrevalidacao(403, "reserva_indisponivel");
      if (error.code === "PT409") throw new ErroPrevalidacao(409, "versao_ou_estado_alterado");
      if (error.code === "PT410") throw new ErroPrevalidacao(410, "reserva_encerrada");
      throw new ErroPrevalidacao(503, "conferencia_indisponivel");
    }
    if (!data || typeof data !== "object" || Array.isArray(data) ||
      typeof data.usuarioId !== "string" || typeof data.mimeType !== "string" ||
      typeof data.expiraEm !== "string" || !Number.isSafeInteger(data.versaoEsperada)) {
      throw new ErroPrevalidacao(503, "conferencia_indisponivel");
    }
    return { usuarioId: data.usuarioId, mimeType: data.mimeType,
      expiraEm: data.expiraEm, versaoEsperada: data.versaoEsperada as number };
  },
  async validar(bytes) {
    try { return await validarImagemPagina(bytes); }
    catch (erro) {
      if (!(erro instanceof ErroImagemPagina)) throw erro;
      throw new ErroPrevalidacao(erro.codigo === "arquivo_grande" ? 413 : erro.codigo === "validacao_ocupada" ? 503 : 422, erro.codigo);
    }
  },
});
