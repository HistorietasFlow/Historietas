import { supabase } from "../../../lib/supabase/client";
import { uuidDiarioEdicaoValido, referenciaTextoCapitulo, type ReferenciaTextoCapitulo } from "./editar-capitulo-save-recovery";

type Resultado = { estado: "confirmado"; referencia: ReferenciaTextoCapitulo; versaoDiario: string | null } |
  { estado: "rejeitado" | "incerto" | "conflito"; mensagem?: string };

export async function salvarTextoCapituloRemoto(
  referencia: ReferenciaTextoCapitulo,
  titulo: string,
  texto: string,
): Promise<Resultado> {
  try {
    const escrita = supabase.from("capitulos").update({titulo, texto, atualizado_em: new Date().toISOString()})
      .eq("id", referencia.id).eq("obra_id", referencia.obra_id).eq("user_id", referencia.user_id)
      .filter("tipo_conteudo", "eq", "texto").eq("atualizado_em", referencia.atualizado_em)
      .eq("ordem", referencia.ordem).eq("publicado", referencia.publicado);
    // A trigger existente renova atualizado_em. Não colocar texto privado nos
    // filtros da URL: capítulos extensos também precisam poder ser salvos.
    const {data, error} = await escrita.select("*");
    if (error) return {estado: /^(?:22|23|42|44|P0)[0-9A-Z]{3}$/.test(error.code || "") ? "rejeitado" : "incerto", mensagem: error.message};
    if (Array.isArray(data) && data.length === 0) return {estado: "conflito"};
    const confirmada = Array.isArray(data) && data.length === 1 ? referenciaTextoCapitulo(data[0]) : null;
    if (!confirmada || confirmada.id !== referencia.id || confirmada.obra_id !== referencia.obra_id ||
        confirmada.user_id !== referencia.user_id || confirmada.titulo !== titulo || confirmada.texto !== texto ||
        confirmada.atualizado_em === referencia.atualizado_em ||
        confirmada.publicado !== referencia.publicado || confirmada.ordem !== referencia.ordem) return {estado: "incerto"};
    // SELECT * na representação do próprio PATCH: campo opcional não pode quebrar
    // o save antes da migration. Nunca buscar o token por GET ou repetir o UPDATE.
    const token = (data[0] as Record<string, unknown>).diario_edicao_versao;
    return {estado: "confirmado", referencia: confirmada, versaoDiario: (referencia.titulo !== titulo || referencia.texto !== texto) && uuidDiarioEdicaoValido(token) ? token : null};
  } catch {
    return {estado: "incerto"};
  }
}
