-- SafeStream Initial Migration
-- Run: psql $DATABASE_URL -f 001_initial_schema.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- USERS
-- ============================================================
CREATE TYPE user_role AS ENUM ('guest','user','premium','creator','super_admin');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    cover_url       TEXT,
    bio             TEXT,
    role            user_role NOT NULL DEFAULT 'user',
    is_verified     BOOLEAN DEFAULT FALSE,
    is_banned       BOOLEAN DEFAULT FALSE,
    ban_reason      TEXT,
    ban_expires_at  TIMESTAMPTZ,
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    mfa_secret      TEXT,
    email_verified  BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    login_count     INTEGER DEFAULT 0,
    country_code    CHAR(2),
    language        VARCHAR(10) DEFAULT 'en',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    date_of_birth   DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role     ON users(role);

-- ============================================================
-- CHANNELS
-- ============================================================
CREATE TABLE channels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handle              VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    avatar_url          TEXT,
    banner_url          TEXT,
    is_verified         BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    subscriber_count    INTEGER DEFAULT 0,
    total_views         BIGINT DEFAULT 0,
    total_videos        INTEGER DEFAULT 0,
    monetization_enabled BOOLEAN DEFAULT FALSE,
    country_code        CHAR(2),
    language            VARCHAR(10) DEFAULT 'en',
    categories          TEXT[] DEFAULT '{}',
    social_links        JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_owner  ON channels(owner_id);
CREATE INDEX idx_channels_handle ON channels(handle);

-- ============================================================
-- VIDEOS
-- ============================================================
CREATE TYPE video_type_enum      AS ENUM ('video','short','live','premium');
CREATE TYPE video_status_enum    AS ENUM ('uploading','processing','pending_review','published','rejected','deleted','draft');
CREATE TYPE video_visibility_enum AS ENUM ('public','private','unlisted','premium_only');
CREATE TYPE moderation_status_enum AS ENUM ('pending','approved','flagged','rejected');

CREATE TABLE videos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    uploader_id         UUID NOT NULL REFERENCES users(id),
    title               VARCHAR(300) NOT NULL,
    description         TEXT,
    thumbnail_url       TEXT,
    video_type          video_type_enum NOT NULL DEFAULT 'video',
    status              video_status_enum NOT NULL DEFAULT 'processing',
    visibility          video_visibility_enum DEFAULT 'public',
    duration_seconds    INTEGER,
    file_size_bytes     BIGINT,
    original_filename   TEXT,
    storage_path        TEXT,
    hls_manifest_url    TEXT,
    is_premium          BOOLEAN DEFAULT FALSE,
    is_age_restricted   BOOLEAN DEFAULT FALSE,
    content_rating      VARCHAR(10) DEFAULT 'G',
    moderation_score    FLOAT,
    moderation_status   moderation_status_enum DEFAULT 'pending',
    view_count          BIGINT DEFAULT 0,
    like_count          INTEGER DEFAULT 0,
    dislike_count       INTEGER DEFAULT 0,
    comment_count       INTEGER DEFAULT 0,
    share_count         INTEGER DEFAULT 0,
    save_count          INTEGER DEFAULT 0,
    trending_score      FLOAT DEFAULT 0,
    tags                TEXT[] DEFAULT '{}',
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_channel        ON videos(channel_id);
CREATE INDEX idx_videos_status         ON videos(status);
CREATE INDEX idx_videos_trending       ON videos(trending_score DESC) WHERE status = 'published';
CREATE INDEX idx_videos_published      ON videos(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_videos_type           ON videos(video_type) WHERE status = 'published';
CREATE INDEX idx_videos_title_trgm     ON videos USING gin(title gin_trgm_ops);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id            UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id           UUID REFERENCES comments(id) ON DELETE CASCADE,
    content             TEXT NOT NULL CHECK (length(content) <= 2000),
    is_pinned           BOOLEAN DEFAULT FALSE,
    is_hidden           BOOLEAN DEFAULT FALSE,
    like_count          INTEGER DEFAULT 0,
    reply_count         INTEGER DEFAULT 0,
    moderation_status   VARCHAR(20) DEFAULT 'approved',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_video  ON comments(video_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id        UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    notify_new_videos BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_subscriptions_user    ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_channel ON subscriptions(channel_id);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id    UUID REFERENCES videos(id) ON DELETE CASCADE,
    comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_like     BOOLEAN NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (video_id IS NOT NULL AND comment_id IS NULL) OR
        (video_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, video_id),
    UNIQUE(user_id, comment_id)
);

-- ============================================================
-- WATCH HISTORY
-- ============================================================
CREATE TABLE watch_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completed       BOOLEAN DEFAULT FALSE,
    last_position   INTEGER DEFAULT 0,
    watch_count     INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

CREATE INDEX idx_watch_history_user ON watch_history(user_id, updated_at DESC);

-- ============================================================
-- PLAYLISTS
-- ============================================================
CREATE TABLE playlists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    visibility  VARCHAR(20) DEFAULT 'private',
    video_count INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_videos (
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    sort_order  INTEGER NOT NULL,
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(playlist_id, video_id)
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type   VARCHAR(20) NOT NULL,
    resource_id     TEXT NOT NULL,
    reason          VARCHAR(50) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'pending',
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    action_taken    VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status, created_at);

-- ============================================================
-- PREMIUM PLANS & SUBSCRIPTIONS
-- ============================================================
CREATE TABLE premium_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    billing_period  VARCHAR(20) NOT NULL,
    price_usd       DECIMAL(10,2) NOT NULL,
    stripe_price_id TEXT,
    features        JSONB,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO premium_plans (name, billing_period, price_usd, features) VALUES
    ('Monthly Premium',   'monthly',   4.99,  '{"downloads":true,"premiumContent":true,"adFree":true}'),
    ('Quarterly Premium', 'quarterly', 12.99, '{"downloads":true,"premiumContent":true,"adFree":true}'),
    ('Annual Premium',    'yearly',    39.99, '{"downloads":true,"premiumContent":true,"adFree":true,"prioritySupport":true}');

CREATE TABLE premium_subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id                 INTEGER NOT NULL REFERENCES premium_plans(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'active',
    stripe_subscription_id  TEXT,
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    trial_ends_at           TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    type                VARCHAR(30) NOT NULL,
    amount_usd          DECIMAL(10,2) NOT NULL,
    currency            CHAR(3) DEFAULT 'USD',
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider            VARCHAR(20),
    provider_payment_id TEXT,
    provider_invoice_id TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES & CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20) NOT NULL DEFAULT 'direct',
    name            VARCHAR(200),
    avatar_url      TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) DEFAULT 'member',
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ,
    is_muted        BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(conversation_id, user_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    reply_to_id     UUID REFERENCES messages(id),
    type            VARCHAR(20) NOT NULL DEFAULT 'text',
    content         TEXT,
    attachment_url  TEXT,
    metadata        JSONB,
    is_edited       BOOLEAN DEFAULT FALSE,
    is_deleted      BOOLEAN DEFAULT FALSE,
    is_encrypted    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200),
    body            TEXT,
    resource_type   VARCHAR(50),
    resource_id     TEXT,
    actor_id        UUID REFERENCES users(id),
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     TEXT,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- ============================================================
-- MODERATION QUEUE
-- ============================================================
CREATE TABLE moderation_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type   VARCHAR(20) NOT NULL,
    resource_id     TEXT NOT NULL,
    ai_score        FLOAT,
    ai_categories   JSONB,
    priority        INTEGER DEFAULT 5,
    status          VARCHAR(20) DEFAULT 'pending',
    assigned_to     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    action_taken    VARCHAR(50),
    reviewer_notes  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modqueue_status ON moderation_queue(status, priority DESC, created_at);

-- ============================================================
-- SEED: Super Admin
-- ============================================================
-- Password: Admin@123456 (bcrypt hash)
INSERT INTO users (username, email, password_hash, display_name, role, email_verified)
VALUES (
    'superadmin',
    'admin@safestream.app',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Super Admin',
    'super_admin',
    true
) ON CONFLICT DO NOTHING;
