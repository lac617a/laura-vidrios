"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImagePlusIcon,
  Loader2Icon,
  StarIcon,
  Trash2Icon,
  TypeIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import {
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  updateProductImageAlt,
} from "@/app/admin/(panel)/image-actions";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminAction } from "@/hooks/use-admin-action";
import { uploadImage, UploadError } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

export type ManagedImage = {
  id: string;
  publicId: string;
  alt: string | null;
};

type PendingUpload = { key: string; name: string; progress: number; preview: string };

const MAX_IMAGES = 12;

export function ProductImagesManager({
  productId,
  images,
  configured,
}: {
  productId: string;
  images: ManagedImage[];
  /** false si faltan las credenciales de Cloudinary. */
  configured: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [editingAlt, setEditingAlt] = useState<ManagedImage | null>(null);
  const { run, pending: busy } = useAdminAction();

  const slotsLeft = MAX_IMAGES - images.length - pending.length;

  async function uploadFiles(files: File[]) {
    if (files.length > slotsLeft) {
      toast.error(`Puedes agregar ${Math.max(slotsLeft, 0)} foto(s) más (máximo ${MAX_IMAGES}).`);
      files = files.slice(0, Math.max(slotsLeft, 0));
    }
    const queue = files.map((file) => ({
      file,
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
    }));
    setPending((current) => [
      ...current,
      ...queue.map(({ file, key }) => ({
        key,
        name: file.name,
        progress: 0,
        preview: URL.createObjectURL(file),
      })),
    ]);

    let uploaded = 0;
    // Una a la vez: más estable con datos móviles y respeta el orden elegido.
    for (const { file, key } of queue) {
      try {
        const result = await uploadImage(file, { kind: "product", productId }, (progress) =>
          setPending((current) =>
            current.map((item) => (item.key === key ? { ...item, progress } : item)),
          ),
        );
        const saved = await addProductImage(productId, result);
        if (!saved.ok) throw new UploadError(saved.error, saved.status === 401);
        uploaded++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo subir la foto.";
        toast.error(message);
        if (error instanceof UploadError && error.unauthorized) {
          router.replace("/admin/login");
          return;
        }
      } finally {
        setPending((current) => {
          const done = current.find((item) => item.key === key);
          if (done) URL.revokeObjectURL(done.preview);
          return current.filter((item) => item.key !== key);
        });
        router.refresh();
      }
    }
    if (uploaded > 0)
      toast.success(uploaded === 1 ? "Foto agregada." : `${uploaded} fotos agregadas.`);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!configured) return;
    void uploadFiles([...event.dataTransfer.files]);
  }

  function move(index: number, to: number) {
    const ids = images.map((image) => image.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(to, 0, moved);
    run(() => reorderProductImages(productId, ids), {
      success: to === 0 ? "Portada actualizada." : undefined,
    });
  }

  if (!configured) {
    return (
      <Alert>
        <TriangleAlertIcon aria-hidden />
        <AlertTitle>Fotos sin configurar</AlertTitle>
        <AlertDescription>
          Para subir fotos falta conectar Cloudinary (variables <code>CLOUDINARY_*</code> del
          archivo <code>.env</code>).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn("space-y-3 rounded-xl", dragging && "ring-2 ring-primary ring-offset-4")}
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id} className="group relative overflow-hidden rounded-lg border bg-muted">
            <CloudinaryImage
              src={image.publicId}
              preset="thumb"
              alt={image.alt ?? ""}
              width={320}
              height={320}
              sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
              className="aspect-square w-full object-cover"
            />
            {index === 0 && <Badge className="absolute top-2 left-2">Portada</Badge>}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/90 p-1 backdrop-blur">
              <div className="flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Mover a la izquierda"
                  disabled={busy || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowLeftIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Mover a la derecha"
                  disabled={busy || index === images.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowRightIcon aria-hidden />
                </Button>
              </div>
              <div className="flex">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Usar como portada"
                    title="Usar como portada"
                    disabled={busy}
                    onClick={() => move(index, 0)}
                  >
                    <StarIcon aria-hidden />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar descripción de la foto"
                  title="Descripción (accesibilidad y buscadores)"
                  onClick={() => setEditingAlt(image)}
                >
                  <TypeIcon aria-hidden />
                </Button>
                <DeleteImageButton
                  disabled={busy}
                  onConfirm={() =>
                    run(() => deleteProductImage(image.id), { success: "Foto eliminada." })
                  }
                />
              </div>
            </div>
          </li>
        ))}

        {pending.map((item) => (
          <li key={item.key} className="relative overflow-hidden rounded-lg border bg-muted">
            {/* Vista previa local (blob:) mientras sube: no pasa por next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.preview}
              alt=""
              className="aspect-square w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
              <Loader2Icon className="size-5 animate-spin" aria-hidden />
              <span className="text-xs font-medium tabular-nums">
                {item.progress < 1 ? `Subiendo ${Math.round(item.progress * 100)} %` : "Guardando…"}
              </span>
              <div className="h-1 w-full overflow-hidden rounded-full bg-background/80">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${Math.round(item.progress * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}

        {slotsLeft > 0 && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <ImagePlusIcon className="size-6" aria-hidden />
              <span>Agregar fotos</span>
              <span className="text-xs">o arrástralas aquí</span>
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) void uploadFiles(files);
        }}
      />

      <p className="text-xs text-muted-foreground">
        Hasta {MAX_IMAGES} fotos. La primera es la portada. Consejo: fondo neutro y luz natural; una
        foto de frente, una de detalle y una en un espacio decorado.
      </p>

      <AltTextDialog
        key={editingAlt?.id ?? "none"}
        image={editingAlt}
        onClose={() => setEditingAlt(null)}
        onSave={(alt) => {
          if (!editingAlt) return;
          const id = editingAlt.id;
          setEditingAlt(null);
          run(() => updateProductImageAlt(id, alt), { success: "Descripción guardada." });
        }}
      />
    </div>
  );
}

function DeleteImageButton({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label="Eliminar foto"
          />
        }
      >
        <Trash2Icon aria-hidden />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AltTextDialog({
  image,
  onClose,
  onSave,
}: {
  image: ManagedImage | null;
  onClose: () => void;
  onSave: (alt: string) => void;
}) {
  const [alt, setAlt] = useState(image?.alt ?? "");

  return (
    <Dialog open={image !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(alt.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Descripción de la foto</DialogTitle>
            <DialogDescription>
              La leen los lectores de pantalla y los buscadores. Ej.: «Espejo redondo con luz LED
              sobre lavamanos».
            </DialogDescription>
          </DialogHeader>
          <Input
            className="my-6"
            aria-label="Descripción de la foto"
            value={alt}
            maxLength={160}
            onChange={(event) => setAlt(event.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
