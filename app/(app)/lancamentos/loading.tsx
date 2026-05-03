export default function LancamentosLoading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-0 sm:grid-cols-2 sm:gap-0 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse border border-white/10 bg-[#171717] sm:border-white/10"
          />
        ))}
      </div>
      <div className="h-[min(60vh,32rem)] animate-pulse border border-white/10 bg-[#171717]" />
    </div>
  )
}
