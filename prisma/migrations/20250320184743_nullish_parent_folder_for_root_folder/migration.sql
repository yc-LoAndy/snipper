-- DropForeignKey
ALTER TABLE `folder` DROP FOREIGN KEY `folder_parrentId_fkey`;

-- AlterTable
ALTER TABLE `folder` MODIFY `parrentId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `folder` ADD CONSTRAINT `folder_parrentId_fkey` FOREIGN KEY (`parrentId`) REFERENCES `folder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
