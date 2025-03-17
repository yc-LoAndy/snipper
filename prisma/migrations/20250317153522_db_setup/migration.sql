-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token` (
    `userEmail` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `accessTokenExp` DATETIME(3) NOT NULL,
    `refreshToken` VARCHAR(191) NOT NULL,
    `refreshTokenExp` DATETIME(3) NOT NULL,

    UNIQUE INDEX `token_userEmail_key`(`userEmail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `snippet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `language` ENUM('C', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'MYSQL', 'PLAIN_TEXT') NOT NULL,
    `content` VARCHAR(191) NULL,
    `ownerEmail` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `token` ADD CONSTRAINT `token_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `snippet` ADD CONSTRAINT `snippet_ownerEmail_fkey` FOREIGN KEY (`ownerEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;
