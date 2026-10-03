/**
 * Seed de desarrollo: reemplaza el catálogo LOCAL con datos de prueba.
 * Se ejecuta con `pnpm db:seed` (o solo tras `prisma migrate reset`).
 *
 * Nunca corre contra producción: solo acepta bases de datos en localhost.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { upsertAdminUser } from "../scripts/lib/admin-user";
import {
  Availability,
  InquiryStatus,
  InquiryType,
  MirrorShape,
  PrismaClient,
  ProductStatus,
  Role,
} from "../src/generated/prisma/client";
import { normalizeSearchText, slugify } from "../src/lib/text";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function assertLocalDatabase(): string {
  const url = process.env.DATABASE_URL;
  if (!url) abort("DATABASE_URL no está definida.");
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    abort("El seed no se ejecuta en producción ni en Vercel.");
  }
  if (process.env.DATABASE_URL_UNPOOLED) {
    abort("DATABASE_URL_UNPOOLED está definida: parece una base de datos de Neon.");
  }
  const { hostname } = new URL(url);
  if (!LOCAL_HOSTS.has(hostname)) {
    abort(`El host "${hostname}" no es local. El seed solo corre contra localhost.`);
  }
  return url;
}

function abort(message: string): never {
  console.error(`\n✋ Seed cancelado: ${message}\n`);
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: assertLocalDatabase() }),
});

const REFERENCE_PREFIX = "ESP";

const categories = [
  { slug: "bano", name: "Baño", description: "Espejos para baño, con o sin marco." },
  {
    slug: "cuerpo-entero",
    name: "Cuerpo entero",
    description: "Espejos de piso y de pared para vestier y habitaciones.",
  },
  {
    slug: "con-luz-led",
    name: "Con luz LED",
    description: "Espejos con iluminación LED integrada.",
  },
  {
    slug: "decorativos",
    name: "Decorativos",
    description: "Piezas para sala, comedor y recibidor.",
  },
  {
    slug: "para-negocios",
    name: "Para negocios",
    description: "Gimnasios, peluquerías, salones de belleza y tiendas.",
  },
] as const;

type CategorySlug = (typeof categories)[number]["slug"];

type SeedVariant = { w: number; h: number; price: number | null; availability?: Availability };

type SeedProduct = {
  name: string;
  category: CategorySlug;
  shape: MirrorShape;
  description: string;
  frameMaterial?: string;
  frameColor?: string;
  style?: string;
  hasLed?: boolean;
  isFeatured?: boolean;
  showPrice?: boolean;
  status?: ProductStatus;
  variants: SeedVariant[];
};

const products: SeedProduct[] = [
  {
    name: "Espejo Redondo Luna LED",
    category: "con-luz-led",
    shape: MirrorShape.ROUND,
    description:
      "Espejo redondo con aro de luz LED perimetral, interruptor táctil y tres tonos de luz.",
    frameMaterial: "Sin marco",
    style: "Moderno",
    hasLed: true,
    isFeatured: true,
    variants: [
      { w: 60, h: 60, price: 520000 },
      { w: 80, h: 80, price: 690000 },
    ],
  },
  {
    name: "Espejo Rectangular Baño Classic",
    category: "bano",
    shape: MirrorShape.RECTANGULAR,
    description: "El clásico para el baño: marco delgado de aluminio y bordes pulidos.",
    frameMaterial: "Aluminio",
    frameColor: "Plateado",
    style: "Clásico",
    variants: [
      { w: 50, h: 70, price: 210000 },
      { w: 60, h: 80, price: 260000 },
      { w: 70, h: 90, price: 310000 },
    ],
  },
  {
    name: "Espejo Ovalado Nórdico",
    category: "decorativos",
    shape: MirrorShape.OVAL,
    description: "Marco en madera natural con acabado mate, ideal para recibidores.",
    frameMaterial: "Madera",
    frameColor: "Natural",
    style: "Nórdico",
    isFeatured: true,
    variants: [
      { w: 50, h: 70, price: 290000 },
      { w: 60, h: 90, price: 360000 },
    ],
  },
  {
    name: "Espejo Cuerpo Entero Esbelto",
    category: "cuerpo-entero",
    shape: MirrorShape.RECTANGULAR,
    description: "Espejo alto y angosto con marco negro, para pared o apoyado en el piso.",
    frameMaterial: "Aluminio",
    frameColor: "Negro",
    style: "Minimalista",
    variants: [
      { w: 40, h: 150, price: 330000 },
      { w: 50, h: 170, price: 390000 },
    ],
  },
  {
    name: "Espejo Arco Florencia",
    category: "cuerpo-entero",
    shape: MirrorShape.ARCH,
    description: "Forma de arco con marco metálico dorado. Se luce en salas y vestieres.",
    frameMaterial: "Metal",
    frameColor: "Dorado",
    style: "Elegante",
    isFeatured: true,
    variants: [
      { w: 60, h: 160, price: 560000 },
      { w: 80, h: 180, price: 720000, availability: Availability.MADE_TO_ORDER },
    ],
  },
  {
    name: "Espejo Orgánico Agua",
    category: "decorativos",
    shape: MirrorShape.ORGANIC,
    description: "Silueta irregular sin marco, inspirada en el agua.",
    frameMaterial: "Sin marco",
    style: "Contemporáneo",
    variants: [{ w: 60, h: 90, price: 380000 }],
  },
  {
    name: "Espejo LED Rectangular Táctil",
    category: "con-luz-led",
    shape: MirrorShape.RECTANGULAR,
    description: "Luz LED frontal, antiempañante y sensor táctil. Perfecto para el baño.",
    frameMaterial: "Sin marco",
    style: "Moderno",
    hasLed: true,
    isFeatured: true,
    variants: [
      { w: 60, h: 80, price: 580000 },
      { w: 80, h: 100, price: 760000 },
      { w: 100, h: 70, price: 820000 },
    ],
  },
  {
    name: "Espejo Redondo Biselado",
    category: "bano",
    shape: MirrorShape.ROUND,
    description: "Espejo redondo con borde biselado de 2 cm, sin marco.",
    frameMaterial: "Biselado",
    style: "Clásico",
    variants: [
      { w: 50, h: 50, price: 190000 },
      { w: 70, h: 70, price: 270000 },
    ],
  },
  {
    name: "Espejo Cuadrado Minimal",
    category: "decorativos",
    shape: MirrorShape.SQUARE,
    description: "Marco negro delgado y líneas limpias.",
    frameMaterial: "Aluminio",
    frameColor: "Negro",
    style: "Minimalista",
    variants: [{ w: 60, h: 60, price: 240000 }],
  },
  {
    name: "Espejo Sol Dorado",
    category: "decorativos",
    shape: MirrorShape.ROUND,
    description: "Espejo decorativo con rayos metálicos dorados alrededor.",
    frameMaterial: "Metal",
    frameColor: "Dorado",
    style: "Vintage",
    variants: [{ w: 70, h: 70, price: 450000, availability: Availability.MADE_TO_ORDER }],
  },
  {
    name: "Espejo Panorámico para Gimnasio",
    category: "para-negocios",
    shape: MirrorShape.RECTANGULAR,
    description: "Láminas de gran formato con instalación incluida. Precio según el muro.",
    frameMaterial: "Sin marco",
    showPrice: false,
    variants: [
      { w: 200, h: 100, price: null, availability: Availability.MADE_TO_ORDER },
      { w: 300, h: 150, price: null, availability: Availability.MADE_TO_ORDER },
    ],
  },
  {
    name: "Espejo Tocador Hollywood",
    category: "con-luz-led",
    shape: MirrorShape.RECTANGULAR,
    description: "Espejo de tocador con bombillos LED regulables.",
    frameMaterial: "Metal",
    frameColor: "Blanco",
    hasLed: true,
    status: ProductStatus.DRAFT,
    variants: [{ w: 60, h: 80, price: 640000 }],
  },
  {
    name: "Espejo Vintage Bronce",
    category: "decorativos",
    shape: MirrorShape.OVAL,
    description: "Modelo descontinuado: sirve para probar la página de producto no disponible.",
    frameMaterial: "Metal",
    frameColor: "Bronce",
    style: "Vintage",
    status: ProductStatus.ARCHIVED,
    variants: [{ w: 50, h: 70, price: 300000, availability: Availability.OUT_OF_STOCK }],
  },
];

async function main() {
  console.log("🌱 Sembrando base de datos local…");

  // Borra el catálogo local en orden de dependencias.
  await prisma.inquiryItem.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categoryIds = new Map<CategorySlug, string>();
  for (const [position, category] of categories.entries()) {
    const created = await prisma.category.create({ data: { ...category, position } });
    categoryIds.set(category.slug, created.id);
  }

  for (const [index, product] of products.entries()) {
    const reference = `${REFERENCE_PREFIX}-${String(index + 1).padStart(4, "0")}`;
    await prisma.product.create({
      data: {
        reference,
        name: product.name,
        slug: slugify(product.name),
        description: product.description,
        shape: product.shape,
        frameMaterial: product.frameMaterial,
        frameColor: product.frameColor,
        style: product.style,
        hasLed: product.hasLed ?? false,
        isFeatured: product.isFeatured ?? false,
        showPrice: product.showPrice ?? true,
        status: product.status ?? ProductStatus.PUBLISHED,
        searchText: normalizeSearchText(product.name, reference),
        categoryId: categoryIds.get(product.category)!,
        variants: {
          create: product.variants.map((v, position) => ({
            sku: `${reference}-${v.w}x${v.h}`,
            widthCm: v.w,
            heightCm: v.h,
            price: v.price,
            availability: v.availability ?? Availability.IN_STOCK,
            isDefault: position === 0,
            position,
          })),
        },
      },
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { referenceCounter: products.length },
    create: {
      id: 1,
      businessName: "Espejos Demo",
      // Número ficticio con formato válido (57 + 3xx…): la configuración se puede guardar tal cual.
      whatsappNumber: process.env.SEED_WHATSAPP_NUMBER ?? "573000000000",
      referencePrefix: REFERENCE_PREFIX,
      referenceCounter: products.length,
      shippingInfo:
        "Enviamos a todo el país. El costo depende de la ciudad y el tamaño del espejo.",
      installationInfo:
        "Instalamos en la ciudad y municipios cercanos. Agenda la visita por WhatsApp.",
      coverageAreas: ["Bogotá", "Medellín"],
      customFrameOptions: [
        "Sin marco",
        "Biselado",
        "Aluminio negro",
        "Aluminio plateado",
        "Aluminio dorado",
        "Madera natural",
      ],
      openingHours: "Lunes a sábado, 8:00 a. m. – 6:00 p. m.",
    },
  });

  await seedInquiries();
  await seedUsers();

  const [categoryCount, productCount, variantCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
  ]);
  console.log(
    `✅ ${categoryCount} categorías, ${productCount} productos, ${variantCount} variantes.`,
  );
}

/** Usuarios de desarrollo (solo existen en la BD local). Credenciales en .env.example. */
async function seedUsers() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "espejos-local-2026";
  await upsertAdminUser(prisma, {
    email: "admin@local.test",
    name: "Admin Local",
    role: Role.OWNER,
    password,
  });
  await upsertAdminUser(prisma, {
    email: "editor@local.test",
    name: "Editor Local",
    role: Role.EDITOR,
    password,
  });
  console.log(
    "👤 Usuarios locales: admin@local.test (acceso total) y editor@local.test (edición).",
  );
}

/** Consultas de ejemplo para desarrollar el módulo de seguimiento. */
async function seedInquiries() {
  const luna = await prisma.product.findUniqueOrThrow({
    where: { reference: "ESP-0001" },
    include: { variants: true },
  });
  const lunaVariant = luna.variants[0];

  await prisma.inquiry.create({
    data: {
      code: "DEMO01",
      type: InquiryType.CATALOG,
      status: InquiryStatus.NEW,
      needsShipping: true,
      needsInstallation: true,
      city: "Medellín",
      source: "detalle",
      items: {
        create: {
          productId: luna.id,
          variantId: lunaVariant.id,
          reference: lunaVariant.sku,
          productName: luna.name,
          widthCm: lunaVariant.widthCm,
          heightCm: lunaVariant.heightCm,
          priceSnapshot: lunaVariant.price,
        },
      },
    },
  });

  await prisma.inquiry.create({
    data: {
      code: "DEMO02",
      type: InquiryType.CUSTOM,
      status: InquiryStatus.QUOTED,
      needsInstallation: true,
      city: "Bogotá",
      source: "a-la-medida",
      customerName: "Cliente de prueba",
      notes: "Pidió esquinas redondeadas.",
      items: {
        create: {
          reference: "A-LA-MEDIDA",
          productName: "Espejo a la medida",
          widthCm: 120,
          heightCm: 180,
          isCustomSize: true,
          customShape: MirrorShape.RECTANGULAR,
          frameDetails: "Aluminio negro",
          hasLed: true,
        },
      },
    },
  });

  await prisma.inquiry.create({
    data: {
      code: "DEMO03",
      type: InquiryType.GENERAL,
      status: InquiryStatus.WON,
      source: "landing",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
