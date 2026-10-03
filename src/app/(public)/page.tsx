import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { Hero } from "@/components/landing/hero";
import { RevealObserver } from "@/components/landing/client-effects";
import {
  CategoriesSection,
  CustomSection,
  FeaturedSection,
  HowItWorksSection,
  ServicesSection,
  type LandingStat,
} from "@/components/landing/sections";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { getLandingData } from "@/lib/catalog-public";
import { getSettings, type SiteSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";
import { formatWhatsappNumber } from "@/lib/whatsapp";

export const metadata: Metadata = {
  description:
    "Espejos de todo tipo y a la medida en Colombia: con luz LED, redondos, de cuerpo entero y para baño. Envío e instalación. Cotiza por WhatsApp.",
  alternates: { canonical: "/" },
};

// Landing (PRD §6.1). Todo lo que lee está cacheado ("use cache") y se invalida desde el admin:
// la página sale prerenderizada y el visitante no espera a la BD.
export default async function Home() {
  const [settings, landing] = await Promise.all([getSettings(), getLandingData()]);
  const siteUrl = getSiteUrl();

  const featuredCover = landing.featured.find((item) => item.card.images.length > 0)?.card;
  const heroImage = settings.heroImageUrl
    ? { src: settings.heroImageUrl, alt: `Espejo de ${settings.businessName}` }
    : featuredCover
      ? { src: featuredCover.images[0].publicId, alt: featuredCover.name }
      : null;

  const stats: LandingStat[] = [];
  if (settings.statsInstalled) {
    stats.push({ value: settings.statsInstalled, prefix: "+", label: "espejos instalados" });
  }
  if (settings.statsYears) {
    stats.push({
      value: settings.statsYears,
      label: settings.statsYears === 1 ? "año de experiencia" : "años de experiencia",
    });
  }
  if (landing.stats.productCount > 0) {
    stats.push({ value: landing.stats.productCount, label: "modelos en el catálogo" });
  }
  if (landing.stats.sizeCount > 0) {
    stats.push({ value: landing.stats.sizeCount, label: "medidas para elegir" });
  }

  return (
    <main>
      <SmoothScroll />
      <RevealObserver />
      <Hero
        whatsappNumber={settings.whatsappNumber}
        coverageAreas={settings.coverageAreas}
        image={heroImage}
      />
      <CategoriesSection categories={landing.categories} />
      <FeaturedSection
        featured={landing.featured}
        marked={landing.featuredAreMarked}
        whatsappNumber={settings.whatsappNumber}
        siteUrl={siteUrl}
      />
      <HowItWorksSection />
      <CustomSection />
      <ServicesSection
        shippingInfo={settings.shippingInfo}
        installationInfo={settings.installationInfo}
        coverageAreas={settings.coverageAreas}
        stats={stats.slice(0, 4)}
        whatsappNumber={settings.whatsappNumber}
      />
      <JsonLd data={localBusiness(settings, siteUrl)} />
    </main>
  );
}

/** JSON-LD LocalBusiness con los datos de la configuración (solo los que existen). */
function localBusiness(settings: SiteSettings, siteUrl: string) {
  const socials = [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl].filter(
    (url): url is string => Boolean(url),
  );
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.businessName,
    description: "Espejos de todo tipo y a la medida, con envío e instalación.",
    url: siteUrl,
    currenciesAccepted: "COP",
    ...(settings.whatsappNumber && {
      telephone: formatWhatsappNumber(settings.whatsappNumber),
    }),
    ...(settings.logoUrl && { logo: settings.logoUrl }),
    ...((settings.heroImageUrl ?? settings.logoUrl) && {
      image: settings.heroImageUrl ?? settings.logoUrl,
    }),
    address: {
      "@type": "PostalAddress",
      addressCountry: "CO",
      ...(settings.address && { streetAddress: settings.address }),
    },
    ...(settings.coverageAreas.length > 0 && {
      areaServed: settings.coverageAreas.map((name) => ({ "@type": "City", name })),
    }),
    ...(socials.length > 0 && { sameAs: socials }),
  };
}
