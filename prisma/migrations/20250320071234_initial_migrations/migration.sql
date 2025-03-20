-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
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

    UNIQUE INDEX `token_userEmail_key`(`userEmail`),
    UNIQUE INDEX `token_accessToken_key`(`accessToken`),
    UNIQUE INDEX `token_refreshToken_key`(`refreshToken`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `snippet` (
    `id` INTEGER NOT NULL,
    `language` ENUM('C', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'SQL', 'PLAIN_TEXT') NOT NULL,
    `content` VARCHAR(191) NULL,
    `ownerEmail` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `folderName` VARCHAR(191) NOT NULL DEFAULT 'MySnippet',

    UNIQUE INDEX `snippet_ownerEmail_id_key`(`ownerEmail`, `id`),
    UNIQUE INDEX `snippet_fileName_folderName_key`(`fileName`, `folderName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `token` ADD CONSTRAINT `token_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `snippet` ADD CONSTRAINT `snippet_ownerEmail_fkey` FOREIGN KEY (`ownerEmail`) REFERENCES `user`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;
