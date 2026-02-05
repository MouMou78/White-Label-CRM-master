DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  email VARCHAR(320) NOT NULL,
  passwordHash TEXT NOT NULL,
  name TEXT,
  role ENUM('owner', 'collaborator', 'restricted', 'admin', 'user') NOT NULL DEFAULT 'user',
  twoFactorSecret TEXT,
  twoFactorEnabled BOOLEAN NOT NULL DEFAULT FALSE,
  backupCodes JSON,
  passwordResetToken TEXT,
  passwordResetExpires TIMESTAMP NULL,
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY tenant_email_unique (tenantId, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
