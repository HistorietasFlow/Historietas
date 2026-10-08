export function timestampData(data: string) {
  const timestamp = new Date(data).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function formatarDataCurta(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .replace(" de ", " ")
    .replace(" de ", " ");
}

export function formatarMesAno(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "SEM DATA";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  })
    .format(new Date(timestamp))
    .toLocaleUpperCase("pt-BR");
}

export function formatarLeituraMesAno(data: string) {
  const timestamp = timestampData(data);

  if (!timestamp) {
    return "";
  }

  const mesAno = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));

  return `Lido em ${mesAno}`;
}

export function compactarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: valor >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Math.max(0, valor));
}

export function formatarNotaListas(nota: number) {
  if (!Number.isFinite(nota) || nota <= 0) {
    return "0";
  }

  const notaArredondada = Math.round(nota * 10) / 10;

  return Number.isInteger(notaArredondada)
    ? String(notaArredondada)
    : notaArredondada.toFixed(1).replace(".", ",");
}
