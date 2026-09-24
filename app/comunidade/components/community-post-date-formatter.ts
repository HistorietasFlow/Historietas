import { obterLocaleDocumentoComunidade } from "./community-document-locale";

export function formatarDataComunidade(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Agora";
  }

  return data.toLocaleDateString(obterLocaleDocumentoComunidade(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
