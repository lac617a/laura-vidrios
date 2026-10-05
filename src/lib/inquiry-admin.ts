import "server-only";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { InquiryStatus, InquiryType } from "@/generated/prisma/enums";
import { startOfLastDays } from "@/lib/dates";
import { normalizeInquiryCode } from "@/lib/inquiry-code";
import { closeRate, dailySeries } from "@/lib/inquiry-stats";
import { prisma } from "@/lib/prisma";

// Lecturas de consultas para el admin (sin caché: siempre datos frescos). PRD RF-A03, RF-A12 – A14.

export const INQUIRY_PAGE_SIZE = 25;

export const INQUIRY_PERIODS = { hoy: 1, "7d": 7, "30d": 30 } as const;

export const inquiryListParamsSchema = z.object({
  /** Código (#K7M2QX), nombre o teléfono del cliente. */
  q: z.string().trim().max(60).catch(""),
  estado: z.union([z.literal("todas"), z.enum(InquiryStatus)]).catch("todas"),
  tipo: z.union([z.literal("todos"), z.enum(InquiryType)]).catch("todos"),
  periodo: z.enum(["todo", "hoy", "7d", "30d"]).catch("todo"),
  ciudad: z.string().trim().max(60).catch(""),
  producto: z.string().max(40).catch(""),
  pagina: z.coerce.number().int().min(1).max(1000).catch(1),
  /** Consulta abierta en el panel lateral. */
  consulta: z.string().max(40).catch(""),
});

export type InquiryListParams = z.infer<typeof inquiryListParamsSchema>;

/** searchParams de la página (valores repetidos → el primero) → parámetros validados. */
export function parseInquiryListParams(raw: Record<string, string | string[] | undefined>) {
  return inquiryListParamsSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    ),
  );
}

/** Filtros salvo el estado (las pestañas de estado muestran cuántas hay con los demás filtros). */
function baseWhere(params: InquiryListParams, now: Date): Prisma.InquiryWhereInput {
  const and: Prisma.InquiryWhereInput[] = [];
  if (params.q) {
    const code = normalizeInquiryCode(params.q);
    const digits = params.q.replace(/\D/g, "");
    and.push({
      OR: [
        // El código puede llevar sufijo si chocó con otro (K7M2QX-2).
        { code: { startsWith: code } },
        { customerName: { contains: params.q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ customerPhone: { contains: digits } }] : []),
      ],
    });
  }
  if (params.tipo !== "todos") and.push({ type: params.tipo });
  if (params.periodo !== "todo") {
    and.push({ createdAt: { gte: startOfLastDays(now, INQUIRY_PERIODS[params.periodo]) } });
  }
  if (params.ciudad) and.push({ city: { equals: params.ciudad, mode: "insensitive" } });
  if (params.producto) and.push({ items: { some: { productId: params.producto } } });
  return and.length > 0 ? { AND: and } : {};
}

export async function listAdminInquiries(params: InquiryListParams, now = new Date()) {
  const base = baseWhere(params, now);
  const where: Prisma.InquiryWhereInput =
    params.estado === "todas" ? base : { ...base, status: params.estado };

  const [total, inquiries, statusCounts] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.pagina - 1) * INQUIRY_PAGE_SIZE,
      take: INQUIRY_PAGE_SIZE,
      select: {
        id: true,
        code: true,
        createdAt: true,
        type: true,
        status: true,
        needsShipping: true,
        needsInstallation: true,
        city: true,
        customerName: true,
        items: {
          take: 3,
          select: {
            productName: true,
            reference: true,
            widthCm: true,
            heightCm: true,
            customShape: true,
            quantity: true,
          },
        },
      },
    }),
    prisma.inquiry.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);

  const counts = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<InquiryStatus, number>>;

  return {
    inquiries,
    total,
    pageCount: Math.max(1, Math.ceil(total / INQUIRY_PAGE_SIZE)),
    counts: {
      todas: Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0),
      ...counts,
    } as Record<"todas" | InquiryStatus, number | undefined>,
  };
}

export type AdminInquiryRow = Awaited<ReturnType<typeof listAdminInquiries>>["inquiries"][number];

/** Opciones de los filtros de ciudad y producto: solo valores que aparecen en consultas. */
export async function listInquiryFilterOptions() {
  const [cities, products] = await Promise.all([
    prisma.inquiry.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 40,
    }),
    prisma.inquiryItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 60,
    }),
  ]);
  const names = await prisma.product.findMany({
    where: { id: { in: products.map((row) => row.productId!) } },
    select: { id: true, name: true, reference: true },
  });
  return {
    cities: cities.map((row) => row.city!).filter(Boolean),
    products: names
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((product) => ({ id: product.id, label: `${product.name} · ${product.reference}` })),
  };
}

export async function getAdminInquiry(id: string) {
  return prisma.inquiry.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      status: true,
      needsShipping: true,
      needsInstallation: true,
      city: true,
      source: true,
      customerName: true,
      customerPhone: true,
      notes: true,
      items: {
        select: {
          id: true,
          reference: true,
          productName: true,
          widthCm: true,
          heightCm: true,
          isCustomSize: true,
          customShape: true,
          frameDetails: true,
          hasLed: true,
          quantity: true,
          priceSnapshot: true,
          notes: true,
          product: { select: { id: true, slug: true, status: true, shape: true } },
        },
      },
    },
  });
}

export type AdminInquiry = NonNullable<Awaited<ReturnType<typeof getAdminInquiry>>>;

/** Si la búsqueda es un código y hay una sola consulta con él, se abre directo. */
export async function findInquiryIdByCode(q: string): Promise<string | null> {
  const code = normalizeInquiryCode(q);
  if (!/^[A-Z0-9]{6}(-\d)?$/.test(code)) return null;
  const matches = await prisma.inquiry.findMany({
    where: { code: { startsWith: code } },
    select: { id: true },
    take: 2,
  });
  return matches.length === 1 ? matches[0].id : null;
}

export async function countNewInquiries() {
  return prisma.inquiry.count({ where: { status: "NEW" } });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

/** KPIs y gráficas del resumen. Todo sobre los últimos 30 días, salvo "hoy" y "7 días". */
export async function getInquiryDashboard(now = new Date()) {
  const since30 = startOfLastDays(now, 30);
  const recent: Prisma.InquiryWhereInput = { createdAt: { gte: since30 } };

  const [today, week, month, byStatus, byType, topProducts, topCities] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: startOfLastDays(now, 1) } } }),
    prisma.inquiry.count({ where: { createdAt: { gte: startOfLastDays(now, 7) } } }),
    prisma.inquiry.findMany({ where: recent, select: { createdAt: true } }),
    prisma.inquiry.groupBy({ by: ["status"], where: recent, _count: { _all: true } }),
    prisma.inquiry.groupBy({ by: ["type"], where: recent, _count: { _all: true } }),
    prisma.inquiryItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, inquiry: recent },
      _count: { _all: true },
      orderBy: [{ _count: { productId: "desc" } }, { productId: "asc" }],
      take: 5,
    }),
    prisma.inquiry.groupBy({
      by: ["city"],
      where: { ...recent, city: { not: null } },
      _count: { _all: true },
      orderBy: [{ _count: { city: "desc" } }, { city: "asc" }],
      take: 5,
    }),
  ]);

  const products = await prisma.product.findMany({
    where: { id: { in: topProducts.map((row) => row.productId!) } },
    select: { id: true, name: true, reference: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const statusCount = (status: InquiryStatus) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    today,
    week,
    month: month.length,
    closeRate: closeRate(statusCount("WON"), month.length),
    daily: dailySeries(
      month.map((row) => row.createdAt),
      now,
      30,
    ),
    byStatus: Object.values(InquiryStatus).map((status) => ({
      status,
      count: statusCount(status),
    })),
    byType: Object.values(InquiryType).map((type) => ({
      type,
      count: byType.find((row) => row.type === type)?._count._all ?? 0,
    })),
    topProducts: topProducts.map((row) => ({
      id: row.productId!,
      name: productById.get(row.productId!)?.name ?? "Producto eliminado",
      reference: productById.get(row.productId!)?.reference ?? "",
      count: row._count._all,
    })),
    topCities: topCities.map((row) => ({ city: row.city!, count: row._count._all })),
  };
}

export type InquiryDashboard = Awaited<ReturnType<typeof getInquiryDashboard>>;
