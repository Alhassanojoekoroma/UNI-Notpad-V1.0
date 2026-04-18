/*
  Warnings:

  - A unique constraint covering the columns `[contentId,reporterId]` on the table `ContentFlag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ContentFlag_contentId_reporterId_key" ON "ContentFlag"("contentId", "reporterId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
