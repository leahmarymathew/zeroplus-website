-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ageTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
