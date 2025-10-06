-- Add collaborators system to existing schema
-- Run this AFTER the main schema.sql
-- This version doesn't use Supabase Auth RLS since we're using Shopify OAuth

-- Users table for collaborator management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaborators table linking users to merchants
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id, user_id)
);

-- Plan limits table
CREATE TABLE IF NOT EXISTS plan_limits (
    plan TEXT PRIMARY KEY,
    max_collaborators INTEGER NOT NULL,
    max_campaigns INTEGER NOT NULL,
    max_links INTEGER NOT NULL,
    max_scans_per_month INTEGER NOT NULL,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk operations tracking table
CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('bulk_links', 'bulk_permalinks', 'csv_import')),
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Link templates for reusable configurations
CREATE TABLE IF NOT EXISTS link_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    discount_code_prefix TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'amount')),
    discount_value DECIMAL(10,2),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled campaigns for future link activation
CREATE TABLE IF NOT EXISTS scheduled_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed')),
    activation_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plan limits (only if they don't exist)
INSERT INTO plan_limits (plan, max_collaborators, max_campaigns, max_links, max_scans_per_month, features) VALUES
('starter', 1, 5, 100, 1000, '{"qr_codes": true, "utm_tracking": true, "basic_analytics": true, "link_templates": false, "scheduled_campaigns": false}'),
('growth', 3, 25, 500, 10000, '{"qr_codes": true, "utm_tracking": true, "advanced_analytics": true, "bulk_operations": true, "custom_domains": false, "link_templates": true, "scheduled_campaigns": true, "csv_import": true}'),
('pro', -1, -1, -1, -1, '{"qr_codes": true, "utm_tracking": true, "advanced_analytics": true, "bulk_operations": true, "custom_domains": true, "api_access": true, "webhooks": true, "link_templates": true, "scheduled_campaigns": true, "csv_import": true, "bulk_export": true}')
ON CONFLICT (plan) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_collaborators_merchant_id ON collaborators(merchant_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON collaborators(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_merchant_id ON bulk_operations(merchant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_link_templates_merchant_id ON link_templates(merchant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_merchant_id ON scheduled_campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_status ON scheduled_campaigns(status);

-- Function to check if user can add more collaborators
CREATE OR REPLACE FUNCTION can_add_collaborator(merchant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    merchant_plan TEXT;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get merchant plan
    SELECT plan INTO merchant_plan FROM merchants WHERE id = merchant_uuid;
    
    -- Get current collaborator count
    SELECT COUNT(*) INTO current_count 
    FROM collaborators 
    WHERE merchant_id = merchant_uuid AND status = 'accepted';
    
    -- Get plan limit
    SELECT max_collaborators INTO max_allowed 
    FROM plan_limits 
    WHERE plan = merchant_plan;
    
    -- -1 means unlimited
    IF max_allowed = -1 THEN
        RETURN TRUE;
    END IF;
    
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get merchant plan limits
CREATE OR REPLACE FUNCTION get_merchant_limits(merchant_uuid UUID)
RETURNS TABLE (
    max_collaborators INTEGER,
    max_campaigns INTEGER,
    max_links INTEGER,
    max_scans_per_month INTEGER,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT pl.max_collaborators, pl.max_campaigns, pl.max_links, pl.max_scans_per_month, pl.features
    FROM plan_limits pl
    JOIN merchants m ON m.plan = pl.plan
    WHERE m.id = merchant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if merchant has feature access
CREATE OR REPLACE FUNCTION has_feature_access(merchant_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    merchant_plan TEXT;
    features JSONB;
BEGIN
    -- Get merchant plan and features
    SELECT pl.features INTO features
    FROM plan_limits pl
    JOIN merchants m ON m.plan = pl.plan
    WHERE m.id = merchant_uuid;
    
    -- Check if feature is enabled
    RETURN COALESCE((features->feature_name)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bulk operation progress
CREATE OR REPLACE FUNCTION update_bulk_operation_progress(
    operation_uuid UUID,
    processed_count INTEGER,
    failed_count INTEGER,
    operation_status TEXT DEFAULT NULL,
    error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE bulk_operations 
    SET 
        processed_items = processed_count,
        failed_items = failed_count,
        status = COALESCE(operation_status, status),
        error_message = COALESCE(error_msg, error_message),
        completed_at = CASE WHEN operation_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = operation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collaborators_updated_at ON collaborators;
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_limits_updated_at ON plan_limits;
CREATE TRIGGER update_plan_limits_updated_at BEFORE UPDATE ON plan_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_link_templates_updated_at ON link_templates;
CREATE TRIGGER update_link_templates_updated_at BEFORE UPDATE ON link_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_campaigns_updated_at ON scheduled_campaigns;
CREATE TRIGGER update_scheduled_campaigns_updated_at BEFORE UPDATE ON scheduled_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

