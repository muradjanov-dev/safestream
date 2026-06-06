'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { getUploadedVideos, updateUploadedVideo, deleteUploadedVideo, type Video } from '@/lib/api/client';
import { useFirestore } from '@/lib/firestore';
import { getVideoDoc, updateVideoDoc, deleteVideoDoc } from '@/lib/data/firestore-data';
import { Button } from '@/components/ui/button';

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const v = useFirestore
        ? await getVideoDoc(id)
        : (getUploadedVideos().find((x) => x.id === id) ?? null);
      setVideo(v);
      if (v) { setTitle(v.title); setDescription(v.description ?? ''); setTags(v.tags.join(', ')); }
    };
    void load();
  }, [id]);

  const save = () => {
    const patch = {
      title: title.trim(),
      description: description.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (useFirestore) void updateVideoDoc(id, patch); else updateUploadedVideo(id, patch);
    setSaved(true);
    setTimeout(() => router.push('/dashboard'), 800);
  };

  const remove = () => {
    if (confirm('Delete this video? This cannot be undone.')) {
      if (useFirestore) void deleteVideoDoc(id); else deleteUploadedVideo(id);
      router.push('/dashboard');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground text-sm mb-6">← Back</button>
        <h1 className="text-2xl font-bold mb-6">Edit Video</h1>

        {!video ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>This video couldn’t be found. Only your uploaded videos can be edited.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>Back to dashboard</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {video.thumbnailUrl && (
              <img src={video.thumbnailUrl} alt="" className="rounded-xl w-full aspect-video object-cover" />
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tags</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma separated"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={save} disabled={!title.trim()}>{saved ? 'Saved ✓' : 'Save changes'}</Button>
              <Button variant="outline" onClick={() => router.push(`/watch/${id}`)}>Preview</Button>
              <Button variant="outline" className="text-destructive ml-auto" onClick={remove}>Delete</Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
