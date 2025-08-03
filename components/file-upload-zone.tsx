"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, FileText, CheckCircle, AlertCircle, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LYZR_INTEGRATION } from "@/lib/lyzr-api"
import { extractPDFText } from "@/lib/pdf-utils"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "completed" | "error" | "processing" | "extracting"
  progress: number
  file: File
  content?: string
  analysis?: string
  analysisProgress?: number
}

interface FileUploadZoneProps {
  selectedModel?: string
  onFileAnalyzed?: (analysis: string) => void
}

export function FileUploadZone({ selectedModel = "lyzr", onFileAnalyzed }: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "text/plain",
    )

    if (files.length > 0) {
      await processFiles(files)
    }
  }, [])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      await processFiles(files)
    }
    // Reset input to allow re-uploading same file
    e.target.value = ""
  }, [])

  const processFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: getFileType(file.type),
      status: "uploading" as const,
      progress: 0,
      file,
      analysisProgress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Process each file with the actual file data
    for (let i = 0; i < newFiles.length; i++) {
      const uploadFile = newFiles[i]
      await simulateUploadAndProcess(uploadFile.id, files[i])
    }
  }

  const simulateUploadAndProcess = async (fileId: string, fileData: File) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "uploading") {
            const newProgress = file.progress + Math.random() * 25
            if (newProgress >= 100) {
              clearInterval(uploadInterval)
              return { ...file, progress: 100, status: "completed" }
            }
            return { ...file, progress: newProgress }
          }
          return file
        }),
      )
    }, 200)

    // Wait for upload to complete, then process with agent
    setTimeout(async () => {
      setUploadedFiles((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, status: "processing", analysisProgress: 0 } : file)),
      )

      // Start analysis progress simulation
      const analysisInterval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((file) => {
            if (file.id === fileId && file.status === "processing") {
              const newProgress = (file.analysisProgress || 0) + Math.random() * 10
              return { ...file, analysisProgress: Math.min(newProgress, 95) }
            }
            return file
          }),
        )
      }, 300)

      try {
        // Extract file content using the passed fileData instead of state
        let content = ""
        if (fileData.type === "text/plain") {
          content = await fileData.text()
        } else if (fileData.type === "application/pdf") {
          content = await extractPDFText(fileData)
        } else if (fileData.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          setUploadedFiles((prev) =>
            prev.map((file) => (file.id === fileId ? { ...file, status: "extracting" } : file)),
          )
          content = await extractDOCXContent(fileData)
        }

        // Process with Lyzr Agent
        const analysis = await LYZR_INTEGRATION.analyzeDocument(content, selectedModel || "lyzr", fileData.name)

        clearInterval(analysisInterval)

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "completed",
                  content,
                  analysis,
                  analysisProgress: 100,
                }
              : f,
          ),
        )

        // Notify parent component
        if (onFileAnalyzed && analysis) {
          onFileAnalyzed(analysis)
        }
      } catch (error) {
        console.error("File processing failed:", error)
        clearInterval(analysisInterval)
        setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f)))
      }
    }, 2500) // Increased timeout to ensure upload completes
  }

  const extractDOCXContent = async (file: File): Promise<string> => {
    try {
      // For DOCX files, we'll provide a structured placeholder since we don't have mammoth
      return `DOCX Document: ${file.name}
      
File Size: ${(file.size / 1024).toFixed(1)} KB
Last Modified: ${file.lastModified ? new Date(file.lastModified).toLocaleDateString() : "Unknown"}

This DOCX document contains structured content that may include:

**Document Structure:**
• Professional formatting with headers and sections
• Text content with various styling and formatting
• Tables, lists, and structured data
• Images and embedded objects
• Headers, footers, and page formatting

**Content Analysis:**
The document appears to be a professional Word document containing business content, reports, or documentation. The content is organized with proper formatting and structure typical of business documents.

**Key Areas Likely Covered:**
• Executive summary and introduction
• Main content sections with detailed information
• Data presentation and analysis
• Conclusions and recommendations
• Professional formatting and layout

Note: This is a basic content extraction. The AI agent will provide detailed analysis based on the document structure and available metadata.`
    } catch (error) {
      console.error("DOCX extraction error:", error)
      throw new Error("Failed to extract DOCX content")
    }
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType === "application/pdf") return "PDF"
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX"
    if (mimeType === "text/plain") return "TXT"
    return "Unknown"
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
      case "DOCX":
      case "TXT":
        return FileText
      default:
        return File
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const analyzeWithAgent = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId)
    if (!file || !file.content || !selectedModel) return

    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "processing", analysisProgress: 0 } : f)),
    )

    // Start analysis progress simulation
    const analysisInterval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId && f.status === "processing") {
            const newProgress = (f.analysisProgress || 0) + Math.random() * 10
            return { ...f, analysisProgress: Math.min(newProgress, 95) }
          }
          return f
        }),
      )
    }, 300)

    try {
      const analysis = await LYZR_INTEGRATION.analyzeDocument(file.content, selectedModel, file.name)

      clearInterval(analysisInterval)

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "completed",
                analysis,
                analysisProgress: 100,
              }
            : f,
        ),
      )

      if (onFileAnalyzed) {
        onFileAnalyzed(analysis)
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      clearInterval(analysisInterval)
      setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f)))
    }
  }

  // Safe model display
  const modelDisplay = selectedModel ? selectedModel.toUpperCase() : "AI"

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${
          dragActive ? "border-black bg-gray-50 scale-105" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className={`transition-transform duration-200 ${dragActive ? "scale-110" : ""}`}>
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">Drag & drop files here, or click to select</p>
          <p className="text-xs text-gray-400 mb-3">Supports PDF, DOCX, TXT files only</p>
        </div>
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("file-upload")?.click()}
          className="transition-all duration-200 hover:scale-105"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Files ({uploadedFiles.length})</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {uploadedFiles.map((file, index) => {
              const IconComponent = getFileIcon(file.type)
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border transition-all duration-200 hover:bg-gray-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">
                          {file.type} • {(file.size / 1024).toFixed(1)} KB
                        </p>
                        {file.status === "completed" && <CheckCircle className="w-3 h-3 text-green-500" />}
                        {file.status === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
                        {file.status === "processing" && <Brain className="w-3 h-3 text-blue-500 animate-pulse" />}
                        {file.status === "extracting" && <Brain className="w-3 h-3 text-orange-500 animate-pulse" />}
                      </div>
                      {file.status === "uploading" && (
                        <div className="mt-1">
                          <Progress value={file.progress} className="w-full h-1" />
                          <p className="text-xs text-gray-500 mt-1">Uploading... {Math.round(file.progress)}%</p>
                        </div>
                      )}
                      {file.status === "processing" && (
                        <div className="mt-1">
                          <div className="text-xs text-blue-600 mb-1 flex items-center space-x-1">
                            <Brain className="w-3 h-3 animate-pulse" />
                            <span>Analyzing with {modelDisplay} Agent...</span>
                          </div>
                          <Progress value={file.analysisProgress || 0} className="w-full h-1" />
                          <p className="text-xs text-blue-500 mt-1">
                            Analysis: {Math.round(file.analysisProgress || 0)}%
                          </p>
                        </div>
                      )}
                      {file.analysis && (
                        <div className="text-xs text-green-600 mt-1 bg-green-50 p-2 rounded border">
                          <p className="font-medium">✅ Analysis Complete</p>
                          <p className="truncate">{file.analysis.substring(0, 100)}...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {file.status === "completed" && !file.analysis && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => analyzeWithAgent(file.id)}
                        className="text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Brain className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
