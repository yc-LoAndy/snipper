-- DropForeignKey
ALTER TABLE `folder` DROP FOREIGN KEY `folder_ownerEmail_fkey`;

-- DropIndex
DROP INDEX `folder_ownerEmail_isTopLevel_name_key` ON `folder`;

-- AddForeignKey
ALTER TABLE `folder` ADD CONSTRAINT `folder_ownerEmail_fkey` FOREIGN KEY (`ownerEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;
