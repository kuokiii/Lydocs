import Link from "next/link"
import Image from "next/image" // Import Image component
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react" // Removed FileText from direct use in header
import { DashboardContent } from "@/components/dashboard-content"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/lyzr_platform_logo.jpeg" alt="Lyzr Logo" width={32} height={32} className="mr-2" />
              <span className="text-2xl font-bold text-black">Lydocs</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/create">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                <Plus className="h-5 w-5 mr-2" />
                Create Document
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <DashboardContent />
    </div>
  )
}
