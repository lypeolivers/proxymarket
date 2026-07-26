-- Unifica modelos CardPrintModel duplicados (base + sufixo -VERNIZ) em um único modelo por arte,
-- preservando fidelidade via order_item.has_varnish.
--
-- Executar manualmente (fora de prisma migrate), após aplicar a migração has_varnish:
--   npx prisma db execute --schema=prisma/schema.prisma --file prisma/scripts/merge-varnish-print-models.sql
--
-- Revise os SELECTs de conferência antes do COMMIT; use ROLLBACK se algo estiver errado.

BEGIN;

-- Órfãos (verniz no nome/arquivo sem par base por sufixo) — não serão alterados
SELECT v.id, v.card_id, v.name, v.file_name
FROM card_print_model v
WHERE v.is_deleted = false
  AND (upper(v.name) LIKE '%VERNIZ%' OR upper(v.file_name) LIKE '%VERNIZ%')
  AND NOT EXISTS (
    SELECT 1 FROM card_print_model b
    WHERE b.card_id = v.card_id AND b.is_deleted = false
      AND upper(v.file_name) = upper(b.file_name || '-VERNIZ')
  )
ORDER BY v.card_id, v.id;

-- Contagens antes
SELECT
  (SELECT count(*) FROM card_print_model WHERE is_deleted = false) AS active_models,
  (SELECT count(*) FROM order_item oi
   JOIN card_print_model m ON m.id = oi.card_print_model_id
   WHERE oi.is_deleted = false
     AND (upper(m.name) LIKE '%VERNIZ%' OR upper(m.file_name) LIKE '%VERNIZ%')) AS items_on_verniz_models;

-- 1) Backfill: linhas que usam modelo "verniz" passam a has_varnish = true
UPDATE order_item oi
SET has_varnish = true,
    updated_at = NOW()
FROM card_print_model m
WHERE oi.card_print_model_id = m.id
  AND oi.is_deleted = false
  AND m.is_deleted = false
  AND (upper(m.name) LIKE '%VERNIZ%' OR upper(m.file_name) LIKE '%VERNIZ%');

-- 2) Repontar itens dos 55 pares: verniz model -> base model (has_varnish já true no passo 1)
UPDATE order_item oi
SET card_print_model_id = b.id,
    updated_at = NOW()
FROM card_print_model v
JOIN card_print_model b
  ON b.card_id = v.card_id
 AND b.is_deleted = false
 AND upper(v.file_name) = upper(b.file_name || '-VERNIZ')
WHERE oi.card_print_model_id = v.id
  AND oi.is_deleted = false
  AND v.is_deleted = false;

-- 3) Soft delete dos modelos verniz que tinham par base (órfãos permanecem ativos)
UPDATE card_print_model v
SET is_deleted = true,
    updated_at = NOW()
WHERE v.is_deleted = false
  AND EXISTS (
    SELECT 1 FROM card_print_model b
    WHERE b.card_id = v.card_id AND b.is_deleted = false
      AND upper(v.file_name) = upper(b.file_name || '-VERNIZ')
  );

-- Contagens depois
SELECT
  (SELECT count(*) FROM card_print_model WHERE is_deleted = false) AS active_models,
  (SELECT count(*) FROM order_item WHERE is_deleted = false AND has_varnish = true) AS items_with_varnish,
  (SELECT count(*) FROM card_print_model WHERE is_deleted = false
     AND (upper(name) LIKE '%VERNIZ%' OR upper(file_name) LIKE '%VERNIZ%')) AS active_verniz_named_models;

COMMIT;
