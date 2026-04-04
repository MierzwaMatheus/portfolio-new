-- ==========================================
-- DIAGNÓSTICO DO SISTEMA DE DEPLOY
-- Execute no SQL Editor do Supabase
-- ==========================================

-- 1. Verificar se a tabela deploy_status existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'deploy_status' 
  AND table_schema = 'app_portfolio';

-- 2. Verificar se o registro existe
SELECT * FROM app_portfolio.deploy_status;

-- 3. Verificar se as triggers foram criadas
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'app_portfolio'
ORDER BY event_object_table;

-- 4. Testar manualmente se a trigger funciona
-- Primeiro, marca pending_changes = FALSE
UPDATE app_portfolio.deploy_status 
SET pending_changes = FALSE 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verifica se atualizou
SELECT pending_changes FROM app_portfolio.deploy_status;

-- Agora, faz um UPDATE em qualquer tabela pública (ex: projects)
-- IMPORTANTE: Substitua pelo ID de um projeto existente
UPDATE app_portfolio.projects 
SET title = title 
WHERE id = 'ID_DO_SEU_PROJETO_AQUI' 
LIMIT 1;

-- Verifica se a trigger marcou pending_changes = TRUE
SELECT pending_changes, updated_at FROM app_portfolio.deploy_status;

-- 5. Verificar se a função mark_pending_changes existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'mark_pending_changes'
  AND routine_schema = 'app_portfolio';

-- 6. Verificar políticas RLS na tabela deploy_status
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'deploy_status'
  AND schemaname = 'app_portfolio';