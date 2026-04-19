import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { hasClerkCredentials } from "@/lib/env/server"
import { PWARegistration } from "@/components/pwa-registration"

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
}

export const metadata: Metadata = {
  title: "Minhas Finanças",
  description:
    "Sistema de gestão financeira pessoal com foco em contas, lançamentos, cartões, recorrências e patrimônio.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Minhas Finanças",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <ThemeProvider forcedTheme="dark" enableSystem={false}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )

  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark antialiased">
      <body className="font-sans">
        <PWARegistration />
        {hasClerkCredentials() ? (
          <ClerkProvider>
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
