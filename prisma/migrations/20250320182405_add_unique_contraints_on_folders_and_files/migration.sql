/*
  Warnings:

  - A unique constraint covering the columns `[parrentId,name]` on the table `folder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerEmail,isTopLevel,name]` on the table `folder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[folderId,fileName]` on the table `snippet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `folder_parrentId_name_key` ON `folder`(`parrentId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `folder_ownerEmail_isTopLevel_name_key` ON `folder`(`ownerEmail`, `isTopLevel`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `snippet_folderId_fileName_key` ON `snippet`(`folderId`, `fileName`);
