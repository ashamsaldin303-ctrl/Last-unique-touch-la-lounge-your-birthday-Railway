-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('LUT', 'LA_LOUNGE', 'YOUR_BIRTHDAY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PAYMENT_FAILED');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "brand" "Brand" NOT NULL DEFAULT 'LUT',
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "brand" "Brand" NOT NULL DEFAULT 'LUT',
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "rentalPricePerDay" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION NOT NULL,
    "images" JSONB NOT NULL,
    "model3dUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "brand" "Brand" NOT NULL DEFAULT 'LUT',
    "productId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KWD',
    "address" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "ip" TEXT,
    "userId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "brand" "Brand" NOT NULL DEFAULT 'LUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_brand_slug_idx" ON "Category"("brand", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_brand_slug_key" ON "Category"("brand", "slug");

-- CreateIndex
CREATE INDEX "Product_brand_categoryId_idx" ON "Product"("brand", "categoryId");

-- CreateIndex
CREATE INDEX "Product_brand_isActive_idx" ON "Product"("brand", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Product_brand_slug_key" ON "Product"("brand", "slug");

-- CreateIndex
CREATE INDEX "Booking_brand_createdAt_idx" ON "Booking"("brand", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_productId_startDate_endDate_idx" ON "Booking"("productId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_brand_startDate_idx" ON "Booking"("brand", "startDate");

-- CreateIndex
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_key_expiresAt_idx" ON "IdempotencyKey"("key", "expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_orderId_idx" ON "IdempotencyKey"("orderId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityLog_event_createdAt_idx" ON "SecurityLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_brand_createdAt_idx" ON "ContactMessage"("brand", "createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

