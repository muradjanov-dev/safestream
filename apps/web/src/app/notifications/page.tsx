'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { mockVideos } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const items = mockVideos.slice(0, 6);
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Notifications
        </h1>
        <div className="divide-y">
          {items.map((v) => (
            <Link key={v.id} href={`/watch/${v.id}`} className="flex items-center gap-3 py-3 hover:bg-accent rounded-lg px-2 -mx-2 transition-colors">
              {v.channel?.avatarUrl && (
                <Image src={v.channel.avatarUrl} alt="" width={40} height={40} className="rounded-full shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{v.channel?.name}</span> uploaded a new video:{' '}
                  <span className="text-muted-foreground">{v.title}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(v.publishedAt!)}</p>
              </div>
              {v.thumbnailUrl && (
                <Image src={v.thumbnailUrl} alt="" width={80} height={45} className="rounded ml-auto shrink-0 object-cover" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
