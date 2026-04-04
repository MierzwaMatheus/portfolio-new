-- Contact Info
CREATE TRIGGER trigger_contact_info_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.contact_info
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Projects
CREATE TRIGGER trigger_projects_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.projects
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Posts
CREATE TRIGGER trigger_posts_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.posts
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Testimonials
CREATE TRIGGER trigger_testimonials_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.testimonials
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Services
CREATE TRIGGER trigger_services_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.services
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Daily Routine Items
CREATE TRIGGER trigger_daily_routine_items_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.daily_routine_items
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- FAQ Items
CREATE TRIGGER trigger_faq_items_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.faq_items
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Resume Items
CREATE TRIGGER trigger_resume_items_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.resume_items
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();

-- Content
CREATE TRIGGER trigger_content_changes
AFTER INSERT OR UPDATE OR DELETE ON app_portfolio.content
FOR EACH ROW EXECUTE FUNCTION app_portfolio.mark_pending_changes();