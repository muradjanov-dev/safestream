export function VideoPlayerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="w-full aspect-video bg-muted rounded-xl animate-pulse" />
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded-md animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-1">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="ml-auto h-9 w-24 bg-muted rounded-full animate-pulse" />
      </div>
    </div>
  );
}
