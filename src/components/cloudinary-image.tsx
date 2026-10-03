"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

import { cloudinaryUrl, IMAGE_PRESETS, isCloudinaryUrl, transformUrl } from "@/lib/cloudinary";

type Preset = keyof typeof IMAGE_PRESETS;

function loaderFor(preset: Preset): ImageLoader {
  return ({ src, width }) => {
    // `src` puede ser un public_id (fotos de producto) o una URL guardada (logo, categorías).
    if (isCloudinaryUrl(src)) return transformUrl(src, `f_auto,q_auto,c_limit,w_${width}`);
    return cloudinaryUrl(src, { ...IMAGE_PRESETS[preset], width });
  };
}

/** next/image servido y optimizado por Cloudinary (no usa el optimizador de Next). */
export function CloudinaryImage({
  src,
  alt,
  preset = "detail",
  ...props
}: Omit<ImageProps, "src" | "loader"> & { src: string; preset?: Preset }) {
  return <Image src={src} alt={alt} loader={loaderFor(preset)} {...props} />;
}
