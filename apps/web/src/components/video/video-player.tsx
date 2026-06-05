'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useQuery } from '@tanstack/react-query';
import { videosApi } from '@/lib/api/client';

interface Props { videoId: string }

export function VideoPlayer({ videoId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);

  const { data } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videosApi.getOne(videoId),
  });

  const video = data?.data;

  useEffect(() => {
    if (!videoRef.current || !video?.hlsManifestUrl) return;

    const el = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(video.hlsManifestUrl);
      hls.attachMedia(el);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError(true);
      });
    } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = video.hlsManifestUrl;
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [video?.hlsManifestUrl]);

  // Record view after 5s of playback
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let recorded = false;
    const handler = () => {
      if (!recorded && el.currentTime >= 5) {
        recorded = true;
        void videosApi.recordView(videoId, { watchedSeconds: Math.floor(el.currentTime) });
      }
    };
    el.addEventListener('timeupdate', handler);
    return () => el.removeEventListener('timeupdate', handler);
  }, [videoId]);

  if (error) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center rounded-lg">
        <p className="text-white text-sm">Unable to load video</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        poster={video?.thumbnailUrl}
        preload="metadata"
      />
    </div>
  );
}
