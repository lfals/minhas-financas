import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ModuleOverview({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
}) {
  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-[#141414] ring-0">
        <CardHeader className="gap-4">
          <CardDescription className="text-[11px] uppercase tracking-[0.35em] text-white/50">
            {eyebrow}
          </CardDescription>
          <CardTitle className="max-w-3xl text-4xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-5xl">
            {title}
          </CardTitle>
          <p className="max-w-2xl text-sm leading-7 text-white/65 sm:text-base">{description}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {bullets.map((bullet) => (
          <Card key={bullet} className="border border-white/10 bg-[#171717] ring-0">
            <CardContent className="pt-6 text-sm leading-7 text-white/62">{bullet}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
