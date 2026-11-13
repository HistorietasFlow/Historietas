import type { Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import {
  idUsuarioSupabaseValido,
  normalizarUsernameConfiguracoes,
} from "./configuracoes-account-utils";
import { carregarResumoContaSupabase } from "./configuracoes-account-summary-supabase";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioConfiguracoes,
} from "./configuracoes-account-models";
import { carregarPreferencias, salvarPreferencias } from "./configuracoes-account-preferences";
import { traduzirErroUsernameConfiguracoes } from "./configuracoes-error-messages";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";
import { salvarPerfilConfiguracoesSupabase } from "./configuracoes-profile-supabase-saver";
import type { RedirecionarLoginConfiguracoes } from "./configuracoes-navigation-types";
import type {
  LimparMensagemAcaoConfiguracoes,
  MostrarMensagemAcaoConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "./configuracoes-callback-types";

export async function salvarConfiguracoesPerfil({
  salvando,
  usuarioIdLogado,
  preferencias,
  usuario,
  language,
  redirecionarLogin,
  setMensagemAcao,
  mostrarMensagemAcao,
  traduzirTexto,
  setErroUsername,
  setSalvando,
  setPreferencias,
  setUsuario,
  setResumo,
  execucaoEstaAtual = () => true,
}: {
  execucaoEstaAtual?: () => boolean;
  salvando: boolean;
  usuarioIdLogado: string;
  preferencias: PreferenciasConta;
  privacidade: PreferenciasPrivacidadeHistorietas;
  usuario: UsuarioConfiguracoes | null;
  language: HistorietasLanguage;
  redirecionarLogin: RedirecionarLoginConfiguracoes;
  setMensagemAcao: LimparMensagemAcaoConfiguracoes;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  setErroUsername: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setUsuario: Dispatch<SetStateAction<UsuarioConfiguracoes | null>>;
  setResumo: Dispatch<SetStateAction<ResumoLocal>>;
}) {
  if (salvando || !execucaoEstaAtual()) {
    return;
  }

  setMensagemAcao(null);

  const userIdSeguro = usuarioIdLogado.trim();
  const usernameLimpo = normalizarUsernameConfiguracoes(preferencias.username);

  if (!idUsuarioSupabaseValido(userIdSeguro)) {
    redirecionarLogin();
    return;
  }

  if (preferencias.username.trim() && usernameLimpo.length < 3) {
    const mensagem = traduzirTexto(
      "Use pelo menos 3 caracteres no @username.",
      "Use at least 3 characters in the @username.",
      "Usa al menos 3 caracteres en el @username.",
    );

    setErroUsername(mensagem);
    mostrarMensagemAcao("erro", mensagem);
    return;
  }

  const preferenciasNormalizadas: PreferenciasConta = {
    ...preferencias,
    nomeExibicao: preferencias.nomeExibicao.trim(),
    username: usernameLimpo,
    emailContato: preferencias.emailContato.trim(),
  };

  setSalvando(true);
  setErroUsername("");

  try {
    const { data: dadosUsuarioAtual, error: erroUsuarioAtual } =
      await supabase.auth.getUser();
    if (!execucaoEstaAtual()) return;
    const usuarioAtualId = dadosUsuarioAtual.user?.id || "";

    if (
      erroUsuarioAtual ||
      !idUsuarioSupabaseValido(usuarioAtualId) ||
      usuarioAtualId !== userIdSeguro
    ) {
      redirecionarLogin();
      return;
    }

    const falhasSincronizacao: string[] = [];

    const resultadoPerfil = await salvarPerfilConfiguracoesSupabase({
      userId: userIdSeguro,
      nome:
        preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
      username: usernameLimpo,
    });

    if (!execucaoEstaAtual()) return;
    if (!resultadoPerfil.ok) {
      const mensagem = traduzirErroUsernameConfiguracoes(
        resultadoPerfil.erro,
        language,
      );

      setErroUsername(mensagem);
      mostrarMensagemAcao("erro", mensagem);
      return;
    }

    const { error: erroMetadata } = await supabase.auth.updateUser({
      data: {
        nome:
          preferenciasNormalizadas.nomeExibicao ||
          usuario?.nome ||
          "Usuário",
        username: usernameLimpo,
      },
    });

    if (!execucaoEstaAtual()) return;
    if (erroMetadata) {
      falhasSincronizacao.push("metadados");
      console.warn(
        "O perfil foi salvo, mas os metadados da autenticação não sincronizaram:",
        erroMetadata.message,
      );
    }

    // A privacidade é salva por sua própria ação. Reenviar o snapshot desta
    // submissão poderia desfazer uma escolha feita enquanto o perfil salvava.
    const preferenciasParaCache = {
      ...preferenciasNormalizadas,
      receberAvisos: carregarPreferencias(userIdSeguro).receberAvisos,
    };
    if (!salvarPreferencias(preferenciasParaCache, userIdSeguro)) {
      falhasSincronizacao.push("preferencias_locais");
    }
    setPreferencias((atuais) => !execucaoEstaAtual() ? atuais : ({
      ...atuais,
      nomeExibicao: atuais.nomeExibicao === preferencias.nomeExibicao ? preferenciasNormalizadas.nomeExibicao : atuais.nomeExibicao,
      username: atuais.username === preferencias.username ? usernameLimpo : atuais.username,
      emailContato: atuais.emailContato === preferencias.emailContato ? preferenciasNormalizadas.emailContato : atuais.emailContato,
    }));
    setUsuario((usuarioAtual) =>
      usuarioAtual && usuarioAtual.id === userIdSeguro && execucaoEstaAtual()
        ? {
            ...usuarioAtual,
            nome:
              preferenciasNormalizadas.nomeExibicao || usuarioAtual.nome,
            username: usernameLimpo,
            email:
              preferenciasNormalizadas.emailContato || usuarioAtual.email,
          }
        : usuarioAtual,
    );
    const resumoAtualizado = await carregarResumoContaSupabase(userIdSeguro);
    if (!execucaoEstaAtual()) return;
    setResumo(resumoAtualizado);

    if (falhasSincronizacao.length > 0) {
      mostrarMensagemAcao(
        "aviso",
        traduzirTexto(
          "O perfil foi salvo, mas não foi possível confirmar todas as preferências. Tente novamente.",
          "The profile was saved, but not all preferences could be confirmed. Try again.",
          "El perfil se guardó, pero no se pudieron confirmar todas las preferencias. Inténtalo de nuevo.",
        ),
      );
    } else {
      mostrarMensagemAcao(
        "sucesso",
        traduzirTexto(
          "Perfil salvo com sucesso.",
          "Profile saved successfully.",
          "Perfil guardado correctamente.",
        ),
      );
    }
  } catch (error) {
    if (!execucaoEstaAtual()) return;
    console.warn("Não consegui salvar as configurações da conta:", error);

    const mensagem = traduzirTexto(
      "Não consegui salvar suas alterações agora.",
      "I could not save your changes right now.",
      "No pude guardar tus cambios ahora.",
    );

    setErroUsername(mensagem);
    mostrarMensagemAcao("erro", mensagem);
  } finally {
    if (execucaoEstaAtual()) setSalvando(false);
  }
}
