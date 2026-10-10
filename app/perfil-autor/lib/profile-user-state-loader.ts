import { supabase } from "../../../lib/supabase/client";
import {
  carregarAutoresSeguidosSupabase,
  carregarIdsObrasTabelaUsuario,
} from "./profile-user-collections-loader";

export async function carregarEstadoUsuarioSupabase() {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return {
        estadoUsuario: null,
        identidadeConfirmada: true,
      };
    }

    const [favoritas, concluidas, obrasSeguidas, autoresSeguidos] =
      await Promise.all([
        carregarIdsObrasTabelaUsuario("favoritos", userId),
        carregarIdsObrasTabelaUsuario("concluidas", userId),
        carregarIdsObrasTabelaUsuario("seguindo_obras", userId),
        carregarAutoresSeguidosSupabase(userId),
      ]);

    return {
      estadoUsuario: {
        userId,
        favoritas,
        concluidas,
        obrasSeguidas,
        autoresSeguidos,
      },
      identidadeConfirmada: true,
    };
  } catch {
    return {
      estadoUsuario: null,
      identidadeConfirmada: false,
    };
  }
}
