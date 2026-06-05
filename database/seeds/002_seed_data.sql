-- SafeStream Seed Data — realistic channels, videos, users
-- Password for all test accounts: Test@123456
-- bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2

-- ============================================================
-- SEED USERS
-- ============================================================
INSERT INTO users (username, email, password_hash, display_name, role, email_verified, avatar_url, bio) VALUES
  ('alice_edu',    'alice@test.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Alice Johnson',    'creator', true, 'https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff',   'Educator & content creator passionate about making learning fun'),
  ('bob_science',  'bob@test.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Bob Science',      'creator', true, 'https://ui-avatars.com/api/?name=Bob+Science&background=22c55e&color=fff',     'Science communicator. Making physics & chemistry accessible for everyone'),
  ('sarah_arts',   'sarah@test.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Sarah Arts',       'creator', true, 'https://ui-avatars.com/api/?name=Sarah+Arts&background=ec4899&color=fff',     'Artist & art teacher. Daily drawing & painting tutorials'),
  ('kidscoder',    'kids@test.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Kids Coder',       'creator', true, 'https://ui-avatars.com/api/?name=Kids+Coder&background=f59e0b&color=fff',    'Teaching coding to children ages 6-12'),
  ('naturexplore', 'nature@test.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Nature Explorer',  'creator', true, 'https://ui-avatars.com/api/?name=Nature+Explorer&background=10b981&color=fff','Wildlife documentaries & nature education for families'),
  ('mathwiz',      'math@test.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Math Wizard',      'creator', true, 'https://ui-avatars.com/api/?name=Math+Wizard&background=8b5cf6&color=fff',   'Making mathematics beautiful and understandable'),
  ('user_one',     'user1@test.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Regular User',     'user',    true, null, null),
  ('premium_user', 'premium@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxT5ZFkxPmD6uXmJKBwXkbJy5O2', 'Premium Member',   'premium', true, null, null)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED CHANNELS
-- ============================================================
WITH creator_ids AS (
    SELECT id, username FROM users WHERE username IN ('alice_edu','bob_science','sarah_arts','kidscoder','naturexplore','mathwiz')
)
INSERT INTO channels (owner_id, handle, name, description, is_verified, subscriber_count, total_videos, categories, avatar_url, banner_url)
SELECT
    c.id,
    c.username,
    CASE c.username
        WHEN 'alice_edu'    THEN 'AliceLearn — Education for All'
        WHEN 'bob_science'  THEN 'Bob''s Science Lab'
        WHEN 'sarah_arts'   THEN 'Sarah Arts Studio'
        WHEN 'kidscoder'    THEN 'Kids Code Academy'
        WHEN 'naturexplore' THEN 'Nature & Wildlife Explorer'
        WHEN 'mathwiz'      THEN 'Math Made Easy'
    END,
    CASE c.username
        WHEN 'alice_edu'    THEN 'Comprehensive educational content for students of all ages. History, geography, languages and more.'
        WHEN 'bob_science'  THEN 'Fun science experiments, physics explanations, and chemistry demos. Safe for the whole family!'
        WHEN 'sarah_arts'   THEN 'Daily art tutorials from beginner to advanced. Drawing, painting, sculpture and more.'
        WHEN 'kidscoder'    THEN 'Learn Scratch, Python and web development through fun projects designed for kids.'
        WHEN 'naturexplore' THEN 'Wildlife documentaries, nature hikes, and environmental education for curious minds.'
        WHEN 'mathwiz'      THEN 'Algebra, geometry, calculus and statistics explained clearly with visual animations.'
    END,
    true,
    CASE c.username
        WHEN 'alice_edu'    THEN 125000
        WHEN 'bob_science'  THEN 98000
        WHEN 'sarah_arts'   THEN 67000
        WHEN 'kidscoder'    THEN 45000
        WHEN 'naturexplore' THEN 234000
        WHEN 'mathwiz'      THEN 89000
    END,
    CASE c.username
        WHEN 'alice_edu'    THEN 150
        WHEN 'bob_science'  THEN 120
        WHEN 'sarah_arts'   THEN 200
        WHEN 'kidscoder'    THEN 80
        WHEN 'naturexplore' THEN 95
        WHEN 'mathwiz'      THEN 110
    END,
    CASE c.username
        WHEN 'alice_edu'    THEN ARRAY['education']
        WHEN 'bob_science'  THEN ARRAY['education','science']
        WHEN 'sarah_arts'   THEN ARRAY['arts','education']
        WHEN 'kidscoder'    THEN ARRAY['education','technology']
        WHEN 'naturexplore' THEN ARRAY['documentary','science']
        WHEN 'mathwiz'      THEN ARRAY['education','science']
    END,
    'https://ui-avatars.com/api/?name=' || replace(c.username,'_','+') || '&size=200&background=random',
    'https://picsum.photos/seed/' || c.username || '/1280/360'
FROM creator_ids c
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED VIDEOS
-- ============================================================
DO $$
DECLARE
    ch_alice    UUID;
    ch_bob      UUID;
    ch_sarah    UUID;
    ch_kids     UUID;
    ch_nature   UUID;
    ch_math     UUID;
    uploader_alice    UUID;
    uploader_bob      UUID;
    uploader_sarah    UUID;
    uploader_kids     UUID;
    uploader_nature   UUID;
    uploader_math     UUID;
BEGIN
    SELECT id INTO ch_alice    FROM channels WHERE handle = 'alice_edu';
    SELECT id INTO ch_bob      FROM channels WHERE handle = 'bob_science';
    SELECT id INTO ch_sarah    FROM channels WHERE handle = 'sarah_arts';
    SELECT id INTO ch_kids     FROM channels WHERE handle = 'kidscoder';
    SELECT id INTO ch_nature   FROM channels WHERE handle = 'naturexplore';
    SELECT id INTO ch_math     FROM channels WHERE handle = 'mathwiz';
    SELECT id INTO uploader_alice   FROM users WHERE username = 'alice_edu';
    SELECT id INTO uploader_bob     FROM users WHERE username = 'bob_science';
    SELECT id INTO uploader_sarah   FROM users WHERE username = 'sarah_arts';
    SELECT id INTO uploader_kids    FROM users WHERE username = 'kidscoder';
    SELECT id INTO uploader_nature  FROM users WHERE username = 'naturexplore';
    SELECT id INTO uploader_math    FROM users WHERE username = 'mathwiz';

    -- Alice's Education Videos
    INSERT INTO videos (channel_id, uploader_id, title, description, video_type, status, visibility, duration_seconds, view_count, like_count, comment_count, trending_score, moderation_status, hls_manifest_url, thumbnail_url, tags, published_at) VALUES
    (ch_alice, uploader_alice, 'The Complete History of Ancient Egypt', 'From the Old Kingdom to Cleopatra — a comprehensive overview of one of history''s greatest civilizations. Includes maps, timelines, and primary source analysis.', 'video', 'published', 'public', 2847, 45230, 3200, 287, 92.5, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/egypt1/640/360', ARRAY['history','egypt','education','ancient'], NOW() - INTERVAL '30 days'),
    (ch_alice, uploader_alice, 'Learn Spanish in 30 Minutes — Beginner Lesson', 'Master the 100 most common Spanish phrases with native pronunciation guides and interactive exercises. Perfect for absolute beginners.', 'video', 'published', 'public', 1823, 78500, 6100, 423, 145.2, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/spanish1/640/360', ARRAY['language','spanish','education','beginner'], NOW() - INTERVAL '14 days'),
    (ch_alice, uploader_alice, 'World Geography: Every Country Explained', 'A deep dive into the world''s 195 countries. Learn capitals, cultures, landmarks, and key facts in this mega-documentary series.', 'video', 'published', 'public', 5420, 123000, 9800, 1250, 298.7, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/geography1/640/360', ARRAY['geography','world','education','documentary'], NOW() - INTERVAL '7 days'),
    (ch_alice, uploader_alice, '5 Memory Techniques Used by World Champions', 'Short science-backed methods to remember anything faster. Great for students of all ages.', 'short', 'published', 'public', 58, 234000, 21000, 3400, 876.3, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/memory1/640/360', ARRAY['memory','study','tips','short'], NOW() - INTERVAL '2 days');

    -- Bob's Science Videos
    INSERT INTO videos (channel_id, uploader_id, title, description, video_type, status, visibility, duration_seconds, view_count, like_count, comment_count, trending_score, moderation_status, hls_manifest_url, thumbnail_url, tags, published_at) VALUES
    (ch_bob, uploader_bob, 'How Vaccines Work — A Visual Explanation', 'Clear, accurate, family-friendly explanation of how the immune system and vaccines work together. Includes animated diagrams.', 'video', 'published', 'public', 1456, 189000, 15600, 2100, 412.8, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/vaccine1/640/360', ARRAY['science','health','biology','education'], NOW() - INTERVAL '21 days'),
    (ch_bob, uploader_bob, 'The Periodic Table Explained Simply', 'Every element, its properties, and why it matters — explained in plain language with fun demonstrations for each group.', 'video', 'published', 'public', 3240, 67000, 5200, 678, 156.4, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/periodic1/640/360', ARRAY['chemistry','science','education','periodic table'], NOW() - INTERVAL '45 days'),
    (ch_bob, uploader_bob, 'Why the Sky is Blue (and Other Light Mysteries)', 'Rayleigh scattering, refraction, and diffraction explained for curious minds. Safe, engaging science for the whole family.', 'short', 'published', 'public', 52, 456000, 38000, 5600, 1543.2, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/sky1/640/360', ARRAY['physics','light','science','short'], NOW() - INTERVAL '1 days');

    -- Sarah's Art Videos
    INSERT INTO videos (channel_id, uploader_id, title, description, video_type, status, visibility, duration_seconds, view_count, like_count, comment_count, trending_score, moderation_status, hls_manifest_url, thumbnail_url, tags, published_at) VALUES
    (ch_sarah, uploader_sarah, 'Drawing Animals for Beginners — Step by Step', 'Learn to draw 10 different animals with easy step-by-step instructions. No experience needed. Great for kids and adults alike!', 'video', 'published', 'public', 2134, 34000, 2800, 341, 78.9, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/draw1/640/360', ARRAY['art','drawing','animals','beginner'], NOW() - INTERVAL '10 days'),
    (ch_sarah, uploader_sarah, 'Watercolor Sunset — Relaxing Tutorial', 'A calming 45-minute watercolor painting session. Paint a beautiful sunset landscape while learning blending techniques.', 'video', 'published', 'public', 2678, 21000, 1900, 213, 56.2, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/watercolor1/640/360', ARRAY['art','watercolor','painting','tutorial'], NOW() - INTERVAL '25 days');

    -- Kids Coder Videos
    INSERT INTO videos (channel_id, uploader_id, title, description, video_type, status, visibility, duration_seconds, view_count, like_count, comment_count, trending_score, moderation_status, hls_manifest_url, thumbnail_url, tags, published_at) VALUES
    (ch_kids, uploader_kids, 'Build Your First Game in Scratch!', 'In this beginner-friendly tutorial, kids aged 7+ will build a complete catching game using Scratch. No prior coding needed!', 'video', 'published', 'public', 1890, 56000, 4500, 892, 134.6, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/scratch1/640/360', ARRAY['coding','scratch','kids','game','education'], NOW() - INTERVAL '5 days'),
    (ch_kids, uploader_kids, 'Python for Kids — Variables and Loops', 'An engaging introduction to Python programming concepts for children aged 10-14. Includes fun exercises and mini-projects.', 'video', 'published', 'public', 2456, 34000, 2900, 445, 89.3, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/python1/640/360', ARRAY['coding','python','kids','programming'], NOW() - INTERVAL '15 days');

    -- Nature Videos
    INSERT INTO videos (channel_id, uploader_id, title, description, video_type, status, visibility, duration_seconds, view_count, like_count, comment_count, trending_score, moderation_status, hls_manifest_url, thumbnail_url, tags, published_at) VALUES
    (ch_nature, uploader_nature, 'Amazon Rainforest — Life in the Canopy', 'Stunning 4K footage of the Amazon rainforest with narrated documentary covering biodiversity, climate impact, and conservation efforts.', 'video', 'published', 'public', 4320, 342000, 28900, 4230, 934.7, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/amazon1/640/360', ARRAY['nature','documentary','amazon','wildlife','conservation'], NOW() - INTERVAL '3 days'),
    (ch_nature, uploader_nature, 'Baby Animals Learning to Walk — Compilation', 'Heartwarming footage of various baby animals taking their first steps. Filmed in ethical wildlife reserves.', 'video', 'published', 'public', 1230, 567000, 52000, 8900, 2134.5, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/baby1/640/360', ARRAY['animals','nature','cute','family','wildlife'], NOW() - INTERVAL '1 days'),
    (ch_nature, uploader_nature, 'Ocean Depths — Creatures of the Abyss', 'Journey 3km below sea level and encounter creatures that have never seen sunlight. A breathtaking deep-sea expedition.', 'short', 'published', 'public', 60, 789000, 67000, 12300, 3456.8, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/ocean1/640/360', ARRAY['ocean','nature','documentary','short','wildlife'], NOW() - INTERVAL '6 hours');

    -- Math Videos
    INSERT INTO videos (channel_id, uploader_id, title, description, video_type, status, visibility, duration_seconds, view_count, like_count, comment_count, trending_score, moderation_status, hls_manifest_url, thumbnail_url, tags, published_at) VALUES
    (ch_math, uploader_math, 'Calculus Made Simple — Understanding Derivatives', 'Visual, intuitive introduction to derivatives using real-world examples. Suitable for high school and early college students.', 'video', 'published', 'public', 2890, 43000, 3600, 512, 98.4, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/calc1/640/360', ARRAY['math','calculus','derivatives','education'], NOW() - INTERVAL '20 days'),
    (ch_math, uploader_math, 'The Beauty of the Fibonacci Sequence', 'How does one mathematical pattern appear in sunflowers, galaxies, and seashells? A stunning visual exploration.', 'short', 'published', 'public', 55, 234000, 19800, 3200, 834.2, 'approved', 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_hd_7.m3u8', 'https://picsum.photos/seed/fib1/640/360', ARRAY['math','fibonacci','nature','short','beautiful'], NOW() - INTERVAL '4 days');

END $$;

-- ============================================================
-- SEED COMMENTS
-- ============================================================
WITH video_ids AS (SELECT id, title FROM videos WHERE status = 'published' LIMIT 5),
     user_ids AS (SELECT id FROM users WHERE username IN ('user_one','premium_user','alice_edu') LIMIT 3)
INSERT INTO comments (video_id, user_id, content, like_count, reply_count)
SELECT
    v.id,
    u.id,
    CASE ((ROW_NUMBER() OVER ()) % 5)
        WHEN 0 THEN 'This is absolutely amazing content! Thank you so much for making this.'
        WHEN 1 THEN 'I showed this to my kids and they loved it! Perfect for the whole family.'
        WHEN 2 THEN 'The explanations are so clear and easy to follow. Subscribed!'
        WHEN 3 THEN 'Best educational channel on the platform. Keep up the great work!'
        ELSE        'Can you make a video about this topic? Would love to learn more.'
    END,
    floor(random() * 50)::int,
    floor(random() * 5)::int
FROM video_ids v
CROSS JOIN user_ids u
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED SUBSCRIPTIONS
-- ============================================================
WITH channel_ids AS (SELECT id FROM channels LIMIT 4),
     subscriber AS (SELECT id FROM users WHERE username = 'user_one')
INSERT INTO subscriptions (user_id, channel_id)
SELECT s.id, c.id FROM channel_ids c, subscriber s
ON CONFLICT DO NOTHING;

-- Update channel stats
UPDATE channels c
SET total_videos = (SELECT COUNT(*) FROM videos v WHERE v.channel_id = c.id AND v.status = 'published');

-- Update trending scores
UPDATE videos
SET trending_score = (
    (CAST(view_count AS FLOAT) * 1.0 + like_count * 3.0 + comment_count * 5.0)
    * EXP(-EXTRACT(EPOCH FROM (NOW() - published_at)) / 86400.0)
)
WHERE status = 'published';
