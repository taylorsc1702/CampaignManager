-- Add collaborators system to existing schema
-- Run this AFTER the main schema.sql

-- Users table for collaborator management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaborators table linking users to merchants
CREATE TABLE collaborators (
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
CREATE TABLE plan_limits (
    plan TEXT PRIMARY KEY,
    max_collaborators INTEGER NOT NULL,
    max_campaigns INTEGER NOT NULL,
    max_links INTEGER NOT NULL,
    max_scans_per_month INTEGER NOT NULL,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO plan_limits (plan, max_collaborators, max_campaigns, max_links, max_scans_per_month, features) VALUES
('starter', 1, 5, 100, 1000, '{"qr_codes": true, "utm_tracking": true, "basic_analytics": true}'),
('growth', 3, 25, 500, 10000, '{"qr_codes": true, "utm_tracking": true, "advanced_analytics": true, "bulk_operations": true, "custom_domains": false}'),
('pro', -1, -1, -1, -1, '{"qr_codes": true, "utm_tracking": true, "advanced_analytics": true, "bulk_operations": true, "custom_domains": true, "api_access": true, "webhooks": true}');

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_collaborators_merchant_id ON collaborators(merchant_id);
CREATE INDEX idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX idx_collaborators_status ON collaborators(status);

-- RLS policies for collaborators
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Since we're using Shopify OAuth, we'll disable RLS for now
-- In production, you'd implement custom authentication logic

-- Allow all operations for now (you can add custom logic later)
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on collaborators" ON collaborators
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on plan_limits" ON plan_limits
    FOR ALL USING (true);

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

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_limits_updated_at BEFORE UPDATE ON plan_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
