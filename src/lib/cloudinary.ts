// URLs de imágenes en Cloudinary (puras: cliente y servidor).
// Cloudinary optimiza (f_auto, q_auto) y redimensiona; no se usa el optimizador de Next.

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

type UrlOptions = {
  width?: number;
  height?: number;
  /** ej. "4:5" */
  aspectRatio?: string;
  /** fill recorta para llenar (con g_auto); limit solo reduce sin recortar. */
  crop?: "fill" | "limit";
  cloudName?: string;
};

/** Presets del PRD: tarjeta 4:5, detalle, miniatura cuadrada y vista previa OG. */
export const IMAGE_PRESETS = {
  card: { aspectRatio: "4:5", crop: "fill" },
  detail: { crop: "limit" },
  thumb: { aspectRatio: "1:1", crop: "fill" },
  og: { width: 1200, height: 630, crop: "fill" },
} as const satisfies Record<string, UrlOptions>;

export function cloudinaryUrl(publicId: string, options: UrlOptions = {}): string {
  const { width, height, aspectRatio, crop = "limit", cloudName = CLOUDINARY_CLOUD_NAME } = options;
  const transformation = ["f_auto", "q_auto", `c_${crop}`];
  if (crop === "fill") transformation.push("g_auto");
  if (aspectRatio) transformation.push(`ar_${aspectRatio}`);
  if (width) transformation.push(`w_${width}`);
  if (height) transformation.push(`h_${height}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation.join(",")}/${publicId}`;
}

const UPLOAD_URL = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

export function isCloudinaryUrl(url: string): boolean {
  return UPLOAD_URL.test(url);
}

/** Agrega una transformación a una URL de Cloudinary guardada (logo, categorías). */
export function transformUrl(url: string, transformation: string): string {
  if (!isCloudinaryUrl(url)) return url;
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}

/** public_id a partir de la secure_url que devuelve la subida (sin transformaciones). */
export function publicIdFromUrl(url: string): string | null {
  const match =
    /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i.exec(
      url,
    );
  return match ? match[1] : null;
}

/** URL subida a nuestra cuenta de Cloudinary (para validar logo e imágenes de categoría). */
export function isOwnCloudinaryUrl(url: string): boolean {
  return (
    CLOUDINARY_CLOUD_NAME !== "" &&
    url.startsWith(`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`)
  );
}
