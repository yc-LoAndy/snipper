/*
  Warnings:

  - The values [MYSQL] on the enum `snippet_language` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `snippet` MODIFY `language` ENUM('C', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'SQL', 'PLAIN_TEXT') NOT NULL;
