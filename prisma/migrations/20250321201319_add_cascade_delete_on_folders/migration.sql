-- DropForeignKey
ALTER TABLE `folder` DROP FOREIGN KEY `folder_parrentId_fkey`;

-- AddForeignKey
ALTER TABLE `folder` ADD CONSTRAINT `folder_parrentId_fkey` FOREIGN KEY (`parrentId`) REFERENCES `folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
