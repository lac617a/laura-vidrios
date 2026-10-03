import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

// Firma de subidas y borrado en Cloudinary con la API REST (sin SDK).
// El API secret nunca sale del servidor: el navegador sube directo a Cloudinary
// con una firma de corta duración generada aquí.

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Firma de Cloudinary: parámetros ordenados alfabéticamente como `clave=valor` unidos con `&`,
 * más el secret, en SHA-1. (file, cloud_name, resource_type y api_key no se firman.)
 */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

/** Carpeta raíz por entorno: dev, preview y prod nunca se mezclan (igual que la BD). */
export function environmentFolder(): "prod" | "preview" | "dev" {
  if (process.env.VERCEL_ENV === "production") return "prod";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "dev";
}

export type UploadTarget =
  { kind: "product"; productId: string } | { kind: "logo" } | { kind: "category" };

export function uploadFolder(target: UploadTarget): string {
  const base = `catalogo-espejos/${environmentFolder()}`;
  if (target.kind === "product") return `${base}/productos/${target.productId}`;
  if (target.kind === "logo") return `${base}/marca`;
  return `${base}/categorias`;
}

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif,heic,heif";
/** Las fotos se guardan con 2400 px como máximo: suficiente para zoom y ahorra espacio. */
const INCOMING_TRANSFORMATION = "c_limit,w_2400,h_2400";

export type UploadSignature = {
  uploadUrl: string;
  apiKey: string;
  params: Record<string, string>;
};

export function createUploadSignature(
  config: CloudinaryConfig,
  folder: string,
  now = Date.now(),
): UploadSignature {
  const params = {
    allowed_formats: ALLOWED_FORMATS,
    folder,
    timestamp: String(Math.floor(now / 1000)),
    transformation: INCOMING_TRANSFORMATION,
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    apiKey: config.apiKey,
    params: { ...params, signature: signParams(params, config.apiSecret) },
  };
}

/** Verifica que la respuesta de subida la firmó Cloudinary con nuestro secret. */
export function isAuthenticUpload(
  config: CloudinaryConfig,
  upload: { public_id: string; version: number | string; signature: string },
): boolean {
  const expected = signParams(
    { public_id: upload.public_id, version: upload.version },
    config.apiSecret,
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(upload.signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Borra una imagen (y la invalida en la CDN). Si falla solo se registra: no bloquea al admin. */
export async function destroyImage(publicId: string): Promise<boolean> {
  const config = getCloudinaryConfig();
  if (!config) return false;

  const params = {
    invalidate: "true",
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const body = new URLSearchParams({
    ...params,
    api_key: config.apiKey,
    signature: signParams(params, config.apiSecret),
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
      { method: "POST", body },
    );
    const result = (await response.json()) as { result?: string };
    if (result.result !== "ok" && result.result !== "not found") {
      console.error("Cloudinary destroy:", publicId, result);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Cloudinary destroy:", publicId, error);
    return false;
  }
}
