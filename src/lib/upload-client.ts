// Subida de imágenes desde el navegador directo a Cloudinary (solo cliente).

import { signImageUpload } from "@/app/admin/(panel)/image-actions";
import type { UploadSignature, UploadTarget } from "@/lib/cloudinary-server";

export type CloudinaryUploadResult = {
  public_id: string;
  version: number | string;
  signature: string;
  secure_url: string;
  width: number;
  height: number;
};

export class UploadError extends Error {
  constructor(
    message: string,
    /** Si la sesión expiró, la UI manda al login. */
    readonly unauthorized = false,
  ) {
    super(message);
  }
}

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** Fotos de más de esto se reducen en el navegador antes de subir. */
const RESIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 2400;

export function validateImageFile(file: File): string | null {
  const isImage = file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
  if (!isImage) return `«${file.name}» no es una imagen.`;
  if (file.size > MAX_SOURCE_BYTES) return `«${file.name}» pesa más de 25 MB.`;
  return null;
}

/**
 * Reduce fotos grandes del celular (JPEG/HEIC) a 2400 px antes de subir: más rápido con datos
 * móviles. PNG y WebP se suben tal cual (pueden tener transparencia, como un logo).
 */
export async function prepareImage(file: File): Promise<Blob> {
  const keepAsIs = file.size <= RESIZE_ABOVE_BYTES || /image\/(png|webp|gif|svg)/.test(file.type);
  if (keepAsIs) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    // Formatos que el navegador no decodifica (HEIC en Chrome): Cloudinary los convierte.
    return file;
  }
}

function friendlyCloudinaryError(message: string | undefined): string {
  if (!message) return "Cloudinary rechazó la foto.";
  if (/too large/i.test(message)) return "La foto es demasiado grande (máximo 10 MB).";
  if (/format not allowed/i.test(message))
    return "Formato no permitido. Usa JPG, PNG, WebP o HEIC.";
  if (/invalid image/i.test(message)) return "El archivo no es una imagen válida.";
  if (/stale request|signature/i.test(message)) return "La subida expiró. Intenta de nuevo.";
  return "Cloudinary rechazó la foto.";
}

function postToCloudinary(
  file: Blob,
  fileName: string,
  signature: UploadSignature,
  onProgress?: (fraction: number) => void,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, fileName);
    form.append("api_key", signature.apiKey);
    for (const [key, value] of Object.entries(signature.params)) form.append(key, value);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signature.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as CloudinaryUploadResult);
        else reject(new UploadError(friendlyCloudinaryError(body?.error?.message)));
      } catch {
        reject(new UploadError("Respuesta inválida al subir la foto."));
      }
    };
    xhr.onerror = () =>
      reject(new UploadError("Sin conexión. Revisa tu internet e intenta de nuevo."));
    xhr.send(form);
  });
}

/** Valida, reduce si hace falta, pide la firma y sube. Lanza UploadError con un mensaje legible. */
export async function uploadImage(
  file: File,
  target: UploadTarget,
  onProgress?: (fraction: number) => void,
): Promise<CloudinaryUploadResult> {
  const invalid = validateImageFile(file);
  if (invalid) throw new UploadError(invalid);

  const [prepared, signature] = await Promise.all([prepareImage(file), signImageUpload(target)]);
  if (!signature.ok) throw new UploadError(signature.error, signature.status === 401);

  return postToCloudinary(prepared, file.name, signature.data, onProgress);
}
