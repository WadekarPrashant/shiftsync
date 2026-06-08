import DashboardNav from '@/components/dashboard/DashboardNav'
import ChatBot from '@/components/dashboard/ChatBot'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardNav />
      <main className="flex-1 p-8">
        {children}
      </main>
      <ChatBot />
    </div>
  )
}
