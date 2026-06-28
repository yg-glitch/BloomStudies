import Sidebar from '@/components/sidebar/Sidebar'
import { MobileNav } from '@/components/ui/MobileNav'
import { OnboardingModal } from '@/components/ui/OnboardingModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-w-0 transition-all duration-300 pb-20 lg:pb-0">
        {children}
      </main>
      <MobileNav />
      <OnboardingModal />
    </div>
  )
}
