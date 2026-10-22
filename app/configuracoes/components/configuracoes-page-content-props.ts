import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioBloqueadoConfiguracoes,
} from "../lib/configuracoes-account-models";
import type {
  AbrirExclusaoContaConfiguracoes,
  AbrirSegurancaConfiguracoes,
  AlternarAprovacaoNovosSeguidoresConfiguracoes,
  AlternarPerfilPrivadoConfiguracoes,
  AlternarReceberAvisosConfiguracoes,
  AtualizarPreferenciaConfiguracoes,
  AtualizarPrivacidadeConfiguracoes,
  AtualizarBuscaConfiguracoes,
  AplicarPrivacidadeAtualizadaConfiguracoes,
  AlternarUsuariosBloqueadosConfiguracoes,
  BaixarBackupConfiguracoes,
  CarregarUsuariosBloqueadosConfiguracoes,
  CopiarBackupConfiguracoes,
  DeveMostrarConfiguracoes,
  DesbloquearUsuarioConfiguracoes,
  LimparErroUsernameConfiguracoes,
  SalvarConfiguracoes,
  SairDaContaConfiguracoes,
  TraduzirTextoConfiguracoes,
  VoltarConfiguracoes,
} from "../lib/configuracoes-callback-types";
import type { PreferenciasPrivacidadeHistorietas } from "../lib/configuracoes-privacy-preferences";

export type ConfiguracoesPageContentProps = {
  busca: string;
  onBuscaChange: AtualizarBuscaConfiguracoes;
  onVoltar: VoltarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  deveMostrar: DeveMostrarConfiguracoes;
  preferencias: PreferenciasConta;
  privacidade: PreferenciasPrivacidadeHistorietas;
  resumo: ResumoLocal;
  totalBiblioteca: number;
  notificacoesNaoLidas: number;
  usuarioNome?: string;
  usuarioEmail?: string;
  erroUsername: string;
  salvando: boolean;
  adminLiberado: boolean;
  mostrarUsuariosBloqueados: boolean;
  usuariosBloqueados: UsuarioBloqueadoConfiguracoes[];
  carregandoUsuariosBloqueados: boolean;
  desbloqueandoUsuarioId: string;
  erroUsuariosBloqueados: string;
  onAtualizarPreferencia: AtualizarPreferenciaConfiguracoes;
  onLimparErroUsername: LimparErroUsernameConfiguracoes;
  onSalvar: SalvarConfiguracoes;
  onAbrirSeguranca: AbrirSegurancaConfiguracoes;
  onAlternarPerfilPrivado: AlternarPerfilPrivadoConfiguracoes;
  onAlternarAprovacaoNovosSeguidores: AlternarAprovacaoNovosSeguidoresConfiguracoes;
  onCarregarUsuariosBloqueados: CarregarUsuariosBloqueadosConfiguracoes;
  onAlternarUsuariosBloqueados: AlternarUsuariosBloqueadosConfiguracoes;
  onDesbloquearUsuario: DesbloquearUsuarioConfiguracoes;
  onAtualizarPrivacidade: AtualizarPrivacidadeConfiguracoes;
  onAplicarPrivacidadeAtualizada: AplicarPrivacidadeAtualizadaConfiguracoes;
  onAlternarReceberAvisos: AlternarReceberAvisosConfiguracoes;
  onCopiarBackup: CopiarBackupConfiguracoes;
  onBaixarBackup: BaixarBackupConfiguracoes;
  onAbrirExclusaoConta: AbrirExclusaoContaConfiguracoes;
  onSairDaConta: SairDaContaConfiguracoes;
};
