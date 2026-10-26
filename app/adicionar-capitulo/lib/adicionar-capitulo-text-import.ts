import {
  contarLetrasNumeros,
  criarTituloPorNomeArquivo,
} from "./adicionar-capitulo-text-utils";
import { calcularEstatisticasCapitulo } from "./adicionar-capitulo-metrics-utils";

export const MAX_TEXT_FILE_SIZE_BYTES = 700 * 1024;

type ArquivoTextoAdicionarCapitulo = {
  name: string;
  size: number;
  text: () => Promise<string>;
};

type ResultadoImportacaoArquivoTexto =
  | {
      ok: true;
      textoImportado: string;
      tituloArquivo: string;
      resumoArquivo: string;
    }
  | {
      ok: false;
      erro: string;
    };

export async function prepararImportacaoArquivoTextoAdicionarCapitulo(
  arquivo: ArquivoTextoAdicionarCapitulo,
  tituloAtual: string,
  numeroNovoCapitulo: number
): Promise<ResultadoImportacaoArquivoTexto> {
  const nomeMinusculo = arquivo.name.toLowerCase();
  const extensaoValida =
    nomeMinusculo.endsWith(".txt") || nomeMinusculo.endsWith(".md");

  if (!extensaoValida) {
    return {
      ok: false,
      erro: "Envie um arquivo .txt ou .md para importar o texto do capítulo.",
    };
  }

  if (arquivo.size > MAX_TEXT_FILE_SIZE_BYTES) {
    return {
      ok: false,
      erro: "Esse arquivo é grande demais. Use um arquivo de até 700 KB.",
    };
  }

  try {
    const conteudoArquivo = await arquivo.text();
    const textoImportado = conteudoArquivo.replace(/\r\n/g, "\n").trim();

    if (contarLetrasNumeros(textoImportado) < 20) {
      return {
        ok: false,
        erro: "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo.",
      };
    }

    const tituloArquivo = criarTituloPorNomeArquivo(arquivo.name);
    const estatisticasImportadas = calcularEstatisticasCapitulo(
      tituloArquivo || tituloAtual,
      textoImportado,
      numeroNovoCapitulo
    );

    return {
      ok: true,
      textoImportado,
      tituloArquivo,
      resumoArquivo: `${arquivo.name} • ${estatisticasImportadas.palavras} palavras • ${estatisticasImportadas.minutosLeitura} min`,
    };
  } catch {
    return {
      ok: false,
      erro: "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente.",
    };
  }
}
