import { LoadingSpinner } from "../components/HomeStatusStates";

export default function Loading() {
  return (
    <main className="historietas-loading-page">
      <LoadingSpinner label="Carregando página" />
    </main>
  );
}
