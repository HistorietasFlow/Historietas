export function EmBreveAboutNotice({
  visivel,
}: {
  visivel: boolean;
}) {
  return (
    <>
      {visivel && (
        <p
          style={{
            margin: "12px 0 0",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Sobre o aviso
        </p>
      )}
    </>
  );
}
