-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links table
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL,
    product_id TEXT NOT NULL,
    product_handle TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    discount_code TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    target_url TEXT NOT NULL,
    permalink_type TEXT DEFAULT 'product' CHECK (permalink_type IN ('product', 'cart', 'custom')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scans table for tracking link clicks
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID REFERENCES links(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table for tracking conversions
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    link_id UUID REFERENCES links(id) ON DELETE SET NULL,
    shop_order_id TEXT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_merchants_shop_domain ON merchants(shop_domain);
CREATE INDEX idx_campaigns_merchant_id ON campaigns(merchant_id);
CREATE INDEX idx_links_merchant_id ON links(merchant_id);
CREATE INDEX idx_links_code ON links(code);
CREATE INDEX idx_links_campaign_id ON links(campaign_id);
CREATE INDEX idx_scans_link_id ON scans(link_id);
CREATE INDEX idx_scans_merchant_id ON scans(merchant_id);
CREATE INDEX idx_scans_timestamp ON scans(timestamp);
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_link_id ON orders(link_id);
CREATE INDEX idx_orders_shop_order_id ON orders(shop_order_id);

-- RLS (Row Level Security) policies
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for merchants (only they can access their own data)
CREATE POLICY "Merchants can view own data" ON merchants
    FOR ALL USING (shop_domain = current_setting('app.current_shop', true));

CREATE POLICY "Campaigns belong to merchant" ON campaigns
    FOR ALL USING (merchant_id IN (
        SELECT id FROM merchants WHERE shop_domain = current_setting('app.current_shop', true)
    ));

CREATE POLICY "Links belong to merchant" ON links
    FOR ALL USING (merchant_id IN (
        SELECT id FROM merchants WHERE shop_domain = current_setting('app.current_shop', true)
    ));

CREATE POLICY "Scans belong to merchant" ON scans
    FOR ALL USING (merchant_id IN (
        SELECT id FROM merchants WHERE shop_domain = current_setting('app.current_shop', true)
    ));

CREATE POLICY "Orders belong to merchant" ON orders
    FOR ALL USING (merchant_id IN (
        SELECT id FROM merchants WHERE shop_domain = current_setting('app.current_shop', true)
    ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
