-- ==========================================
-- CRIAR RPC FUNCTION PARA ACESSAR DEPLOY_STATUS
-- Execute no SQL Editor do Supabase
-- ==========================================

-- Criar função que retorna deploy_status
CREATE OR REPLACE FUNCTION get_deploy_status()
RETURNS TABLE (
  pending_changes BOOLEAN,
  last_published_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.pending_changes,
    ds.last_published_at
  FROM app_portfolio.deploy_status ds
  WHERE ds.id = '00000000-0000-0000-0000-000000000001';
END;
$$;

-- Dar permissão para authenticated users executarem
GRANT EXECUTE ON FUNCTION get_deploy_status() TO authenticated;

-- Testar a função
SELECT * FROM get_deploy_status();