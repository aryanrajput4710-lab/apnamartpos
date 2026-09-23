/*
  Warnings:

  - Added the required column `barcodeSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productNameSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skuSnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "barcodeSnapshot" TEXT NOT NULL,
ADD COLUMN     "colorSnapshot" TEXT,
ADD COLUMN     "productNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "sizeSnapshot" TEXT,
ADD COLUMN     "skuSnapshot" TEXT NOT NULL;
