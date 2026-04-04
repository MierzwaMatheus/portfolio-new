-- ==========================================
-- CORREÇÃO RÁPIDA - Execute se as triggers não existirem
-- ==========================================

-- 1. Criar a função trigger (se não existir)
CREATE OR REPLACE FUNCTION app_portfolio.mark_pending_changes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE app_portfolio.deploy_status
  SET 
    pending_changes = TRUE,
    updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir que o registro inicial existe
INSERT INTO app_portfolio.deploy_status (id, pending_changes, last_published_at)
VALUES ('00000000-0000-0000-0000-000000000001', FALSE, NOW())
ON CONFLICT (id) DO UPDATE SET 
  pending_changes = FALSE,
  last_published_at = NOW();

-- 3. Recriar todas as triggers (DROP se existirem, CREATE se não)
DO $$
BEGIN
  -- Contact Info
  DROP TRIGGER IF EXISTS trigger_contact_info_changes ON app_portfolio.contact_info;
  CREATE TRIGGER trigger_contact_info_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.contact_info
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Projects
  DROP TRIGGER IF EXISTS trigger_projects_changes ON app_portfolio.projects;
  CREATE TRIGGER trigger_projects_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.projects
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Posts
  DROP TRIGGER IF EXISTS trigger_posts_changes ON app_portfolio.posts;
  CREATE TRIGGER trigger_posts_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.posts
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Testimonials
  DROP TRIGGER IF EXISTS trigger_testimonials_changes ON app_portfolio.testimonials;
  CREATE TRIGGER trigger_testimonials_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.testimonials
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Services
  DROP TRIGGER IF EXISTS trigger_services_changes ON app_portfolio.services;
  CREATE TRIGGER trigger_services_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.services
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Daily Routine Items
  DROP TRIGGER IF EXISTS trigger_daily_routine_items_changes ON app_portfolio.daily_routine_items;
  CREATE TRIGGER trigger_daily_routine_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.daily_routine_items
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- FAQ Items
  DROP TRIGGER IF EXISTS trigger_faq_items_changes ON app_portfolio.faq_items;
  CREATE TRIGGER trigger_faq_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.faq_items
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Resume Items
  DROP TRIGGER IF EXISTS trigger_resume_items_changes ON app_portfolio.resume_items;
  CREATE TRIGGER trigger_resume_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.resume_items
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

  -- Content
  DROP TRIGGER IF EXISTS trigger_content_changes ON app_portfolio.content;
  CREATE TRIGGER trigger_content_changes
  AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.content
  FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();
END
$$;

-- 4. Verificar se funcionou
SELECT 
  pending_changes,
  last_published_at,
  updated_at
FROM app_portfolio.deploy_status;