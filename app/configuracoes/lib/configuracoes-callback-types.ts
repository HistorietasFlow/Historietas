export type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

export type TipoMensagemAcaoConfiguracoes = "sucesso" | "erro" | "aviso";

export type MensagemAcaoConfiguracoesVisual = {
  tipo: TipoMensagemAcaoConfiguracoes;
  texto: string;
};

export type MensagemAcaoConfiguracoes = MensagemAcaoConfiguracoesVisual & {
  id: number;
};

export type MostrarMensagemAcaoConfiguracoes = (
  tipo: TipoMensagemAcaoConfiguracoes,
  texto: string,
) => void;
