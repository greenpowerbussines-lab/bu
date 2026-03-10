-- Manual migration for existing PostgreSQL databases.
-- Run in Supabase SQL Editor if your schema still has legacy roles:
-- OWNER, ACCOUNTANT, EMPLOYEE.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthMethod') THEN
        CREATE TYPE "AuthMethod" AS ENUM ('CREDENTIALS', 'ONE_ID', 'ERI');
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole')
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole_new') THEN
        CREATE TYPE "UserRole_new" AS ENUM (
            'CEO',
            'MANAGER',
            'CHIEF_ACCOUNTANT',
            'ACCOUNTANT_CLERK',
            'WAREHOUSE_KEEPER'
        );
    END IF;
END $$;

-- Convert legacy enum values to new roles.
ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT,
    ALTER COLUMN role TYPE "UserRole_new"
    USING (
        CASE role::text
            WHEN 'OWNER' THEN 'CEO'
            WHEN 'ACCOUNTANT' THEN 'CHIEF_ACCOUNTANT'
            WHEN 'EMPLOYEE' THEN 'ACCOUNTANT_CLERK'
            WHEN 'MANAGER' THEN 'MANAGER'
            WHEN 'CEO' THEN 'CEO'
            WHEN 'CHIEF_ACCOUNTANT' THEN 'CHIEF_ACCOUNTANT'
            WHEN 'ACCOUNTANT_CLERK' THEN 'ACCOUNTANT_CLERK'
            WHEN 'WAREHOUSE_KEEPER' THEN 'WAREHOUSE_KEEPER'
            ELSE 'ACCOUNTANT_CLERK'
        END
    )::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'ACCOUNTANT_CLERK',
    ADD COLUMN IF NOT EXISTS "authMethod" "AuthMethod" NOT NULL DEFAULT 'CREDENTIALS',
    ADD COLUMN IF NOT EXISTS "eriKeyData" TEXT,
    ADD COLUMN IF NOT EXISTS "oneIdSub" TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS "createdById" TEXT;

COMMIT;
