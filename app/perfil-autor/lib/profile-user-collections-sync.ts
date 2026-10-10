import { supabase } from "../../../lib/supabase/client";
import type { VisibilidadeDiarioPerfil } from "../types";

export async function sincronizarTabelaUsuario(
  tabela: "favoritos" | "concluidas" | "salvos_capitulos" | "seguindo_obras",
  idValor: string,
  ativo: boolean,
  visibilidade: VisibilidadeDiarioPerfil = "parcial",
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !idValor) {
      return;
    }

    const operacoes = {
      favoritos: {
        excluir: () =>
          supabase
            .from("favoritos")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", idValor),
        inserir: () =>
          supabase.from("favoritos").insert({
            user_id: userId,
            obra_id: idValor,
            visibilidade,
          }),
      },
      concluidas: {
        excluir: () =>
          supabase
            .from("concluidas")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", idValor),
        inserir: () =>
          supabase.from("concluidas").insert({
            user_id: userId,
            obra_id: idValor,
            visibilidade,
          }),
      },
      salvos_capitulos: {
        excluir: () =>
          supabase
            .from("salvos_capitulos")
            .delete()
            .eq("user_id", userId)
            .eq("capitulo_id", idValor),
        inserir: () =>
          supabase.from("salvos_capitulos").insert({
            user_id: userId,
            capitulo_id: idValor,
          }),
      },
      seguindo_obras: {
        excluir: () =>
          supabase
            .from("seguindo_obras")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", idValor),
        inserir: () =>
          supabase.from("seguindo_obras").insert({
            user_id: userId,
            obra_id: idValor,
            visibilidade,
          }),
      },
    };
    const operacao = operacoes[tabela];
    const { error: erroDelete } = await operacao.excluir();

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const { error: erroInsert } = await operacao.inserir();

    if (erroInsert) {
      throw erroInsert;
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no perfil:`, error);
    // A ação local permanece funcionando se o Supabase falhar.
  }
}

export async function sincronizarAutorSeguidoSupabase(autor: string, ativo: boolean) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !autor) {
      return;
    }

    if (ativo) {
      await supabase.from("seguindo_autores").upsert(
        {
          user_id: userId,
          autor_nome: autor,
        },
        { onConflict: "user_id,autor_nome" },
      );
      return;
    }

    await supabase
      .from("seguindo_autores")
      .delete()
      .eq("user_id", userId)
      .eq("autor_nome", autor);
  } catch {
    // A ação local permanece funcionando se o Supabase falhar.
  }
}
