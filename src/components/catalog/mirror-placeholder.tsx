import type { MirrorShape } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

// Silueta del espejo según su forma, para productos que aún no tienen foto.
const SHAPE_CLASS: Record<MirrorShape, string> = {
  RECTANGULAR: "aspect-[3/4] w-1/2 rounded-sm",
  SQUARE: "aspect-square w-3/5 rounded-sm",
  ROUND: "aspect-square w-3/5 rounded-full",
  OVAL: "aspect-[2/3] w-1/2 rounded-[50%]",
  ARCH: "aspect-[1/2] w-2/5 rounded-t-full",
  ORGANIC: "aspect-[4/5] w-3/5 rounded-[48%_52%_40%_60%/55%_45%_55%_45%]",
  OTHER: "aspect-[3/4] w-1/2 rounded-2xl",
};

export function MirrorPlaceholder({
  shape,
  className,
}: {
  shape: MirrorShape;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("flex size-full items-center justify-center bg-muted", className)}
    >
      <div className={cn("mirror-surface", SHAPE_CLASS[shape])} />
    </div>
  );
}
