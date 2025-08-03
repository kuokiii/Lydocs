"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Share2, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { documentStore, type DocumentData } from "@/lib/document-store"
import { PDFExporter } from "@/lib/pdf-export"
import { useToast } from "@/hooks/use-toast"

export function DashboardContent() {
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadDocuments = () => {
      const storedDocuments = documentStore.getDocuments()
      setDocuments(storedDocuments)
    }

    loadDocuments()

    // Listen for storage changes
    const handleStorageChange = () => {
      loadDocuments()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: DocumentData["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending Signature
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Draft
          </Badge>
        )
    }
  }

  const handleDownload = async (document: DocumentData) => {
    try {
      const pdfDataUrl = await PDFExporter.exportToPDF(document.content, document.title, document.signatureFields)
      const link = document.createElement("a")
      link.href = pdfDataUrl
      link.download = `${document.title.replace(/\s/g, "_")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Download Started",
        description: "Your document is being prepared for download.",
      })
    } catch (error) {
      console.error("PDF download failed:", error)
      toast({
        title: "Download Failed",
        description: "Could not generate PDF for download.",
        variant: "destructive",
      })
    }
  }

  const handleShare = (document: DocumentData) => {
    const link = `${window.location.origin}/document/view/${document.id}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "Shareable link has been copied to clipboard.",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Documents</h1>
          <p className="text-gray-600 mt-1">Manage your agreements and proposals</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Removed Browse Templates Button */}
          <Link href="/create">
            <Button size="lg" className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-5 w-5 mr-2" />
              New Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            className="pl-10 border-gray-300 focus:border-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Removed Quick Actions (readymade templates) */}
      {/* <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Link href="/create?template=nda">
        <Card className="border-gray-200 hover:border-black transition-all duration-200 cursor-pointer hover:shadow-lg transform hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-black">Create NDA</CardTitle>
            <CardDescription>Non-disclosure agreement template</CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/create?template=proposal">
        <Card className="border-gray-200 hover:border-black transition-all duration-200 cursor-pointer hover:shadow-lg transform hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-black">Sales Proposal</CardTitle>
            <CardDescription>Professional sales proposal template</CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/create?template=partnership">
        <Card className="border-gray-200 hover:border-black transition-all duration-200 cursor-pointer hover:shadow-lg transform hover:scale-105">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-black">Partnership Agreement</CardTitle>
            <CardDescription>Business partnership template</CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div> */}

      {/* Documents List */}
      <div>
        <h2 className="text-xl font-semibold text-black mb-4">
          {searchTerm ? `Search Results (${filteredDocuments.length})` : `Your Documents (${documents.length})`}
        </h2>

        {filteredDocuments.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-black mb-2">
                {searchTerm ? "No documents found" : "No documents yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms or create a new document."
                  : "Create your first document to get started with Lydocs."}
              </p>
              <Link href="/create">
                <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Document
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card
                key={document.id}
                className="border-gray-200 hover:border-black transition-all duration-200 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black">{document.title}</h3>
                        <p className="text-sm text-gray-600">
                          Created {formatDate(document.createdAt)}
                          {document.recipients && document.recipients.length > 0 && (
                            <span> • Sent to {document.recipients.join(", ")}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(document.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/document/preview?id=${document.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/document/preview?id=${document.id}`}>
                            {" "}
                            {/* Link to preview for editing */}
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleShare(document)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
