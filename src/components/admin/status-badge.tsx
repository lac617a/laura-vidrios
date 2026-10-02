import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/generated/prisma/enums";
import { PRODUCT_STATUS_LABELS } from "@/lib/catalog";

const VARIANT: Record<ProductStatus, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={VARIANT[status]}>{PRODUCT_STATUS_LABELS[status]}</Badge>;
}
