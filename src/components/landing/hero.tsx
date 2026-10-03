import { ArrowRightIcon, RulerIcon, TruckIcon, WrenchIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { CloudinaryImage } from "@/components/cloudinary-image";
import { GeneralWhatsappLink } from "@/components/site/general-whatsapp-link";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { joinList } from "@/lib/text";

/** Retraso de la entrada escalonada (.hero-rise en globals.css). */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/** Hero (PRD RF-L01): titular escalonado, dos CTA y un espejo con brillo y parallax. */
export function Hero({
  whatsappNumber,
  coverageAreas,
  image,
}: {
  whatsappNumber: string;
  coverageAreas: string[];
  /** Foto principal de la configuración o la portada de un destacado; null = ilustración. */
  image: { src: string; alt: string } | null;
}) {
  const coverage = coverageAreas.length > 0 ? joinList(coverageAreas.slice(0, 3)) : null;

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-20 lg:pb-24">
        <div>
          <p className="hero-rise text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Espejos · A la medida · Colombia
          </p>
          <h1 className="mt-5 font-heading text-[2.9rem] leading-[1.02] font-semibold text-balance sm:text-6xl lg:text-7xl">
            <span className="hero-rise block" style={delay(80)}>
              Espejos que
            </span>
            <span className="hero-rise block" style={delay(160)}>
              transforman
            </span>
            <span className="hero-rise block italic" style={delay(240)}>
              tus espacios
            </span>
          </h1>
          <p
            className="hero-rise mt-6 max-w-lg text-lg text-pretty text-muted-foreground"
            style={delay(320)}
          >
            Redondos, con luz LED, de cuerpo entero o hechos a tu medida. Elige el tuyo y consúltalo
            por WhatsApp en un toque.
          </p>

          <div className="hero-rise mt-8 flex flex-wrap gap-3" style={delay(400)}>
            <Link
              href="/espejos"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Ver catálogo
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
            {whatsappNumber && (
              <GeneralWhatsappLink
                whatsappNumber={whatsappNumber}
                channel="landing-hero"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-foreground/15 bg-background/70 px-6 font-medium backdrop-blur transition-colors hover:border-whatsapp focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <WhatsappIcon className="size-5 text-whatsapp" />
                Escríbenos por WhatsApp
              </GeneralWhatsappLink>
            )}
          </div>

          <ul
            className="hero-rise mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
            style={delay(480)}
          >
            <li className="flex items-center gap-2">
              <RulerIcon className="size-4" aria-hidden />
              Fabricamos a la medida
            </li>
            <li className="flex items-center gap-2">
              <TruckIcon className="size-4" aria-hidden />
              Envío a tu ciudad
            </li>
            <li className="flex items-center gap-2">
              <WrenchIcon className="size-4" aria-hidden />
              {coverage ? `Instalación en ${coverage}` : "Instalación"}
            </li>
          </ul>
        </div>

        <HeroMirror image={image} />
      </div>
    </section>
  );
}

function HeroMirror({ image }: { image: { src: string; alt: string } | null }) {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
      {/* Halo cálido detrás del espejo. */}
      <div
        aria-hidden
        className="absolute inset-x-[8%] top-[12%] bottom-0 rounded-full bg-accent blur-3xl"
      />
      {/* Parallax con CSS ligado al scroll (.hero-parallax en globals.css): sin JavaScript. */}
      <div className="hero-parallax relative">
        <div
          className="hero-rise relative mx-auto aspect-4/5 w-[82%] overflow-hidden rounded-t-full rounded-b-[2rem] border-[10px] border-white bg-muted shadow-[0_40px_80px_-30px_oklch(0.3_0.03_60/0.45)]"
          style={delay(200)}
        >
          {image ? (
            <CloudinaryImage
              src={image.src}
              alt={image.alt}
              preset="detail"
              fill
              preload
              sizes="(min-width: 1024px) 38vw, 80vw"
              className="object-cover"
            />
          ) : (
            <MirrorIllustration />
          )}
          <span aria-hidden className="hero-sheen" />
        </div>
      </div>
    </div>
  );
}

/** Sin foto: un espejo con el reflejo difuso de una ventana y una planta. */
function MirrorIllustration() {
  return (
    <div aria-hidden className="mirror-surface relative size-full">
      <div className="absolute top-[18%] right-[14%] h-[38%] w-[30%] rounded-t-full bg-white/70 blur-md" />
      <div className="absolute bottom-[6%] left-[10%] size-[34%] rounded-full bg-[oklch(0.78_0.05_140/0.45)] blur-xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-[oklch(0.86_0.02_70/0.7)] to-transparent" />
    </div>
  );
}
