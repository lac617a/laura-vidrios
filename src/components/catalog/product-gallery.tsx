"use client";

import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { MirrorPlaceholder } from "@/components/catalog/mirror-placeholder";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { MirrorShape } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type GalleryImage = { publicId: string; alt: string | null; width: number; height: number };

/** Galería del detalle: deslizar en móvil, miniaturas y flechas en desktop, ampliar con zoom. */
export function ProductGallery({
  images,
  shape,
  name,
}: {
  images: GalleryImage[];
  shape: MirrorShape;
  name: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-4/5 overflow-hidden rounded-2xl">
        <MirrorPlaceholder shape={shape} />
      </div>
    );
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + images.length) % images.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setActive(next);
  }

  return (
    <div className="space-y-3">
      <div className="group/gallery relative">
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget;
            setActive(Math.round(track.scrollLeft / track.clientWidth));
          }}
          aria-label="Fotos del producto"
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto rounded-2xl bg-muted [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setLightbox(index)}
              aria-label={`Ampliar foto ${index + 1} de ${images.length}`}
              className="relative aspect-4/5 w-full shrink-0 cursor-zoom-in snap-center"
            >
              <CloudinaryImage
                src={image.publicId}
                preset="card"
                alt={image.alt ?? name}
                fill
                preload={index === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-xs backdrop-blur">
          <ZoomInIcon className="size-3.5" aria-hidden />
          {images.length > 1 ? `${active + 1} / ${images.length}` : "Ampliar"}
        </span>

        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Foto anterior"
              onClick={() => goTo(active - 1)}
              className="absolute top-1/2 left-3 hidden -translate-y-1/2 rounded-full opacity-0 shadow-sm transition-opacity group-hover/gallery:opacity-100 focus-visible:opacity-100 sm:inline-flex"
            >
              <ChevronLeftIcon aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Foto siguiente"
              onClick={() => goTo(active + 1)}
              className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-full opacity-0 shadow-sm transition-opacity group-hover/gallery:opacity-100 focus-visible:opacity-100 sm:inline-flex"
            >
              <ChevronRightIcon aria-hidden />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={image.publicId} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={active === index}
                className={cn(
                  "block overflow-hidden rounded-lg border-2 transition-colors",
                  active === index
                    ? "border-primary"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <CloudinaryImage
                  src={image.publicId}
                  preset="thumb"
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox images={images} name={name} index={lightbox} onChange={setLightbox} />
    </div>
  );
}

function Lightbox({
  images,
  name,
  index,
  onChange,
}: {
  images: GalleryImage[];
  name: string;
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const image = index === null ? null : images[index];

  function step(delta: number) {
    if (index === null) return;
    setZoom(null);
    onChange((index + delta + images.length) % images.length);
  }

  function toggleZoom(event: MouseEvent<HTMLButtonElement>) {
    if (zoom) return setZoom(null);
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  return (
    <Dialog
      open={image !== null}
      onOpenChange={(open) => {
        if (!open) {
          setZoom(null);
          onChange(null);
        }
      }}
    >
      <DialogContent
        onKeyDown={onKeyDown}
        className="flex h-[92svh] w-[96vw] max-w-[96vw] flex-col gap-2 p-2 sm:max-w-[min(96vw,1100px)]"
      >
        <DialogTitle className="sr-only">{name}</DialogTitle>
        {image && (
          <button
            type="button"
            onClick={toggleZoom}
            aria-label={zoom ? "Alejar" : "Acercar"}
            className={cn(
              "relative min-h-0 flex-1 overflow-hidden rounded-lg bg-muted",
              zoom ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
          >
            <CloudinaryImage
              key={image.publicId}
              src={image.publicId}
              preset="detail"
              alt={image.alt ?? name}
              fill
              sizes="(min-width: 1100px) 1100px, 96vw"
              className="object-contain transition-transform duration-300 motion-reduce:transition-none"
              style={
                zoom
                  ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : undefined
              }
            />
          </button>
        )}
        {images.length > 1 && index !== null && (
          <div className="flex items-center justify-center gap-3 pb-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Foto anterior"
              onClick={() => step(-1)}
            >
              <ChevronLeftIcon aria-hidden />
            </Button>
            <span className="text-sm tabular-nums">
              {index + 1} / {images.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Foto siguiente"
              onClick={() => step(1)}
            >
              <ChevronRightIcon aria-hidden />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
