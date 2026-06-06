'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveUploadedVideo, type Video } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useFirestore } from '@/lib/firestore';
import { uploadVideoFile } from '@/lib/data/firestore-data';
import { MainLayout } from '@/components/layout/main-layout';

type Step = 'select' | 'details' | 'uploading' | 'done';

interface UploadForm {
  title: string;
  description: string;
  tags: string;
  visibility: 'public' | 'unlisted' | 'private';
  videoType: 'video' | 'short';
}

const DEMO_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    tags: '',
    visibility: 'public',
    videoType: 'video',
  });
  const [progress, setProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024 * 1024) {
      setError('File must be under 5 GB.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setForm((f) => ({
      ...f,
      title: selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    }));
    setStep('details');
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const handleSubmit = async () => {
    if (!file || !form.title.trim() || !user) return;
    setStep('uploading');
    setProgress(0);
    setError(null);

    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (useFirestore) {
        // Real backend: upload to Storage (or fall back to demo) + save metadata to Firestore
        const video = await uploadVideoFile(file, { title: form.title.trim(), description: form.description.trim(), tags, videoType: form.videoType }, user, setProgress);
        setUploadedVideoId(video.id);
        setStep('done');
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('details');
      return;
    }

    // Local fallback (no Firebase): simulate upload, store in localStorage
    for (let p = 10; p <= 100; p += 10) {
      await new Promise((r) => setTimeout(r, 180));
      setProgress(p);
    }
    const id = 'up-' + Date.now();
    const now = new Date().toISOString();
    const video: Video = {
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      thumbnailUrl: `https://picsum.photos/seed/${id}/640/360`,
      hlsManifestUrl: DEMO_HLS,
      durationSeconds: 0,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      channelId: user.id,
      channel: { id: user.id, name: user.displayName ?? user.username, handle: user.username, avatarUrl: user.avatarUrl },
      videoType: form.videoType,
      status: 'published',
      publishedAt: now,
      createdAt: now,
      tags,
      trendingScore: 0,
    };
    saveUploadedVideo(video);
    setUploadedVideoId(id);
    setStep('done');
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Upload Video</h1>
        </div>

        {/* Step: Select File */}
        {step === 'select' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg font-medium">Drag & drop your video here</p>
            <p className="text-muted-foreground text-sm mt-1 mb-6">or click to browse</p>
            <div className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm">
              Select File
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Supports MP4, MOV, AVI, MKV — up to 5 GB
            </p>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && file && (
          <div className="space-y-6">
            {/* Preview */}
            {preview && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <video src={preview} controls className="w-full h-full" />
              </div>
            )}

            <div className="bg-card border rounded-xl p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  placeholder="Add a title that describes your video"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{form.title.length}/200</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={5000}
                  rows={4}
                  placeholder="Tell viewers about your video"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="education, science, tutorial (comma separated)"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Visibility + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as any }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Format</label>
                  <select
                    value={form.videoType}
                    onChange={(e) => setForm((f) => ({ ...f, videoType: e.target.value as any }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="video">Regular Video</option>
                    <option value="short">Short (vertical)</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('select'); setFile(null); setPreview(null); }}
                className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Change File
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title.trim()}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload & Publish
              </button>
            </div>
          </div>
        )}

        {/* Step: Uploading */}
        {step === 'uploading' && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {progress}%
              </span>
            </div>
            <p className="text-lg font-medium">Uploading your video</p>
            <p className="text-sm text-muted-foreground mt-1">
              {progress < 90 ? 'Sending chunks to storage...' : 'Finalizing upload...'}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Please keep this tab open until the upload completes.
            </p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">Upload Complete!</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Your video is being processed and will be available shortly.
              Transcoding usually takes 2–10 minutes depending on video length.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setStep('select');
                  setFile(null);
                  setPreview(null);
                  setForm({ title: '', description: '', tags: '', visibility: 'public', videoType: 'video' });
                }}
                className="border rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                View Dashboard
              </button>
              {uploadedVideoId && (
                <button
                  onClick={() => router.push(`/watch/${uploadedVideoId}`)}
                  className="border border-primary text-primary rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors"
                >
                  Watch Video
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
