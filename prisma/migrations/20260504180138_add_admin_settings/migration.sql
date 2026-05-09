-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "themeColors" JSONB NOT NULL DEFAULT '{"primary":"#6fcf2e","secondary":"#2a4a2a","accent":"#90ee90","background":"#0d0d12","surface":"#181820","text":"#ffffff","border":"#2a2a36","success":"#10b981","warning":"#f59e0b","danger":"#ef4444"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);
