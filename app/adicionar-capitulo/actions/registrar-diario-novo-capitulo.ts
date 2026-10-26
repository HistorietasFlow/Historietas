import { supabase } from "../../../lib/supabase/client";
import { criarHrefLeituraCapitulo } from "../lib/adicionar-capitulo-route-utils";

type Obra = { id: string; titulo: string; slug: string; publicado: boolean };
type Capitulo = { id: string; titulo: string; ordem?: number };
export async function registrarDiarioNovoCapitulo({ userId, obra, capitulo, numeroCapitulo, criadoEm }: { userId: string; obra: Obra; capitulo: Capitulo; numeroCapitulo: number; criadoEm: string }) {
  try {
    const payload = { user_id: userId, tipo: "publicou_capitulo", obra_id: obra.id, capitulo_id: capitulo.id, texto: "", visibilidade: "publico", metadata: { obra_titulo: obra.titulo, titulo_obra: obra.titulo, capitulo_titulo: capitulo.titulo, numero_capitulo: numeroCapitulo, href: criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo) }, criado_em: criadoEm, atualizado_em: criadoEm };
    const { error } = await supabase.from("diario_atividades").insert(payload);
    if (!error) return;
    await supabase.from("diario_atividades").insert({ user_id: userId, tipo: "publicou_capitulo", obra_id: obra.id, capitulo_id: capitulo.id, texto: "", visibilidade: "publico", criado_em: criadoEm });
  } catch (error) { console.warn("Não consegui registrar o capítulo no Diário:", error); }
}
