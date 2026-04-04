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