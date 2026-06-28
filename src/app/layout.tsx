import type { Metadata, Viewport } from "next"
import { Inter, Calistoga } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SubscriptionProvider } from "@/components/SubscriptionProvider"
import { ToastProvider } from "@/components/ui/Toast"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const calistoga = Calistoga({
  subsets: ["latin"],
  variable: "--font-cal",
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Bloom Studies — AI-Powered Learning for Irish Students",
    template: "%s · Bloom Studies",
  },
  description: "The AI-powered study platform for Junior Cycle and Leaving Certificate students in Ireland. AI Tutor, Exam Grader, Flashcards, Study Planner and more.",
  keywords: ["Leaving Cert", "Junior Cycle", "Irish students", "AI tutor", "exam grader", "study app", "CAO points"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Bloom Studies — AI-Powered Learning for Irish Students",
    description: "Study smarter with AI tools built for the Irish curriculum. Trusted by 15,000+ students.",
    type: "website",
    locale: "en_IE",
  },
}

// Separate viewport export — fixes Next.js 14 deprecation warning
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${calistoga.variable} font-sans antialiased`}>
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary-600 focus:text-white focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <SubscriptionProvider>
            <ToastProvider>
              <div id="main-content">
                {children}
              </div>
            </ToastProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
