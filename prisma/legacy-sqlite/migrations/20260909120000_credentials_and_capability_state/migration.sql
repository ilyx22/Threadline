-- Encrypted credentials, the OAuth handshake, and capability-granular
-- connection state.
--
-- Existing Integration rows keep working: every new column is defaulted to the
-- honest value for a workspace that has connected nothing.

CREATE TABLE "Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sealed" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "externalAccountId" TEXT,
    "externalAccountLabel" TEXT,
    "rotatedAt" DATETIME,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Credential_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Credential_orgId_provider_purpose_key" ON "Credential"("orgId", "provider", "purpose");
CREATE INDEX "Credential_orgId_provider_idx" ON "Credential"("orgId", "provider");
CREATE INDEX "Credential_keyId_idx" ON "Credential"("keyId");

CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "sealedVerifier" TEXT,
    "returnTo" TEXT,
    "scopesRequested" TEXT NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthState_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OAuthState_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OAuthState_state_key" ON "OAuthState"("state");
CREATE INDEX "OAuthState_orgId_provider_idx" ON "OAuthState"("orgId", "provider");
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

-- Capability-granular integration state. Defaults describe a workspace that has
-- connected nothing, which is the truth for every existing row.
ALTER TABLE "Integration" ADD COLUMN "authStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Integration" ADD COLUMN "publishCapability" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Integration" ADD COLUMN "analyticsCapability" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Integration" ADD COLUMN "researchCapability" TEXT NOT NULL DEFAULT 'unavailable';
ALTER TABLE "Integration" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE "Integration" ADD COLUMN "scopesRequested" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Integration" ADD COLUMN "scopesGranted" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Integration" ADD COLUMN "restrictions" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Integration" ADD COLUMN "externalAccountId" TEXT;
ALTER TABLE "Integration" ADD COLUMN "externalAccountLabel" TEXT;
ALTER TABLE "Integration" ADD COLUMN "tokenExpiresAt" DATETIME;
ALTER TABLE "Integration" ADD COLUMN "lastVerifiedAt" DATETIME;
ALTER TABLE "Integration" ADD COLUMN "lastSuccessfulSyncAt" DATETIME;
ALTER TABLE "Integration" ADD COLUMN "lastErrorAt" DATETIME;
ALTER TABLE "Integration" ADD COLUMN "lastErrorCode" TEXT;
ALTER TABLE "Integration" ADD COLUMN "lastErrorMessage" TEXT;
ALTER TABLE "Integration" ADD COLUMN "reconnectRequired" BOOLEAN NOT NULL DEFAULT false;

-- Carry the old coarse state forward rather than resetting it.
UPDATE "Integration" SET "publishCapability" = 'native_delegated' WHERE "accessMethod" = 'native_delegated';
UPDATE "Integration" SET "authStatus" = 'error' WHERE "status" = 'error';
