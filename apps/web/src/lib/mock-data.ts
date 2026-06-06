// Synthetic content so the app is fully functional without a backend.
// Videos use a public HLS test stream so the player actually plays.

import type { Video, Channel, VideoComment } from '@/lib/api/client';

const HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const HLS2 = 'https://test-streams.mux.dev/pts_shift/master.m3u8';

function avatar(seed: string, color = '6366f1') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=${color}&color=fff&size=128`;
}
function thumb(seed: string) {
  return `https://picsum.photos/seed/${seed}/640/360`;
}

export const mockChannels: Channel[] = [
  { id: 'ch-alice', handle: 'alice_edu', name: 'AliceLearn — Education for All', description: 'Comprehensive educational content for students of all ages. History, geography, languages and more.', avatarUrl: avatar('Alice Learn', '6366f1'), bannerUrl: thumb('alicebanner'), subscriberCount: 125000, totalVideos: 4, isVerified: true, categories: ['education'] },
  { id: 'ch-bob', handle: 'bob_science', name: "Bob's Science Lab", description: 'Fun science experiments, physics explanations, and chemistry demos. Safe for the whole family!', avatarUrl: avatar('Bob Science', '22c55e'), bannerUrl: thumb('bobbanner'), subscriberCount: 98000, totalVideos: 3, isVerified: true, categories: ['education', 'science'] },
  { id: 'ch-sarah', handle: 'sarah_arts', name: 'Sarah Arts Studio', description: 'Daily art tutorials from beginner to advanced. Drawing, painting, sculpture and more.', avatarUrl: avatar('Sarah Arts', 'ec4899'), bannerUrl: thumb('sarahbanner'), subscriberCount: 67000, totalVideos: 2, isVerified: true, categories: ['arts', 'education'] },
  { id: 'ch-kids', handle: 'kidscoder', name: 'Kids Code Academy', description: 'Learn Scratch, Python and web development through fun projects designed for kids.', avatarUrl: avatar('Kids Coder', 'f59e0b'), bannerUrl: thumb('kidsbanner'), subscriberCount: 45000, totalVideos: 2, isVerified: true, categories: ['education', 'technology'] },
  { id: 'ch-nature', handle: 'naturexplore', name: 'Nature & Wildlife Explorer', description: 'Wildlife documentaries, nature hikes, and environmental education for families.', avatarUrl: avatar('Nature Explorer', '10b981'), bannerUrl: thumb('naturebanner'), subscriberCount: 234000, totalVideos: 3, isVerified: true, categories: ['documentary', 'science'] },
  { id: 'ch-math', handle: 'mathwiz', name: 'Math Made Easy', description: 'Algebra, geometry, calculus and statistics explained clearly with visual animations.', avatarUrl: avatar('Math Wizard', '8b5cf6'), bannerUrl: thumb('mathbanner'), subscriberCount: 89000, totalVideos: 2, isVerified: true, categories: ['education', 'science'] },
  { id: 'ch-melody', handle: 'melodymakers', name: 'Melody Makers', description: 'Family-friendly music lessons, instrument tutorials and sing-alongs.', avatarUrl: avatar('Melody Makers', 'f43f5e'), bannerUrl: thumb('melodybanner'), subscriberCount: 156000, totalVideos: 2, isVerified: true, categories: ['music'] },
  { id: 'ch-pixel', handle: 'pixelplay', name: 'PixelPlay Kids Gaming', description: 'Safe, ad-free gaming walkthroughs and tips suitable for young players.', avatarUrl: avatar('Pixel Play', '0ea5e9'), bannerUrl: thumb('pixelbanner'), subscriberCount: 198000, totalVideos: 2, isVerified: true, categories: ['gaming'] },
];

const channelById = Object.fromEntries(mockChannels.map((c) => [c.id, c]));

interface Seed {
  id: string; ch: string; title: string; desc: string; type: 'video' | 'short';
  dur: number; views: number; likes: number; comments: number; days: number;
  tags: string[]; cat: string; hls?: string;
}

const seeds: Seed[] = [
  { id: 'v-egypt', ch: 'ch-alice', title: 'The Complete History of Ancient Egypt', desc: 'From the Old Kingdom to Cleopatra — a comprehensive overview of one of history’s greatest civilizations.', type: 'video', dur: 2847, views: 45230, likes: 3200, comments: 287, days: 30, tags: ['history', 'egypt', 'education'], cat: 'education' },
  { id: 'v-spanish', ch: 'ch-alice', title: 'Learn Spanish in 30 Minutes — Beginner Lesson', desc: 'Master the 100 most common Spanish phrases with native pronunciation guides.', type: 'video', dur: 1823, views: 78500, likes: 6100, comments: 423, days: 14, tags: ['language', 'spanish', 'education'], cat: 'education' },
  { id: 'v-geo', ch: 'ch-alice', title: 'World Geography: Every Country Explained', desc: 'A deep dive into the world’s 195 countries. Capitals, cultures, landmarks, and key facts.', type: 'video', dur: 5420, views: 123000, likes: 9800, comments: 1250, days: 7, tags: ['geography', 'world', 'documentary'], cat: 'education' },
  { id: 'v-memory', ch: 'ch-alice', title: '5 Memory Techniques Used by World Champions', desc: 'Science-backed methods to remember anything faster. Great for students.', type: 'short', dur: 58, views: 234000, likes: 21000, comments: 3400, days: 2, tags: ['memory', 'study', 'tips'], cat: 'education' },

  { id: 'v-vaccine', ch: 'ch-bob', title: 'How Vaccines Work — A Visual Explanation', desc: 'Clear, accurate, family-friendly explanation of how the immune system and vaccines work together.', type: 'video', dur: 1456, views: 189000, likes: 15600, comments: 2100, days: 21, tags: ['science', 'health', 'biology'], cat: 'science' },
  { id: 'v-periodic', ch: 'ch-bob', title: 'The Periodic Table Explained Simply', desc: 'Every element, its properties, and why it matters — explained in plain language.', type: 'video', dur: 3240, views: 67000, likes: 5200, comments: 678, days: 45, tags: ['chemistry', 'science'], cat: 'science' },
  { id: 'v-sky', ch: 'ch-bob', title: 'Why the Sky is Blue (and Other Light Mysteries)', desc: 'Rayleigh scattering, refraction, and diffraction explained for curious minds.', type: 'short', dur: 52, views: 456000, likes: 38000, comments: 5600, days: 1, tags: ['physics', 'light', 'science'], cat: 'science' },

  { id: 'v-draw', ch: 'ch-sarah', title: 'Drawing Animals for Beginners — Step by Step', desc: 'Learn to draw 10 different animals with easy step-by-step instructions. No experience needed.', type: 'video', dur: 2134, views: 34000, likes: 2800, comments: 341, days: 10, tags: ['art', 'drawing', 'beginner'], cat: 'arts' },
  { id: 'v-water', ch: 'ch-sarah', title: 'Watercolor Sunset — Relaxing Tutorial', desc: 'A calming 45-minute watercolor painting session. Paint a beautiful sunset landscape.', type: 'video', dur: 2678, views: 21000, likes: 1900, comments: 213, days: 25, tags: ['art', 'watercolor', 'painting'], cat: 'arts' },

  { id: 'v-scratch', ch: 'ch-kids', title: 'Build Your First Game in Scratch!', desc: 'Kids aged 7+ will build a complete catching game using Scratch. No prior coding needed!', type: 'video', dur: 1890, views: 56000, likes: 4500, comments: 892, days: 5, tags: ['coding', 'scratch', 'kids'], cat: 'technology' },
  { id: 'v-python', ch: 'ch-kids', title: 'Python for Kids — Variables and Loops', desc: 'An engaging introduction to Python programming concepts for children aged 10-14.', type: 'video', dur: 2456, views: 34000, likes: 2900, comments: 445, days: 15, tags: ['coding', 'python', 'kids'], cat: 'technology' },

  { id: 'v-amazon', ch: 'ch-nature', title: 'Amazon Rainforest — Life in the Canopy', desc: 'Stunning 4K footage of the Amazon rainforest covering biodiversity and conservation.', type: 'video', dur: 4320, views: 342000, likes: 28900, comments: 4230, days: 3, tags: ['nature', 'documentary', 'wildlife'], cat: 'documentary' },
  { id: 'v-baby', ch: 'ch-nature', title: 'Baby Animals Learning to Walk — Compilation', desc: 'Heartwarming footage of various baby animals taking their first steps.', type: 'video', dur: 1230, views: 567000, likes: 52000, comments: 8900, days: 1, tags: ['animals', 'nature', 'cute'], cat: 'documentary' },
  { id: 'v-ocean', ch: 'ch-nature', title: 'Ocean Depths — Creatures of the Abyss', desc: 'Journey 3km below sea level and encounter creatures that have never seen sunlight.', type: 'short', dur: 60, views: 789000, likes: 67000, comments: 12300, days: 1, tags: ['ocean', 'nature', 'wildlife'], cat: 'documentary' },

  { id: 'v-calc', ch: 'ch-math', title: 'Calculus Made Simple — Understanding Derivatives', desc: 'Visual, intuitive introduction to derivatives using real-world examples.', type: 'video', dur: 2890, views: 43000, likes: 3600, comments: 512, days: 20, tags: ['math', 'calculus', 'education'], cat: 'education' },
  { id: 'v-fib', ch: 'ch-math', title: 'The Beauty of the Fibonacci Sequence', desc: 'How does one mathematical pattern appear in sunflowers, galaxies, and seashells?', type: 'short', dur: 55, views: 234000, likes: 19800, comments: 3200, days: 4, tags: ['math', 'fibonacci', 'nature'], cat: 'education' },

  { id: 'v-piano', ch: 'ch-melody', title: 'Learn Piano in 20 Minutes — Your First Song', desc: 'Absolute beginner piano lesson. Play your first recognizable tune today!', type: 'video', dur: 1320, views: 312000, likes: 24000, comments: 1820, days: 6, tags: ['music', 'piano', 'beginner'], cat: 'music', hls: HLS2 },
  { id: 'v-sing', ch: 'ch-melody', title: 'Sing-Along Classics for Kids', desc: 'Family-friendly sing-along with on-screen lyrics. Fun for the whole family.', type: 'short', dur: 48, views: 145000, likes: 12000, comments: 980, days: 3, tags: ['music', 'kids', 'singalong'], cat: 'music', hls: HLS2 },

  { id: 'v-minecraft', ch: 'ch-pixel', title: 'Building a Castle — Family Friendly Walkthrough', desc: 'A calm, ad-free building walkthrough suitable for young players.', type: 'video', dur: 1980, views: 421000, likes: 31000, comments: 5400, days: 4, tags: ['gaming', 'building', 'kids'], cat: 'gaming', hls: HLS2 },
  { id: 'v-puzzle', ch: 'ch-pixel', title: 'Top 5 Brain Puzzle Games for Kids', desc: 'Educational puzzle games that build problem-solving skills. Safe and ad-free.', type: 'short', dur: 59, views: 198000, likes: 16500, comments: 1340, days: 2, tags: ['gaming', 'puzzle', 'educational'], cat: 'gaming', hls: HLS2 },
];

function buildVideo(s: Seed): Video & { category: string } {
  const ch = channelById[s.ch]!;
  const publishedAt = new Date(Date.now() - s.days * 86400000).toISOString();
  const ageHours = s.days * 24;
  const trendingScore = (s.views * 1 + s.likes * 3 + s.comments * 5) * Math.exp(-ageHours / 168);
  return {
    id: s.id,
    title: s.title,
    description: s.desc,
    thumbnailUrl: thumb(s.id),
    hlsManifestUrl: s.hls ?? HLS,
    durationSeconds: s.dur,
    viewCount: s.views,
    likeCount: s.likes,
    commentCount: s.comments,
    channelId: s.ch,
    channel: { id: ch.id, name: ch.name, handle: ch.handle, avatarUrl: ch.avatarUrl },
    videoType: s.type,
    status: 'published',
    publishedAt,
    createdAt: publishedAt,
    tags: s.tags,
    trendingScore,
    // extra field used for category filtering
    ...( { category: s.cat } as object ),
  } as Video & { category: string };
}

export const mockVideos: (Video & { category: string })[] = seeds.map(buildVideo);

export function getVideos(): Video[] {
  return [...mockVideos].sort((a, b) => +new Date(b.publishedAt!) - +new Date(a.publishedAt!));
}
export function getTrending(): Video[] {
  return [...mockVideos].sort((a, b) => b.trendingScore - a.trendingScore);
}
export function getShorts(): Video[] {
  return mockVideos.filter((v) => v.videoType === 'short').sort((a, b) => b.trendingScore - a.trendingScore);
}
export function getByCategory(cat: string): Video[] {
  return mockVideos.filter((v) => v.category === cat).sort((a, b) => b.trendingScore - a.trendingScore);
}
export function getVideoById(id: string): Video | undefined {
  return mockVideos.find((v) => v.id === id);
}
export function getRelated(id: string): Video[] {
  const v = getVideoById(id);
  if (!v) return getTrending().slice(0, 8);
  const byTag: Video[] = mockVideos.filter((x) => x.id !== id && x.tags.some((t) => v.tags.includes(t)));
  const rest: Video[] = getTrending().filter((x) => x.id !== id);
  const combined: Video[] = [...byTag, ...rest];
  return combined.filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i).slice(0, 10);
}
export function searchVideos(q: string): Video[] {
  const term = q.toLowerCase();
  return mockVideos.filter(
    (v) =>
      v.title.toLowerCase().includes(term) ||
      v.description?.toLowerCase().includes(term) ||
      v.tags.some((t) => t.includes(term)) ||
      v.channel?.name.toLowerCase().includes(term),
  );
}
export function getChannelByHandle(handle: string): Channel | undefined {
  return mockChannels.find((c) => c.handle === handle);
}

const COMMENT_AUTHORS = [
  { id: 'u1', username: 'sarah_m', displayName: 'Sarah M.', avatarUrl: avatar('Sarah M', '8b5cf6') },
  { id: 'u2', username: 'dad_of_three', displayName: 'David K.', avatarUrl: avatar('David K', '0ea5e9') },
  { id: 'u3', username: 'learner99', displayName: 'Aisha R.', avatarUrl: avatar('Aisha R', 'ec4899') },
  { id: 'u4', username: 'mr_teacher', displayName: 'Mr. Thompson', avatarUrl: avatar('Mr Thompson', '22c55e') },
];
const COMMENT_TEXTS = [
  'This is absolutely amazing content! Thank you so much for making this.',
  'I showed this to my kids and they loved it! Perfect for the whole family.',
  'The explanations are so clear and easy to follow. Subscribed!',
  'Best educational channel on the platform. Keep up the great work!',
  'Can you make a video about this topic? Would love to learn more.',
];

export function getComments(videoId: string): VideoComment[] {
  const v = getVideoById(videoId);
  const count = Math.min(4, v ? Math.max(2, Math.floor(v.commentCount / 100) % 5 + 2) : 3);
  return Array.from({ length: count }).map((_, i) => ({
    id: `${videoId}-c${i}`,
    content: COMMENT_TEXTS[i % COMMENT_TEXTS.length],
    userId: COMMENT_AUTHORS[i % COMMENT_AUTHORS.length].id,
    videoId,
    likeCount: Math.floor(Math.random() * 80),
    replyCount: Math.floor(Math.random() * 4),
    isPinned: i === 0,
    createdAt: new Date(Date.now() - (i + 1) * 3600000 * 6).toISOString(),
    user: COMMENT_AUTHORS[i % COMMENT_AUTHORS.length],
  }));
}
