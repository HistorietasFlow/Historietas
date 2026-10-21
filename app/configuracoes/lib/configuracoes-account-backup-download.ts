export function baixarBackupConfiguracoes(backup: string) {
  const dataAtual = new Date().toISOString().slice(0, 10);
  const arquivo = new Blob([backup], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = `historietas-backup-${dataAtual}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
