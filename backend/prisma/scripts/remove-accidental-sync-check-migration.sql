-- Remove accidental migration created by `migrate dev --name sync_check` (wrong timestamp order).
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260515233631_sync_check';
