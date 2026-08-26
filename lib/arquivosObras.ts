const UUID_VALIDO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RespostaUrlArquivoObra = {
  ok?: unknown;
  url?: unknown;
  mensagem?: unknown;
};

export async function solicitarUrlTemporariaArquivoObra(
  obraId: string,
  signal?: AbortSignal,
) {
  const obraIdLimpo = obraId.trim();

  if (!UUID_VALIDO.test(obraIdLimpo)) {
    throw new Error("Obra inválida para liberar o arquivo.");
  }

  const resposta = await fetch("/api/arquivos-obras/url", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ obraId: obraIdLimpo }),
    signal,
  });

  const dados = (await resposta.json().catch(() => null)) as
    | RespostaUrlArquivoObra
    | null;

  if (!resposta.ok || dados?.ok !== true || typeof dados.url !== "string") {
    const mensagem =
      typeof dados?.mensagem === "string" && dados.mensagem.trim()
        ? dados.mensagem.trim()
        : "Não foi possível liberar o arquivo da obra agora.";

    throw new Error(mensagem);
  }

  const url = dados.url.trim();

  if (!/^https:\/\//i.test(url)) {
    throw new Error("O servidor retornou uma URL de arquivo inválida.");
  }

  return url;
}
