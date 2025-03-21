-- DropForeignKey
ALTER TABLE `token` DROP FOREIGN KEY `token_userEmail_fkey`;

-- AddForeignKey
ALTER TABLE `token` ADD CONSTRAINT `token_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON DELETE CASCADE ON UPDATE CASCADE;
