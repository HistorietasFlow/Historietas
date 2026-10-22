export type ExecutarAcaoComArgumentosConfiguracoes<
  Argumentos extends unknown[],
> = (...argumentos: Argumentos) => void;

export type VerificarCondicaoConfiguracoes<Argumentos extends unknown[]> = (
  ...argumentos: Argumentos
) => boolean;

export type ExecutarAcaoConfiguracoes = () => void;

export type ExecutarAcaoAssincronaConfiguracoes = () => Promise<void>;

export type ExecutarAcaoAssincronaComArgumentoConfiguracoes<Argumento> = (
  argumento: Argumento,
) => Promise<void>;

export type AtualizarValorConfiguracoes<Valor> = (valor: Valor) => void;

export type AtualizarTextoConfiguracoes = AtualizarValorConfiguracoes<string>;

export type AtualizarCampoConfiguracoes<Objeto> = <K extends keyof Objeto>(
  campo: K,
  valor: Objeto[K],
) => void;
