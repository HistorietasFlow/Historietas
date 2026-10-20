"use client";

type NotificacoesEmptyStateProps = {
  mensagem: string;
};

export default function NotificacoesEmptyState({
  mensagem,
}: NotificacoesEmptyStateProps) {
  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {mensagem}
    </p>
  );
}
