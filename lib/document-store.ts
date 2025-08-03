export interface DocumentData {
  id: string
  title: string
  type: string
  status: "draft" | "pending" | "completed" | "sent"
  createdAt: string
  updatedAt: string
  content: string
  formData: any
  signatures?: {
    serviceProvider?: string
    client?: string
    serviceProviderDate?: string
    clientDate?: string
  }
  // New: Add a field for signature field definitions
  signatureFields?: {
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
  }[]
  recipients?: string[]
}

class DocumentStore {
  private storageKey = "lydocs-documents"

  getDocuments(): DocumentData[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : []
  }

  saveDocument(document: DocumentData): void {
    if (typeof window === "undefined") return
    const documents = this.getDocuments()
    const existingIndex = documents.findIndex((doc) => doc.id === document.id)

    if (existingIndex >= 0) {
      documents[existingIndex] = document
    } else {
      documents.unshift(document)
    }

    localStorage.setItem(this.storageKey, JSON.stringify(documents))
  }

  getDocument(id: string): DocumentData | null {
    const documents = this.getDocuments()
    return documents.find((doc) => doc.id === id) || null
  }

  updateDocumentStatus(id: string, status: DocumentData["status"]): void {
    const documents = this.getDocuments()
    const document = documents.find((doc) => doc.id === id)
    if (document) {
      document.status = status
      document.updatedAt = new Date().toISOString()
      localStorage.setItem(this.storageKey, JSON.stringify(documents))
    }
  }
}

export const documentStore = new DocumentStore()
