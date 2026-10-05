import {
  ArrowRightIcon,
  MapPinIcon,
  RulerIcon,
  SearchIcon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { MirrorPlaceholder } from "@/components/catalog/mirror-placeholder";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { FeaturedCard } from "@/components/landing/featured-card";
import { CountUp } from "@/components/landing/client-effects";
import { Reveal } from "@/components/landing/reveal";
import { GeneralWhatsappLink } from "@/components/site/general-whatsapp-link";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import type { MirrorShape } from "@/generated/prisma/enums";
import { SHAPE_LABELS } from "@/lib/catalog";
import { shapeSlugOf } from "@/lib/catalog-filters";
import type { FeaturedProduct, LandingCategory } from "@/lib/catalog-public";
import { cn } from "@/lib/utils";

// Secciones de la página de inicio (PRD §6.1). Servidor; lo animado son piezas cliente pequeñas.

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  id: string;
}) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">{eyebrow}</p>
        <h2 id={id} className="mt-3 font-heading text-4xl font-semibold text-balance sm:text-5xl">
          {title}
        </h2>
        {description && <p className="mt-3 text-pretty text-muted-foreground">{description}</p>}
      </div>
      {action}
    </Reveal>
  );
}

function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
    >
      {children}
      <ArrowRightIcon
        className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden
      />
    </Link>
  );
}

// ── Categorías (RF-L02) ───────────────────────────────────────────────────────

export function CategoriesSection({ categories }: { categories: LandingCategory[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="landing-categorias" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <SectionHeading
        id="landing-categorias"
        eyebrow="Categorías"
        title="Un espejo para cada espacio"
        action={<ArrowLink href="/espejos">Ver todo el catálogo</ArrowLink>}
      />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
        {categories.map((category, index) => (
          <li key={category.slug}>
            <Reveal delay={Math.min(index, 5) * 60} className="h-full">
              <CategoryCard category={category} />
            </Reveal>
          </li>
        ))}
        <li>
          <Reveal delay={Math.min(categories.length, 5) * 60} className="h-full">
            <Link
              href="/a-la-medida"
              className="group relative flex aspect-4/5 h-full flex-col justify-between overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-6"
            >
              <RulerIcon className="size-7" aria-hidden />
              <span>
                <span className="block font-heading text-2xl font-semibold sm:text-3xl">
                  A la medida
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm text-primary-foreground/75">
                  Diseña el tuyo
                  <ArrowRightIcon
                    className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden
                  />
                </span>
              </span>
              <span className="mirror-sheen" aria-hidden />
            </Link>
          </Reveal>
        </li>
      </ul>
    </section>
  );
}

function CategoryCard({ category }: { category: LandingCategory }) {
  const count = `${category.productCount} ${category.productCount === 1 ? "espejo" : "espejos"}`;
  return (
    <Link
      href={`/espejos?categoria=${category.slug}`}
      className="group relative block aspect-4/5 overflow-hidden rounded-2xl bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {category.cover ? (
        <>
          <CloudinaryImage
            src={category.cover.src}
            alt=""
            preset="card"
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent"
          />
        </>
      ) : (
        <MirrorPlaceholder shape={category.shape} className="pb-16" />
      )}
      <span className="mirror-sheen" aria-hidden />
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 p-4 sm:p-5",
          category.cover ? "text-white" : "text-foreground",
        )}
      >
        <span className="block font-heading text-2xl font-semibold sm:text-3xl">
          {category.name}
        </span>
        <span className={cn("text-sm", category.cover ? "text-white/80" : "text-muted-foreground")}>
          {count}
        </span>
      </span>
    </Link>
  );
}

// ── Destacados (RF-L03) ───────────────────────────────────────────────────────

export function FeaturedSection({
  featured,
  marked,
  whatsappNumber,
  siteUrl,
}: {
  featured: FeaturedProduct[];
  /** false: no hay destacados marcados y se muestran los más recientes. */
  marked: boolean;
  whatsappNumber: string;
  siteUrl: string;
}) {
  if (featured.length === 0) return null;
  return (
    <section aria-labelledby="landing-destacados" className="bg-secondary/50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          id="landing-destacados"
          eyebrow={marked ? "Destacados" : "Recién llegados"}
          title={marked ? "Nuestros favoritos" : "Lo nuevo del catálogo"}
          description="Toca «Consultar» y te llega por WhatsApp con la referencia y la medida."
          action={<ArrowLink href="/espejos">Ver más espejos</ArrowLink>}
        />
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((item, index) => (
            <li key={item.card.id}>
              <Reveal delay={(index % 4) * 60} className="h-full">
                <FeaturedCard item={item} whatsappNumber={whatsappNumber} siteUrl={siteUrl} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Cómo funciona (RF-L04) ────────────────────────────────────────────────────

const STEPS = [
  {
    icon: SearchIcon,
    title: "Elige tu espejo",
    text: "Explora el catálogo por forma, medida o estilo, o diseña uno a la medida.",
  },
  {
    icon: WhatsappIcon,
    title: "Consulta por WhatsApp",
    text: "Con un toque nos llega la referencia, la medida y el enlace. Te respondemos con precio y disponibilidad.",
  },
  {
    icon: TruckIcon,
    title: "Te lo enviamos e instalamos",
    text: "Coordinamos la entrega en tu ciudad y, si lo necesitas, la instalación.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="landing-como-funciona"
      className="mx-auto max-w-7xl px-4 py-16 sm:py-24"
    >
      <SectionHeading
        id="landing-como-funciona"
        eyebrow="Cómo funciona"
        title="Tu espejo en 3 pasos"
      />
      <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Reveal delay={index * 120} className="relative">
              {/* Línea que une los pasos (desktop). */}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-7 left-16 hidden h-px w-[calc(100%-3rem)] bg-linear-to-r from-border to-transparent md:block"
                />
              )}
              <span className="flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                <step.icon className="size-6" aria-hidden />
              </span>
              <p className="mt-6 font-heading text-5xl font-semibold text-foreground/55 tabular-nums">
                0{index + 1}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-pretty text-muted-foreground">{step.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── A la medida (RF-L05) ──────────────────────────────────────────────────────

const CUSTOM_SHAPES: MirrorShape[] = ["RECTANGULAR", "ROUND", "OVAL", "ARCH", "ORGANIC"];
const SILHOUETTES = [
  "aspect-[1/2] rounded-t-full rounded-b-md",
  "aspect-square rounded-full",
  "aspect-[4/5] rounded-[48%_52%_40%_60%/55%_45%_55%_45%]",
];

export function CustomSection() {
  return (
    <section aria-labelledby="landing-a-la-medida" className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <Reveal className="relative grid overflow-hidden rounded-[2rem] bg-primary text-primary-foreground lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <p className="text-xs tracking-[0.3em] text-primary-foreground/60 uppercase">
            A la medida
          </p>
          <h2
            id="landing-a-la-medida"
            className="mt-3 font-heading text-4xl font-semibold text-balance sm:text-5xl"
          >
            ¿No encuentras la medida? La fabricamos para ti
          </h2>
          <p className="mt-4 max-w-md text-pretty text-primary-foreground/75">
            Elige la forma, las medidas, el marco y la luz LED. Te enviamos la cotización por
            WhatsApp.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Empieza por la forma">
            {CUSTOM_SHAPES.map((shape) => (
              <li key={shape}>
                <Link
                  href={`/a-la-medida?forma=${shapeSlugOf(shape)}`}
                  className="inline-flex h-9 items-center rounded-full border border-primary-foreground/20 px-4 text-sm transition-colors hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-primary-foreground/40 focus-visible:outline-none"
                >
                  {SHAPE_LABELS[shape]}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/a-la-medida"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-background px-6 font-medium text-foreground transition-colors hover:bg-background/90 focus-visible:ring-3 focus-visible:ring-primary-foreground/40 focus-visible:outline-none"
          >
            Diseñar mi espejo
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>

        {/* Composición decorativa de siluetas. */}
        <div
          aria-hidden
          className="relative hidden min-h-80 items-end justify-center gap-6 p-12 lg:flex"
        >
          {SILHOUETTES.map((shape, index) => (
            <span
              key={index}
              className={cn("mirror-surface block w-32 opacity-90", shape, index === 1 && "mb-20")}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ── Servicios y cifras (RF-L08) ───────────────────────────────────────────────

export type LandingStat = { value: number; prefix?: string; label: string };

const STATS_GRID = [
  "grid-cols-1",
  "grid-cols-2",
  "grid-cols-1 sm:grid-cols-3",
  "grid-cols-2 lg:grid-cols-4",
];

export function ServicesSection({
  shippingInfo,
  installationInfo,
  coverageAreas,
  stats,
  whatsappNumber,
}: {
  shippingInfo: string | null;
  installationInfo: string | null;
  coverageAreas: string[];
  stats: LandingStat[];
  whatsappNumber: string;
}) {
  const services = [
    {
      icon: TruckIcon,
      title: "Envío",
      text:
        shippingInfo ??
        "Coordinamos el envío a tu ciudad. El costo depende del destino y del tamaño del espejo.",
    },
    {
      icon: WrenchIcon,
      title: "Instalación",
      text:
        installationInfo ??
        "Instalamos tu espejo con las fijaciones adecuadas para cada tipo de pared.",
      areas: coverageAreas,
    },
  ];

  return (
    <section aria-labelledby="landing-servicios" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <SectionHeading
        id="landing-servicios"
        eyebrow="Servicios"
        title="Del taller a tu pared"
        action={
          whatsappNumber ? (
            <GeneralWhatsappLink
              whatsappNumber={whatsappNumber}
              channel="landing-servicios"
              className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              <WhatsappIcon className="size-4 text-whatsapp" />
              ¿Tienes una pregunta? Escríbenos
            </GeneralWhatsappLink>
          ) : undefined
        }
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {services.map((service, index) => (
          <Reveal key={service.title} delay={index * 100} className="h-full">
            <article className="h-full rounded-2xl border bg-card p-6 sm:p-8">
              <service.icon className="size-7" aria-hidden />
              <h3 className="mt-5 text-xl font-semibold">{service.title}</h3>
              <p className="mt-2 text-pretty text-muted-foreground">{service.text}</p>
              {service.areas && service.areas.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Zonas de instalación">
                  {service.areas.map((area) => (
                    <li
                      key={area}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      <MapPinIcon className="size-3.5" aria-hidden />
                      {area}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      {stats.length > 0 && (
        <Reveal>
          <dl
            className={cn(
              "mt-14 grid gap-8 border-t pt-12 text-center",
              STATS_GRID[Math.min(stats.length, 4) - 1],
            )}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="font-heading text-5xl font-semibold sm:text-6xl">
                  <CountUp value={stat.value} prefix={stat.prefix} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}
    </section>
  );
}
