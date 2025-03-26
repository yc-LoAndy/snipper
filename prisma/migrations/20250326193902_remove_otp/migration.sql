/*
  Warnings:

  - You are about to drop the column `otp` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `otpExp` on the `token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `token` DROP COLUMN `otp`,
    DROP COLUMN `otpExp`;
