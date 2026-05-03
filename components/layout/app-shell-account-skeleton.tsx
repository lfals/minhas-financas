export function AppShellDesktopAccountSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 border border-white/10 bg-white/5 px-3 py-2">
      <div className="h-5 w-32 rounded-none bg-white/10" />
      <div className="size-8 shrink-0 rounded-none bg-white/10" />
    </div>
  )
}

export function AppShellMobileAccountSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between gap-3 border border-white/10 bg-white/5 px-3 py-2">
      <div className="min-w-0 space-y-1">
        <div className="h-2 w-16 rounded-none bg-white/10" />
        <div className="h-4 w-28 rounded-none bg-white/10" />
      </div>
      <div className="size-8 shrink-0 rounded-none bg-white/10" />
    </div>
  )
}
