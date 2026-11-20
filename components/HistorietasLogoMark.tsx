import Image from "next/image";

export default function HistorietasLogoMark() {
  return (
    <Image
      src="/icon-192.png"
      alt=""
      width={192}
      height={192}
      unoptimized
      loading="eager"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        objectFit: "contain",
      }}
    />
  );
}
