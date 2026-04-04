-- ==========================================
-- TESTE MANUAL DA TRIGGER
-- Execute passo a passo para verificar
-- ==========================================

-- PASSO 1: Resetar status para FALSE
UPDATE app_portfolio.deploy_status 
SET pending_changes = FALSE;

-- Verificar
SELECT pending_changes FROM app_portfolio.deploy_status;
-- Esperado: FALSE

-- PASSO 2: Fazer um UPDATE em uma tabela (ex: contact_info)
UPDATE app_portfolio.contact_info 
SET name = name 
WHERE id IS NOT NULL 
LIMIT 1;

-- PASSO 3: Verificar se a trigger funcionou
SELECT 
  pending_changes,
  updated_at,
  NOW() as current_time
FROM app_portfolio.deploy_status;
-- Esperado: pending_changes = TRUE

-- PASSO 4: Testar com INSERT (criar um projeto dummy)
INSERT INTO app_portfolio.projects (
  id,
  title,
  description,
  created_at
) VALUES (
  gen_random_uuid(),
  'TESTE - Projeto Dummy',
  'Este é um projeto de teste para verificar a trigger',
  NOW()
) RETURNING id;

-- Verificar se marcou pending_changes
SELECT pending_changes FROM app_portfolio.deploy_status;
-- Esperado: TRUE

-- PASSO 5: Limpar o projeto de teste
DELETE FROM app_portfolio.projects 
WHERE title = 'TESTE - Projeto Dummy';

-- Verificar novamente
SELECT pending_changes FROM app_portfolio.deploy_status;
-- Esperado: TRUE (permanece TRUE após DELETE)

-- PASSO 6: Resetar para testar o fluxo completo
UPDATE app_portfolio.deploy_status 
SET 
  pending_changes = FALSE,
  last_published_at = NOW();