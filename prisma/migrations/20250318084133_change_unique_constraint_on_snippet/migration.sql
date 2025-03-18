/*
  Warnings:

  - The primary key for the `snippet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[ownerEmail,id]` on the table `snippet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `snippet` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `snippet_ownerEmail_id_key` ON `snippet`(`ownerEmail`, `id`);
