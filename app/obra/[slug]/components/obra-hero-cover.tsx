import Image from "next/image";
import Link from "next/link";

import {
  coverArtStyle,
  coverTitleStyle,
  desktopCoverArtStyle,
  desktopHeroCoverLinkStyle,
  heroCoverLinkStyle,
} from "../lib/obra-style-utils";

type ObraHeroCoverProps = {
  isDesktop: boolean;
  href: string;
  ariaLabel: string;
  capa: string;
  capaOtimizada: boolean;
  iniciais: string;
};

export default function ObraHeroCover({
  isDesktop,
  href,
  ariaLabel,
  capa,
  capaOtimizada,
  iniciais,
}: ObraHeroCoverProps) {
  return (
    <Link
      href={href}
      style={isDesktop ? desktopHeroCoverLinkStyle : heroCoverLinkStyle}
      aria-label={ariaLabel}
    >
      <div
        style={isDesktop ? desktopCoverArtStyle : coverArtStyle}
        aria-hidden="true"
      >
        {capa ? (
          <Image
            src={capa}
            alt=""
            fill
            sizes="(min-width: 1300px) 650px, (min-width: 1024px) 50vw, 100vw"
            preload
            unoptimized={!capaOtimizada}
            style={{
              objectFit: "cover",
              objectPosition: isDesktop ? "center" : "center top",
            }}
          />
        ) : (
          <strong style={coverTitleStyle}>{iniciais}</strong>
        )}
      </div>
    </Link>
  );
}
