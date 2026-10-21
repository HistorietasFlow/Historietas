export type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

export type MostrarMensagemAcaoConfiguracoes = (
  tipo: "sucesso" | "erro" | "aviso",
  texto: string,
) => void;
