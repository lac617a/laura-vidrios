"use client";

import { ImagePlusIcon, Loader2Icon, RefreshCwIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { confirmImageUpload } from "@/app/admin/(panel)/image-actions";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { Button } from "@/components/ui/button";
import type { UploadTarget } from "@/lib/cloudinary-server";
import { uploadImage, UploadError } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

/**
 * Una sola imagen (logo, categoría). Sube a Cloudinary y entrega la URL al formulario:
 * se guarda cuando se guarda el formulario.
 */
export function SingleImageField({
  id,
  value,
  onChange,
  target,
  configured,
  alt,
  previewClassName,
}: {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  target: Exclude<UploadTarget, { kind: "product" }>;
  configured: boolean;
  alt: string;
  previewClassName?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File) {
    setProgress(0);
    try {
      const result = await uploadImage(file, target, setProgress);
      const confirmed = await confirmImageUpload(result);
      if (!confirmed.ok) throw new UploadError(confirmed.error, confirmed.status === 401);
      onChange(confirmed.data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen.");
      if (error instanceof UploadError && error.unauthorized) router.replace("/admin/login");
    } finally {
      setProgress(null);
    }
  }

  if (!configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Para subir imágenes falta conectar Cloudinary.
      </p>
    );
  }

  const uploading = progress !== null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className={cn(
          "relative flex size-24 items-center justify-center overflow-hidden rounded-lg border bg-muted",
          previewClassName,
        )}
      >
        {value ? (
          <CloudinaryImage
            src={value}
            alt={alt}
            width={192}
            height={192}
            className="size-full object-contain"
          />
        ) : (
          <ImagePlusIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs tabular-nums">
            <Loader2Icon className="mr-1 size-4 animate-spin" aria-hidden />
            {Math.round(progress * 100)} %
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          id={id}
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {value ? <RefreshCwIcon aria-hidden /> : <ImagePlusIcon aria-hidden />}
          {value ? "Cambiar" : "Subir imagen"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => onChange("")}
          >
            <XIcon aria-hidden />
            Quitar
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
