export function aguardarLogin(milisegundos: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milisegundos);
  });
}
