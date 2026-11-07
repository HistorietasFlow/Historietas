export function criarInvocacaoStatusSupabase({
  plataforma = process.platform,
  comSpec = process.env.ComSpec,
} = {}) {
  if (plataforma === "win32") {
    return {
      comando: comSpec || "cmd.exe",
      argumentos: ["/d", "/s", "/c", "supabase status -o env"],
    };
  }

  return {
    comando: "supabase",
    argumentos: ["status", "-o", "env"],
  };
}
