-- R2: knowledge base (additive).
CREATE TABLE "KnowledgeDoc" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "source" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeDoc_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KnowledgeDoc_kind_idx" ON "KnowledgeDoc"("kind");
CREATE INDEX "KnowledgeDoc_status_idx" ON "KnowledgeDoc"("status");

CREATE TABLE "KnowledgeDocVersion" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "savedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeDocVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KnowledgeDocVersion_docId_version_key" ON "KnowledgeDocVersion"("docId", "version");
ALTER TABLE "KnowledgeDocVersion" ADD CONSTRAINT "KnowledgeDocVersion_docId_fkey" FOREIGN KEY ("docId") REFERENCES "KnowledgeDoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "heading" TEXT,
    "text" TEXT NOT NULL,
    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KnowledgeChunk_docId_ordinal_key" ON "KnowledgeChunk"("docId", "ordinal");
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_docId_fkey" FOREIGN KEY ("docId") REFERENCES "KnowledgeDoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
