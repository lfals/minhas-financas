export default function CreditCardsSettingsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-36 animate-pulse border border-white/10 bg-[#171717]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse border border-white/10 bg-[#171717]" />
        ))}
      </div>
    </div>
  )
}
