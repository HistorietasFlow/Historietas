export function copiarTextoComFallback(texto: string) {
  const campo = document.createElement("textarea");
  campo.value = texto;
  campo.setAttribute("readonly", "true");
  campo.style.position = "fixed";
  campo.style.left = "-9999px";
  document.body.appendChild(campo);
  campo.select();

  let copiado = false;

  try {
    copiado = document.execCommand("copy");
  } catch {
    copiado = false;
  }

  document.body.removeChild(campo);
  return copiado;
}
