'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { videosApi, channelsApi, type Video, type ChannelAnalytics } from '@/lib/api/client';
import { formatViewCount, formatDuration, timeAgo } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'videos' | 'analytics' | 'channel'>('videos');

  const { data: channelResp } = useQuery({
    queryKey: ['my-channel'],
    queryFn: () => channelsApi.getMine(),
    enabled: !!user,
  });
  const channel = channelResp?.data;

  const { data: videosData, isLoading } = useQuery({
    queryKey: ['my-videos'],
    queryFn: () => videosApi.mine(),
    enabled: !!user,
  });

  const videos: Video[] = videosData?.items ?? [];
  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
  const publishedCount = videos.filter((v) => v.status === 'published').length;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.displayName ?? user?.username}
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Video
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Videos', value: videos.length, icon: '🎬' },
            { label: 'Published', value: publishedCount, icon: '✅' },
            { label: 'Total Views', value: formatViewCount(totalViews), icon: '👁' },
            { label: 'Total Likes', value: formatViewCount(totalLikes), icon: '❤️' },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-xl p-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="border-b mb-6 flex gap-1">
          {(['videos', 'analytics', 'channel'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'videos' && (
          <div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-5xl mb-4">🎬</div>
                <p className="text-lg font-medium">No videos yet</p>
                <p className="text-sm mt-1 mb-6">Upload your first video to get started</p>
                <Link href="/dashboard/upload" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90">
                  Upload Video
                </Link>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Video</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
                      <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Views</th>
                      <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Likes</th>
                      <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {videos.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-14 bg-muted rounded-md overflow-hidden flex-shrink-0">
                              {v.thumbnailUrl ? (
                                <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">🎬</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-xs">{v.title}</p>
                              <p className="text-muted-foreground text-xs mt-0.5">{formatDuration(v.durationSeconds ?? 0)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={v.status} /></td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">{formatViewCount(v.viewCount)}</td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">{formatViewCount(v.likeCount)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden xl:table-cell">{timeAgo(v.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/watch/${v.id}`} className="text-xs text-primary hover:underline">View</Link>
                            <Link href={`/dashboard/edit/${v.id}`} className="text-xs text-muted-foreground hover:text-foreground">Edit</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'analytics' && <AnalyticsPanel channelId={channel?.id} />}
        {tab === 'channel' && <ChannelSettings channel={channel} />}
      </div>
    </MainLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? colors['draft']}`}>
      {status}
    </span>
  );
}

function AnalyticsPanel({ channelId }: { channelId?: string }) {
  const { data } = useQuery({
    queryKey: ['channel-analytics', channelId],
    queryFn: () => channelsApi.getAnalytics(channelId!),
    enabled: !!channelId,
  });

  const stats: Partial<ChannelAnalytics> = data ?? {};
  const items = [
    { label: 'Views (30d)', value: formatViewCount(stats.viewsLast30Days ?? 0) },
    { label: 'Watch Time (hrs)', value: Math.round((stats.watchTimeSeconds ?? 0) / 3600).toLocaleString() },
    { label: 'New Subscribers', value: formatViewCount(stats.newSubscribers ?? 0) },
    { label: 'Revenue (est.)', value: `$${((stats.viewsLast30Days ?? 0) * 0.003).toFixed(2)}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {items.map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-5">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="text-center text-muted-foreground py-12">
        Full analytics charts coming soon. Connect ClickHouse to enable real-time insights.
      </p>
    </div>
  );
}

function ChannelSettings({ channel }: { channel?: { id: string; handle: string; subscriberCount: number; totalVideos: number } | null }) {
  if (!channel) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No channel found. Create one to start publishing.</p>
      </div>
    );
  }
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Channel Info</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Handle</label>
            <p className="text-muted-foreground text-sm mt-0.5">@{channel.handle}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Subscribers</label>
            <p className="text-muted-foreground text-sm mt-0.5">{formatViewCount(channel.subscriberCount)}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Videos</label>
            <p className="text-muted-foreground text-sm mt-0.5">{channel.totalVideos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
