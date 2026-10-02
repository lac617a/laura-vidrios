-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IN_STOCK', 'MADE_TO_ORDER', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "MirrorShape" AS ENUM ('RECTANGULAR', 'SQUARE', 'ROUND', 'OVAL', 'ARCH', 'ORGANIC', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('CATALOG', 'CUSTOM', 'GENERAL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'EDITOR');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shape" "MirrorShape" NOT NULL,
    "frameMaterial" TEXT,
    "frameColor" TEXT,
    "style" TEXT,
    "hasLed" BOOLEAN NOT NULL DEFAULT false,
    "searchText" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "allowCustomSize" BOOLEAN NOT NULL DEFAULT true,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "widthCm" INTEGER NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "price" INTEGER,
    "availability" "Availability" NOT NULL DEFAULT 'IN_STOCK',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "InquiryType" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "needsShipping" BOOLEAN NOT NULL DEFAULT false,
    "needsInstallation" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "source" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryItem" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "reference" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "widthCm" INTEGER,
    "heightCm" INTEGER,
    "isCustomSize" BOOLEAN NOT NULL DEFAULT false,
    "customShape" "MirrorShape",
    "frameDetails" TEXT,
    "hasLed" BOOLEAN,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceSnapshot" INTEGER,
    "notes" TEXT,

    CONSTRAINT "InquiryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "businessName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "whatsappNumber" TEXT NOT NULL,
    "messageTemplate" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'COP',
    "locale" TEXT NOT NULL DEFAULT 'es-CO',
    "referencePrefix" TEXT NOT NULL DEFAULT 'ESP',
    "referenceCounter" INTEGER NOT NULL DEFAULT 0,
    "shippingInfo" TEXT,
    "installationInfo" TEXT,
    "coverageAreas" TEXT[],
    "customMinCm" INTEGER NOT NULL DEFAULT 20,
    "customMaxCm" INTEGER NOT NULL DEFAULT 250,
    "customFrameOptions" TEXT[],
    "privacyPolicy" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "tiktokUrl" TEXT,
    "address" TEXT,
    "openingHours" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_reference_key" ON "Product"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_categoryId_idx" ON "Product"("status", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_code_key" ON "Inquiry"("code");

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_type_createdAt_idx" ON "Inquiry"("type", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryItem_inquiryId_idx" ON "InquiryItem"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryItem_productId_idx" ON "InquiryItem"("productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
