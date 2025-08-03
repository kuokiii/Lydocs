"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Share2, Download, Send, Eye, FilePenLineIcon as Signature } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { LYZR_INTEGRATION } from "@/lib/lyzr-api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { documentStore, type DocumentData } from "@/lib/document-store"
import { emailService } from "@/lib/email-service"
import { PDFExporter } from "@/lib/pdf-export"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function DocumentPreview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [documentContent, setDocumentContent] = useState("")
  const [originalContent, setOriginalContent] = useState("") // Store original content
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTone, setSelectedTone] = useState("professional")
  const [isAdjustingTone, setIsAdjustingTone] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [emailRecipients, setEmailRecipients] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const initialLoadRef = useRef(false)

  useEffect(() => {
    if (initialLoadRef.current) {
      return
    }

    const loadContent = () => {
      const documentId = searchParams.get("id")
      let doc: DocumentData | null = null

      if (documentId) {
        doc = documentStore.getDocument(documentId)
      } else {
        // Fallback to loading from localStorage if no ID (for newly generated docs)
        const generatedContent = localStorage.getItem("lydocs-generated-content")
        const formData = localStorage.getItem("lydocs-form-data")

        if (generatedContent && formData) {
          const parsedFormData = JSON.parse(formData)
          const newDocumentId = Date.now().toString()

          doc = {
            id: newDocumentId,
            title: `${parsedFormData.documentType || "Service Agreement"} - ${parsedFormData.clientCompanyName || "Client"}`,
            type: parsedFormData.documentType || "service",
            status: "draft",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: generatedContent,
            formData: parsedFormData,
            signatureFields: [], // Initialize signatureFields
          }
          documentStore.saveDocument(doc)
          // Clear temporary storage after saving
          localStorage.removeItem("lydocs-generated-content")
          localStorage.removeItem("lydocs-form-data")
          localStorage.removeItem("lydocs-uploaded-analysis")
        }
      }

      if (doc) {
        setCurrentDocument(doc)
        setDocumentContent(doc.content)
        setOriginalContent(doc.content) // Store original content
        // Set up email defaults
        setEmailSubject(`${doc.title} - Ready for Review`)
        setEmailBody(
          emailService.generateEmailBody(
            doc.title,
            doc.formData?.contactName || "Service Provider",
            doc.formData?.clientContactName || "Client",
          ),
        )
        setEmailRecipients(doc.formData?.clientContactEmail || "")
        initialLoadRef.current = true
      } else {
        toast({
          title: "No Document Found",
          description: "Please generate or select a document from the dashboard.",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
      setIsLoading(false)
    }

    loadContent()
  }, [searchParams, router, toast])

  const handleToneAdjustment = async () => {
    if (!documentContent) return

    setIsAdjustingTone(true)
    try {
      const adjustedContent = await LYZR_INTEGRATION.adjustDocumentTone(documentContent, selectedTone)
      setDocumentContent(adjustedContent)

      if (currentDocument) {
        const updatedDocument = { ...currentDocument, content: adjustedContent, updatedAt: new Date().toISOString() }
        documentStore.saveDocument(updatedDocument)
        setCurrentDocument(updatedDocument)
      }

      toast({
        title: "Tone Adjusted",
        description: `Document tone has been adjusted to ${selectedTone}.`,
      })
    } catch (error) {
      console.error("Tone adjustment failed:", error)
      toast({
        title: "Error",
        description: "Failed to adjust document tone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAdjustingTone(false)
    }
  }

  const handleShare = () => {
    if (currentDocument) {
      const link = `${window.location.origin}/document/view/${currentDocument.id}`
      setShareLink(link)
      navigator.clipboard.writeText(link)
      toast({
        title: "Link Copied",
        description: "Shareable link has been copied to clipboard.",
      })
    }
  }

  const handleSendEmail = async () => {
    if (!currentDocument || !emailRecipients.trim()) {
      toast({
        title: "Missing Information",
        description: "Please ensure document and recipient email are available.",
        variant: "destructive",
      })
      return
    }

    setIsSendingEmail(true)

    try {
      const recipients = emailRecipients.split(",").map((email) => email.trim())

      // Generate PDF content as base64, including signature fields
      const pdfDataUrl = await PDFExporter.exportToPDF(
        documentContent,
        currentDocument.title,
        currentDocument.signatureFields,
      )
      const base64PdfContent = pdfDataUrl.split(",")[1] // Extract base64 part

      const success = await emailService.sendEmail({
        to: recipients,
        subject: emailSubject,
        body: emailBody,
        documentContent: documentContent,
        attachment: {
          filename: `${currentDocument.title.replace(/\s/g, "_")}.pdf`,
          content: base64PdfContent,
          contentType: "application/pdf",
        },
      })

      if (success) {
        toast({
          title: "Email Sent Successfully! 📧",
          description: `Document sent to ${recipients.join(", ")}`,
        })

        if (currentDocument) {
          const updatedDocument = {
            ...currentDocument,
            status: "sent" as const,
            recipients: recipients,
            updatedAt: new Date().toISOString(),
          }
          documentStore.saveDocument(updatedDocument)
          setCurrentDocument(updatedDocument)
        }
        setEmailDialogOpen(false)
      } else {
        toast({
          title: "Email Sent via Mail Client",
          description: "Your default email client has been opened with the pre-filled email.",
        })
      }
    } catch (error: any) {
      console.error("Email sending failed:", error)
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again or use your mail client.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleDownload = async () => {
    if (currentDocument) {
      try {
        const pdfDataUrl = await PDFExporter.exportToPDF(
          documentContent,
          currentDocument.title,
          currentDocument.signatureFields,
        )
        const link = document.createElement("a")
        link.href = pdfDataUrl
        link.download = `${currentDocument.title.replace(/\s/g, "_")}.pdf`
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
  }

  const handleEdit = () => {
    setIsEditing(!isEditing)
    if (isEditing) {
      if (currentDocument && documentContent !== originalContent) {
        const updatedDocument = {
          ...currentDocument,
          content: documentContent,
          updatedAt: new Date().toISOString(),
        }
        documentStore.saveDocument(updatedDocument)
        setCurrentDocument(updatedDocument)
        setOriginalContent(documentContent)
        toast({
          title: "Document Updated",
          description: "Your changes have been saved.",
        })
      }
    }
    toast({
      title: isEditing ? "Edit Mode Disabled" : "Edit Mode Enabled",
      description: isEditing ? "Document is now read-only." : "You can now edit the document content.",
    })
  }

  const handleContentChange = (newContent: string) => {
    setDocumentContent(newContent)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/create" className="flex items-center space-x-2 text-gray-600 hover:text-black">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Form</span>
              </Link>
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/images/lyzr_platform_logo.jpeg" alt="Lyzr Logo" width={32} height={32} className="mr-2" />
                <span className="text-2xl font-bold text-black">Lydocs</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {currentDocument?.status || "Draft"}
              </Badge>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isEditing ? "Preview" : "Preview"}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Save & Stop Editing" : "Edit"}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {currentDocument && (
                <Link href={`/document/signature?id=${currentDocument.id}`}>
                  <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                    <Signature className="h-5 w-5 mr-2" />
                    Add Signatures
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg text-black">Document Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-black">Document Tone</Label>
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger className="border-gray-300 focus:border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleToneAdjustment}
                    disabled={isAdjustingTone}
                    variant="outline"
                    size="lg"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                  >
                    {isAdjustingTone ? "Adjusting..." : "Adjust Tone"}
                  </Button>
                </div>

                {currentDocument && (
                  <Link href={`/document/signature?id=${currentDocument.id}`}>
                    <Button size="lg" className="w-full bg-black text-white hover:bg-gray-800">
                      <Signature className="h-5 w-5 mr-2" />
                      Add Signatures
                    </Button>
                  </Link>
                )}

                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      onClick={handleShare}
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      Share Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Share Document</DialogTitle>
                      <DialogDescription>Copy this link to share your document with others.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input value={shareLink} readOnly />
                      <Button onClick={() => navigator.clipboard.writeText(shareLink)} className="w-full">
                        Copy Link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      onClick={() => setEmailDialogOpen(true)}
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Send Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Send Document via Email</DialogTitle>
                      <DialogDescription>Send the document directly to recipients.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Recipients (comma-separated)</Label>
                        <Input
                          value={emailRecipients}
                          onChange={(e) => setEmailRecipients(e.target.value)}
                          placeholder="client@email.com, partner@email.com"
                        />
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} />
                      </div>
                      <Button
                        onClick={handleSendEmail}
                        disabled={isSendingEmail || !emailRecipients.trim()}
                        className="w-full bg-black text-white hover:bg-gray-800"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSendingEmail ? "Sending..." : "Send Email Now"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Document Content */}
          <div className="lg:col-span-3">
            <Card className="border-gray-200">
              <CardContent className="p-8">
                {/* Document Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-black mb-2">SERVICE AGREEMENT</h1>
                  <p className="text-gray-600">Generated by Lydocs AI</p>
                </div>

                <Separator className="my-8" />

                {/* Document Body */}
                <div className="space-y-6 text-gray-800 leading-relaxed">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                      <p>Loading generated document...</p>
                    </div>
                  ) : isEditing ? (
                    <Textarea
                      value={documentContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="min-h-[400px] border-gray-300 focus:border-black"
                      placeholder="Edit your document content here..."
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{documentContent}</div>
                  )}
                </div>

                <Separator className="my-8" />

                {/* Signature Section */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-black mb-4">Service Provider</h3>
                    <p className="text-sm text-gray-600 mb-2">[Your Name]</p>
                    <p className="text-sm text-gray-600 mb-6">[Your Company]</p>

                    <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-6 text-center text-gray-600 mb-4">
                      <Signature className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Your Signature</p>
                      <p className="text-sm">Service Provider</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-800 bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                      <p className="font-medium">Date</p>
                      <p className="text-sm">Service Provider</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-black mb-4">Client</h3>
                    <p className="text-sm text-gray-600 mb-2">[Client Name]</p>
                    <p className="text-sm text-gray-600 mb-6">[Client Company]</p>

                    <div className="border-2 border-dashed border-green-400 bg-green-50 rounded-lg p-6 text-center text-gray-600 mb-4">
                      <Signature className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Client Signature</p>
                      <p className="text-sm">Client</p>
                    </div>

                    <div className="border-2 border-dashed border-green-400 bg-green-50 rounded-lg p-4 text-center text-gray-600">
                      <p className="font-medium">Date</p>
                      <p className="text-sm">Client</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
