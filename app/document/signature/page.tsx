"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Trash2, Type, PenTool, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { documentStore } from "@/lib/document-store"
import { emailService } from "@/lib/email-service"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PDFExporter } from "@/lib/pdf-export" // Import PDFExporter

interface SignatureField {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: "signature" | "date" | "text" | "initial"
  label: string
  signer: string
  signatureData?: string
  filled?: boolean
}

export default function SignatureEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentSignature, setCurrentSignature] = useState("")
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw")
  const [typedSignature, setTypedSignature] = useState("")
  const [selectedFont, setSelectedFont] = useState("cursive")
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [selectedFieldForSigning, setSelectedFieldForSigning] = useState<number | null>(null)
  const [emailRecipients, setEmailRecipients] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const currentFieldPositionsRef = useRef<SignatureField[]>([])

  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [selectedField, setSelectedField] = useState<number | null>(null)
  const [documentContent, setDocumentContent] = useState("")
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)

  const documentId = searchParams.get("id")

  // Load document content and signature fields
  useEffect(() => {
    if (!documentId) {
      toast({
        title: "No Document ID",
        description: "Please select a document from the dashboard or preview.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    setCurrentDocumentId(documentId)
    const doc = documentStore.getDocument(documentId)

    if (doc) {
      setDocumentContent(doc.content)
      const loadedFields = doc.signatureFields && doc.signatureFields.length > 0 ? doc.signatureFields : []
      setSignatureFields(loadedFields)
      currentFieldPositionsRef.current = loadedFields

      setEmailSubject(`${doc.formData?.documentType || "Service Agreement"} - Ready for Signature`)
      setEmailBody(
        emailService.generateEmailBody(
          `${doc.formData?.documentType || "Service Agreement"} - ${doc.formData?.clientCompanyName || "Client"}`,
          doc.formData?.contactName || "Service Provider",
          doc.formData?.clientContactName || "Client",
        ),
      )
      setEmailRecipients(doc.formData?.clientContactEmail || "")
    } else {
      toast({
        title: "Document Not Found",
        description: "The specified document could not be loaded.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [documentId, router, toast])

  const handleSaveDocument = useCallback(() => {
    if (!currentDocumentId) return

    const doc = documentStore.getDocument(currentDocumentId)
    if (doc) {
      const updatedDoc = {
        ...doc,
        signatureFields: signatureFields,
        updatedAt: new Date().toISOString(),
      }
      documentStore.saveDocument(updatedDoc)
      toast({
        title: "Document Saved",
        description: "Signature setup has been saved.",
      })
    }
  }, [currentDocumentId, signatureFields, toast])

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const generateTypedSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = `36px ${selectedFont}`
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL("image/png")
    setCurrentSignature(dataURL)

    if (selectedFieldForSigning) {
      setSignatureFields((fields) =>
        fields.map((field) =>
          field.id === selectedFieldForSigning ? { ...field, signatureData: dataURL, filled: true } : field,
        ),
      )
      setSignatureDialogOpen(false)
      setSelectedFieldForSigning(null)
      handleSaveDocument()
    }

    toast({
      title: "Signature Saved",
      description: "Your signature has been saved successfully.",
    })
  }

  const addSignatureField = (type: "signature" | "date" | "text" | "initial", dropX?: number, dropY?: number) => {
    const newField: SignatureField = {
      id: Date.now(),
      x: dropX !== undefined ? dropX - (type === "signature" ? 200 : type === "date" ? 150 : 100) / 2 : 50,
      y: dropY !== undefined ? dropY - (type === "signature" ? 60 : 30) / 2 : 50,
      width: type === "signature" ? 200 : type === "date" ? 150 : 100,
      height: type === "signature" ? 60 : 30,
      type,
      label: type === "signature" ? "Signature" : type === "date" ? "Date" : type === "initial" ? "Initial" : "Text",
      signer: "Service Provider",
    }
    setSignatureFields((prevFields) => {
      const updatedFields = [...prevFields, newField]
      currentFieldPositionsRef.current = updatedFields
      return updatedFields
    })
    handleSaveDocument()
  }

  const deleteField = (id: number) => {
    setSignatureFields((prevFields) => {
      const updatedFields = prevFields.filter((field) => field.id !== id)
      currentFieldPositionsRef.current = updatedFields
      return updatedFields
    })
    setSelectedField(null)
    handleSaveDocument()
  }

  const handleSendEmail = async () => {
    if (!currentDocumentId || !emailRecipients.trim()) {
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
      const docToSend = documentStore.getDocument(currentDocumentId)

      if (!docToSend) {
        toast({
          title: "Error",
          description: "Document content not found for sending.",
          variant: "destructive",
        })
        return
      }

      // Generate PDF content as base64, including signature fields
      const pdfDataUrl = await PDFExporter.exportToPDF(docToSend.content, docToSend.title, signatureFields)
      const base64PdfContent = pdfDataUrl.split(",")[1] // Extract base64 part

      const success = await emailService.sendEmail({
        to: recipients,
        subject: emailSubject,
        body: emailBody,
        documentContent: docToSend.content,
        attachment: {
          filename: `${docToSend.title.replace(/\s/g, "_")}.pdf`,
          content: base64PdfContent,
          contentType: "application/pdf",
        },
      })

      if (success) {
        toast({
          title: "Email Sent Successfully",
          description: `Document sent to ${recipients.join(", ")}`,
        })

        // Update document status to 'sent'
        documentStore.updateDocumentStatus(currentDocumentId, "sent")
        setEmailDialogOpen(false)
      } else {
        toast({
          title: "Email Sent via Mail Client",
          description: "Your default email client has been opened with the pre-filled email.",
        })
        setEmailDialogOpen(false)
      }
    } catch (error: any) {
      console.error("Email sending failed:", error)
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleFieldClick = (fieldId: number) => {
    if (!isDraggingRef.current) {
      const field = signatureFields.find((f) => f.id === fieldId)
      if (field && (field.type === "signature" || field.type === "date" || field.type === "initial")) {
        setSelectedFieldForSigning(fieldId)
        setSignatureDialogOpen(true)
        clearCanvas()
        // If it's a date field, pre-fill with current date
        if (field.type === "date") {
          setTypedSignature(new Date().toLocaleDateString())
          setSelectedFont("sans-serif") // Default font for date
          // Generate immediately for date fields
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.font = `36px sans-serif`
              ctx.fillStyle = "#000000"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height / 2)
            }
          }
        } else {
          setTypedSignature("") // Clear for signature/initial
        }
      }
      setSelectedField(fieldId)
    }
    isDraggingRef.current = false
  }

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    setSelectedField(id)
    isDraggingRef.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartRef.current && selectedField !== null) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x)
      const dy = Math.abs(e.clientY - dragStartRef.current.y)
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true
      }

      const container = e.currentTarget as HTMLDivElement
      const containerRect = container.getBoundingClientRect()

      // Calculate mouse position relative to the container's scrollable content
      const mouseX = e.clientX - containerRect.left + container.scrollLeft
      const mouseY = e.clientY - containerRect.top + container.scrollTop

      setSignatureFields((prevFields) => {
        return prevFields.map((field) => {
          if (field.id === selectedField) {
            // Position the center of the field at the mouse cursor
            return { ...field, x: mouseX - field.width / 2, y: mouseY - field.height / 2 }
          }
          return field
        })
      })
    }
  }

  const handleMouseUp = () => {
    if (selectedField !== null && isDraggingRef.current) {
      // Only save if actual dragging occurred
      handleSaveDocument()
    }
    dragStartRef.current = null
    isDraggingRef.current = false
    setSelectedField(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Allow drop
    e.dataTransfer.dropEffect = "copy"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fieldType = e.dataTransfer.getData("text/plain") as "signature" | "date" | "text" | "initial"
    const container = e.currentTarget as HTMLDivElement
    const containerRect = container.getBoundingClientRect()

    const dropX = e.clientX - containerRect.left + container.scrollLeft
    const dropY = e.clientY - containerRect.top + container.scrollTop

    addSignatureField(fieldType, dropX, dropY)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentDocumentId && (
                <Link
                  href={`/document/preview?id=${currentDocumentId}`}
                  className="flex items-center space-x-2 text-gray-600 hover:text-black"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Preview</span>
                </Link>
              )}
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/images/lyzr_platform_logo.jpeg" alt="Lyzr Logo" width={32} height={32} className="mr-2" />
                <span className="text-2xl font-bold text-black">Lydocs</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Setting up Signatures
              </Badge>
              <Button
                variant="outline"
                size="lg"
                onClick={handleSaveDocument}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                <Save className="h-5 w-5 mr-2" />
                Save
              </Button>
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                    <Send className="h-5 w-5 mr-2" />
                    Send for Signature
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Send Document for Signature</DialogTitle>
                    <DialogDescription>Send the document directly to recipients for signature.</DialogDescription>
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
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Signature Tools */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg text-black">Create Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Signature Method Selector */}
                <div className="space-y-2">
                  <Label className="text-black">Signature Method</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant={signatureMode === "draw" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSignatureMode("draw")}
                      className={signatureMode === "draw" ? "bg-black text-white" : ""}
                    >
                      <PenTool className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={signatureMode === "type" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSignatureMode("type")}
                      className={signatureMode === "type" ? "bg-black text-white" : ""}
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Signature Canvas */}
                <div className="border border-gray-300 rounded-lg bg-white">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={120}
                    className="w-full cursor-crosshair rounded-lg"
                    onMouseDown={signatureMode === "draw" ? startDrawing : undefined}
                    onMouseMove={signatureMode === "draw" ? draw : undefined}
                    onMouseUp={signatureMode === "draw" ? stopDrawing : undefined}
                    onMouseLeave={signatureMode === "draw" ? stopDrawing : undefined}
                  />
                </div>

                {/* Mode-specific controls */}
                {signatureMode === "type" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Type your name"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="border-gray-300 focus:border-black"
                    />
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-black"
                    >
                      <option value="cursive">Cursive</option>
                      <option value="serif">Serif</option>
                      <option value="sans-serif">Sans Serif</option>
                      <option value="monospace">Monospace</option>
                    </select>
                    <Button
                      onClick={generateTypedSignature}
                      size="lg"
                      variant="outline"
                      className="w-full border-gray-300 bg-transparent"
                    >
                      Generate
                    </Button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={clearCanvas}
                    className="flex-1 border-gray-300 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button onClick={saveSignature} size="lg" className="flex-1 bg-black text-white hover:bg-gray-800">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>

                {/* Add Field Tools */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-3">Add Fields</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      draggable="true"
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", "signature")}
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Signature
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      draggable="true"
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", "initial")}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Initial
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      draggable="true"
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", "date")}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Date
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      draggable="true"
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", "text")}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Text Field
                    </Button>
                  </div>
                </div>

                {selectedField && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-black mb-3">Field Properties</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-black">Label</Label>
                        <Input
                          value={signatureFields.find((f) => f.id === selectedField)?.label || ""}
                          onChange={(e) => {
                            setSignatureFields((fields) => {
                              const updatedFields = fields.map((field) =>
                                field.id === selectedField ? { ...field, label: e.target.value } : field,
                              )
                              currentFieldPositionsRef.current = updatedFields
                              return updatedFields
                            })
                            handleSaveDocument()
                          }}
                          className="border-gray-300 focus:border-black"
                        />
                      </div>
                      <div>
                        <Label className="text-black">Signer</Label>
                        <select
                          value={signatureFields.find((f) => f.id === selectedField)?.signer || ""}
                          onChange={(e) => {
                            setSignatureFields((fields) => {
                              const updatedFields = fields.map((field) =>
                                field.id === selectedField ? { ...field, signer: e.target.value } : field,
                              )
                              currentFieldPositionsRef.current = updatedFields
                              return updatedFields
                            })
                            handleSaveDocument()
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:border-black"
                        >
                          <option value="Service Provider">Service Provider</option>
                          <option value="Client">Client</option>
                        </select>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteField(selectedField)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Field
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Canvas */}
          <div className="lg:col-span-3">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-black">Document Signature Setup</CardTitle>
                <p className="text-sm text-gray-600">
                  Click on signature or date fields to add your signature. Drag fields to reposition them.
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="relative bg-white border border-gray-200 rounded-lg overflow-auto"
                  style={{ height: "700px", width: "100%" }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {/* Document Background */}
                  <div className="absolute inset-0 bg-white p-8 text-sm leading-relaxed">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold text-black mb-2">SERVICE AGREEMENT</h1>
                      <p className="text-gray-600">Generated by Lydocs AI</p>
                    </div>

                    <div className="space-y-4 text-gray-800">
                      <div className="whitespace-pre-wrap">{documentContent}</div>
                    </div>
                  </div>

                  {/* Signature Fields */}
                  {signatureFields.map((field) => (
                    <div
                      key={field.id}
                      className={`absolute border-2 border-dashed cursor-pointer flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${
                        selectedField === field.id
                          ? "border-black bg-black bg-opacity-10"
                          : field.signer === "Service Provider"
                            ? field.type === "signature" || field.type === "initial"
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-800 bg-gray-50"
                            : field.type === "signature" || field.type === "initial"
                              ? "border-green-400 bg-green-50"
                              : "border-gray-800 bg-gray-50"
                      } ${field.filled ? "bg-opacity-20" : ""}`}
                      style={{
                        left: field.x,
                        top: field.y,
                        width: field.width,
                        height: field.height,
                        // Removed transform for dragging, as left/top are directly updated
                      }}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      onClick={() => handleFieldClick(field.id)}
                    >
                      <div className="text-center">
                        {field.filled && field.signatureData ? (
                          field.type === "signature" || field.type === "initial" ? (
                            <img
                              src={field.signatureData || "/placeholder.svg"}
                              alt={field.label}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="font-semibold text-sm">{field.signatureData}</span>
                          )
                        ) : (
                          <>
                            <div className="font-semibold">
                              {(field.type === "signature" || field.type === "initial") && (
                                <PenTool className="h-4 w-4 mx-auto mb-1" />
                              )}
                              {(field.type === "date" || field.type === "text") && (
                                <Type className="h-4 w-4 mx-auto mb-1" />
                              )}
                            </div>
                            <div>{field.label}</div>
                            <div className="text-xs opacity-75">{field.signer}</div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Signature</DialogTitle>
            <DialogDescription>Create your signature for the selected field.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Signature Method Selector */}
            <div className="space-y-2">
              <Label className="text-black">Signature Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={signatureMode === "draw" ? "default" : "outline"}
                  onClick={() => setSignatureMode("draw")}
                  className={signatureMode === "draw" ? "bg-black text-white" : ""}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Draw
                </Button>
                <Button
                  variant={signatureMode === "type" ? "default" : "outline"}
                  onClick={() => setSignatureMode("type")}
                  className={signatureMode === "type" ? "bg-black text-white" : ""}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Type
                </Button>
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="border border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="w-full cursor-crosshair rounded-lg"
                onMouseDown={signatureMode === "draw" ? startDrawing : undefined}
                onMouseMove={signatureMode === "draw" ? draw : undefined}
                onMouseUp={signatureMode === "draw" ? stopDrawing : undefined}
                onMouseLeave={signatureMode === "draw" ? stopDrawing : undefined}
              />
            </div>

            {/* Mode-specific controls */}
            {signatureMode === "type" && (
              <div className="space-y-2">
                <Input
                  placeholder="Type your name"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="border-gray-300 focus:border-black"
                />
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-black"
                >
                  <option value="cursive">Cursive</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
                <Button
                  onClick={generateTypedSignature}
                  variant="outline"
                  className="w-full border-gray-300 bg-transparent"
                >
                  Generate Signature
                </Button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={clearCanvas} className="flex-1 border-gray-300 bg-transparent">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={saveSignature} className="flex-1 bg-black text-white hover:bg-gray-800">
                <Save className="h-4 w-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
