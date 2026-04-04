-- Deploy Status Table
CREATE TABLE IF NOT EXISTS app_portfolio.deploy_status (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  pending_changes BOOLEAN DEFAULT FALSE,
  last_published_at TIMESTAMPTZ DEFAULT NOW(),
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001')
);

INSERT INTO app_portfolio.deploy_status (id, pending_changes, last_published_at)
VALUES ('00000000-0000-0000-0000-000000000001', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_portfolio.deploy_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can update deploy_status"
  ON app_portfolio.deploy_status
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_app_roles 
    WHERE user_app_roles.user_id = auth.uid() 
    AND user_app_roles.role IN ('root', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_app_roles 
    WHERE user_app_roles.user_id = auth.uid() 
    AND user_app_roles.role IN ('root', 'admin')
  ));

CREATE POLICY "Anyone can read deploy_status"
  ON app_portfolio.deploy_status
  FOR SELECT
  TO authenticated
  USING (true);