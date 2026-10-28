import { accessMessageStyle } from "../lib/em-breve-styles";

export function EmBreveEmptyState({
  avisoAcesso,
  nomeObra,
}: {
  avisoAcesso: string;
  nomeObra: string;
}) {
  return (
    <>
      {avisoAcesso && <p style={accessMessageStyle}>{avisoAcesso}</p>}

      <p
        style={{
          margin: "10px 0 0",
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        {nomeObra
          ? "Essa obra ainda não está disponível"
          : "Ainda não há lançamentos em breve"}
      </p>
    </>
  );
}
