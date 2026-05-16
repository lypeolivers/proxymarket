-- Repair Prisma migration history when migration "20260515224630" was removed from the repo.
-- That migration referenced order_status before the column existed; it was superseded by
-- 20260516120000_order_pipeline_status. Keeping this row makes migrate status / migrate dev fail.
--
-- Safe to run: only deletes one row from Prisma's bookkeeping table (no business data).
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260515224630';
