-- DropForeignKey
ALTER TABLE `snippet` DROP FOREIGN KEY `snippet_folderId_fkey`;

-- AddForeignKey
ALTER TABLE `snippet` ADD CONSTRAINT `snippet_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
