export default function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-48 animate-pulse border border-white/10 bg-[#171717]" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse border border-white/10 bg-[#171717]"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 animate-pulse border border-white/10 bg-[#171717]" />
        <div className="h-96 animate-pulse border border-white/10 bg-[#171717]" />
      </div>
    </div>
  )
}
