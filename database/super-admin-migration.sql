-- ============================================================
-- SECUREPRO SUPER ADMIN MIGRATION
-- Purpose:
-- Add the super_admin role to the existing users table.
--
-- Super Admin is MONITORING ONLY.
-- It does not receive Admin/Technician management permissions.
-- ============================================================

-- 1. Allow the existing users table to use the super_admin role.
ALTER TABLE users
    MODIFY COLUMN role ENUM(
        'admin',
        'technician',
        'super_admin'
    ) NOT NULL;

-- 2. Verify the role definition after running the migration.
SHOW COLUMNS FROM users LIKE 'role';

-- 3. Verify existing users were not changed.
SELECT id, name, email, role, status
FROM users
ORDER BY created_at;