import type { InquiryStatus, InquiryType } from "@/generated/prisma/enums";
import { INQUIRY_STATUS_LABELS, INQUIRY_TYPE_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Colores del embudo: nueva (atención), en curso, cotizada, vendida y perdida (apagada). */
export const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  CONTACTED: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  QUOTED: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  WON: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  LOST: "bg-muted text-muted-foreground",
};

export function InquiryStatusBadge({
  status,
  className,
}: {
  status: InquiryStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {INQUIRY_STATUS_LABELS[status]}
    </span>
  );
}

export function InquiryTypeBadge({ type }: { type: InquiryType }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-xs text-muted-foreground">
      {INQUIRY_TYPE_LABELS[type]}
    </span>
  );
}
