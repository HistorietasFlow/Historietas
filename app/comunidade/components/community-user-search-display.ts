export function obterInicialAvatarUsuarioBuscaComunidade(nome: string) {
  return nome.slice(0, 1).toUpperCase() || "U";
}

export function obterTextoUsernameUsuarioBuscaComunidade(username: string) {
  return username ? `@${username}` : "Perfil da comunidade";
}
