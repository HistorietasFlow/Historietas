type ArquivoObraAtualizacao = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
};

type CriarPayloadAtualizacaoObraParams = {
  tituloFinal: string;
  autorFinal: string;
  generoFinalSalvo: string;
  formatoFinalSalvo: string;
  classificacaoFinal: string;
  avisosConteudoFinal: string[];
  sinopseFinal: string;
  tagsFinais: string[];
  capaFinal: string;
  capaNomeFinal: string;
  arquivoObraFinal: ArquivoObraAtualizacao | null;
  agora: string;
};

export function criarPayloadAtualizacaoObra({
  tituloFinal,
  autorFinal,
  generoFinalSalvo,
  formatoFinalSalvo,
  classificacaoFinal,
  avisosConteudoFinal,
  sinopseFinal,
  tagsFinais,
  capaFinal,
  capaNomeFinal,
  arquivoObraFinal,
  agora,
}: CriarPayloadAtualizacaoObraParams) {
  return {
    titulo: tituloFinal,
    autor: autorFinal,
    genero: generoFinalSalvo,
    formato: formatoFinalSalvo,
    classificacao_indicativa: classificacaoFinal,
    avisos_conteudo: avisosConteudoFinal,
    sinopse: sinopseFinal,
    tags: tagsFinais,
    capa_url: capaFinal,
    capa_nome: capaNomeFinal,
    arquivo_url: arquivoObraFinal?.conteudo || "",
    arquivo_nome: arquivoObraFinal?.nome || "",
    arquivo_tipo: arquivoObraFinal?.tipo || "",
    arquivo_tamanho: arquivoObraFinal?.tamanho || 0,
    arquivo_categoria: arquivoObraFinal?.categoria || "outro",
    atualizado_em: agora,
  };
}
