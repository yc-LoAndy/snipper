/*
  Warnings:

  - You are about to drop the column `folderName` on the `snippet` table. All the data in the column will be lost.
  - You are about to drop the column `ownerEmail` on the `snippet` table. All the data in the column will be lost.
  - You are about to alter the column `language` on the `snippet` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - Added the required column `folderId` to the `snippet` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `snippet` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `snippet` DROP FOREIGN KEY `snippet_ownerEmail_fkey`;

-- DropIndex
DROP INDEX `snippet_fileName_folderName_key` ON `snippet`;

-- DropIndex
DROP INDEX `snippet_ownerEmail_id_key` ON `snippet`;

-- AlterTable
ALTER TABLE `snippet` DROP COLUMN `folderName`,
    DROP COLUMN `ownerEmail`,
    ADD COLUMN `folderId` INTEGER NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `language` VARCHAR(191) NOT NULL,
    MODIFY `content` VARCHAR(191) NOT NULL DEFAULT '',
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `folder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `ownerEmail` VARCHAR(191) NOT NULL,
    `isTopLevel` BOOLEAN NOT NULL,
    `parrentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `folder` ADD CONSTRAINT `folder_ownerEmail_fkey` FOREIGN KEY (`ownerEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folder` ADD CONSTRAINT `folder_parrentId_fkey` FOREIGN KEY (`parrentId`) REFERENCES `folder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `snippet` ADD CONSTRAINT `snippet_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
