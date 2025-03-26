/*
  Warnings:

  - Added the required column `otp` to the `token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `otpExp` to the `token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `token` ADD COLUMN `otp` VARCHAR(191) NOT NULL,
    ADD COLUMN `otpExp` DATETIME(3) NOT NULL;
