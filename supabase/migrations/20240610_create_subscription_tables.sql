-- Drop existing tables if they exist
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS subscription_items CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- Create enums
CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled',
    'pending',
    'expired'
);

CREATE TYPE subscription_plan AS ENUM (
    'decouverte',
    'essentiel',
    'essentiel_plus',
    'pro',
    'business'
);

CREATE TYPE payment_method AS ENUM (
    'mobile_money',
    'bank_transfer',
    'cash'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'confirmed',
    'failed',
    'refunded'
);

-- Create tables
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name subscription_plan NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    plan_id UUID REFERENCES subscription_plans NOT NULL,
    status subscription_status NOT NULL DEFAULT 'pending',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions NOT NULL,
    feature_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    transaction_reference TEXT,
    payer_phone TEXT,
    payer_name TEXT,
    payment_proof_url TEXT,
    admin_notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES auth.users,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- Create functions
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_subscription_timestamp
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_status();

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "subscription_plans_visible_to_all" ON subscription_plans
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "users_can_read_own_subscriptions" ON subscriptions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_subscriptions" ON subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_read_own_subscription_items" ON subscription_items
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.id = subscription_items.subscription_id
        AND subscriptions.user_id = auth.uid()
    ));

CREATE POLICY "users_can_read_own_payments" ON payment_history
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.id = payment_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    ));

CREATE POLICY "users_can_create_own_payments" ON payment_history
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.id = payment_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    ));

CREATE POLICY "users_can_read_own_roles" ON user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "admins_can_manage_roles" ON user_roles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "admins_can_manage_all_payments" ON payment_history
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Insert default data
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('decouverte', 'Pour curieux, étudiants, testeurs', 0, 0, '{
    "max_cards": 1,
    "basic_customization": true,
    "social_links": true,
    "qr_code": true,
    "hosting": true,
    "templates": 10
}'::jsonb),
('essentiel', 'Pour indépendants, freelances', 6000, 60000, '{
    "max_cards": 1,
    "full_customization": true,
    "vcard": true,
    "basic_stats": true,
    "verified_badge": true,
    "priority_email_support": true,
    "whatsapp_business": true,
    "directory_listing": true,
    "custom_qr": true
}'::jsonb),
('essentiel_plus', 'Pour consultants, professions libérales', 10000, 100000, '{
    "max_cards": 2,
    "custom_landing": true,
    "advanced_stats": true,
    "website_widget": true,
    "basic_appointments": true,
    "branded_qr": true,
    "chat_support": true,
    "contact_survey": true
}'::jsonb),
('pro', 'Pour créateurs avancés, TPE', 15000, 150000, '{
    "max_cards": 3,
    "full_appointments": true,
    "analytics_dashboard": true,
    "calendar_integration": true,
    "advanced_analytics": true,
    "customer_surveys": true,
    "premium_templates": true,
    "phone_support": true,
    "custom_alerts": true
}'::jsonb),
('business', 'Pour agences, entreprises, écoles', 0, 0, '{
    "max_cards": 10,
    "team_management": true,
    "company_page": true,
    "full_branding": true,
    "multi_user_dashboard": true,
    "access_control": true,
    "api_access": true,
    "dedicated_manager": true,
    "quarterly_reports": true,
    "training": true,
    "vip_support": true,
    "custom_features": true
}'::jsonb); 