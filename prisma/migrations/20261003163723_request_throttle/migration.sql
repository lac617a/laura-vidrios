-- CreateTable
CREATE TABLE "RequestThrottle" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "RequestThrottle_windowStart_idx" ON "RequestThrottle"("windowStart");
